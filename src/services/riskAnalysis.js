import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_CONFIG } from '../config/index.js';

// Initialize Gemini AI if API key is available
let gemini;
if (GEMINI_CONFIG.apiKey) {
    try {
        gemini = new GoogleGenerativeAI(GEMINI_CONFIG.apiKey);
        console.log('✅ Gemini AI initialized successfully');
    } catch (e) {
        console.warn('⚠️ Failed to init Gemini SDK:', e);
    }
} else {
    console.warn('⚠️ Gemini API key not configured - AI analysis will be skipped');
}

// Cache for risk term patterns (compiled once for better performance)
const RISK_PATTERNS = {
    critical_severe: {
        score: 8,
        terms: [
            'suicide', 'kill myself', 'end my life', 'i want to die', 'hang myself', 
            'take my own life', 'marna chahta hun', 'jaan dena', 'suicide karna'
        ]
    },
    severe_plan: {
        score: 6,
        terms: [
            'jump off', 'overdose', 'self harm', 'self-harm', 'cut myself', 'razor blade', 
            'poison myself', 'gun to my head', 'bought a rope', 'bought pills', 'wrote a note'
        ]
    },
    high: {
        score: 3,
        terms: [
            'i am going to', 'i have a plan', 'goodbye forever', 'can\'t go on', 'hopeless', 
            'life is meaningless', 'nothing matters', 'give up completely', 'no way out', 
            'trapped forever', 'can\'t escape', 'ready to go', 'final decision', 'said goodbye', 
            'planning to end', 'going to jump', 'no reason to live', 'better off dead', 
            'koi raah nahi', 'umeed khatam', 'plan bana liya', 'alvida keh diya', 
            'bass khatam', 'zindagi khatam'
        ]
    },
    medium: {
        score: 2,
        terms: [
            'depressed', 'depression', 'anxious', 'panic', 'can\'t sleep', 'lost interest', 
            'crying a lot', 'worthless', 'feeling empty', 'numb inside', 'constant pain', 
            'overwhelming sadness', 'can\'t cope', 'breaking down', 'lost control', 'spiraling', 
            'dark thoughts', 'intrusive thoughts', 'mental breakdown', 'emotional pain', 
            'pareshan hun', 'depression hai', 'udaas hun', 'ro raha hun', 
            'kuch samajh nahi aa raha', 'pareshani hai', 'anxiety hai', 'ghabrat hai', 'dukh hai'
        ]
    },
    low: {
        score: 1,
        terms: [
            'stressed', 'sad', 'lonely', 'down', 'upset', 'tired of everything', 'frustrated', 
            'annoyed', 'irritated', 'fed up', 'overwhelmed', 'exhausted', 'burned out', 
            'bothered', 'disappointed', 'discouraged', 'moody', 'grumpy', 'pareshaan', 
            'gussa', 'tension', 'thak gaya', 'bore ho gaya', 'irritate ho raha', 
            'tang aa gaya', 'dimag kharab', 'stress hai'
        ]
    }
};

// Compile immediate risk patterns once
const IMMEDIATE_RISK_PATTERNS = [
    /i\s+(am|will|going to)\s+(kill|end|hurt|harm)\s+(my)/i,
    /tonight\s+(i|will|going)/i,
    /(plan|planning)\s+to\s+(die|kill|end)/i,
    /(ready|prepared)\s+to\s+(die|go|leave)/i,
    /going\s+to\s+(jump|hang)/i
];

// Performance optimization: Cache for analysis results (simple in-memory cache)
const analysisCache = new Map();
const CACHE_MAX_SIZE = 100;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Simple cache implementation with TTL
 */
function getCachedAnalysis(key) {
    const cached = analysisCache.get(key);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
        return cached.data;
    }
    return null;
}

function setCachedAnalysis(key, data) {
    if (analysisCache.size >= CACHE_MAX_SIZE) {
        // Remove oldest entry
        const oldestKey = analysisCache.keys().next().value;
        analysisCache.delete(oldestKey);
    }
    analysisCache.set(key, {
        data,
        timestamp: Date.now()
    });
}

/**
 * NEW: Complete Analysis with Audio Recording via Gemini AI
 * Always fetches fresh recording URL from Ultravox to avoid expiration issues
 */
