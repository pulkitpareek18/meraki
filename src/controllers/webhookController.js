import { 
    processCallCompletion, 
    findConversationByTwilioSid 
} from '../services/conversation.js';
import { sendEmergencyAlert } from '../services/riskAnalysis.js';

/**
 * Handle Ultravox event webhooks
 */
export async function handleUltravoxEvents(req, res) {
    console.log('Received Webhook Event:', JSON.stringify(req.body, null, 2));
    
    const event = req.body || {};
    const callId = event.call?.callId || req.body.ParentCallSid || req.body.CallSid;
    const eventType = event.event || req.body.CallStatus; // 'call.ended' or 'completed'

    if (!callId) {
        console.warn('Webhook event received without a CallSid or call.callId.');
        return res.status(200).json({ 
            ok: true, 
            message: 'Event acknowledged, no Call ID found.' 
        });
    }
    
    // Acknowledge the webhook immediately
    res.status(200).json({ 
        ok: true, 
        message: `Event '${eventType}' acknowledged.` 
    });

    // For Twilio, the final status is 'completed'. For Ultravox, it's 'call.ended'.
    if (eventType === 'completed' || eventType === 'call.ended') {
        console.log(`📞 Call ended for ${callId} - processing transcript and recording.`);
        
        try {
            // Process the call completion
            const record = await processCallCompletion(callId, false);
            
            // Send emergency alert if needed
            if (record.immediateIntervention) {
                await sendEmergencyAlert(record);
            }
            
            console.log(`✅ Final processing complete for call ${callId}.`);
        } catch (error) {
            console.error(`Error processing call_ended event for ${callId}:`, error);
        }
    }
}