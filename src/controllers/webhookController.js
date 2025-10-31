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
            // Determine if this is an Ultravox callId or Twilio CallSid
            const isUltravoxCallId = event.event === 'call.ended' || event.call?.callId;
            console.log(`🔍 Call ID Type: ${isUltravoxCallId ? 'Ultravox CallId' : 'Twilio CallSid'}`);
            console.log(`⚙️ Starting call completion processing...`);
            
            // Process the call completion with the correct ID type
            const record = await processCallCompletion(callId, isUltravoxCallId);
            console.log(`✅ Call processing successful for ${callId}`);
            console.log(`📊 Risk Analysis Complete - Score: ${record.riskScore || 'N/A'}`);
            
            // Send emergency alert if needed
            if (record.immediateIntervention) {
                console.log(`🚨 HIGH RISK DETECTED - Sending emergency alert for ${callId}`);
                await sendEmergencyAlert(record);
                console.log(`📧 Emergency alert sent successfully`);
            } else {
                console.log(`✅ No immediate intervention required - Risk level: ${record.riskLevel || 'Normal'}`);
            }
            
            console.log(`✅ Final processing complete for call ${callId}.`);
        } catch (error) {
            console.error(`❌ Error processing call_ended event for ${callId}:`, error);
            console.error(`📍 Error details:`, {
                message: error.message,
                stack: error.stack?.split('\n').slice(0, 3).join('\n')
            });
        }
    } else {
        console.log(`ℹ️  Non-terminal event received: ${eventType} for ${callId}`);
    }
}