export async function analyzeAudioRecording(callId) {
    const startTime = Date.now();
    
    console.log(`🎵 Starting audio analysis for call: ${callId}`);
    
    // Input validation
    if (!callId || typeof callId !== 'string') {
        console.warn('⚠️ Invalid call ID provided for analysis');
        return generateDefaultAudioResponse();
    }
    
    // Check cache first using call ID
    const cacheKey = `audio_analysis_${callId}`;
    const cachedResult = getCachedAnalysis(cacheKey);
    if (cachedResult) {
        console.log('📋 Using cached audio analysis result');
        return cachedResult;
    }
    
    // IMPORTANT: Always fetch fresh recording URL from Ultravox API
    // The stored URLs contain expiration tokens (5 minutes) and will fail if expired
    console.log('📥 Fetching fresh recording URL from Ultravox API...');
    let freshRecordingUrl;
    
    try {
        const { getUltravoxCallRecording } = await import('./ultravox.js');
        freshRecordingUrl = await getUltravoxCallRecording(callId);
        console.log(`✅ Fresh recording URL obtained: ${freshRecordingUrl.substring(0, 80)}...`);
    } catch (error) {
        console.error(`❌ Failed to fetch fresh recording URL for ${callId}:`, error.message);
        return {
            ...generateDefaultAudioResponse(),
            error: `Failed to fetch recording: ${error.message}`
        };
    }
    
    let audioAnalysis = null;
    
    if (gemini) {
        try {
            console.log('🤖 Starting Gemini audio analysis with fresh URL...');
            audioAnalysis = await performGeminiAudioAnalysisWithRetry(freshRecordingUrl, callId, 2);
            console.log('✅ Gemini audio analysis completed successfully');
        } catch (e) {
            console.warn('⚠️ Gemini audio analysis failed:', e.message);
            audioAnalysis = { 
                error: e.message, 
                fallback: true,
                ...generateDefaultAudioResponse()
            };
        }
    } else {
        console.warn('⚠️ Gemini AI not available - cannot analyze audio');
        return generateDefaultAudioResponse();
    }
    
    // Calculate legacy risk score for backwards compatibility
    const legacyScore = calculateLegacyRiskScore(audioAnalysis);
    
    const result = {
        // New comprehensive data from Gemini
        transcript: audioAnalysis.transcript || '',
        analysis: {
            risk_level: audioAnalysis.risk_level || 'no',
            counseling_needed: audioAnalysis.counseling_needed || 'no',
            immediate_intervention: audioAnalysis.immediate_intervention || 'no',
            emotional_state: audioAnalysis.emotional_state || 'Unknown',
            concerning_phrases: audioAnalysis.concerning_phrases || [],
            assessment_summary: audioAnalysis.assessment_summary || 'No assessment available',
            confidence_level: audioAnalysis.confidence_level || 'medium',
            language_used: audioAnalysis.language_used || 'unknown',
            support_recommendations: audioAnalysis.support_recommendations || 'Continue supportive engagement'
        },
        
        // Legacy fields for backwards compatibility
        tendency: audioAnalysis.risk_level || 'no',
        needsCounselling: audioAnalysis.counseling_needed || 'no',
        review: generateReviewSummary(audioAnalysis.risk_level || 'no', legacyScore),
        score: legacyScore,
        detectedTerms: [], // Not applicable for audio analysis
        geminiAnalysis: audioAnalysis,
        immediateIntervention: audioAnalysis.immediate_intervention === 'yes',
        
        // Metadata
        processingTime: Date.now() - startTime,
        source: 'audio_gemini_analysis',
        recordingUrl: freshRecordingUrl, // Fresh URL from Ultravox API
        callId: callId
    };
    
    // Cache the result
    setCachedAnalysis(cacheKey, result);
    
    console.log(`🎯 Audio analysis completed in ${result.processingTime}ms - Risk: ${result.tendency}, Transcript: ${result.transcript.length} chars`);
    return result;
}

/**
 * Legacy function maintained for backwards compatibility - now redirects to audio analysis if transcript is a URL
 */
