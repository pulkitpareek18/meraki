/**
 * Integrated Service Manager - Coordinates all services with health monitoring
 */

import { getRiskAnalysisStats, clearAnalysisCache } from './riskAnalysis.js';
import { getConversations } from './conversation.js';

// Service health monitoring
const serviceHealth = {
    riskAnalysis: { status: 'unknown', lastCheck: null, errors: 0 },
    ultravox: { status: 'unknown', lastCheck: null, errors: 0 },
    gemini: { status: 'unknown', lastCheck: null, errors: 0 },
    database: { status: 'unknown', lastCheck: null, errors: 0 }
};

/**
 * Check health of all services
 */
export async function checkServicesHealth() {
    const healthChecks = await Promise.allSettled([
        checkRiskAnalysisHealth(),
        checkUltravoxHealth(),
        checkGeminiHealth(),
        checkDatabaseHealth()
    ]);

    const results = {
        overall: 'healthy',
        services: {},
        timestamp: new Date().toISOString(),
        summary: {
            healthy: 0,
            degraded: 0,
            unhealthy: 0
        }
    };

    healthChecks.forEach((check, index) => {
        const serviceName = ['riskAnalysis', 'ultravox', 'gemini', 'database'][index];
        if (check.status === 'fulfilled') {
            results.services[serviceName] = check.value;
            if (check.value.status === 'healthy') results.summary.healthy++;
            else if (check.value.status === 'degraded') results.summary.degraded++;
            else results.summary.unhealthy++;
        } else {
            results.services[serviceName] = {
                status: 'unhealthy',
                error: check.reason.message,
                lastCheck: new Date().toISOString()
            };
            results.summary.unhealthy++;
        }
    });

    // Determine overall health
    if (results.summary.unhealthy > 1) {
        results.overall = 'unhealthy';
    } else if (results.summary.unhealthy > 0 || results.summary.degraded > 0) {
        results.overall = 'degraded';
    }

    return results;
}

/**
 * Check Risk Analysis service health
 */
async function checkRiskAnalysisHealth() {
    try {
        const stats = getRiskAnalysisStats();
        const status = stats.geminiAvailable ? 'healthy' : 'degraded';
        
        serviceHealth.riskAnalysis = {
            status,
            lastCheck: new Date().toISOString(),
            errors: 0,
            details: {
                cacheUtilization: `${stats.cacheSize}/${stats.cacheMaxSize}`,
                patternsLoaded: stats.patternsLoaded,
                geminiAvailable: stats.geminiAvailable
            }
        };

        return serviceHealth.riskAnalysis;
    } catch (error) {
        serviceHealth.riskAnalysis.errors++;
        throw error;
    }
}

/**
 * Check Ultravox service health
 */
async function checkUltravoxHealth() {
    try {
        const { testUltravoxConnection } = await import('./ultravox.js');
        const isHealthy = await testUltravoxConnection();
        
        serviceHealth.ultravox = {
            status: isHealthy ? 'healthy' : 'unhealthy',
            lastCheck: new Date().toISOString(),
            errors: isHealthy ? 0 : serviceHealth.ultravox.errors + 1
        };

        return serviceHealth.ultravox;
    } catch (error) {
        serviceHealth.ultravox.errors++;
        serviceHealth.ultravox.status = 'unhealthy';
        serviceHealth.ultravox.lastCheck = new Date().toISOString();
        throw error;
    }
}

/**
 * Check Gemini AI service health
 */
async function checkGeminiHealth() {
    try {
        const { GEMINI_CONFIG } = await import('../config/index.js');
        const hasApiKey = !!GEMINI_CONFIG.apiKey;
        
        serviceHealth.gemini = {
            status: hasApiKey ? 'healthy' : 'degraded',
            lastCheck: new Date().toISOString(),
            errors: 0,
            details: {
                configured: hasApiKey,
                model: GEMINI_CONFIG.model || 'not-configured'
            }
        };

        return serviceHealth.gemini;
    } catch (error) {
        serviceHealth.gemini.errors++;
        throw error;
    }
}

/**
 * Check Database service health
 */
