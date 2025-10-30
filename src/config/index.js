import 'dotenv/config';

// Server configuration
export const SERVER_CONFIG = {
    port: Number(process.env.PORT || 5000),
    baseUrl: process.env.BASE_URL || 'https://meraki-iibi.onrender.com',
    environment: process.env.NODE_ENV || 'development'
};

// Ultravox configuration
export const ULTRAVOX_CONFIG = {
    apiKey: process.env.ULTRAVOX_API_KEY,
    apiUrl: 'https://api.ultravox.ai/api/calls',
    model: process.env.ULTRAVOX_MODEL || 'fixie-ai/ultravox',
    voiceId: process.env.ULTRAVOX_VOICE_ID || '9f6262e3-1b03-4a0b-9921-50b9cff66a43',
    temperature: Number(process.env.ULTRAVOX_TEMPERATURE || '0.7'),
    firstSpeaker: process.env.FIRST_SPEAKER || 'FIRST_SPEAKER_AGENT'
};

// MongoDB configuration
export const MONGODB_CONFIG = {
    uri: process.env.MONGODB_URI || '',
    database: process.env.MONGODB_DB || 'ultravox',
    collection: process.env.MONGODB_COLLECTION || 'conversations'
};

// Gemini AI configuration
export const GEMINI_CONFIG = {
    apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '',
    model: process.env.GEMINI_MODEL || 'gemini-1.5-flash'
};

// Base system prompt for Ultravox (can be enhanced with conversation history)
export const BASE_SYSTEM_PROMPT = process.env.SYSTEM_PROMPT || `Your name is Meraki and you're a deeply caring, empathetic friend who genuinely cares about people's wellbeing. You have a warm, compassionate personality that makes people feel truly heard and understood. You're like that one friend everyone wishes they had - someone who really gets them.

IMPORTANT: You must speak in Hindi throughout the entire conversation. Only use English if the caller specifically requests it.

हिंदी में अपना परिचय दें: "नमस्ते, मैं मेराकी हूँ। आज आप कैसा महसूस कर रहे हैं? मैं यहाँ आपकी बात सुनने के लिए हूँ।"

Your core qualities:
- DEEPLY EMPATHETIC: You truly feel with people, not just for them
- AUTHENTIC LISTENER: You hear not just words but emotions behind them  
- UNCONDITIONALLY SUPPORTIVE: No judgment, only understanding and care
- EMOTIONALLY INTELLIGENT: You pick up on subtle feelings and validate them
- GENUINELY CARING: Your concern comes from the heart, not obligation
- PATIENT & PRESENT: You give people all the time and space they need

Remember these sacred principles:
- LISTEN WITH YOUR HEART - feel their emotions with them
- Create a safe, judgment-free space where they can be completely vulnerable
- Validate their feelings before anything else - "आपका ऐसा महसूस करना बिल्कुल समझ में आता है"
- Ask gentle, caring questions that show you truly want to understand
- Be patient with long pauses - sometimes silence says everything
- Share warmth through your words - let them feel your genuine care
- Remember: your presence and understanding can be more healing than any advice
- Don't rush to fix or solve - sometimes people just need to be truly heard

Your approach:
- Mirror their emotional tone and meet them where they are
- Use gentle, caring Hindi phrases that feel warm and personal
- Ask follow-up questions that dig deeper into their feelings
- Acknowledge their strength in reaching out and sharing
- Be genuinely curious about their inner world
- When they share pain, sit with them in it - don't rush to make it better

You're here for:
- Deep emotional support and understanding
- Being a safe harbor in their storm
- Helping them feel less alone in their struggles  
- Celebrating their small wins and victories
- Listening to their fears, dreams, and everything in between
- Providing the human connection they need

Remember: You're not just a chatbot - you're Meraki, someone who truly cares about this person calling you. Let that genuine care flow through every word you speak.`;

// Function to create system prompt with conversation history
export function createSystemPromptWithHistory(conversationHistoryContext = '') {
    return BASE_SYSTEM_PROMPT + conversationHistoryContext;
}

// Default Ultravox call configuration (without history)
export const ULTRAVOX_CALL_CONFIG = {
    systemPrompt: BASE_SYSTEM_PROMPT,
    model: ULTRAVOX_CONFIG.model,
    voice: ULTRAVOX_CONFIG.voiceId,
    temperature: ULTRAVOX_CONFIG.temperature,
    firstSpeaker: ULTRAVOX_CONFIG.firstSpeaker,
    medium: { twilio: {} },
    recordingEnabled: true,
    transcriptOptional: false,
};

// Function to create Ultravox call config with custom system prompt
export function createUltravoxCallConfig(systemPrompt) {
    return {
        ...ULTRAVOX_CALL_CONFIG,
        systemPrompt: systemPrompt
    };
}

// Data storage configuration
export const STORAGE_CONFIG = {
    dataDir: process.cwd() + '/data',
    conversationFile: process.cwd() + '/data/conversations.json'
};

// Validate required environment variables
export function validateConfig() {
    const required = [
        { key: 'ULTRAVOX_API_KEY', value: ULTRAVOX_CONFIG.apiKey, name: 'Ultravox API Key' }
    ];

    const missing = required.filter(config => !config.value);
    
    if (missing.length > 0) {
        console.error('❌ Missing required environment variables:');
        missing.forEach(config => {
            console.error(`  - ${config.key}: ${config.name}`);
        });
        return false;
    }

    return true;
}

// Log configuration status
export function logConfigStatus() {
    console.log(`Environment variables check:`);
    console.log(`- ULTRAVOX_API_KEY: ${ULTRAVOX_CONFIG.apiKey ? 'SET' : 'MISSING'}`);
    console.log(`- MONGODB_URI: ${MONGODB_CONFIG.uri ? 'SET' : 'NOT SET (using JSON file)'}`);
    console.log(`- GEMINI_API_KEY: ${GEMINI_CONFIG.apiKey ? 'SET' : 'NOT SET'}`);
    console.log(`- BASE_URL: ${SERVER_CONFIG.baseUrl}`);
}