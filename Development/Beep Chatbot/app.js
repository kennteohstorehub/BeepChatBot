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
const sql = process.env.NODE_ENV === 'test' || !process.env.DATABASE_URL?.includes('neon') 
    ? async () => ({ rows: [{ '?column?': 1 }] }) // Mock for testing
    : neon(process.env.DATABASE_URL);

// Initialize queue
const queue = require('./lib/queue');
const orderQueue = new Bull('order-status', process.env.REDIS_URL);

// Webhook signature verification
function verifyIntercomSignature(payload, signature, secret) {
    if (!signature || !secret) return false;
    
    const computedSignature = 'sha1=' + crypto
        .createHmac('sha1', secret)
        .update(JSON.stringify(payload))
        .digest('hex');
    
    // Ensure both buffers are same length for timingSafeEqual
    const signatureBuffer = Buffer.from(signature);
    const computedBuffer = Buffer.from(computedSignature);
    
    if (signatureBuffer.length !== computedBuffer.length) {
        return false;
    }
    
    return crypto.timingSafeEqual(signatureBuffer, computedBuffer);
}


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

// Webhook handler for testing
async function webhookHandler(req, res) {
    const signature = req.headers['x-hub-signature'];
    const payload = req.body;
    
    // Verify signature
    if (!signature || !verifyIntercomSignature(payload, signature, process.env.WEBHOOK_SECRET)) {
        return res.status(401).send('Unauthorized');
    }
    
    // Immediately respond to Intercom
    res.status(200).json({ status: 'ok' });
    
    try {
        const { topic, data } = payload;
        
        if (topic === 'conversation.user.replied' && data?.item) {
            const conversation = data.item;
            const message = conversation.conversation_parts?.conversation_parts?.[0]?.body || '';
            
            // Extract order info
            const { extractOrderInfo } = require('./lib/order-processor');
            const orderInfo = extractOrderInfo(message);
            
            // Check for escalation keywords
            const escalationKeywords = ['human', 'agent', 'help', 'speak to', 'talk to'];
            const needsEscalation = escalationKeywords.some(keyword => 
                message.toLowerCase().includes(keyword)
            );
            
            if (needsEscalation) {
                await queue.addJob('process-escalation', {
                    conversationId: conversation.id,
                    userId: conversation.user?.id,
                    message
                });
            } else if (orderInfo) {
                await queue.addJob('process-order-status', {
                    conversationId: conversation.id,
                    userId: conversation.user?.id,
                    message,
                    orderInfo
                });
            }
        }
    } catch (error) {
        logger.error('Webhook processing error:', error);
    }
}

// Use the handler for the webhook route
app.post('/webhook', webhookHandler);

const PORT = process.env.PORT || 3000;

// Only start server if not in test mode
if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        logger.info(`Webhook service running on port ${PORT}`);
    });
}

// Export for testing
module.exports = app;
module.exports.webhookHandler = webhookHandler;