async function checkDatabaseHealth() {
    try {
        const conversations = await getConversations();
        const isHealthy = Array.isArray(conversations);
        
        serviceHealth.database = {
            status: isHealthy ? 'healthy' : 'unhealthy',
            lastCheck: new Date().toISOString(),
            errors: isHealthy ? 0 : serviceHealth.database.errors + 1,
            details: {
                totalConversations: conversations.length,
                recentConversations: conversations.filter(c => 
                    new Date(c.createdAt) > new Date(Date.now() - 24 * 60 * 60 * 1000)
                ).length
            }
        };

        return serviceHealth.database;
    } catch (error) {
        serviceHealth.database.errors++;
        throw error;
    }
}

/**
 * Get service performance metrics
 */
export async function getServiceMetrics() {
    const conversations = await getConversations();
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const recent24h = conversations.filter(c => new Date(c.createdAt) > last24h);
    const recent7d = conversations.filter(c => new Date(c.createdAt) > last7d);

    return {
        timestamp: now.toISOString(),
        conversations: {
            total: conversations.length,
            last24h: recent24h.length,
            last7d: recent7d.length
        },
        riskDistribution: {
            severe: conversations.filter(c => c.tendency === 'severe').length,
            high: conversations.filter(c => c.tendency === 'high').length,
            medium: conversations.filter(c => c.tendency === 'medium').length,
            low: conversations.filter(c => c.tendency === 'low').length,
            none: conversations.filter(c => c.tendency === 'no').length
        },
        analysis: {
            withTranscripts: conversations.filter(c => c.transcript && c.transcript.trim().length > 0).length,
            withAIAnalysis: conversations.filter(c => c.geminiAnalysis && !c.geminiAnalysis.error).length,
            withRecordings: conversations.filter(c => c.recordingUrl && c.recordingUrl.trim().length > 0).length,
            emergencyAlerts: conversations.filter(c => c.immediateIntervention).length
        },
        performance: {
            avgProcessingTime: calculateAverageProcessingTime(conversations),
            analysisSuccessRate: calculateAnalysisSuccessRate(conversations)
        }
    };
}

/**
 * Calculate average processing time for conversations
 */
function calculateAverageProcessingTime(conversations) {
    const withProcessingTime = conversations.filter(c => c.processingTime && c.processingTime > 0);
    if (withProcessingTime.length === 0) return null;
    
    const total = withProcessingTime.reduce((sum, c) => sum + c.processingTime, 0);
    return Math.round(total / withProcessingTime.length);
}

/**
 * Calculate analysis success rate
 */
function calculateAnalysisSuccessRate(conversations) {
    const withAnalysisAttempt = conversations.filter(c => c.geminiAnalysis !== null);
    if (withAnalysisAttempt.length === 0) return null;
    
    const successful = withAnalysisAttempt.filter(c => c.geminiAnalysis && !c.geminiAnalysis.error).length;
    return Math.round((successful / withAnalysisAttempt.length) * 100);
}

/**
 * Cleanup and maintenance operations
 */
export async function performMaintenance() {
    console.log('🧹 Starting system maintenance...');
    
    const results = {
        timestamp: new Date().toISOString(),
        operations: []
    };

    try {
        // Clear analysis cache
        const cacheCleared = clearAnalysisCache();
        results.operations.push({
            operation: 'clear_cache',
            success: true,
            details: `Cleared ${cacheCleared} cache entries`
        });
    } catch (error) {
        results.operations.push({
            operation: 'clear_cache',
            success: false,
            error: error.message
        });
    }

    // Add more maintenance operations here as needed
    // - Database cleanup
    // - Log rotation
    // - Temporary file cleanup
    // etc.

    console.log(`✅ Maintenance completed: ${results.operations.filter(op => op.success).length} successful operations`);
    return results;
}

/**
 * Get current service health summary
 */
export function getServiceHealthSummary() {
    return {
        services: serviceHealth,
        timestamp: new Date().toISOString(),
        overallStatus: Object.values(serviceHealth).every(s => s.status === 'healthy') ? 'healthy' :
                      Object.values(serviceHealth).some(s => s.status === 'unhealthy') ? 'degraded' : 'degraded'
    };
}