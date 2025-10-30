import { 
    upsertConversation, 
    getConversations, 
    getConversationById,
    findConversationByTwilioSid,
    getConversationsByPhoneNumber
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

/**
 * Import conversations from Ultravox with better error handling and performance
 */
export async function importConversationsFromUltravox(limit = 20) {
    console.log(`📥 Importing ${limit} conversations from Ultravox...`);
    
    const { listUltravoxCalls, getUltravoxCall, getUltravoxTranscriptFromMessages } = await import('./ultravox.js');
    const { classifyRiskAndCounselling } = await import('./riskAnalysis.js');
    
    const callsResponse = await listUltravoxCalls(limit);
    const calls = callsResponse.results || [];
    console.log(`📋 Fetched ${calls.length} calls from Ultravox`);
    
    const results = [];
    
    // Process calls in batches to avoid overwhelming the system
    const batchSize = 5;
    for (let i = 0; i < calls.length; i += batchSize) {
        const batch = calls.slice(i, i + batchSize);
        
        const batchResults = await Promise.allSettled(
            batch.map(call => processUltravoxCall(call))
        );
        
        batchResults.forEach((result, index) => {
            const call = batch[index];
            if (result.status === 'fulfilled') {
                results.push(result.value);
            } else {
                console.error(`Error processing call ${call.id}:`, result.reason);
                results.push({ 
                    id: call.id || 'unknown', 
                    status: 'error', 
                    message: result.reason.message 
                });
            }
        });
        
        // Small delay between batches
        if (i + batchSize < calls.length) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }
    
    return results;
    
    async function processUltravoxCall(call) {
        const callId = call.id || call.callId;
        if (!callId) {
            return { 
                id: 'unknown', 
                status: 'skipped', 
                message: 'No call ID found' 
            };
        }
        
        const [transcriptResult, callDetailsResult] = await Promise.allSettled([
            getUltravoxTranscriptFromMessages(callId),
            getUltravoxCall(callId),
        ]);

        const transcript = transcriptResult.status === 'fulfilled' ? transcriptResult.value : '';
        const callDetails = callDetailsResult.status === 'fulfilled' ? callDetailsResult.value : null;

        const analysis = await classifyRiskAndCounselling(transcript || 'Imported call - no transcript');
        const existing = await getConversationById(callId);
        
        const record = {
            ...(existing || {}),
            id: callId,
            from: callDetails?.from || call.from || 'unknown',
            createdAt: call.createdAt || call.created_at || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            transcript,
            recordingUrl: callDetails?.recordingUrl || '',
            summary: analysis.review,
            tendency: analysis.tendency,
            needsCounselling: analysis.needsCounselling,
            score: analysis.score,
            detectedTerms: analysis.detectedTerms,
            immediateIntervention: analysis.immediateIntervention,
            geminiAnalysis: analysis.geminiAnalysis,
            status: existing ? 'imported_updated' : 'imported',
            raw: { 
                ...(existing?.raw || {}), 
                importedCall: call, 
                importedDetails: callDetails 
            }
        };
        
        await upsertConversation(record);
        return { 
            id: callId, 
            status: existing ? 'updated' : 'created', 
            message: 'Call data processed successfully' 
        };
    }
}

/**
 * Validate conversations against Ultravox to identify orphaned records
 */
export async function validateConversationsAgainstUltravox() {
    console.log('🧹 Validating conversations against Ultravox...');
    
    const { getUltravoxCall } = await import('./ultravox.js');
    const conversations = await getConversations();
    const results = [];
    
    // Process in batches to avoid rate limiting
    const batchSize = 10;
    for (let i = 0; i < conversations.length; i += batchSize) {
        const batch = conversations.slice(i, i + batchSize);
        
        const batchResults = await Promise.allSettled(
            batch.map(async conv => {
                try {
                    await getUltravoxCall(conv.id);
                    return { id: conv.id, status: 'valid' };
                } catch (error) {
                    if (error.message.includes('404')) {
                        return { 
                            id: conv.id, 
                            status: 'invalid', 
                            message: 'Not found in Ultravox' 
                        };
                    } else {
                        return { 
                            id: conv.id, 
                            status: 'error', 
                            message: error.message 
                        };
                    }
                }
            })
        );
        
        batchResults.forEach(result => {
            if (result.status === 'fulfilled') {
                results.push(result.value);
            }
        });
        
        // Small delay between batches
        if (i + batchSize < conversations.length) {
            await new Promise(resolve => setTimeout(resolve, 200));
        }
    }
    
    return results;
}

/**
 * Build conversation history context for AI prompts
 */
export function buildConversationHistoryContext(previousConversations) {
    if (!previousConversations || previousConversations.length === 0) {
        return '';
    }

    // Filter conversations that have meaningful transcripts and limit to last 5
    const relevantConversations = previousConversations
        .filter(conv => conv.transcript && conv.transcript.trim().length > 50)
        .slice(0, 5);

    if (relevantConversations.length === 0) {
        return '';
    }

    let historyContext = '\n\n--- PREVIOUS CONVERSATION HISTORY ---\n';
    historyContext += `This caller has spoken with you ${relevantConversations.length} time(s) before. Here\'s what was discussed:\n\n`;

    relevantConversations.forEach((conv, index) => {
        const date = new Date(conv.createdAt).toLocaleDateString('en-IN');
        const time = new Date(conv.createdAt).toLocaleTimeString('en-IN', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        historyContext += `CONVERSATION ${index + 1} (${date} at ${time}):\n`;
        
        // Add analysis summary if available
        if (conv.summary) {
            historyContext += `Previous Analysis: ${conv.summary}\n`;
        }
        
        // Add key conversation excerpts (first 500 characters)
        if (conv.transcript) {
            const excerpt = conv.transcript.length > 500 
                ? conv.transcript.substring(0, 500) + '...' 
                : conv.transcript;
            historyContext += `Key Discussion Points:\n${excerpt}\n`;
        }
        
        historyContext += '\n';
    });

    historyContext += '--- END PREVIOUS HISTORY ---\n\n';
    historyContext += 'Based on this history, please:\n';
    historyContext += '- Remember what they shared before and acknowledge their journey\n';
    historyContext += '- Show continuity in your support and understanding\n';
    historyContext += '- Check in on any previous concerns they mentioned\n';
    historyContext += '- Be aware of their emotional patterns and progress\n';
    historyContext += '- Don\'t repeat the same advice unless they specifically ask for it\n\n';

    return historyContext;
}

// Export database functions for backward compatibility
export { 
    getConversations, 
    getConversationById, 
    findConversationByTwilioSid,
    getConversationsByPhoneNumber,
    upsertConversation 
};