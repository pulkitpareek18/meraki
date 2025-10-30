import express from 'express';
import { handleIncomingCall } from '../controllers/callController.js';
import { handleUltravoxEvents } from '../controllers/webhookController.js';
import {
    getAllConversations,
    refreshSpecificConversation,
    regenerateConversationAnalysis,
    batchRefreshAllConversations,
    importFromUltravox,
    cleanupInvalidCalls,
    getCallRecording
} from '../controllers/apiController.js';
import { 
    checkServicesHealth, 
    getServiceMetrics, 
    performMaintenance,
    getServiceHealthSummary
} from '../services/serviceManager.js';
import { getConversations, getConversationById } from '../services/conversation.js';
import { generateDashboardHTML } from '../views/dashboard.js';
import { generateConversationDetailHTML } from '../views/conversationDetail.js';

const router = express.Router();

// Call handling routes
router.post('/incoming', handleIncomingCall);
router.post('/ultravox/events', handleUltravoxEvents);

// API routes for conversations
router.get('/api/conversations', getAllConversations);
router.post('/api/conversations/:id/refresh', refreshSpecificConversation);
router.post('/api/conversations/:id/regenerate-analysis', regenerateConversationAnalysis);
router.get('/api/conversations/:id/recording', getCallRecording);
router.post('/api/conversations/refresh-all', batchRefreshAllConversations);
router.post('/api/conversations/import-from-ultravox', importFromUltravox);
router.post('/api/conversations/cleanup-invalid', cleanupInvalidCalls);

// Enhanced health check endpoints
router.get('/health', (req, res) => {
    res.json({ 
        ok: true, 
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.version
    });
});

router.get('/health/detailed', async (req, res) => {
    try {
        const health = await checkServicesHealth();
        res.json(health);
    } catch (error) {
        res.status(500).json({
            ok: false,
            error: 'Health check failed',
            timestamp: new Date().toISOString()
        });
    }
});

router.get('/metrics', async (req, res) => {
    try {
        const metrics = await getServiceMetrics();
        res.json(metrics);
    } catch (error) {
        res.status(500).json({
            ok: false,
            error: 'Failed to retrieve metrics',
            timestamp: new Date().toISOString()
        });
    }
});

router.post('/maintenance', async (req, res) => {
    try {
        const results = await performMaintenance();
        res.json({ ok: true, ...results });
    } catch (error) {
        res.status(500).json({
            ok: false,
            error: 'Maintenance operation failed',
            details: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Dashboard route
router.get('/dashboard', async (req, res) => {
    try {
        const conversations = await getConversations();
        const html = generateDashboardHTML(conversations);
        res.type('html').send(html);
    } catch (error) {
        console.error('Error rendering dashboard:', error);
        res.status(500).send('Error loading dashboard');
    }
});

// Conversation detail page
router.get('/conversations/:id', async (req, res) => {
    try {
        const conversation = await getConversationById(req.params.id);
        if (!conversation) {
            return res.status(404).send('Conversation not found');
        }
        
        const html = generateConversationDetailHTML(conversation);
        res.type('html').send(html);
    } catch (error) {
        console.error('Error loading conversation:', error);
        res.status(500).send('Error loading conversation');
    }
});

export default router;