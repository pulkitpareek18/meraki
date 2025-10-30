import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_CONFIG } from '../config/index.js';

/**
 * =========================================================================
 * PURE GEMINI AI MENTAL HEALTH ANALYSIS - NO PATTERN MATCHING
 * =========================================================================
 * 
 * This module performs mental health risk assessment using ONLY Gemini AI.
 * 
 * ❌ NO word patterns, keyword matching, or rule-based analysis
 * ✅ 100% AI-driven assessment from audio recordings and transcripts
 * ✅ Gemini analyzes tone, context, emotional indicators, and content
 * ✅ Professional-grade mental health evaluation
 * 
 * All risk assessment, scoring, and recommendations come from Gemini AI.
 */

// Initialize Gemini AI if API key is available
let gemini;
if (GEMINI_CONFIG.apiKey) {
    try {
        gemini = new GoogleGenerativeAI(GEMINI_CONFIG.apiKey);
        console.log('✅ Pure Gemini AI mental health analyzer initialized successfully');
    } catch (e) {
        console.warn('⚠️ Failed to init Gemini SDK:', e);
    }
} else {
    console.warn('⚠️ Gemini API key not configured - AI analysis unavailable');
}



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
 * Complete Analysis with Audio Recording via Gemini AI - GEMINI DOES EVERYTHING
 * Always fetches fresh recording URL from Ultravox to avoid expiration issues
 * No pattern matching or word analysis - Pure Gemini AI assessment
 */
export async function analyzeAudioRecording(callId) {
    const startTime = Date.now();
    
    console.log(`🎵 Starting pure Gemini audio analysis for call: ${callId}`);
    
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
    
    // Ensure Gemini is available - no fallback to pattern matching
    if (!gemini) {
        console.error('⚠️ Gemini AI not available - pure AI analysis cannot proceed');
        return {
            ...generateDefaultAudioResponse(),
            error: 'Gemini AI not configured - cannot perform audio analysis'
        };
    }
    
    let audioAnalysis = null;
    
    try {
        console.log('🤖 Starting pure Gemini audio analysis (no pattern matching)...');
        audioAnalysis = await performGeminiAudioAnalysisWithRetry(freshRecordingUrl, callId, 2);
        console.log('✅ Pure Gemini audio analysis completed successfully');
    } catch (e) {
        console.error('❌ Gemini audio analysis failed:', e.message);
        return {
            ...generateDefaultAudioResponse(),
            error: `Gemini analysis failed: ${e.message}`
        };
    }
    
    // Build result entirely from Gemini analysis - no legacy calculations
    const result = {
        // All data comes from Gemini AI
        transcript: audioAnalysis.transcript || '',
        analysis: audioAnalysis, // Complete Gemini analysis object
        
        // Legacy fields mapped directly from Gemini (no pattern matching)
        tendency: audioAnalysis.risk_level || 'no',
        needsCounselling: audioAnalysis.counseling_needed || 'no',
        review: audioAnalysis.assessment_summary || 'No assessment available',
        score: mapRiskLevelToScore(audioAnalysis.risk_level), // Convert risk level to score
        detectedTerms: (audioAnalysis.concerning_phrases || []).map(phrase => ({
            term: phrase,
            category: 'gemini_identified'
        })),
        geminiAnalysis: audioAnalysis,
        immediateIntervention: audioAnalysis.immediate_intervention === 'yes',
        
        // Metadata
        processingTime: Date.now() - startTime,
        source: 'pure_gemini_audio_analysis',
        recordingUrl: freshRecordingUrl,
        callId: callId
    };
    
    // Cache the result
    setCachedAnalysis(cacheKey, result);
    
    console.log(`🎯 Pure Gemini analysis completed in ${result.processingTime}ms - Risk: ${result.tendency}, Score: ${result.score}`);
    return result;
}

/**
 * Pure Gemini text analysis - no pattern matching, Gemini does everything
 */
