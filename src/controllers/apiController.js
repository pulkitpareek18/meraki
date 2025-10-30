import { 
    getConversations,
    getConversationById,
    refreshConversation,
    regenerateAnalysis,
    batchRefreshConversations,
    importConversationsFromUltravox,
    validateConversationsAgainstUltravox
} from '../services/conversation.js';
import { sendResponse, sendError, asyncHandler, validateRequired } from './baseController.js';

/**
 * Get all conversations with enhanced filtering and sorting
 */
export const getAllConversations = asyncHandler(async (req, res) => {
    const { 
        limit = 50, 
        offset = 0, 
        riskLevel, 
        status, 
        sortBy = 'createdAt', 
        sortOrder = 'desc' 
    } = req.query;
    
    const conversations = await getConversations();
    
    // Apply filters
    let filtered = conversations;
    if (riskLevel) {
        filtered = filtered.filter(c => c.tendency === riskLevel);
    }
    if (status) {
        filtered = filtered.filter(c => c.status === status);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
        let aVal = a[sortBy];
        let bVal = b[sortBy];
        
        if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
            aVal = new Date(aVal);
            bVal = new Date(bVal);
        }
        
        const multiplier = sortOrder === 'desc' ? -1 : 1;
        return aVal < bVal ? -1 * multiplier : aVal > bVal ? 1 * multiplier : 0;
    });
    
    // Apply pagination
    const total = filtered.length;
    const paginatedResults = filtered.slice(parseInt(offset), parseInt(offset) + parseInt(limit));
    
    return sendResponse(res, 200, {
        conversations: paginatedResults,
        pagination: {
            total,
            limit: parseInt(limit),
            offset: parseInt(offset),
            hasMore: (parseInt(offset) + parseInt(limit)) < total
        }
    });
});

/**
 * Refresh a specific conversation's transcript and recording
 */
export const refreshSpecificConversation = asyncHandler(async (req, res) => {
    const { id: callId } = req.params;
    validateRequired({ callId }, ['callId']);
    
    console.log(`🔄 Manual refresh requested for conversation: ${callId}`);
    
    const result = await refreshConversation(callId);
    
    const message = result.transcriptUpdated ? 
        'Transcript fetched and analysis updated successfully' : 
        'Analysis updated with existing data';
    
    console.log(`✅ Conversation refresh complete for ${callId}`);
    return sendResponse(res, 200, { conversation: result.conversation }, message);
});

/**
 * Regenerate AI analysis for a specific conversation
 */
export const regenerateConversationAnalysis = asyncHandler(async (req, res) => {
    const { id: callId } = req.params;
    validateRequired({ callId }, ['callId']);
    
    console.log(`🤖 Regenerating AI analysis for conversation: ${callId}`);
    
    try {
        const updatedRecord = await regenerateAnalysis(callId);
        
        console.log(`✅ AI Analysis regeneration complete for ${callId}`);
        return sendResponse(res, 200, { conversation: updatedRecord }, 'AI analysis has been successfully regenerated');
    } catch (error) {
        if (error.message === 'Conversation not found') {
            return sendError(res, 404, 'Conversation not found');
        }
        if (error.message === 'Cannot regenerate analysis without a transcript') {
            return sendError(res, 400, 'Cannot regenerate analysis without a transcript');
        }
        throw error; // Re-throw for asyncHandler to catch
    }
});

/**
 * Batch refresh endpoint to update all conversations missing transcripts
 */
export const batchRefreshAllConversations = asyncHandler(async (req, res) => {
    console.log('🔄 Batch refresh requested for all conversations');
    
    const results = await batchRefreshConversations();
    
    const summary = {
        total: results.length,
        updated: results.filter(r => r.status === 'updated').length,
        failed: results.filter(r => r.status === 'failed').length,
        skipped: results.filter(r => r.status === 'skipped').length
    };
    
    console.log(`✅ Batch refresh complete - processed ${results.length} conversations`);
    return sendResponse(res, 200, { results, summary }, `Batch refresh completed: ${summary.updated} updated, ${summary.failed} failed, ${summary.skipped} skipped`);
});

/**
 * Import conversations from Ultravox
 */
