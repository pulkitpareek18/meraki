import twilio from 'twilio';
import { createUltravoxCall } from '../services/ultravox.js';
import { createConversation } from '../services/conversation.js';
import { ULTRAVOX_CALL_CONFIG } from '../config/index.js';

/**
 * Handle incoming Twilio calls
 */
export async function handleIncomingCall(req, res) {
    console.log('=== INCOMING CALL ===', req.body);
    
    try {
        const callerNumber = req.body.From;
        const callSid = req.body.CallSid;
        
        if (!callerNumber) {
            throw new Error('No caller number found in request');
        }
        
        const uvxResponse = await createUltravoxCall(ULTRAVOX_CALL_CONFIG);
        console.log('Ultravox response structure:', JSON.stringify(uvxResponse, null, 2));

        // Handle different possible response structures
        let joinUrl, callId;
        
        if (uvxResponse.call) {
            // If response has nested 'call' object (webhook structure)
            joinUrl = uvxResponse.call.joinUrl;
            callId = uvxResponse.call.callId;
        } else if (uvxResponse.joinUrl) {
            // If response has direct properties (API response structure)
            joinUrl = uvxResponse.joinUrl;
            callId = uvxResponse.callId;
        } else {
            console.error('Unexpected response structure from Ultravox:', uvxResponse);
            throw new Error('Invalid response structure from Ultravox API');
        }

        if (!joinUrl || !callId) {
            console.error('Missing joinUrl or callId in response:', { joinUrl, callId, uvxResponse });
            throw new Error('Missing required fields (joinUrl, callId) in Ultravox response');
        }

        console.log(`Connecting call ${callSid} to Ultravox call ${callId}`);
        
        // Create TwiML response
        const twiml = new twilio.twiml.VoiceResponse();
        twiml.connect().stream({ url: joinUrl });
        res.type('text/xml').send(twiml.toString());

        // Store the conversation record
        await createConversation({
            id: callId,
            twilioCallSid: callSid,
            from: callerNumber,
            raw: { uvxResponse, twilioRequest: req.body }
        });
        
    } catch (error) {
        console.error('Error handling incoming call:', error);
        
        const twiml = new twilio.twiml.VoiceResponse();
        twiml.say({ 
            voice: 'alice', 
            language: 'en-IN' 
        }, 'We are experiencing difficulty connecting your call. Please try again shortly.');
        twiml.hangup();
        
        res.type('text/xml').send(twiml.toString());
    }
}