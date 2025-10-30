import express from 'express';
import { handleIncomingCall } from '../controllers/callController.js';
import { handleUltravoxEvents } from '../controllers/webhookController.js';
import {
    getAllConversations,
    refreshSpecificConversation,
    regenerateConversationAnalysis,
    batchRefreshAllConversations,
    importFromUltravox,
    cleanupInvalidCalls
} from '../controllers/apiController.js';
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
router.post('/api/conversations/refresh-all', batchRefreshAllConversations);
router.post('/api/conversations/import-from-ultravox', importFromUltravox);
router.post('/api/conversations/cleanup-invalid', cleanupInvalidCalls);

// Health check endpoint
router.get('/health', (req, res) => {
    res.json({ ok: true, timestamp: new Date().toISOString() });
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