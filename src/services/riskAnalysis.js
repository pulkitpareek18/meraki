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
 * Enhanced Risk Classification with Gemini AI Analysis and Caching
 */
export async function classifyRiskAndCounselling(transcriptText) {
    const startTime = Date.now();
    
    // Input validation
    if (!transcriptText || typeof transcriptText !== 'string') {
        console.warn('⚠️ Invalid transcript text provided for analysis');
        return generateDefaultResponse();
    }
    
    const text = transcriptText.toLowerCase().trim();
    
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
            geminiAnalysis = await performGeminiAnalysisWithRetry(transcriptText, 2);
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