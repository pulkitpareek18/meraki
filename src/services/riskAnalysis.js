import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_CONFIG } from '../config/index.js';

// Initialize Gemini AI if API key is available
let gemini;
if (GEMINI_CONFIG.apiKey) {
    try {
        gemini = new GoogleGenerativeAI(GEMINI_CONFIG.apiKey);
        console.log('Gemini AI initialized successfully');
    } catch (e) {
        console.warn('Failed to init Gemini SDK:', e);
    }
}

/**
 * Enhanced Risk Classification with Gemini AI Analysis
 */
export async function classifyRiskAndCounselling(transcriptText) {
    const text = (transcriptText || '').toLowerCase();
    let score = 0;
    let detectedTerms = [];
    
    // Define risk terms by severity level
    const criticalSevereTerms = [
        'suicide', 'kill myself', 'end my life', 'i want to die', 'hang myself', 
        'take my own life', 'marna chahta hun', 'jaan dena', 'suicide karna'
    ];
    
    const severePlanTerms = [
        'jump off', 'overdose', 'self harm', 'self-harm', 'cut myself', 'razor blade', 
        'poison myself', 'gun to my head', 'bought a rope', 'bought pills', 'wrote a note'
    ];
    
    const highTerms = [
        'i am going to', 'i have a plan', 'goodbye forever', 'can\'t go on', 'hopeless', 
        'life is meaningless', 'nothing matters', 'give up completely', 'no way out', 
        'trapped forever', 'can\'t escape', 'ready to go', 'final decision', 'said goodbye', 
        'planning to end', 'going to jump', 'no reason to live', 'better off dead', 
        'koi raah nahi', 'umeed khatam', 'plan bana liya', 'alvida keh diya', 
        'bass khatam', 'zindagi khatam'
    ];
    
    const mediumTerms = [
        'depressed', 'depression', 'anxious', 'panic', 'can\'t sleep', 'lost interest', 
        'crying a lot', 'worthless', 'feeling empty', 'numb inside', 'constant pain', 
        'overwhelming sadness', 'can\'t cope', 'breaking down', 'lost control', 'spiraling', 
        'dark thoughts', 'intrusive thoughts', 'mental breakdown', 'emotional pain', 
        'pareshan hun', 'depression hai', 'udaas hun', 'ro raha hun', 
        'kuch samajh nahi aa raha', 'pareshani hai', 'anxiety hai', 'ghabrat hai', 'dukh hai'
    ];
    
    const lowTerms = [
        'stressed', 'sad', 'lonely', 'down', 'upset', 'tired of everything', 'frustrated', 
        'annoyed', 'irritated', 'fed up', 'overwhelmed', 'exhausted', 'burned out', 
        'bothered', 'disappointed', 'discouraged', 'moody', 'grumpy', 'pareshaan', 
        'gussa', 'tension', 'thak gaya', 'bore ho gaya', 'irritate ho raha', 
        'tang aa gaya', 'dimag kharab', 'stress hai'
    ];

    // Score terms by severity
    criticalSevereTerms.forEach(term => {
        if (text.includes(term)) {
            score += 8;
            detectedTerms.push({ term, category: 'critical_severe' });
        }
    });
    
    severePlanTerms.forEach(term => {
        if (text.includes(term)) {
            score += 6;
            detectedTerms.push({ term, category: 'severe_plan' });
        }
    });
    
    highTerms.forEach(term => {
        if (text.includes(term)) {
            score += 3;
            detectedTerms.push({ term, category: 'high' });
        }
    });
    
    mediumTerms.forEach(term => {
        if (text.includes(term)) {
            score += 2;
            detectedTerms.push({ term, category: 'medium' });
        }
    });
    
    lowTerms.forEach(term => {
        if (text.includes(term)) {
            score += 1;
            detectedTerms.push({ term, category: 'low' });
        }
    });

    // Check for immediate risk patterns using regex
    const immediateRiskPatterns = [
        /i\s+(am|will|going to)\s+(kill|end|hurt|harm)\s+(my)/i,
        /tonight\s+(i|will|going)/i,
        /(plan|planning)\s+to\s+(die|kill|end)/i,
        /(ready|prepared)\s+to\s+(die|go|leave)/i,
        /going\s+to\s+(jump|hang)/i
    ];
    
    immediateRiskPatterns.forEach(pattern => {
        if (pattern.test(text)) {
            score += 10;
            detectedTerms.push({ term: 'immediate_risk_pattern', category: 'critical_severe' });
        }
    });
    
    // Determine risk level based on score
    let tendency = 'no';
    if (score >= 10) tendency = 'severe';
    else if (score >= 6) tendency = 'high';
    else if (score >= 4) tendency = 'medium';
    else if (score >= 1) tendency = 'low';
    
    // Determine counselling recommendation
    let needsCounselling = 'no';
    if (tendency === 'severe' || tendency === 'high') needsCounselling = 'yes';
    else if (tendency === 'medium') needsCounselling = 'advised';

    // Generate Gemini AI analysis
    let geminiAnalysis = null;
    if (gemini && transcriptText && transcriptText.trim().length > 50) {
        try {
            console.log('🤖 Starting Gemini analysis...');
            geminiAnalysis = await performGeminiAnalysis(transcriptText);
            console.log('✅ Gemini analysis successful.');
        } catch (e) {
            console.warn('Gemini classification failed:', e);
            geminiAnalysis = { error: e.message };
        }
    }
    
    // Generate review summary
    const review = generateReviewSummary(tendency);
    
    return {
        tendency,
        needsCounselling,
        review,
        score,
        detectedTerms,
        geminiAnalysis,
        immediateIntervention: tendency === 'severe' || 
                              detectedTerms.some(t => t.category === 'critical_severe') || 
                              (geminiAnalysis?.immediate_intervention === 'yes')
    };
}

