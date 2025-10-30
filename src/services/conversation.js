import { 
    upsertConversation, 
    getConversations, 
    getConversationById,
    findConversationByTwilioSid 
} from '../database/connection.js';
import { 
    getUltravoxCall, 
    getUltravoxTranscriptFromMessages 
} from './ultravox.js';
import { classifyRiskAndCounselling } from './riskAnalysis.js';

/**
 * Create a new conversation record
 */
export async function createConversation(data) {
    const conversation = {
        id: data.id,
        twilioCallSid: data.twilioCallSid,
        from: data.from,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'active',
        ...data
    };
    
    await upsertConversation(conversation);
    return conversation;
}

/**
 * Update an existing conversation
 */
export async function updateConversation(id, updates) {
    const existing = await getConversationById(id);
    if (!existing) {
        throw new Error(`Conversation with id ${id} not found`);
    }
    
    const updated = {
        ...existing,
        ...updates,
        updatedAt: new Date().toISOString()
    };
    
    await upsertConversation(updated);
    return updated;
}

/**
 * Process call completion - fetch transcript and analyze
 */
export async function processCallCompletion(callId, isUltravoxCallId = false) {
    console.log(`📞 Processing call completion for ${callId}`);
    
    // If we received a Twilio CallSid, find the Ultravox call ID
    let ultravoxCallId = callId;
    let existing;
    
    if (!isUltravoxCallId) {
        existing = await findConversationByTwilioSid(callId);
        if (!existing) {
            throw new Error(`Could not find conversation record for Twilio CallSid: ${callId}`);
        }
        ultravoxCallId = existing.id;
    } else {
        existing = await getConversationById(callId);
    }
    
    if (!existing) {
        throw new Error(`Conversation not found: ${callId}`);
    }

    // Fetch transcript and call details
    const [transcriptResult, callDetailsResult] = await Promise.allSettled([
        getUltravoxTranscriptFromMessages(ultravoxCallId),
        getUltravoxCall(ultravoxCallId),
    ]);
    
    const transcript = transcriptResult.status === 'fulfilled' ? transcriptResult.value : '';
    const callDetails = callDetailsResult.status === 'fulfilled' ? callDetailsResult.value : null;

    if (transcriptResult.status === 'rejected') {
        console.warn(`Failed to fetch transcript for ${callId}:`, transcriptResult.reason.message);
    }
    if (callDetailsResult.status === 'rejected') {
        console.warn(`Failed to fetch call details for ${callId}:`, callDetailsResult.reason.message);
    }

    // Analyze the transcript
    const analysis = await classifyRiskAndCounselling(transcript || 'No transcript available');
    
    // Update the conversation record
    const updatedRecord = {
        ...existing,
        updatedAt: new Date().toISOString(),
        transcript,
        recordingUrl: callDetails?.recordingUrl || existing.recordingUrl || '',
        summary: analysis.review,
        tendency: analysis.tendency,
        needsCounselling: analysis.needsCounselling,
        score: analysis.score,
        detectedTerms: analysis.detectedTerms,
        immediateIntervention: analysis.immediateIntervention,
        geminiAnalysis: analysis.geminiAnalysis,
        status: 'completed',
        raw: { 
            ...(existing.raw || {}), 
            finalDetails: callDetails 
        }
    };
    
    await upsertConversation(updatedRecord);
    
    console.log(`✅ Call processing complete for ${callId}`);
    return updatedRecord;
}

/**
 * Refresh a conversation's transcript and analysis
 */
export async function refreshConversation(callId) {
    console.log(`🔄 Refreshing conversation: ${callId}`);
    
    const existing = await getConversationById(callId);
    if (!existing) {
        throw new Error('Conversation not found');
    }

    const [transcriptResult, callDetailsResult] = await Promise.allSettled([
        getUltravoxTranscriptFromMessages(callId),
        getUltravoxCall(callId),
    ]);

    const transcript = transcriptResult.status === 'fulfilled' ? transcriptResult.value : existing.transcript || '';
    const callDetails = callDetailsResult.status === 'fulfilled' ? callDetailsResult.value : null;
    const transcriptUpdated = transcriptResult.status === 'fulfilled' && !!transcriptResult.value;

    const analysis = await classifyRiskAndCounselling(transcript || 'No transcript available');
    
    const updatedRecord = {
        ...existing,
        updatedAt: new Date().toISOString(),
        transcript,
        summary: analysis.review,
        tendency: analysis.tendency,
        needsCounselling: analysis.needsCounselling,
        score: analysis.score,
        detectedTerms: analysis.detectedTerms,
        immediateIntervention: analysis.immediateIntervention,
        geminiAnalysis: analysis.geminiAnalysis,
        recordingUrl: callDetails?.recordingUrl || existing.recordingUrl || '',
        status: transcript ? 'completed' : 'no_transcript'
    };
    
    await upsertConversation(updatedRecord);
    
    console.log(`✅ Conversation refresh complete for ${callId}`);
    return {
        conversation: updatedRecord,
        transcriptUpdated
    };
}

/**
 * Regenerate AI analysis for a conversation
 */
export async function regenerateAnalysis(callId) {
    console.log(`🤖 Regenerating AI analysis for conversation: ${callId}`);
    
    const existing = await getConversationById(callId);
    if (!existing) {
        throw new Error('Conversation not found');
    }

    if (!existing.transcript || existing.transcript.trim().length === 0) {
        throw new Error('Cannot regenerate analysis without a transcript');
    }

    // Re-run the full analysis
    const analysis = await classifyRiskAndCounselling(existing.transcript);

    const updatedRecord = {
        ...existing,
        updatedAt: new Date().toISOString(),
        summary: analysis.review,
        tendency: analysis.tendency,
        needsCounselling: analysis.needsCounselling,
        score: analysis.score,
        detectedTerms: analysis.detectedTerms,
        immediateIntervention: analysis.immediateIntervention,
        geminiAnalysis: analysis.geminiAnalysis,
    };
    
    await upsertConversation(updatedRecord);
    
    console.log(`✅ AI Analysis regeneration complete for ${callId}`);
    return updatedRecord;
}

/**
 * Batch refresh all conversations missing transcripts
 */
export async function batchRefreshConversations() {
    console.log('🔄 Batch refresh requested for all conversations');
    
    const conversations = await getConversations();
    const results = [];
    
    for (const conv of conversations) {
        if (!conv.transcript || conv.transcript.trim().length === 0) {
            console.log(`🔄 Refreshing conversation ${conv.id}...`);
            try {
                const result = await refreshConversation(conv.id);
                results.push({ 
                    id: conv.id, 
                    status: 'updated', 
                    transcriptLength: result.conversation.transcript.length 
                });
            } catch (error) {
                console.error(`Failed to refresh conversation ${conv.id}:`, error);
                results.push({ 
                    id: conv.id, 
                    status: 'failed', 
                    error: error.message 
                });
            }
        } else {
            results.push({ 
                id: conv.id, 
                status: 'skipped', 
                reason: 'already has transcript' 
            });
        }
    }
    
    console.log(`✅ Batch refresh complete - processed ${results.length} conversations`);
    return results;
}

// Export database functions for backward compatibility
export { 
    getConversations, 
    getConversationById, 
    findConversationByTwilioSid,
    upsertConversation 
};