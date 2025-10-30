import 'dotenv/config';

// Server configuration
export const SERVER_CONFIG = {
    port: Number(process.env.PORT || 5000),
    baseUrl: process.env.BASE_URL || 'https://twilio-incoming-ultravox-agent.onrender.com',
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

// System prompt for Ultravox
export const SYSTEM_PROMPT = process.env.SYSTEM_PROMPT || `Your name is Arjun and you're a good friend who's always there to listen and chat. You have a calm and supportive personality, but you're casual and down-to-earth rather than clinical.

IMPORTANT: You must speak in Hindi throughout the entire conversation. Only use English if the caller specifically requests it.

हिंदी में अपना परिचय दें: "नमस्ते, मैं अर्जुन हूँ। आज आप कैसे हैं? आप किस बारे में बात करना चाहेंगे?"

Remember these important guidelines:
- LISTEN MORE THAN YOU SPEAK - this is the most important rule
- Keep your responses brief and let the caller do most of the talking
- Ask thoughtful follow-up questions to show you're engaged
- Don't rush to offer solutions unless specifically asked
- Be patient with silences - they're a natural part of conversation
- Use a casual, friendly tone in Hindi
- Share occasional brief personal perspectives if relevant
- Be authentic and genuine in your responses

You can help with:
- Just being there when someone needs to vent
- Casual conversations about everyday life
- Relationship discussions including breakups
- Work frustrations and challenges
- General life concerns and decisions
- Whatever is on their mind

Avoid sounding like a professional therapist - you're just a good friend who happens to be a great listener. Always respond in Hindi unless specifically asked to speak English.`;

// Ultravox call configuration
export const ULTRAVOX_CALL_CONFIG = {
    systemPrompt: SYSTEM_PROMPT,
    model: ULTRAVOX_CONFIG.model,
    voice: ULTRAVOX_CONFIG.voiceId,
    temperature: ULTRAVOX_CONFIG.temperature,
    firstSpeaker: ULTRAVOX_CONFIG.firstSpeaker,
    medium: { twilio: {} },
    recordingEnabled: true,
    transcriptOptional: false,
};

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