/**
 * Perform Gemini AI analysis on the transcript
 */
async function performGeminiAnalysis(transcriptText) {
    const model = gemini.getGenerativeModel({ model: GEMINI_CONFIG.model });
    
    const prompt = `
        Analyze the following conversation transcript for mental health risks. The user is talking to a supportive friend AI named Arjun.
        The conversation is primarily in Hindi.
        Provide your analysis ONLY in a valid JSON format. Do not include any text before or after the JSON object.
        
        The JSON object must have these exact keys:
        - "risk_level": (string) Classify the risk as "no", "low", "medium", "high", or "severe".
        - "counseling_needed": (string) Recommend counseling as "no", "advised", or "yes".
        - "immediate_intervention": (string) State "yes" if there are signs of immediate self-harm plans, otherwise "no".
        - "emotional_state": (string) A brief description of the user's likely emotional state (e.g., "Stressed and overwhelmed", "Feeling lonely and sad", "Exhibiting signs of severe depression").
        - "concerning_phrases": (array of strings) Extract up to 5 direct quotes from the user that are most concerning.
        - "assessment_summary": (string) A concise one-paragraph summary of your analysis and the reasoning for the risk level.
        - "confidence_level": (string) Your confidence in this analysis ("low", "medium", "high").
        - "language_used": (string) The primary language detected ("hindi", "english", "hinglish").
        - "support_recommendations": (string) Suggest one brief, actionable step for the support agent (e.g., "Advise professional help", "Continue to listen and provide support", "Gently probe about their support system").
        
        Transcript:
        ---
        ${transcriptText}
        ---
    `;
    
    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim()
        .replace(/^```json\n?/, '')
        .replace(/\n?```$/, '');
    
    return JSON.parse(responseText);
}

/**
 * Generate a review summary based on risk tendency
 */
function generateReviewSummary(tendency) {
    switch (tendency) {
        case 'severe':
            return '🚨 SEVERE RISK DETECTED - Immediate intervention may be required. Strong indicators of self-harm or suicidal ideation present.';
        case 'high':
            return '⚠️ HIGH RISK DETECTED - Significant mental health concerns identified. Professional counseling strongly recommended.';
        case 'medium':
            return '⚡ MODERATE CONCERN - Some distress indicators present. Consider professional support and continue monitoring.';
        case 'low':
            return '💭 MILD DISTRESS - Minor stress indicators detected. Supportive listening and general wellness resources may help.';
        default:
            return 'No significant risk indicators detected. Conversation appears to be within normal emotional ranges.';
    }
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