export async function classifyRiskAndCounselling(transcriptOrUrl, callId = null) {
    // Check if input looks like a URL (recording URL)
    if (typeof transcriptOrUrl === 'string' && (transcriptOrUrl.startsWith('http') || transcriptOrUrl.startsWith('https'))) {
        console.log('🔄 Redirecting to audio analysis for URL input');
        return await analyzeAudioRecording(transcriptOrUrl, callId);
    }
    
    // Original text-based analysis (legacy support)
    const startTime = Date.now();
    
    // Input validation
    if (!transcriptOrUrl || typeof transcriptOrUrl !== 'string') {
        console.warn('⚠️ Invalid transcript text provided for analysis');
        return generateDefaultResponse();
    }
    
    const text = transcriptOrUrl.toLowerCase().trim();
    
    // Check cache first
    const cacheKey = `analysis_${Buffer.from(text.substring(0, 200)).toString('base64')}`;
    const cachedResult = getCachedAnalysis(cacheKey);
    if (cachedResult) {
        console.log('📋 Using cached analysis result');
        return cachedResult;
    }
    
    let score = 0;
    let detectedTerms = [];
    
    // Optimized term matching using the pre-compiled patterns
    Object.entries(RISK_PATTERNS).forEach(([category, pattern]) => {
        pattern.terms.forEach(term => {
            if (text.includes(term)) {
                score += pattern.score;
                detectedTerms.push({ term, category });
            }
        });
    });

    // Check for immediate risk patterns using pre-compiled regex
    IMMEDIATE_RISK_PATTERNS.forEach(pattern => {
        if (pattern.test(text)) {
            score += 10;
            detectedTerms.push({ term: 'immediate_risk_pattern', category: 'critical_severe' });
        }
    });
    
    // Determine risk level and counselling needs
    const riskAssessment = assessRiskLevel(score);
    
    // Generate Gemini AI analysis (with timeout and retry logic)
    let geminiAnalysis = null;
    if (gemini && text.length > 50) {
        try {
            console.log('🤖 Starting Gemini analysis...');
            geminiAnalysis = await performGeminiAnalysisWithRetry(transcriptOrUrl, 2);
            console.log('✅ Gemini analysis completed successfully');
        } catch (e) {
            console.warn('⚠️ Gemini analysis failed:', e.message);
            geminiAnalysis = { error: e.message, fallback: true };
        }
    }
    
    const result = {
        ...riskAssessment,
        score,
        detectedTerms,
        geminiAnalysis,
        immediateIntervention: riskAssessment.tendency === 'severe' || 
                              detectedTerms.some(t => t.category === 'critical_severe') || 
                              (geminiAnalysis?.immediate_intervention === 'yes'),
        processingTime: Date.now() - startTime
    };
    
    // Cache the result
    setCachedAnalysis(cacheKey, result);
    
    console.log(`🎯 Risk analysis completed in ${result.processingTime}ms - Risk: ${result.tendency}, Score: ${score}`);
    return result;
}

/**
 * Assess risk level and counselling needs based on score
 */
function assessRiskLevel(score) {
    let tendency = 'no';
    let needsCounselling = 'no';
    
    if (score >= 10) {
        tendency = 'severe';
        needsCounselling = 'yes';
    } else if (score >= 6) {
        tendency = 'high';
        needsCounselling = 'yes';
    } else if (score >= 4) {
        tendency = 'medium';
        needsCounselling = 'advised';
    } else if (score >= 1) {
        tendency = 'low';
        needsCounselling = 'no';
    }
    
    return {
        tendency,
        needsCounselling,
        review: generateReviewSummary(tendency, score)
    };
}

/**
 * Download audio file from URL
 */
