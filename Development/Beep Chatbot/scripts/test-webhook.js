// scripts/test-webhook.js - Test webhook endpoint with mock payloads
require('dotenv').config();
const axios = require('axios');
const crypto = require('crypto');

const scenarios = {
    'order-status': {
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
    },
    'order-not-found': {
        topic: 'conversation.user.replied',
        data: {
            item: {
                id: 'test-conversation-2',
                user: { id: 'test-user-2' },
                conversation_parts: {
                    conversation_parts: [{
                        body: 'Can you check order BEP99999999?'
                    }]
                }
            }
        }
    },
    'foodpanda': {
        topic: 'conversation.user.replied',
        data: {
            item: {
                id: 'test-conversation-3',
                user: { id: 'test-user-3' },
                conversation_parts: {
                    conversation_parts: [{
                        body: 'Track my foodpanda order FP1234567890'
                    }]
                }
            }
        }
    },
    'escalation': {
        topic: 'conversation.user.replied',
        data: {
            item: {
                id: 'test-conversation-4',
                user: { id: 'test-user-4' },
                conversation_parts: {
                    conversation_parts: [{
                        body: 'I want to speak to a human agent'
                    }]
                }
            }
        }
    },
    'malay': {
        topic: 'conversation.user.replied',
        data: {
            item: {
                id: 'test-conversation-5',
                user: { id: 'test-user-5' },
                conversation_parts: {
                    conversation_parts: [{
                        body: 'Mana pesanan saya LM87654321?'
                    }]
                }
            }
        }
    }
};

async function testWebhook(scenario = 'order-status') {
    const webhookUrl = process.env.WEBHOOK_URL || 'http://localhost:3000/webhook';
    const webhookSecret = process.env.WEBHOOK_SECRET || 'test-secret';
    
    if (!scenarios[scenario]) {
        console.error(`❌ Unknown scenario: ${scenario}`);
        console.log('Available scenarios:', Object.keys(scenarios).join(', '));
        process.exit(1);
    }
    
    const payload = scenarios[scenario];
    
    // Generate signature
    const signature = 'sha1=' + crypto
        .createHmac('sha1', webhookSecret)
        .update(JSON.stringify(payload))
        .digest('hex');
    
    try {
        console.log(`🚀 Testing webhook with scenario: ${scenario}`);
        console.log(`📍 URL: ${webhookUrl}`);
        console.log(`📦 Payload:`, JSON.stringify(payload, null, 2));
        
        const response = await axios.post(webhookUrl, payload, {
            headers: {
                'X-Hub-Signature': signature,
                'Content-Type': 'application/json'
            }
        });
        
        console.log(`✅ Response: ${response.status} ${response.statusText}`);
        console.log(`📄 Body:`, response.data);
        
    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        if (error.response) {
            console.error(`📄 Response:`, error.response.data);
        }
    }
}

// Parse command line arguments
const args = process.argv.slice(2);
const scenarioArg = args.find(arg => arg.startsWith('--scenario='));
const scenario = scenarioArg ? scenarioArg.split('=')[1] : 'order-status';

// Run test
testWebhook(scenario);