export async function classifyRiskAndCounselling(transcriptOrUrl, callId = null) {
    // Check if input looks like a URL (recording URL)
    if (typeof transcriptOrUrl === 'string' && (transcriptOrUrl.startsWith('http') || transcriptOrUrl.startsWith('https'))) {
        console.log('🔄 Redirecting to audio analysis for URL input');
        return await analyzeAudioRecording(transcriptOrUrl, callId);
    }
    
    // Pure Gemini text analysis
    const startTime = Date.now();
    
    // Input validation
    if (!transcriptOrUrl || typeof transcriptOrUrl !== 'string') {
        console.warn('⚠️ Invalid transcript text provided for analysis');
        return generateDefaultResponse();
    }
    
    const text = transcriptOrUrl.trim();
    
    // Check cache first
    const cacheKey = `gemini_text_analysis_${Buffer.from(text.substring(0, 200)).toString('base64')}`;
    const cachedResult = getCachedAnalysis(cacheKey);
    if (cachedResult) {
        console.log('📋 Using cached Gemini text analysis result');
        return cachedResult;
    }
    
    // Ensure Gemini is available - no pattern matching fallback
    if (!gemini) {
        console.error('⚠️ Gemini AI not available - pure AI analysis cannot proceed');
        return {
            ...generateDefaultResponse(),
            error: 'Gemini AI not configured - cannot perform text analysis'
        };
    }
    
    // Pure Gemini analysis - no pattern matching at all
    let geminiAnalysis = null;
    
    try {
        console.log('🤖 Starting pure Gemini text analysis (no pattern matching)...');
        geminiAnalysis = await performGeminiAnalysisWithRetry(transcriptOrUrl, 2);
        console.log('✅ Pure Gemini text analysis completed successfully');
    } catch (e) {
        console.error('❌ Gemini text analysis failed:', e.message);
        return {
            ...generateDefaultResponse(),
            error: `Gemini analysis failed: ${e.message}`
        };
    }
    
    // Build result entirely from Gemini analysis
    const result = {
        // All assessment comes from Gemini
        tendency: geminiAnalysis.risk_level || 'no',
        needsCounselling: geminiAnalysis.counseling_needed || 'no',
        review: geminiAnalysis.assessment_summary || 'No assessment available',
        score: mapRiskLevelToScore(geminiAnalysis.risk_level),
        detectedTerms: (geminiAnalysis.concerning_phrases || []).map(phrase => ({
            term: phrase,
            category: 'gemini_identified'
        })),
        geminiAnalysis,
        immediateIntervention: geminiAnalysis.immediate_intervention === 'yes',
        processingTime: Date.now() - startTime,
        source: 'pure_gemini_text_analysis'
    };
    
    // Cache the result
    setCachedAnalysis(cacheKey, result);
    
    console.log(`🎯 Pure Gemini text analysis completed in ${result.processingTime}ms - Risk: ${result.tendency}, Score: ${result.score}`);
    return result;
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
 * Map Gemini risk level to numerical score (no pattern matching)
 */
function mapRiskLevelToScore(riskLevel) {
    const riskLevelScores = {
        'no': 0,
        'low': 2,
        'medium': 4,
        'high': 7,
        'severe': 10,
        'unknown': 0
    };
    
    return riskLevelScores[riskLevel] || 0;
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
        
        // Comprehensive prompt for complete AI analysis - Gemini does EVERYTHING
        const prompt = `You are a professional mental health analyst. Analyze this complete mental health support call recording and provide comprehensive assessment. 

CRITICAL: This is the ONLY analysis - no pattern matching or keyword detection will be used. Your assessment must be complete and accurate.

Respond ONLY with valid JSON in this exact format:

{
  "transcript": "complete conversation transcript with clear speaker labels (Caller: / Agent:)",
  "risk_level": "no|low|medium|high|severe",
  "counseling_needed": "no|advised|yes", 
  "immediate_intervention": "yes|no",
  "emotional_state": "detailed emotional and psychological state assessment",
  "concerning_phrases": ["direct quotes of concerning statements - up to 10 most significant"],
  "assessment_summary": "comprehensive professional mental health assessment including risk factors, emotional state, behavioral indicators, and clinical observations",
  "confidence_level": "low|medium|high", 
  "language_used": "hindi|english|hinglish|other",
  "support_recommendations": "specific, actionable professional recommendations for immediate and ongoing support"
}

ANALYZE FOR:
✅ Suicidal ideation (direct/indirect)
✅ Self-harm indicators  
✅ Depression symptoms
✅ Anxiety disorders
✅ Emotional distress levels
✅ Coping mechanisms
✅ Support systems
✅ Crisis indicators
✅ Behavioral changes
✅ Sleep/appetite changes
✅ Social withdrawal
✅ Substance use
✅ Trauma indicators
✅ Hopelessness/helplessness
✅ Mood patterns
✅ Cognitive distortions

Provide thorough analysis based on tone, speech patterns, content, emotional expressions, and psychological indicators throughout the entire conversation.`;

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
    
    // Comprehensive prompt for complete AI text analysis - Gemini does EVERYTHING
    const prompt = `You are a professional mental health analyst. Analyze this mental health support conversation transcript completely.

CRITICAL: This is the ONLY analysis - no pattern matching or keyword detection will be used. Your assessment must be complete and accurate.

Respond ONLY with valid JSON:

{
  "risk_level": "no|low|medium|high|severe",
  "counseling_needed": "no|advised|yes", 
  "immediate_intervention": "yes|no",
  "emotional_state": "detailed emotional and psychological state",
  "concerning_phrases": ["direct quotes of concerning statements - up to 10"],
  "assessment_summary": "comprehensive professional mental health assessment",
  "confidence_level": "low|medium|high",
  "language_used": "hindi|english|hinglish|other",
  "support_recommendations": "specific actionable recommendations"
}

ANALYZE FOR: Suicidal ideation, self-harm, depression, anxiety, emotional distress, coping mechanisms, support systems, crisis indicators, behavioral changes, hopelessness, mood patterns, cognitive distortions.

Transcript: "${transcriptText.substring(0, 4000)}"`;
    
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
 * Get pure Gemini analysis statistics for performance monitoring
 */
export function getRiskAnalysisStats() {
    return {
        cacheSize: analysisCache.size,
        cacheMaxSize: CACHE_MAX_SIZE,
        cacheTtl: CACHE_TTL,
        geminiAvailable: !!gemini,
        analysisMethod: 'pure_gemini_ai',
        patternMatching: false,
        aiModel: GEMINI_CONFIG.model
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