import twilio from 'twilio';
import { createUltravoxCall } from '../services/ultravox.js';
import { createConversation, getConversationsByPhoneNumber, buildConversationHistoryContext } from '../services/conversation.js';
import { createSystemPromptWithHistory, createUltravoxCallConfig } from '../config/index.js';

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
        
        console.log(`📞 Fetching conversation history for ${callerNumber}`);
        
        // Fetch previous conversations for this phone number
        const previousConversations = await getConversationsByPhoneNumber(callerNumber);
        console.log(`Found ${previousConversations.length} previous conversations for ${callerNumber}`);
        
        // Build conversation history context for the AI
        const conversationHistoryContext = buildConversationHistoryContext(previousConversations);
        
        // Create enhanced system prompt with conversation history
        const enhancedSystemPrompt = createSystemPromptWithHistory(conversationHistoryContext);
        
        // Create call configuration with the enhanced system prompt
        const callConfig = createUltravoxCallConfig(enhancedSystemPrompt);
        
        console.log(`🤖 Creating Ultravox call with ${conversationHistoryContext ? 'enhanced' : 'standard'} prompt`);
        
        const uvxResponse = await createUltravoxCall(callConfig);
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