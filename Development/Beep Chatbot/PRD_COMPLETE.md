# Product Requirements Document (PRD)
## StoreHub BEEP Intercom Chatbot

**Version:** 1.0  
**Date:** January 2025  
**Author:** Product Team  
**Status:** Draft

---

## Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [Product Overview](#2-product-overview)
3. [Functional Requirements](#3-functional-requirements)
4. [Non-Functional Requirements](#4-non-functional-requirements)
5. [Technical Architecture](#5-technical-architecture)
6. [Implementation Guide](#6-implementation-guide)
7. [Implementation Phases](#7-implementation-phases)
8. [Success Criteria](#8-success-criteria)
9. [Risks & Mitigation](#9-risks--mitigation)
10. [Dependencies](#10-dependencies)
11. [Open Questions](#11-open-questions)
12. [Appendices](#12-appendices)

---

## 1. Executive Summary

### 1.1 Purpose
This document outlines the requirements for building an automated chatbot integration with Intercom to handle customer order inquiries for StoreHub's BEEP delivery platform. The chatbot will reduce support team workload by automatically responding to common order status queries.

### 1.2 Background
Based on the BEEP Scenarios Process Flow document, customer support agents spend 7-50 minutes per ticket handling various scenarios. The most common query "Where is my order?" can be automated, allowing agents to focus on complex issues requiring human intervention.

### 1.3 Success Metrics
- **Automation Rate**: 60% of order status queries handled without human intervention
- **Response Time**: < 2 seconds for automated responses
- **Customer Satisfaction**: Maintain or improve current CSAT scores
- **Cost Reduction**: 40% reduction in support costs for order status queries
- **Agent Efficiency**: 30% reduction in average handling time

---

## 2. Product Overview

### 2.1 Product Vision
Create an intelligent, automated customer service experience that provides instant order status updates while seamlessly escalating complex issues to human agents.

### 2.2 Target Users
- **Primary**: BEEP customers inquiring about order status
- **Secondary**: Merchants checking delivery status
- **Tertiary**: Support agents managing escalated conversations

### 2.3 Core Value Proposition
- **Instant Responses**: 24/7 availability with sub-2 second response times
- **Accurate Information**: Real-time order status from multiple delivery partners
- **Seamless Experience**: Natural conversation flow with intelligent handoff to humans
- **Reduced Wait Times**: No queue for simple order inquiries

---

## 3. Functional Requirements

### 3.1 Bot Capabilities

#### 3.1.1 Order Status Queries
**Priority**: P0 (Must Have)

The bot MUST be able to:
- Detect order status inquiries in multiple languages (English, Malay, Chinese)
- Extract order numbers from various message formats
- Retrieve real-time order status from:
  - StoreHub IST (Internal Service Tool)
  - Lalamove API
  - Foodpanda API
  - GrabExpress API (future)
- Provide formatted status updates with:
  - Current order status
  - Driver/rider information
  - Estimated delivery time
  - Tracking link (when available)

**Acceptance Criteria**:
- Successfully extracts order numbers with 95% accuracy
- Retrieves order status within 2 seconds
- Handles order not found gracefully

#### 3.1.2 Multi-Platform Order Tracking
**Priority**: P0 (Must Have)

The bot MUST:
- Identify delivery platform from order number format or context
- Query the appropriate delivery partner API
- Consolidate information from multiple sources
- Cache responses for 5 minutes to reduce API calls

**Supported Platforms**:
| Platform | Order ID Format | API Integration |
|----------|----------------|-----------------|
| Lalamove | LM[0-9]{8} | REST API v2 |
| Foodpanda | FP[0-9]{10} | Partner API v1 |
| Internal | BEP[0-9]{8} | IST API |

#### 3.1.3 Automated Ticket Creation
**Priority**: P0 (Must Have)

When unable to resolve queries, the bot MUST:
- Create support tickets via IST API
- Tag conversations appropriately:
  - `bot-escalation`
  - `order-not-found`
  - `api-error`
  - `complex-query`
- Provide ticket reference to customer
- Log context for human agents

#### 3.1.4 Conversation Context Management
**Priority**: P1 (Should Have)

The bot SHOULD:
- Remember previous interactions within a conversation
- Avoid asking for order number repeatedly
- Maintain context during platform switches
- Clear context after 30 minutes of inactivity

### 3.2 Integration Requirements

#### 3.2.1 Intercom Integration
**Priority**: P0 (Must Have)

- **Webhooks**: Subscribe to conversation events
  - `conversation.user.created`
  - `conversation.user.replied`
  - `conversation.admin.replied`
- **API Endpoints**: 
  - Send replies
  - Add internal notes
  - Tag conversations
  - Assign to teams
- **Authentication**: OAuth 2.0 with token refresh

#### 3.2.2 Delivery Partner APIs
**Priority**: P0 (Must Have)

**Lalamove Integration**:
- Authentication: HMAC signature
- Rate Limits: 100 requests/minute
- Required Endpoints:
  - GET /v2/orders/{orderId}
  - GET /v2/orders/{orderId}/driver/location

**Foodpanda Integration**:
- Authentication: API Key
- Rate Limits: 500 requests/minute
- Required Endpoints:
  - GET /v1/orders/{orderId}/status
  - GET /v1/orders/{orderId}/tracking

#### 3.2.3 Internal Systems Integration
**Priority**: P0 (Must Have)

**IST (Internal Service Tool) API**:
- Authentication: JWT Bearer token
- Endpoints:
  - GET /api/orders/{orderId}
  - POST /api/tickets
  - POST /api/vouchers
- Timeout: 5 seconds with circuit breaker

### 3.3 User Experience Requirements

#### 3.3.1 Response Patterns
**Priority**: P0 (Must Have)

The bot MUST respond naturally with:
- Greeting for first interaction
- Acknowledgment of query
- Clear status updates
- Helpful error messages
- Smooth handoff messages

**Example Flows**:
```
Customer: "Where is my order LM12345678?"
Bot: "Let me check your Lalamove order LM12345678 for you! 📦

Your order is currently with the driver and on the way to you.
Driver: Ahmad Rahman
Status: In transit
Estimated arrival: 2:45 PM (in 15 minutes)

Track your order: https://track.lalamove.com/LM12345678"
```

#### 3.3.2 Language Support
**Priority**: P1 (Should Have)

- Primary: English
- Secondary: Bahasa Malaysia
- Future: Mandarin Chinese

Language detection based on:
- Customer's Intercom profile
- Message content analysis
- Previous conversation history

#### 3.3.3 Error Handling
**Priority**: P0 (Must Have)

Graceful handling of:
- Order not found
- API timeouts
- Invalid order formats
- System maintenance
- Rate limit exceeded

### 3.4 Bot-to-Human Handoff

#### 3.4.1 Escalation Triggers
**Priority**: P0 (Must Have)

Automatic escalation when:
- Customer explicitly requests human agent
- Complex queries detected (refunds, complaints)
- Multiple failed attempts (>2)
- Negative sentiment detected
- VIP customer identified

#### 3.4.2 Context Preservation
**Priority**: P0 (Must Have)

When escalating:
- Add internal note with conversation summary
- Include last customer message
- Tag with escalation reason
- Preserve order information
- Assign to appropriate team

---

## 4. Non-Functional Requirements

### 4.1 Performance Requirements

| Metric | Requirement | Target |
|--------|------------|--------|
| Response Time | 95th percentile | < 2 seconds |
| Availability | Uptime SLA | 99.9% |
| Throughput | Concurrent conversations | 1,000 |
| API Latency | External API calls | < 3 seconds |
| Cache Hit Rate | Order status cache | > 60% |

### 4.2 Security Requirements

#### 4.2.1 Data Protection
- **Encryption**: TLS 1.3 for all API communications
- **Authentication**: 
  - OAuth 2.0 for Intercom
  - API keys stored in secure vault
  - JWT tokens with 1-hour expiry
- **PII Handling**:
  - No storage of payment information
  - Phone numbers masked in logs
  - 30-day retention for conversation data

#### 4.2.2 Compliance
- **GDPR**: Right to deletion support
- **PDPA**: Malaysian data protection compliance
- **PCI DSS**: No payment data processing

### 4.3 Scalability Requirements

- **Horizontal Scaling**: Auto-scale 2-10 instances
- **Queue Management**: Handle 10,000 queued messages
- **Database**: Support 1M conversations/month
- **Caching**: Redis with 1GB memory minimum

### 4.4 Monitoring & Analytics

#### 4.4.1 Operational Metrics
- Bot response times
- API success rates
- Queue depths
- Error rates by type
- Escalation rates

#### 4.4.2 Business Metrics
- Conversations handled
- Automation rate
- Customer satisfaction
- Cost per conversation
- Time to resolution

---

## 5. Technical Architecture

### 5.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Intercom                                 │
└────────────────────────────┬────────────────────────────────────┘
                             │ Webhooks
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Render Pro Services                           │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              Main API Service (Web)                         │ │
│  │                                                             │ │
│  │  • Webhook Handler    • Response Generator                 │ │
│  │  • Queue Manager      • Bot Logic                          │ │
│  └──────────────────────────┬─────────────────────────────────┘ │
│                             │                                    │
│  ┌──────────────────────────┴─────────────────────────────────┐ │
│  │          Integration Service (Background Worker)            │ │
│  │                                                             │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐      │ │
│  │  │ Lalamove    │  │ Foodpanda   │  │ StoreHub IST │      │ │
│  │  │ API Client  │  │ API Client  │  │ API Client   │      │ │
│  │  └─────────────┘  └─────────────┘  └──────────────┘      │ │
│  │                                                             │ │
│  │  • Circuit Breakers  • Rate Limiting  • Retry Logic        │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Neon PostgreSQL                              │
│                                                                 │
│  • Order tracking data  • API response cache                   │
│  • Delivery mappings    • Conversation logs                    │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Technology Stack

| Component | Technology | Justification |
|-----------|------------|---------------|
| Runtime | Node.js 18+ | Event-driven, good for webhooks |
| Framework | Express.js | Simple, well-documented |
| Queue | Bull/Redis | Reliable job processing |
| Database | PostgreSQL | ACID compliance, JSON support |
| Cache | Redis | Fast, supports TTL |
| Monitoring | Prometheus/Grafana | Industry standard |
| Logging | ELK Stack | Centralized logging |

### 5.3 Deployment Infrastructure

- **Platform**: Render.com Pro
- **Database**: Neon PostgreSQL
- **Redis**: Render Redis Pro
- **CDN**: Cloudflare (optional)
- **Monitoring**: Datadog/New Relic

---

## 6. Implementation Guide

### 6.1 Complete Implementation Code

#### 6.1.1 Main Service (app.js)

```javascript
// app.js - Main webhook handler and API service
const express = require('express');
const Bull = require('bull');
const { neon } = require('@neondatabase/serverless');
const crypto = require('crypto');

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
        return res.status(401).send('Unauthorized');
    }
    
    // Immediately respond to Intercom
    res.status(200).send('OK');
    
    try {
        const { topic, data } = req.body;
        
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
        
    } catch (error) {
        console.error('Webhook processing error:', error);
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
            queue: queueHealth ? 'ready' : 'not ready'
        });
    } catch (error) {
        res.status(503).json({ status: 'unhealthy', error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Webhook service running on port ${PORT}`);
});
```

#### 6.1.2 Queue Worker (worker.js)

```javascript
// worker.js - Background job processor
const Bull = require('bull');
const { DeliveryAPIClient } = require('./lib/delivery-client');
const { IntercomClient } = require('./lib/intercom-client');
const { OrderProcessor } = require('./lib/order-processor');
const { neon } = require('@neondatabase/serverless');

// Initialize services
const sql = neon(process.env.DATABASE_URL);
const orderQueue = new Bull('order-status', process.env.REDIS_URL);
const deliveryClient = new DeliveryAPIClient();
const intercomClient = new IntercomClient();
const orderProcessor = new OrderProcessor();

// Process queue jobs
orderQueue.process('process-message', async (job) => {
    const { conversationId, message, userId } = job.data;
    
    try {
        // Extract order information
        const orderInfo = orderProcessor.extractOrderInfo(message);
        
        if (!orderInfo) {
            // Not an order query, ignore
            return { processed: false, reason: 'not_order_query' };
        }
        
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
                (conversation_id, order_number, platform, status, response_time_ms)
                VALUES (${conversationId}, ${orderInfo.orderNumber}, 
                        ${orderStatus.platform}, ${orderStatus.status}, 
                        ${job.processedOn - job.timestamp})
            `;
        } else {
            // Order not found
            response = orderProcessor.generateNotFoundResponse(orderInfo.orderNumber);
            
            // Create support ticket
            await createSupportTicket(conversationId, orderInfo.orderNumber, userId);
        }
        
        // Send response to Intercom
        await intercomClient.sendReply(conversationId, response);
        
        return { processed: true, orderNumber: orderInfo.orderNumber };
        
    } catch (error) {
        console.error('Job processing error:', error);
        
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
}

// Escalate to human agent
async function escalateToHuman(conversationId, reason) {
    await intercomClient.assignToTeam(conversationId, process.env.SUPPORT_TEAM_ID);
    await intercomClient.tagConversation(conversationId, ['requires-human', 'bot-error']);
    await intercomClient.addNote(conversationId, `Bot escalation: ${reason}`);
}

// Queue event handlers
orderQueue.on('completed', (job, result) => {
    console.log(`Job ${job.id} completed:`, result);
});

orderQueue.on('failed', (job, err) => {
    console.error(`Job ${job.id} failed:`, err);
});

console.log('Worker started and listening for jobs...');
```

#### 6.1.3 Delivery API Client (lib/delivery-client.js)

```javascript
// lib/delivery-client.js - Multi-platform delivery API client
const axios = require('axios');
const crypto = require('crypto');
const CircuitBreaker = require('opossum');

class DeliveryAPIClient {
    constructor() {
        this.clients = {
            lalamove: new LalamoveClient(),
            foodpanda: new FoodpandaClient(),
            internal: new ISTClient()
        };
        
        // Setup circuit breakers for each client
        Object.keys(this.clients).forEach(platform => {
            const client = this.clients[platform];
            const breaker = new CircuitBreaker(
                client.getDeliveryStatus.bind(client),
                {
                    timeout: 5000,
                    errorThresholdPercentage: 50,
                    resetTimeout: 30000
                }
            );
            
            breaker.fallback(() => {
                console.log(`${platform} API circuit breaker opened`);
                return null;
            });
            
            this.clients[platform].getDeliveryStatus = breaker.fire.bind(breaker);
        });
    }
    
    async getOrderStatus(orderNumber, platform) {
        try {
            // Check cache first
            const cached = await this.getCachedStatus(orderNumber);
            if (cached) {
                console.log(`Cache hit for order ${orderNumber}`);
                return cached;
            }
            
            let status;
            
            if (platform && this.clients[platform]) {
                // Use specified platform
                status = await this.clients[platform].getDeliveryStatus(orderNumber);
            } else {
                // Try to detect platform or search across all
                status = await this.findOrderAcrossPlatforms(orderNumber);
            }
            
            // Cache the result
            if (status) {
                await this.cacheStatus(orderNumber, status);
            }
            
            return status;
            
        } catch (error) {
            console.error('Delivery API error:', error);
            throw error;
        }
    }
    
    async findOrderAcrossPlatforms(orderNumber) {
        // First check IST for order details
        try {
            const istOrder = await this.clients.internal.getOrder(orderNumber);
            if (istOrder && istOrder.delivery_partner) {
                const status = await this.clients[istOrder.delivery_partner]
                    .getDeliveryStatus(istOrder.delivery_tracking_id);
                return { ...status, internalOrderId: orderNumber };
            }
        } catch (error) {
            console.log('IST lookup failed, trying other platforms');
        }
        
        // Try each platform based on order number pattern
        const patterns = {
            lalamove: /^LM\d{8}$/,
            foodpanda: /^FP\d{10}$/
        };
        
        for (const [platform, pattern] of Object.entries(patterns)) {
            if (pattern.test(orderNumber)) {
                try {
                    const status = await this.clients[platform].getDeliveryStatus(orderNumber);
                    if (status) return status;
                } catch (error) {
                    continue;
                }
            }
        }
        
        return null;
    }
    
    async getCachedStatus(orderNumber) {
        // Implement Redis cache lookup
        const redis = require('./redis-client');
        const cached = await redis.get(`order:${orderNumber}`);
        return cached ? JSON.parse(cached) : null;
    }
    
    async cacheStatus(orderNumber, status) {
        const redis = require('./redis-client');
        await redis.setex(
            `order:${orderNumber}`,
            300, // 5 minutes TTL
            JSON.stringify(status)
        );
    }
    
    async createTicket(ticketData) {
        return await this.clients.internal.createTicket(ticketData);
    }
}

// Lalamove API Client
class LalamoveClient {
    constructor() {
        this.baseURL = 'https://rest.lalamove.com';
        this.apiKey = process.env.LALAMOVE_API_KEY;
        this.apiSecret = process.env.LALAMOVE_API_SECRET;
    }
    
    async getDeliveryStatus(trackingId) {
        const timestamp = Date.now();
        const path = `/v2/orders/${trackingId}`;
        
        // Generate HMAC signature
        const signature = this.generateSignature('GET', path, timestamp);
        
        try {
            const response = await axios.get(`${this.baseURL}${path}`, {
                headers: {
                    'Authorization': `hmac ${this.apiKey}:${timestamp}:${signature}`,
                    'Market': 'MY',
                    'Accept': 'application/json'
                },
                timeout: 5000
            });
            
            return this.formatLalamoveStatus(response.data);
            
        } catch (error) {
            if (error.response?.status === 404) return null;
            throw error;
        }
    }
    
    generateSignature(method, path, timestamp) {
        const data = `${timestamp}\r\n${method}\r\n${path}\r\n\r\n`;
        return crypto
            .createHmac('sha256', this.apiSecret)
            .update(data)
            .digest('hex');
    }
    
    formatLalamoveStatus(data) {
        const statusMap = {
            'ASSIGNING_DRIVER': 'Finding a driver for your order',
            'ON_GOING': 'Driver is on the way to pick up your order',
            'PICKED_UP': 'Your order has been picked up and is on the way',
            'COMPLETED': 'Your order has been delivered',
            'CANCELED': 'Order was cancelled',
            'REJECTED': 'Order was rejected'
        };
        
        return {
            platform: 'lalamove',
            orderId: data.orderId,
            status: statusMap[data.status] || data.status,
            rawStatus: data.status,
            driver: {
                name: data.driverInfo?.name,
                phone: data.driverInfo?.phone,
                plateNumber: data.driverInfo?.plateNumber,
                photo: data.driverInfo?.photo
            },
            location: {
                lat: data.driverInfo?.location?.lat,
                lng: data.driverInfo?.location?.lng
            },
            trackingUrl: data.shareLink,
            estimatedTime: data.completedAt || data.estimatedCompletedAt,
            distance: data.distance,
            stops: data.stops
        };
    }
}

// Foodpanda API Client
class FoodpandaClient {
    constructor() {
        this.baseURL = process.env.FOODPANDA_API_URL || 'https://api.foodpanda.my';
        this.apiKey = process.env.FOODPANDA_API_KEY;
    }
    
    async getDeliveryStatus(orderId) {
        try {
            const response = await axios.get(
                `${this.baseURL}/v1/orders/${orderId}/status`,
                {
                    headers: {
                        'X-API-Key': this.apiKey,
                        'Accept': 'application/json'
                    },
                    timeout: 5000
                }
            );
            
            return this.formatFoodpandaStatus(response.data);
            
        } catch (error) {
            if (error.response?.status === 404) return null;
            throw error;
        }
    }
    
    formatFoodpandaStatus(data) {
        const statusMap = {
            'confirmed': 'Order confirmed by restaurant',
            'preparing': 'Restaurant is preparing your order',
            'ready_for_pickup': 'Order ready for pickup',
            'finding_rider': 'Finding a rider for your order',
            'rider_assigned': 'Rider assigned to your order',
            'picked_up': 'Rider has picked up your order',
            'near_customer': 'Rider is nearby your location',
            'delivered': 'Order delivered successfully',
            'cancelled': 'Order cancelled'
        };
        
        return {
            platform: 'foodpanda',
            orderId: data.order_id,
            status: statusMap[data.status] || data.status,
            rawStatus: data.status,
            rider: {
                name: data.delivery?.rider_name,
                phone: data.delivery?.rider_contact,
                vehicleType: data.delivery?.vehicle_type
            },
            restaurant: {
                name: data.restaurant_name,
                phone: data.restaurant_phone
            },
            estimatedTime: data.estimated_delivery_time,
            actualTime: data.actual_delivery_time,
            trackingUrl: data.tracking_url,
            items: data.items?.map(item => ({
                name: item.name,
                quantity: item.quantity,
                price: item.price
            }))
        };
    }
}

// IST (Internal Service Tool) Client
class ISTClient {
    constructor() {
        this.baseURL = process.env.IST_API_URL;
        this.apiKey = process.env.IST_API_KEY;
    }
    
    async getOrder(orderId) {
        try {
            const response = await axios.get(
                `${this.baseURL}/api/orders/${orderId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Accept': 'application/json'
                    },
                    timeout: 5000
                }
            );
            
            return response.data;
            
        } catch (error) {
            if (error.response?.status === 404) return null;
            throw error;
        }
    }
    
    async createTicket(ticketData) {
        try {
            const response = await axios.post(
                `${this.baseURL}/api/tickets`,
                {
                    type: ticketData.type,
                    conversation_id: ticketData.conversationId,
                    order_number: ticketData.orderNumber,
                    user_id: ticketData.userId,
                    priority: 'medium',
                    source: 'intercom_bot'
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            return response.data;
            
        } catch (error) {
            console.error('Failed to create IST ticket:', error);
            throw error;
        }
    }
}

module.exports = { DeliveryAPIClient };
```

#### 6.1.4 Order Processor (lib/order-processor.js)

```javascript
// lib/order-processor.js - Order processing logic
class OrderProcessor {
    constructor() {
        this.orderPatterns = [
            /order\s*#?\s*(\w+)/i,
            /pesanan\s*#?\s*(\w+)/i,
            /tracking\s*#?\s*(\w+)/i,
            /mana\s+(?:order|pesanan)\s*(\w+)/i,
            /\b([A-Z]{2,3}\d{8,10})\b/
        ];
        
        this.platformPatterns = {
            lalamove: /^LM\d{8}$/,
            foodpanda: /^FP\d{10}$/,
            internal: /^BEP\d{8}$/
        };
    }
    
    extractOrderInfo(message) {
        const messageLower = message.toLowerCase();
        
        // Check if it's an order-related query
        const orderKeywords = [
            'order', 'pesanan', 'where', 'mana', 'status', 
            'track', 'delivery', 'penghantaran'
        ];
        
        const hasOrderKeyword = orderKeywords.some(keyword => 
            messageLower.includes(keyword)
        );
        
        if (!hasOrderKeyword) return null;
        
        // Extract order number
        let orderNumber = null;
        
        for (const pattern of this.orderPatterns) {
            const match = message.match(pattern);
            if (match && match[1]) {
                orderNumber = match[1].toUpperCase();
                break;
            }
        }
        
        if (!orderNumber) return null;
        
        // Detect platform
        let platform = 'unknown';
        
        for (const [platformName, pattern] of Object.entries(this.platformPatterns)) {
            if (pattern.test(orderNumber)) {
                platform = platformName;
                break;
            }
        }
        
        // Check for platform mentions in message
        if (messageLower.includes('lalamove')) platform = 'lalamove';
        if (messageLower.includes('foodpanda')) platform = 'foodpanda';
        
        return {
            orderNumber,
            platform,
            originalMessage: message
        };
    }
    
    generateOrderResponse(orderStatus) {
        const { platform, status, driver, rider, estimatedTime, trackingUrl } = orderStatus;
        
        let response = `📦 I found your ${platform} order!\n\n`;
        response += `**Status**: ${status}\n`;
        
        // Add driver/rider info
        if (driver?.name || rider?.name) {
            const deliveryPerson = driver?.name || rider?.name;
            const deliveryPhone = driver?.phone || rider?.phone;
            
            response += `🚗 **${platform === 'foodpanda' ? 'Rider' : 'Driver'}**: ${deliveryPerson}\n`;
            
            if (deliveryPhone) {
                response += `📞 **Contact**: ${deliveryPhone}\n`;
            }
        }
        
        // Add time estimate
        if (estimatedTime) {
            const time = new Date(estimatedTime);
            const now = new Date();
            const diffMinutes = Math.round((time - now) / 60000);
            
            if (diffMinutes > 0) {
                response += `⏱️ **Estimated arrival**: ${time.toLocaleTimeString('en-MY', {
                    hour: '2-digit',
                    minute: '2-digit'
                })} (in ${diffMinutes} minutes)\n`;
            } else if (orderStatus.rawStatus !== 'COMPLETED' && orderStatus.rawStatus !== 'delivered') {
                response += `⏱️ **Expected soon** - driver is very close!\n`;
            }
        }
        
        // Add tracking link
        if (trackingUrl) {
            response += `\n🔗 [Track your order live](${trackingUrl})`;
        }
        
        // Add helpful message based on status
        const statusMessages = {
            'Finding a driver for your order': '\n\n💡 Tip: A driver will be assigned shortly!',
            'Your order has been picked up and is on the way': '\n\n🎉 Great news! Your order is on the way!',
            'Your order has been delivered': '\n\n✅ Your order has been delivered. Enjoy your meal! 🍽️'
        };
        
        if (statusMessages[status]) {
            response += statusMessages[status];
        }
        
        return response;
    }
    
    generateNotFoundResponse(orderNumber) {
        return `I couldn't find order ${orderNumber} in our system. This could mean:

• The order number might be incorrect
• The order is still being processed
• It's from a different platform

I'm creating a support ticket for you, and our team will look into this right away. They'll respond within 2-4 hours.

In the meantime, please double-check your order confirmation email/SMS for the correct order number.`;
    }
    
    generateErrorResponse() {
        return `I'm having trouble accessing order information right now. Let me connect you with a human agent who can help you immediately.`;
    }
}

module.exports = { OrderProcessor };
```

#### 6.1.5 Database Schema (schema.sql)

```sql
-- Neon PostgreSQL Schema
-- Create database tables for BEEP Intercom Chatbot

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Conversations table
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    intercom_id VARCHAR(255) UNIQUE NOT NULL,
    user_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active',
    first_message TEXT,
    last_message TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Order lookups table
CREATE TABLE order_lookups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id VARCHAR(255),
    order_number VARCHAR(100),
    platform VARCHAR(50),
    status VARCHAR(100),
    response_time_ms INTEGER,
    cache_hit BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Support tickets table
CREATE TABLE support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id VARCHAR(100),
    conversation_id VARCHAR(255),
    order_number VARCHAR(100),
    reason VARCHAR(100),
    priority VARCHAR(20) DEFAULT 'medium',
    status VARCHAR(50) DEFAULT 'open',
    assigned_to VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    resolved_at TIMESTAMP
);

-- API logs table for monitoring
CREATE TABLE api_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    platform VARCHAR(50),
    endpoint VARCHAR(500),
    method VARCHAR(10),
    request_data JSONB,
    response_data JSONB,
    status_code INTEGER,
    response_time_ms INTEGER,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Delivery status cache
CREATE TABLE delivery_status_cache (
    order_number VARCHAR(100) PRIMARY KEY,
    platform VARCHAR(50),
    status_data JSONB,
    raw_response JSONB,
    cached_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '5 minutes'
);

-- Bot interactions table
CREATE TABLE bot_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id VARCHAR(255),
    message_type VARCHAR(50), -- 'user' or 'bot'
    message TEXT,
    intent VARCHAR(100),
    confidence DECIMAL(3, 2),
    entities JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Performance metrics table
CREATE TABLE performance_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_name VARCHAR(100),
    metric_value DECIMAL(10, 2),
    metric_unit VARCHAR(50),
    tags JSONB DEFAULT '{}',
    recorded_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_conversations_intercom_id ON conversations(intercom_id);
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_conversations_created_at ON conversations(created_at DESC);

CREATE INDEX idx_order_lookups_conversation_id ON order_lookups(conversation_id);
CREATE INDEX idx_order_lookups_order_number ON order_lookups(order_number);
CREATE INDEX idx_order_lookups_created_at ON order_lookups(created_at DESC);

CREATE INDEX idx_tickets_conversation_id ON support_tickets(conversation_id);
CREATE INDEX idx_tickets_order_number ON support_tickets(order_number);
CREATE INDEX idx_tickets_status ON support_tickets(status);
CREATE INDEX idx_tickets_created_at ON support_tickets(created_at DESC);

CREATE INDEX idx_api_logs_platform ON api_logs(platform);
CREATE INDEX idx_api_logs_status_code ON api_logs(status_code);
CREATE INDEX idx_api_logs_created_at ON api_logs(created_at DESC);

CREATE INDEX idx_cache_order_number ON delivery_status_cache(order_number);
CREATE INDEX idx_cache_expires_at ON delivery_status_cache(expires_at);

CREATE INDEX idx_interactions_conversation_id ON bot_interactions(conversation_id);
CREATE INDEX idx_interactions_created_at ON bot_interactions(created_at DESC);

-- Create views for analytics
CREATE VIEW hourly_metrics AS
SELECT 
    DATE_TRUNC('hour', created_at) as hour,
    COUNT(*) as total_lookups,
    COUNT(DISTINCT conversation_id) as unique_conversations,
    AVG(response_time_ms) as avg_response_time,
    SUM(CASE WHEN cache_hit THEN 1 ELSE 0 END)::FLOAT / COUNT(*) as cache_hit_rate
FROM order_lookups
GROUP BY DATE_TRUNC('hour', created_at);

CREATE VIEW daily_platform_stats AS
SELECT 
    DATE_TRUNC('day', created_at) as day,
    platform,
    COUNT(*) as total_requests,
    AVG(response_time_ms) as avg_response_time
FROM order_lookups
GROUP BY DATE_TRUNC('day', created_at), platform;

-- Function to clean up expired cache
CREATE OR REPLACE FUNCTION cleanup_expired_cache() RETURNS void AS $$
BEGIN
    DELETE FROM delivery_status_cache WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to update conversation updated_at timestamp
CREATE OR REPLACE FUNCTION update_conversation_timestamp() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating conversation timestamp
CREATE TRIGGER update_conversation_timestamp_trigger
BEFORE UPDATE ON conversations
FOR EACH ROW
EXECUTE FUNCTION update_conversation_timestamp();
```

#### 6.1.6 Environment Configuration (.env)

```bash
# Environment Configuration for BEEP Intercom Chatbot

# Node Environment
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=postgresql://user:password@neon-hostname.neon.tech:5432/beep-chatbot?sslmode=require

# Redis (Render Redis or Upstash)
REDIS_URL=redis://default:password@redis-hostname.render.com:6379

# Intercom Configuration
INTERCOM_ACCESS_TOKEN=dG9rOmFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6
INTERCOM_BOT_ADMIN_ID=1234567
WEBHOOK_SECRET=your_webhook_secret_here
SUPPORT_TEAM_ID=2345678

# Lalamove API
LALAMOVE_API_KEY=your_lalamove_api_key
LALAMOVE_API_SECRET=your_lalamove_api_secret

# Foodpanda API
FOODPANDA_API_URL=https://api.foodpanda.my
FOODPANDA_API_KEY=your_foodpanda_api_key

# Internal APIs
IST_API_URL=https://api.storehub.com
IST_API_KEY=your_ist_api_key

# Monitoring (optional)
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
DATADOG_API_KEY=your_datadog_api_key

# Feature Flags
ENABLE_LALAMOVE=true
ENABLE_FOODPANDA=true
ENABLE_CACHE=true
CACHE_TTL_SECONDS=300

# Performance Settings
MAX_CONCURRENT_JOBS=10
JOB_TIMEOUT_MS=30000
API_TIMEOUT_MS=5000
```

#### 6.1.7 Package.json

```json
{
  "name": "beep-intercom-chatbot",
  "version": "1.0.0",
  "description": "StoreHub BEEP Intercom Chatbot for order status queries",
  "main": "app.js",
  "scripts": {
    "start": "node app.js",
    "start:worker": "node worker.js",
    "start:all": "concurrently \"npm run start\" \"npm run start:worker\"",
    "dev": "nodemon app.js",
    "dev:worker": "nodemon worker.js",
    "dev:all": "concurrently \"npm run dev\" \"npm run dev:worker\"",
    "test": "jest",
    "test:watch": "jest --watch",
    "migrate": "node scripts/migrate.js",
    "seed": "node scripts/seed.js"
  },
  "dependencies": {
    "@neondatabase/serverless": "^0.9.0",
    "axios": "^1.6.0",
    "bull": "^4.11.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "ioredis": "^5.3.2",
    "opossum": "^8.0.1",
    "winston": "^3.11.0"
  },
  "devDependencies": {
    "concurrently": "^8.2.2",
    "jest": "^29.7.0",
    "nodemon": "^3.0.1",
    "supertest": "^6.3.3"
  },
  "engines": {
    "node": ">=18.0.0"
  },
  "keywords": [
    "chatbot",
    "intercom",
    "delivery",
    "storehub",
    "beep"
  ],
  "author": "StoreHub Team",
  "license": "MIT"
}
```

#### 6.1.8 Render Deployment Configuration (render.yaml)

```yaml
# render.yaml - Render deployment configuration
services:
  # Main webhook service
  - type: web
    name: beep-chatbot-api
    env: node
    plan: pro
    region: singapore
    buildCommand: npm install
    startCommand: npm start
    healthCheckPath: /health
    envVars:
      - key: NODE_ENV
        value: production
      - fromGroup: beep-secrets
      - fromGroup: beep-config
    autoDeploy: true
    
  # Background worker for processing
  - type: worker
    name: beep-chatbot-worker
    env: node
    plan: pro
    region: singapore
    buildCommand: npm install
    startCommand: npm run start:worker
    envVars:
      - key: NODE_ENV
        value: production
      - fromGroup: beep-secrets
      - fromGroup: beep-config
    autoDeploy: true

# Redis for queuing and caching
databases:
  - name: beep-redis
    type: redis
    plan: pro
    region: singapore
    ipAllowList: []

# Environment variable groups
envVarGroups:
  # Sensitive credentials
  - name: beep-secrets
    envVars:
      - key: DATABASE_URL
        sync: false
      - key: INTERCOM_ACCESS_TOKEN
        sync: false
      - key: WEBHOOK_SECRET
        sync: false
      - key: LALAMOVE_API_KEY
        sync: false
      - key: LALAMOVE_API_SECRET
        sync: false
      - key: FOODPANDA_API_KEY
        sync: false
      - key: IST_API_KEY
        sync: false
      
  # Non-sensitive configuration
  - name: beep-config
    envVars:
      - key: INTERCOM_BOT_ADMIN_ID
        value: "1234567"
      - key: SUPPORT_TEAM_ID
        value: "2345678"
      - key: IST_API_URL
        value: https://api.storehub.com
      - key: FOODPANDA_API_URL
        value: https://api.foodpanda.my
      - key: ENABLE_LALAMOVE
        value: "true"
      - key: ENABLE_FOODPANDA
        value: "true"
      - key: CACHE_TTL_SECONDS
        value: "300"
      - key: MAX_CONCURRENT_JOBS
        value: "10"
```

---

## 7. Implementation Phases

### Phase 1: MVP (Week 1-4)
- [x] Basic webhook handling
- [x] Order number extraction
- [x] IST API integration
- [x] Simple response generation
- [x] Basic error handling

**Deliverables:**
- Working webhook endpoint
- Basic order status queries for internal orders
- Deployment on Render

### Phase 2: 3PL Integration (Week 5-8)
- [ ] Lalamove API integration
- [ ] Foodpanda API integration
- [ ] Multi-platform order lookup
- [ ] Response caching
- [ ] Enhanced error messages

**Deliverables:**
- Full 3PL platform support
- Caching layer implementation
- Improved response formatting

### Phase 3: Intelligence (Week 9-12)
- [ ] NLP improvements
- [ ] Multi-language support
- [ ] Sentiment analysis
- [ ] Smart escalation
- [ ] Analytics dashboard

**Deliverables:**
- Enhanced natural language processing
- Language detection and multi-language responses
- Automated sentiment-based escalation
- Real-time analytics dashboard

### Phase 4: Optimization (Week 13-16)
- [ ] Performance tuning
- [ ] A/B testing framework
- [ ] Advanced caching strategies
- [ ] Cost optimization
- [ ] Monitoring enhancement

**Deliverables:**
- Optimized performance metrics
- A/B testing capability
- Advanced caching with predictive loading
- Cost reduction through efficient API usage

---

## 8. Success Criteria

### 8.1 Launch Criteria
- Handle 100 concurrent conversations
- 95% order extraction accuracy
- < 2 second response time
- 99% uptime over 7 days
- Successful escalation flow

### 8.2 Success Metrics (3 months post-launch)

| Metric | Target | Measurement |
|--------|--------|-------------|
| Automation Rate | 60% | Conversations without human touch |
| CSAT Score | ≥ 4.0 | Post-conversation survey |
| Cost Reduction | 40% | Support cost per conversation |
| Response Time | < 2s | 95th percentile |
| Escalation Rate | < 20% | Human handoff required |

---

## 9. Risks & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| API Rate Limits | High | Medium | Implement caching, circuit breakers |
| 3PL API Changes | High | Low | Version detection, graceful degradation |
| High Volume Spikes | Medium | High | Auto-scaling, queue management |
| Language Complexity | Medium | Medium | Start with English, phase others |
| Security Breach | High | Low | Encryption, key rotation, monitoring |

---

## 10. Dependencies

### 10.1 External Dependencies
- Intercom API availability
- Lalamove API access and credentials
- Foodpanda partner API approval
- IST API documentation and access

### 10.2 Internal Dependencies
- IST team for API support
- DevOps for infrastructure setup
- Security team for compliance review
- Customer Success for feedback

---

## 11. Open Questions

1. Should the bot handle refund requests directly via IST API?
2. What is the preferred escalation path for different scenarios?
3. Should merchants have different bot interactions than customers?
4. How should the bot handle multiple orders in one conversation?
5. What analytics data should be exposed to merchants?

---

## 12. Appendices

### Appendix A: Example Conversations
[Link to conversation flows]

### Appendix B: API Documentation Links
- [Intercom API Reference](https://developers.intercom.com/docs)
- [Lalamove API Docs](https://developers.lalamove.com)
- Internal IST API Docs (internal link)

### Appendix C: Competitive Analysis
- Zendesk Answer Bot
- Freshdesk Freddy AI
- Custom solutions by competitors

---

**Document History**
| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Jan 2025 | Product Team | Initial draft |

This PRD provides a comprehensive overview of the chatbot project with clear requirements, success metrics, and implementation phases. It can be used to align stakeholders, guide development, and track progress throughout the project lifecycle.