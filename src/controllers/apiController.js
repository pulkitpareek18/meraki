import { 
    getConversations,
    getConversationById,
    refreshConversation,
    regenerateAnalysis,
    batchRefreshConversations
} from '../services/conversation.js';
import { listUltravoxCalls, getUltravoxCall, getUltravoxTranscriptFromMessages } from '../services/ultravox.js';
import { classifyRiskAndCounselling } from '../services/riskAnalysis.js';
import { upsertConversation } from '../database/connection.js';

/**
 * Get all conversations
 */
export async function getAllConversations(req, res) {
    try {
        const conversations = await getConversations();
        res.json({ ok: true, conversations });
    } catch (error) {
        console.error('Error fetching conversations:', error);
        res.status(500).json({ ok: false, error: 'Internal server error' });
    }
}

/**
 * Refresh a specific conversation's transcript and recording
 */
export async function refreshSpecificConversation(req, res) {
    try {
        const { id: callId } = req.params;
        console.log(`🔄 Manual refresh requested for conversation: ${callId}`);
        
        const result = await refreshConversation(callId);
        
        console.log(`✅ Conversation refresh complete for ${callId}`);
        res.json({ 
            ok: true, 
            conversation: result.conversation, 
            message: result.transcriptUpdated ? 
                'Transcript fetched and analysis updated' : 
                'Analysis updated with existing data'
        });
    } catch (error) {
        console.error('Error refreshing conversation:', error);
        res.status(500).json({ ok: false, error: 'Internal server error' });
    }
}

/**
 * Regenerate AI analysis for a specific conversation
 */
export async function regenerateConversationAnalysis(req, res) {
    try {
        const { id: callId } = req.params;
        console.log(`🤖 Regenerating AI analysis for conversation: ${callId}`);
        
        const updatedRecord = await regenerateAnalysis(callId);
        
        console.log(`✅ AI Analysis regeneration complete for ${callId}`);
        res.json({ 
            ok: true, 
            conversation: updatedRecord, 
            message: 'AI analysis has been successfully regenerated.' 
        });
    } catch (error) {
        console.error('Error regenerating AI analysis:', error);
        
        if (error.message === 'Conversation not found') {
            return res.status(404).json({ ok: false, error: 'Conversation not found' });
        }
        if (error.message === 'Cannot regenerate analysis without a transcript') {
            return res.status(400).json({ ok: false, error: 'Cannot regenerate analysis without a transcript.' });
        }
        
        res.status(500).json({ ok: false, error: 'Internal server error during analysis regeneration.' });
    }
}

/**
 * Batch refresh endpoint to update all conversations missing transcripts
 */
export async function batchRefreshAllConversations(req, res) {
    try {
        console.log('🔄 Batch refresh requested for all conversations');
        
        const results = await batchRefreshConversations();
        
        console.log(`✅ Batch refresh complete - processed ${results.length} conversations`);
        res.json({ 
            ok: true, 
            results, 
            message: `Processed ${results.length} conversations` 
        });
    } catch (error) {
        console.error('Error in batch refresh:', error);
        res.status(500).json({ ok: false, error: 'Internal server error' });
    }
}

/**
 * Import actual calls from Ultravox endpoint
 */
export async function importFromUltravox(req, res) {
    try {
        console.log('📥 Starting import of calls from Ultravox...');
        const limit = parseInt(req.body.limit) || 20;

        const callsResponse = await listUltravoxCalls(limit);
        const calls = callsResponse.results || [];
        console.log(`📋 Fetched ${calls.length} calls from Ultravox`);
        
        const results = [];
        
        for (const call of calls) {
            try {
                const callId = call.id || call.callId;
                if (!callId) {
                    results.push({ 
                        id: 'unknown', 
                        status: 'skipped', 
                        message: 'No call ID found' 
                    });
                    continue;
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
                results.push({ 
                    id: callId, 
                    status: existing ? 'updated' : 'created', 
                    message: 'Call data processed' 
                });
            } catch (callError) {
                console.error(`Error processing call ${call.id}:`, callError);
                results.push({ 
                    id: call.id || 'unknown', 
                    status: 'error', 
                    message: callError.message 
                });
            }
        }
        
        const created = results.filter(r => r.status === 'created').length;
        const updated = results.filter(r => r.status === 'updated').length;
        console.log(`📥 Import complete: ${created} created, ${updated} updated.`);
        
        res.json({ 
            ok: true, 
            summary: { created, updated }, 
            results 
        });
    } catch (error) {
        console.error('Error during import:', error);
        res.status(500).json({ ok: false, error: error.message });
    }
}

/**
 * Cleanup invalid calls endpoint
 */
export async function cleanupInvalidCalls(req, res) {
    try {
        console.log('🧹 Starting cleanup of invalid calls...');
        const conversations = await getConversations();
        const results = [];
        
        for (const conv of conversations) {
            try {
                await getUltravoxCall(conv.id);
                results.push({ id: conv.id, status: 'valid' });
            } catch (error) {
                if (error.message.includes('404')) {
                    results.push({ 
                        id: conv.id, 
                        status: 'invalid', 
                        message: 'Not found in Ultravox' 
                    });
                } else {
                    results.push({ 
                        id: conv.id, 
                        status: 'error', 
                        message: error.message 
                    });
                }
            }
        }
        
        const invalidCount = results.filter(r => r.status === 'invalid').length;
        console.log(`🧹 Cleanup complete: Found ${invalidCount} invalid calls.`);
        
        res.json({ 
            ok: true, 
            summary: { invalid: invalidCount }, 
            results 
        });
    } catch (error) {
        console.error('Error during cleanup:', error);
        res.status(500).json({ ok: false, error: error.message });
    }
}