async function downloadAudioFile(url) {
    const https = await import('https');
    
    return new Promise((resolve, reject) => {
        const request = https.request(url, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download audio: HTTP ${response.statusCode}`));
                return;
            }
            
            const chunks = [];
            response.on('data', chunk => chunks.push(chunk));
            response.on('end', () => {
                const buffer = Buffer.concat(chunks);
                console.log(`📥 Downloaded audio file: ${buffer.length} bytes`);
                resolve(buffer);
            });
        });
        
        request.on('error', reject);
        request.setTimeout(30000, () => {
            request.destroy();
            reject(new Error('Audio download timeout'));
        });
        
        request.end();
    });
}

/**
 * Calculate legacy risk score from Gemini analysis for backwards compatibility
 */
function calculateLegacyRiskScore(analysis) {
    if (!analysis || !analysis.risk_level) return 0;
    
    const riskLevelScores = {
        'no': 0,
        'low': 1,
        'medium': 3,
        'high': 6,
        'severe': 10
    };
    
    let score = riskLevelScores[analysis.risk_level] || 0;
    
    // Add points for concerning phrases
    if (analysis.concerning_phrases && analysis.concerning_phrases.length > 0) {
        score += analysis.concerning_phrases.length;
    }
    
    // Add points for immediate intervention
    if (analysis.immediate_intervention === 'yes') {
        score += 5;
    }
    
    return score;
}

/**
 * Validate and sanitize Gemini audio response
 */
function validateGeminiAudioResponse(response) {
    const validRiskLevels = ['no', 'low', 'medium', 'high', 'severe'];
    const validCounselingLevels = ['no', 'advised', 'yes'];
    const validConfidenceLevels = ['low', 'medium', 'high'];
    
    return {
        transcript: String(response.transcript || '').substring(0, 10000), // Limit transcript length
        risk_level: validRiskLevels.includes(response.risk_level) ? response.risk_level : 'no',
        counseling_needed: validCounselingLevels.includes(response.counseling_needed) ? response.counseling_needed : 'no',
        immediate_intervention: response.immediate_intervention === 'yes' ? 'yes' : 'no',
        emotional_state: String(response.emotional_state || 'Unknown emotional state').substring(0, 300),
        concerning_phrases: Array.isArray(response.concerning_phrases) ? 
            response.concerning_phrases.slice(0, 10).map(p => String(p).substring(0, 200)) : [],
        assessment_summary: String(response.assessment_summary || 'No assessment available').substring(0, 1000),
        confidence_level: validConfidenceLevels.includes(response.confidence_level) ? response.confidence_level : 'medium',
        language_used: String(response.language_used || 'unknown').toLowerCase(),
        support_recommendations: String(response.support_recommendations || 'Continue supportive listening').substring(0, 500)
    };
}

/**
 * Generate default response for invalid input
 */
function generateDefaultResponse() {
    return {
        tendency: 'unknown',
        needsCounselling: 'no',
        review: 'Unable to analyze transcript - invalid or empty input',
        score: 0,
        detectedTerms: [],
        geminiAnalysis: null,
        immediateIntervention: false,
        processingTime: 0
    };
}

/**
 * Generate default response for audio analysis failures
 */
function generateDefaultAudioResponse() {
    return {
        transcript: '',
        analysis: {
            risk_level: 'unknown',
            counseling_needed: 'no',
            immediate_intervention: 'no',
            emotional_state: 'Unable to determine',
            concerning_phrases: [],
            assessment_summary: 'Unable to analyze audio recording - analysis failed',
            confidence_level: 'low',
            language_used: 'unknown',
            support_recommendations: 'Manual review recommended'
        },
        tendency: 'unknown',
        needsCounselling: 'no',
        review: 'Unable to analyze audio recording - invalid URL or analysis failed',
        score: 0,
        detectedTerms: [],
        geminiAnalysis: null,
        immediateIntervention: false,
        processingTime: 0,
        source: 'audio_analysis_failed'
    };
}

/**
 * NEW: Perform Gemini AI audio analysis with retry logic
 */
async function performGeminiAudioAnalysisWithRetry(recordingUrl, callId, maxRetries = 2) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await performGeminiAudioAnalysis(recordingUrl, callId, attempt === maxRetries);
        } catch (error) {
            console.warn(`🎵 Gemini audio analysis attempt ${attempt} failed:`, error.message);
            if (attempt === maxRetries) {
                throw error;
            }
            // Wait before retry (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
    }
}

/**
 * Perform Gemini AI analysis with retry logic and timeout
 */
async function performGeminiAnalysisWithRetry(transcriptText, maxRetries = 2) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await performGeminiAnalysis(transcriptText, attempt === maxRetries);
        } catch (error) {
            console.warn(`🤖 Gemini analysis attempt ${attempt} failed:`, error.message);
            if (attempt === maxRetries) {
                throw error;
            }
            // Wait before retry (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
    }
}

/**
 * NEW: Perform Gemini AI analysis on audio recording with comprehensive output
 */
async function performGeminiAudioAnalysis(recordingUrl, callId, isLastAttempt = false) {
    console.log(`🎵 Processing audio analysis for call ${callId} with URL: ${recordingUrl.substring(0, 80)}...`);
    
    // For now, we'll download the audio and send it to Gemini
    // Note: This is a simplified approach. In production, you might want to:
    // 1. Stream the audio directly
    // 2. Use specialized audio processing
    // 3. Handle large files differently
    
    try {
        // Download the audio file
        console.log('📥 Downloading audio file...');
        const audioBuffer = await downloadAudioFile(recordingUrl);
        
        // Get Gemini model with vision/audio capabilities
        const model = gemini.getGenerativeModel({ model: "gemini-2.5-pro" });
        
        // Create the comprehensive prompt for audio analysis
        const prompt = `Please analyze this mental health support call recording and provide a comprehensive analysis. 

IMPORTANT: Respond ONLY with valid JSON in this exact format:

{
  "transcript": "full conversation transcript with speaker labels (User: / Agent:)",
  "risk_level": "no|low|medium|high|severe",
  "counseling_needed": "no|advised|yes",
  "immediate_intervention": "yes|no",
  "emotional_state": "detailed emotional state of the caller",
  "concerning_phrases": ["list of concerning phrases or statements"],
  "assessment_summary": "comprehensive assessment paragraph including emotional state, risk factors, and recommendations", 
  "confidence_level": "low|medium|high",
  "language_used": "hindi|english|hinglish|other",
  "support_recommendations": "specific actionable recommendations for support"
}

Please listen carefully to the entire conversation and provide:
1. A complete transcript with speaker identification
2. Mental health risk assessment 
3. Emotional state analysis
4. Any concerning language or indicators
5. Professional recommendations for support

Focus on identifying signs of distress, suicidal ideation, depression, anxiety, or other mental health concerns.`;

        console.log(`🤖 Sending audio to Gemini for analysis... (File size: ${(audioBuffer.length / 1024 / 1024).toFixed(2)}MB)`);
        console.log('⏳ This may take 2-5 minutes for large audio files. Please wait...');
        
        // Create progress indicator for long-running operations
        const progressInterval = setInterval(() => {
            console.log('🔄 Still processing audio with Gemini AI...');
        }, 30000); // Log every 30 seconds
        
        // Create a promise that will timeout after 5 minutes (audio processing can take a long time for large files)
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
                clearInterval(progressInterval);
                reject(new Error('Gemini audio analysis timeout after 5 minutes'));
            }, 300000); // 5 minutes
        });
        
        const analysisPromise = model.generateContent([
            prompt,
            {
                inlineData: {
                    data: audioBuffer.toString('base64'),
                    mimeType: 'audio/wav'
                }
            }
        ]).then(result => {
            clearInterval(progressInterval); // Clear progress indicator on success
            
            const responseText = result.response.text().trim()
                .replace(/^```json\n?/, '')
                .replace(/\n?```$/, '')
                .replace(/^```\n?/, '')
                .replace(/\n?```$/, '');
            
            console.log('📋 Received Gemini response, parsing JSON...');
            
            try {
                const parsed = JSON.parse(responseText);
                return validateGeminiAudioResponse(parsed);
            } catch (parseError) {
                console.warn('🤖 Failed to parse Gemini audio response:', responseText.substring(0, 300));
                console.warn('Parse error:', parseError.message);
                throw new Error(`Invalid JSON response from Gemini: ${parseError.message}`);
            }
        });
        
        return Promise.race([analysisPromise, timeoutPromise]);
        
    } catch (error) {
        console.error('❌ Audio analysis failed:', error.message);
        throw new Error(`Audio analysis failed: ${error.message}`);
    }
}

/**
 * Perform Gemini AI analysis on the transcript with timeout
 */
async function performGeminiAnalysis(transcriptText, isLastAttempt = false) {
    const model = gemini.getGenerativeModel({ model: GEMINI_CONFIG.model });
    
    // Optimized prompt for better performance and accuracy
    const prompt = `Analyze this mental health support conversation transcript. Respond ONLY with valid JSON.

Required format:
{
  "risk_level": "no|low|medium|high|severe",
  "counseling_needed": "no|advised|yes", 
  "immediate_intervention": "yes|no",
  "emotional_state": "brief emotional state description",
  "concerning_phrases": ["up to 3 most concerning direct quotes"],
  "assessment_summary": "one paragraph analysis summary",
  "confidence_level": "low|medium|high",
  "language_used": "hindi|english|hinglish",
  "support_recommendations": "one actionable recommendation"
}

Transcript: "${transcriptText.substring(0, 2000)}"`;
    
    // Create a promise that will timeout after 15 seconds
    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Gemini API timeout')), 15000);
    });
    
    const analysisPromise = model.generateContent(prompt)
        .then(result => {
            const responseText = result.response.text().trim()
                .replace(/^```json\n?/, '')
                .replace(/\n?```$/, '')
                .replace(/^```\n?/, '')
                .replace(/\n?```$/, '');
            
            try {
                const parsed = JSON.parse(responseText);
                return validateGeminiResponse(parsed);
            } catch (parseError) {
                console.warn('🤖 Failed to parse Gemini response:', responseText.substring(0, 200));
                throw new Error(`Invalid JSON response from Gemini: ${parseError.message}`);
            }
        });
    
    return Promise.race([analysisPromise, timeoutPromise]);
}

/**
 * Validate and sanitize Gemini response
 */
function validateGeminiResponse(response) {
    const validRiskLevels = ['no', 'low', 'medium', 'high', 'severe'];
    const validCounselingLevels = ['no', 'advised', 'yes'];
    const validConfidenceLevels = ['low', 'medium', 'high'];
    
    return {
        risk_level: validRiskLevels.includes(response.risk_level) ? response.risk_level : 'unknown',
        counseling_needed: validCounselingLevels.includes(response.counseling_needed) ? response.counseling_needed : 'no',
        immediate_intervention: response.immediate_intervention === 'yes' ? 'yes' : 'no',
        emotional_state: String(response.emotional_state || 'Unknown emotional state').substring(0, 200),
        concerning_phrases: Array.isArray(response.concerning_phrases) ? 
            response.concerning_phrases.slice(0, 5).map(p => String(p).substring(0, 100)) : [],
        assessment_summary: String(response.assessment_summary || 'No assessment available').substring(0, 500),
        confidence_level: validConfidenceLevels.includes(response.confidence_level) ? response.confidence_level : 'medium',
        language_used: String(response.language_used || 'unknown').toLowerCase(),
        support_recommendations: String(response.support_recommendations || 'Continue supportive listening').substring(0, 200)
    };
}

/**
 * Generate a comprehensive review summary based on risk tendency and score
 */
function generateReviewSummary(tendency, score = 0) {
    const summaries = {
        'severe': `🚨 SEVERE RISK DETECTED (Score: ${score}) - IMMEDIATE INTERVENTION REQUIRED. Strong indicators of self-harm or suicidal ideation present. Contact crisis intervention team immediately.`,
        'high': `⚠️ HIGH RISK DETECTED (Score: ${score}) - Significant mental health concerns identified. Professional counseling strongly recommended within 24-48 hours.`,
        'medium': `⚡ MODERATE CONCERN (Score: ${score}) - Some distress indicators present. Consider professional support and continue monitoring. Follow up within a week.`,
        'low': `💭 MILD DISTRESS (Score: ${score}) - Minor stress indicators detected. Supportive listening and general wellness resources may help. Routine check-in recommended.`,
        'no': `✅ NO SIGNIFICANT RISK (Score: ${score}) - Conversation appears to be within normal emotional ranges. Continue supportive engagement.`,
        'unknown': `❓ UNABLE TO ASSESS - Invalid or insufficient data for analysis. Consider requesting clearer information or manual review.`
    };
    
    return summaries[tendency] || summaries['unknown'];
}

/**
 * Get risk analysis statistics for performance monitoring
 */
export function getRiskAnalysisStats() {
    return {
        cacheSize: analysisCache.size,
        cacheMaxSize: CACHE_MAX_SIZE,
        cacheTtl: CACHE_TTL,
        geminiAvailable: !!gemini,
        patternsLoaded: Object.keys(RISK_PATTERNS).length,
        immediatePatterns: IMMEDIATE_RISK_PATTERNS.length
    };
}

/**
 * Clear analysis cache (useful for testing or memory management)
 */
export function clearAnalysisCache() {
    const previousSize = analysisCache.size;
    analysisCache.clear();
    console.log(`🧹 Cleared analysis cache (${previousSize} entries removed)`);
    return previousSize;
}

/**
 * Send emergency alert (placeholder for actual implementation)
 */
export async function sendEmergencyAlert(alertData) {
    console.log(`🚨 EMERGENCY ALERT TRIGGERED for call ${alertData.callId}`);
    // TODO: Implement actual alert integrations (email, SMS, webhook, etc.)
    
    // Example implementations:
    // - Send SMS to crisis intervention team
    // - Send email notification to supervisors
    // - Post to Slack channel
    // - Call webhook endpoint for external systems
    
    return {
        alertSent: true,
        timestamp: new Date().toISOString(),
        callId: alertData.callId,
        riskLevel: alertData.tendency
    };
}