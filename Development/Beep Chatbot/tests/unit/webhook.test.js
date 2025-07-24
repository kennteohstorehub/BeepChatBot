// tests/unit/webhook.test.js
const request = require('supertest');
const express = require('express');
const crypto = require('crypto');

// Mock dependencies
jest.mock('../../lib/queue', () => ({
    addJob: jest.fn().mockResolvedValue({ id: 'test-job-id' })
}));

jest.mock('../../lib/intercom-client', () => ({
    replyToConversation: jest.fn().mockResolvedValue({}),
    assignToTeam: jest.fn().mockResolvedValue({}),
    addTag: jest.fn().mockResolvedValue({})
}));

// Create test app
const app = express();
app.use(express.json());

// Import webhook handler after mocks
const { webhookHandler } = require('../../app');
app.post('/webhook', webhookHandler);

describe('Webhook Handler', () => {
    const validPayload = {
        topic: 'conversation.user.replied',
        data: {
            item: {
                id: 'test-conversation-1',
                user: { id: 'test-user-1' },
                conversation_parts: {
                    conversation_parts: [{
                        body: 'Where is my order LM12345678?'
                    }]
                }
            }
        }
    };

    const webhookSecret = process.env.WEBHOOK_SECRET || 'test-webhook-secret-12345';

    function generateSignature(payload) {
        return 'sha1=' + crypto
            .createHmac('sha1', webhookSecret)
            .update(JSON.stringify(payload))
            .digest('hex');
    }

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should accept valid webhook with correct signature', async () => {
        const signature = generateSignature(validPayload);
        
        const response = await request(app)
            .post('/webhook')
            .set('X-Hub-Signature', signature)
            .send(validPayload);

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ status: 'ok' });
    });

    it('should reject webhook with invalid signature', async () => {
        const response = await request(app)
            .post('/webhook')
            .set('X-Hub-Signature', 'sha1=invalid')
            .send(validPayload);

        expect(response.status).toBe(401);
        expect(response.text).toBe('Unauthorized');
    });

    it('should reject webhook without signature', async () => {
        const response = await request(app)
            .post('/webhook')
            .send(validPayload);

        expect(response.status).toBe(401);
        expect(response.text).toBe('Unauthorized');
    });

    it('should queue job for order status query', async () => {
        const queue = require('../../lib/queue');
        const signature = generateSignature(validPayload);
        
        const response = await request(app)
            .post('/webhook')
            .set('X-Hub-Signature', signature)
            .send(validPayload);

        expect(response.status).toBe(200);
        expect(queue.addJob).toHaveBeenCalledWith(
            'process-order-status',
            expect.objectContaining({
                conversationId: 'test-conversation-1',
                userId: 'test-user-1',
                message: 'Where is my order LM12345678?',
                orderInfo: {
                    orderNumber: 'LM12345678',
                    platform: 'lalamove',
                    originalMessage: 'Where is my order LM12345678?'
                }
            })
        );
    });

    it('should handle escalation requests', async () => {
        const escalationPayload = {
            ...validPayload,
            data: {
                item: {
                    ...validPayload.data.item,
                    conversation_parts: {
                        conversation_parts: [{
                            body: 'I want to speak to a human agent'
                        }]
                    }
                }
            }
        };

        const queue = require('../../lib/queue');
        const signature = generateSignature(escalationPayload);
        
        const response = await request(app)
            .post('/webhook')
            .set('X-Hub-Signature', signature)
            .send(escalationPayload);

        expect(response.status).toBe(200);
        expect(queue.addJob).toHaveBeenCalledWith(
            'process-escalation',
            expect.objectContaining({
                conversationId: 'test-conversation-1',
                userId: 'test-user-1',
                message: 'I want to speak to a human agent'
            })
        );
    });

    it('should handle invalid payload gracefully', async () => {
        const invalidPayload = { invalid: 'data' };
        const signature = generateSignature(invalidPayload);
        
        const response = await request(app)
            .post('/webhook')
            .set('X-Hub-Signature', signature)
            .send(invalidPayload);

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ status: 'ok' });
    });

    it('should ignore non-user-replied topics', async () => {
        const otherPayload = {
            topic: 'conversation.admin.replied',
            data: validPayload.data
        };

        const queue = require('../../lib/queue');
        const signature = generateSignature(otherPayload);
        
        const response = await request(app)
            .post('/webhook')
            .set('X-Hub-Signature', signature)
            .send(otherPayload);

        expect(response.status).toBe(200);
        expect(queue.addJob).not.toHaveBeenCalled();
    });
});