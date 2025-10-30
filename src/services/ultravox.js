import https from 'https';
import { ULTRAVOX_CONFIG, ULTRAVOX_CALL_CONFIG } from '../config/index.js';

/**
 * Helper function to make requests to the Ultravox API
 */
async function requestUltravoxAPI(url, options, timeout = 10000) {
    return new Promise((resolve, reject) => {
        const request = https.request(url, options, (response) => {
            let data = '';
            response.on('data', (chunk) => (data += chunk));
            response.on('end', () => {
                console.log(`🌐 Ultravox API response from ${url}: ${response.statusCode}`);
                if (response.statusCode >= 400) {
                    console.error(`❌ Ultravox API Error: ${response.statusCode}`, data);
                    reject(new Error(`API error ${response.statusCode}: ${data}`));
                } else {
                    try {
                        resolve(data ? JSON.parse(data) : {});
                    } catch (e) {
                        console.error('❌ Failed to parse Ultravox JSON response:', e, data.substring(0, 200));
                        reject(new Error('Failed to parse JSON response.'));
                    }
                }
            });
        });
        
        request.on('error', (error) => {
            console.error(`❌ Ultravox API request error for ${url}:`, error.message);
            reject(error);
        });
        
        request.setTimeout(timeout, () => {
            request.destroy();
            reject(new Error(`Request timed out after ${timeout}ms`));
        });
        
        if (options.body) {
            request.write(options.body);
        }
        
        request.end();
    });
}

/**
 * Test Ultravox API connection
 */
export async function testUltravoxConnection() {
    try {
        if (!ULTRAVOX_CONFIG.apiKey) {
            console.warn('⚠️ Ultravox API key not configured');
            return false;
        }

        const url = `${ULTRAVOX_CONFIG.baseUrl}/calls?limit=1`;
        const options = {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${ULTRAVOX_CONFIG.apiKey}`,
                'Content-Type': 'application/json'
            }
        };

        await requestUltravoxAPI(url, options, 5000); // Short timeout for health check
        console.log('✅ Ultravox connection test successful');
        return true;
    } catch (error) {
        console.error('❌ Ultravox connection test failed:', error.message);
        return false;
    }
}

/**
 * Creates a new call session with Ultravox
 */
export async function createUltravoxCall(config = ULTRAVOX_CALL_CONFIG) {
    if (!ULTRAVOX_CONFIG.apiKey) {
        throw new Error('ULTRAVOX_API_KEY is required');
    }
    
    const postData = JSON.stringify(config);
    console.log('Creating Ultravox call with config:', postData);
    
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-API-Key': ULTRAVOX_CONFIG.apiKey,
            'Content-Length': Buffer.byteLength(postData)
        },
        timeout: 10000,
        body: postData,
    };
    
    return requestUltravoxAPI(ULTRAVOX_CONFIG.apiUrl, options);
}

/**
 * Retrieves the main call object from Ultravox (for metadata and recordingUrl)
 */
export async function getUltravoxCall(callId) {
    if (!ULTRAVOX_CONFIG.apiKey) {
        throw new Error('ULTRAVOX_API_KEY is required');
    }
    
    const url = `${ULTRAVOX_CONFIG.apiUrl}/${callId}`;
    console.log(`Fetching call details from: ${url}`);
    
    const options = {
        method: 'GET',
        headers: { 'X-API-Key': ULTRAVOX_CONFIG.apiKey },
        timeout: 15000,
    };
    
    return requestUltravoxAPI(url, options);
}

/**
 * Retrieves messages for a call and formats them into a transcript
 */
export async function getUltravoxTranscriptFromMessages(callId) {
    if (!ULTRAVOX_CONFIG.apiKey) {
        throw new Error('ULTRAVOX_API_KEY is required');
    }
    
    const url = `${ULTRAVOX_CONFIG.apiUrl}/${callId}/messages`;
    console.log(`Fetching messages for transcript from: ${url}`);
    
    const options = {
        method: 'GET',
        headers: { 'X-API-Key': ULTRAVOX_CONFIG.apiKey },
        timeout: 15000,
    };
    
    const messagesResponse = await requestUltravoxAPI(url, options);
    
    if (messagesResponse.results && Array.isArray(messagesResponse.results)) {
        return messagesResponse.results
            .filter(msg => msg.text && msg.text.trim())
            .map(msg => `${msg.role === 'MESSAGE_ROLE_USER' ? 'User' : 'Agent'}: ${msg.text}`)
            .join('\n');
    }
    
    return '';
}

/**
 * List calls from Ultravox API
 */
export async function listUltravoxCalls(limit = 50) {
    if (!ULTRAVOX_CONFIG.apiKey) {
        throw new Error('ULTRAVOX_API_KEY is required');
    }
    
    const url = `${ULTRAVOX_CONFIG.apiUrl}?limit=${limit}`;
    const options = {
        method: 'GET',
        headers: { 'X-API-Key': ULTRAVOX_CONFIG.apiKey },
        timeout: 15000,
    };
    
    return requestUltravoxAPI(url, options);
}