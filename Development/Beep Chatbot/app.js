// app.js - Main webhook handler and API service
require('dotenv').config();
const express = require('express');
const Bull = require('bull');
const { neon } = require('@neondatabase/serverless');
const crypto = require('crypto');
const winston = require('winston');

// Configure logger
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' })
    ]
});

const app = express();
app.use(express.json());

// Initialize database
const sql = neon(process.env.DATABASE_URL);

// Initialize queue
const orderQueue = new Bull('order-status', process.env.REDIS_URL);

// Webhook signature verification
function verifyIntercomSignature(payload, signature, secret) {
    const computedSignature = 'sha1=' + crypto
        .createHmac('sha1', secret)
        .update(JSON.stringify(payload))
        .digest('hex');
    
    return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(computedSignature)
    );
}

// Main webhook endpoint
app.post('/webhook', async (req, res) => {
    const signature = req.headers['x-hub-signature'];
    
    if (!verifyIntercomSignature(req.body, signature, process.env.WEBHOOK_SECRET)) {
        logger.warn('Invalid webhook signature attempt');
        return res.status(401).send('Unauthorized');
    }
    
    // Immediately respond to Intercom
    res.status(200).send('OK');
    
    try {
        const { topic, data } = req.body;
        
        logger.info(`Received webhook: ${topic}`);
        
        // Only process user replies
        if (topic !== 'conversation.user.replied') return;
        
        const conversationId = data.item.id;
        const message = data.item.conversation_parts.conversation_parts[0].body;
        
        // Queue for processing
        await orderQueue.add('process-message', {
            conversationId,
            message,
            userId: data.item.user.id,
            timestamp: Date.now()
        });
        
        logger.info(`Queued message for conversation ${conversationId}`);
        
    } catch (error) {
        logger.error('Webhook processing error:', error);
    }
});

// Health check endpoint
app.get('/health', async (req, res) => {
    try {
        await sql`SELECT 1`;
        const queueHealth = await orderQueue.isReady();
        res.json({ 
            status: 'healthy',
            database: 'connected',
            queue: queueHealth ? 'ready' : 'not ready',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Health check failed:', error);
        res.status(503).json({ 
            status: 'unhealthy', 
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        service: 'BEEP Intercom Chatbot',
        version: '1.0.0',
        endpoints: {
            webhook: 'POST /webhook',
            health: 'GET /health'
        }
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    logger.info(`Webhook service running on port ${PORT}`);
});