import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';
import { MONGODB_CONFIG, STORAGE_CONFIG } from '../config/index.js';

let mongoClient;
let conversationsCol;

/**
 * Initialize MongoDB connection
 */
export async function initMongo() {
    if (!MONGODB_CONFIG.uri) {
        console.warn('MONGODB_URI not set; falling back to local JSON file storage.');
        return;
    }
    
    try {
        mongoClient = new MongoClient(MONGODB_CONFIG.uri);
        await mongoClient.connect();
        const db = mongoClient.db(MONGODB_CONFIG.database);
        conversationsCol = db.collection(MONGODB_CONFIG.collection);
        await conversationsCol.createIndex({ id: 1 }, { unique: true });
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection failed:', error);
        mongoClient = null;
        conversationsCol = null;
    }
}

/**
 * Ensure JSON file storage directory and file exist
 */
function ensureJsonStore() {
    if (!fs.existsSync(STORAGE_CONFIG.dataDir)) {
        fs.mkdirSync(STORAGE_CONFIG.dataDir, { recursive: true });
    }
    if (!fs.existsSync(STORAGE_CONFIG.conversationFile)) {
        fs.writeFileSync(STORAGE_CONFIG.conversationFile, JSON.stringify([]), 'utf-8');
    }
}

/**
 * Upsert a conversation record
 */
export async function upsertConversation(record) {
    try {
        if (conversationsCol) {
            await conversationsCol.updateOne(
                { id: record.id }, 
                { $set: record }, 
                { upsert: true }
            );
        } else {
            ensureJsonStore();
            const raw = fs.readFileSync(STORAGE_CONFIG.conversationFile, 'utf-8');
            const list = JSON.parse(raw);
            const idx = list.findIndex(x => x.id === record.id);
            if (idx >= 0) {
                list[idx] = record;
            } else {
                list.push(record);
            }
            fs.writeFileSync(STORAGE_CONFIG.conversationFile, JSON.stringify(list, null, 2), 'utf-8');
        }
    } catch (error) {
        console.error('Failed to upsert conversation:', error);
    }
}

/**
 * Get all conversations, sorted by updated date
 */
export async function getConversations() {
    try {
        if (conversationsCol) {
            return await conversationsCol.find({}).sort({ updatedAt: -1 }).toArray();
        }
        
        ensureJsonStore();
        const raw = fs.readFileSync(STORAGE_CONFIG.conversationFile, 'utf-8');
        const list = JSON.parse(raw);
        return list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    } catch (error) {
        console.error('Failed to get conversations:', error);
        return [];
    }
}

/**
 * Get a conversation by ID
 */
export async function getConversationById(id) {
    try {
        if (conversationsCol) {
            return await conversationsCol.findOne({ id });
        }
        
        const list = await getConversations();
        return list.find(x => x.id === id);
    } catch (error) {
        console.error('Failed to get conversation by ID:', error);
        return null;
    }
}

/**
 * Find conversation by Twilio CallSid
 */
export async function findConversationByTwilioSid(twilioCallSid) {
    try {
        if (conversationsCol) {
            return await conversationsCol.findOne({ twilioCallSid: twilioCallSid });
        }
        
        const list = await getConversations();
        return list.find(x => x.twilioCallSid === twilioCallSid);
    } catch (error) {
        console.error('Failed to get conversation by Twilio SID:', error);
        return null;
    }
}

/**
 * Close database connection
 */
export async function closeDatabaseConnection() {
    if (mongoClient) {
        await mongoClient.close();
        console.log('MongoDB connection closed');
    }
}