export const importFromUltravox = asyncHandler(async (req, res) => {
    const { limit = 20 } = req.body;
    
    console.log('� Starting import of calls from Ultravox...');
    
    const results = await importConversationsFromUltravox(parseInt(limit));
    
    const summary = {
        total: results.length,
        created: results.filter(r => r.status === 'created').length,
        updated: results.filter(r => r.status === 'updated').length,
        errors: results.filter(r => r.status === 'error').length
    };
    
    console.log(`📥 Import complete: ${summary.created} created, ${summary.updated} updated`);
    return sendResponse(res, 200, { results, summary }, `Import completed: ${summary.created} new calls, ${summary.updated} updated calls`);
});

/**
 * Validate conversations against Ultravox data
 */
export const cleanupInvalidCalls = asyncHandler(async (req, res) => {
    console.log('🧹 Starting validation of calls against Ultravox...');
    
    const results = await validateConversationsAgainstUltravox();
    
    const summary = {
        total: results.length,
        valid: results.filter(r => r.status === 'valid').length,
        invalid: results.filter(r => r.status === 'invalid').length,
        errors: results.filter(r => r.status === 'error').length
    };
    
    console.log(`🧹 Validation complete: ${summary.valid} valid, ${summary.invalid} invalid calls`);
    return sendResponse(res, 200, { results, summary }, `Validation completed: ${summary.valid} valid calls, ${summary.invalid} invalid calls found`);
});

/**
 * Get call recording from Ultravox
 */
export const getCallRecording = asyncHandler(async (req, res) => {
    const { id: conversationId } = req.params;
    validateRequired({ conversationId }, ['conversationId']);
    
    console.log(`🎵 Fetching recording for conversation: ${conversationId}`);
    
    // First, get the conversation to extract the correct call ID
    const { getConversationById } = await import('../services/conversation.js');
    const conversation = await getConversationById(conversationId);
    
    if (!conversation) {
        return sendError(res, 404, 'Conversation not found');
    }
    
    // Determine the Ultravox call ID to use
    let ultravoxCallId = conversationId;
    
    // Check if there's a specific Ultravox call ID in the raw data
    if (conversation.raw?.uvxResponse?.callId) {
        ultravoxCallId = conversation.raw.uvxResponse.callId;
        console.log(`🎵 Using Ultravox call ID from raw data: ${ultravoxCallId}`);
    }
    
    const { getUltravoxCallRecording } = await import('../services/ultravox.js');
    
    try {
        const recording = await getUltravoxCallRecording(ultravoxCallId);
        let recordingUrl = null;
        
        // Extract recording URL from response
        if (typeof recording === 'string' && (recording.startsWith('http') || recording.startsWith('https'))) {
            recordingUrl = recording;
        } else if (recording && typeof recording === 'object') {
            recordingUrl = recording.recordingUrl || recording.location || recording.url;
        }
        
        // If we successfully got a recording URL, store it in the conversation
        if (recordingUrl) {
            console.log(`✅ Recording URL retrieved: ${recordingUrl.substring(0, 100)}...`);
            
            // Import updateConversation function
            const { updateConversation } = await import('../services/conversation.js');
            
            try {
                // Update the conversation with the recording URL
                await updateConversation(conversationId, { recordingUrl });
                console.log(`💾 Recording URL stored in conversation: ${conversationId}`);
            } catch (updateError) {
                console.warn(`⚠️ Failed to store recording URL in conversation: ${updateError.message}`);
                // Continue anyway - we still want to return the recording URL
            }
            
            return sendResponse(res, 200, { 
                recordingUrl,
                callId: ultravoxCallId,
                conversationId: conversationId,
                stored: true 
            }, 'Recording URL retrieved and stored successfully');
        }
        
        // If we get here, the response format is unexpected - return for debugging
        console.warn(`⚠️ Unexpected recording response format:`, recording);
        return sendResponse(res, 200, { 
            recording, 
            callId: ultravoxCallId,
            conversationId: conversationId,
            warning: 'Unexpected response format - please check the recording field' 
        }, 'Recording data retrieved but format is unexpected');
    } catch (error) {
        console.error(`❌ Error fetching recording for call ${ultravoxCallId}:`, error.message);
        
        if (error.message.includes('404')) {
            return sendError(res, 404, `Recording not found for call ${ultravoxCallId}`, {
                callId: ultravoxCallId,
                conversationId: conversationId
            });
        }
        throw error; // Re-throw for asyncHandler to catch
    }
});