// worker.js - Background job processor
require('dotenv').config();
const Bull = require('bull');
const { DeliveryAPIClient } = require('./lib/delivery-client');
const { IntercomClient } = require('./lib/intercom-client');
const { OrderProcessor } = require('./lib/order-processor');
const { neon } = require('@neondatabase/serverless');
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
        new winston.transports.File({ filename: 'worker-error.log', level: 'error' }),
        new winston.transports.File({ filename: 'worker-combined.log' })
    ]
});

// Initialize services
const sql = neon(process.env.DATABASE_URL);
const orderQueue = new Bull('order-status', process.env.REDIS_URL);
const deliveryClient = new DeliveryAPIClient();
const intercomClient = new IntercomClient();
const orderProcessor = new OrderProcessor();

// Process queue jobs
orderQueue.process('process-message', async (job) => {
    const { conversationId, message, userId } = job.data;
    
    logger.info(`Processing message for conversation ${conversationId}`);
    
    try {
        // Extract order information
        const orderInfo = orderProcessor.extractOrderInfo(message);
        
        if (!orderInfo) {
            // Not an order query, ignore
            logger.info(`Not an order query for conversation ${conversationId}`);
            return { processed: false, reason: 'not_order_query' };
        }
        
        logger.info(`Extracted order ${orderInfo.orderNumber} from conversation ${conversationId}`);
        
        // Get order status
        const orderStatus = await deliveryClient.getOrderStatus(
            orderInfo.orderNumber,
            orderInfo.platform
        );
        
        let response;
        
        if (orderStatus) {
            // Generate success response
            response = orderProcessor.generateOrderResponse(orderStatus);
            
            // Log successful lookup
            await sql`
                INSERT INTO order_lookups 
                (conversation_id, order_number, platform, status, response_time_ms, cache_hit)
                VALUES (${conversationId}, ${orderInfo.orderNumber}, 
                        ${orderStatus.platform}, ${orderStatus.status}, 
                        ${Date.now() - job.timestamp}, ${orderStatus.fromCache || false})
            `;
            
            logger.info(`Found order ${orderInfo.orderNumber} with status: ${orderStatus.status}`);
        } else {
            // Order not found
            response = orderProcessor.generateNotFoundResponse(orderInfo.orderNumber);
            
            // Create support ticket
            await createSupportTicket(conversationId, orderInfo.orderNumber, userId);
            
            logger.warn(`Order ${orderInfo.orderNumber} not found, created support ticket`);
        }
        
        // Send response to Intercom
        await intercomClient.sendReply(conversationId, response);
        
        return { processed: true, orderNumber: orderInfo.orderNumber };
        
    } catch (error) {
        logger.error('Job processing error:', error);
        
        // Send error response
        const errorResponse = "I'm having trouble checking your order right now. Let me connect you with a human agent who can help.";
        await intercomClient.sendReply(conversationId, errorResponse);
        
        // Escalate to human
        await escalateToHuman(conversationId, error.message);
        
        throw error; // Re-throw for Bull retry mechanism
    }
});

// Create support ticket
async function createSupportTicket(conversationId, orderNumber, userId) {
    try {
        // Create ticket in IST
        const ticket = await deliveryClient.createTicket({
            type: 'order_not_found',
            conversationId,
            orderNumber,
            userId
        });
        
        // Tag conversation in Intercom
        await intercomClient.tagConversation(conversationId, ['bot-escalation', 'order-not-found']);
        
        // Add internal note
        await intercomClient.addNote(conversationId, 
            `Bot could not find order ${orderNumber}. Ticket created: ${ticket.id}`
        );
        
        // Log ticket creation
        await sql`
            INSERT INTO support_tickets
            (ticket_id, conversation_id, order_number, reason)
            VALUES (${ticket.id}, ${conversationId}, ${orderNumber}, 'order_not_found')
        `;
        
    } catch (error) {
        logger.error('Failed to create support ticket:', error);
        throw error;
    }
}

// Escalate to human agent
async function escalateToHuman(conversationId, reason) {
    try {
        await intercomClient.assignToTeam(conversationId, process.env.SUPPORT_TEAM_ID);
        await intercomClient.tagConversation(conversationId, ['requires-human', 'bot-error']);
        await intercomClient.addNote(conversationId, `Bot escalation: ${reason}`);
        
        logger.info(`Escalated conversation ${conversationId} to human agent`);
    } catch (error) {
        logger.error('Failed to escalate to human:', error);
    }
}

// Queue event handlers
orderQueue.on('completed', (job, result) => {
    logger.info(`Job ${job.id} completed:`, result);
});

orderQueue.on('failed', (job, err) => {
    logger.error(`Job ${job.id} failed:`, err);
});

orderQueue.on('stalled', (job) => {
    logger.warn(`Job ${job.id} stalled and will be retried`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, closing queue...');
    await orderQueue.close();
    process.exit(0);
});

logger.info('Worker started and listening for jobs...');