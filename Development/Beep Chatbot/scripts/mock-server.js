// scripts/mock-server.js - Mock API server for development
const express = require('express');
const crypto = require('crypto');

const app = express();
app.use(express.json());

const PORT = process.env.MOCK_PORT || 4000;

// Mock data
const mockOrders = {
    'LM12345678': {
        orderId: 'LM12345678',
        status: 'PICKED_UP',
        driverInfo: {
            name: 'Ahmad Rahman',
            phone: '+60123456789',
            plateNumber: 'WXY 1234',
            location: { lat: 3.1390, lng: 101.6869 }
        },
        shareLink: 'https://track.lalamove.com/LM12345678',
        estimatedCompletedAt: new Date(Date.now() + 15 * 60000).toISOString()
    },
    'FP1234567890': {
        order_id: 'FP1234567890',
        status: 'picked_up',
        delivery: {
            rider_name: 'Ali Hassan',
            rider_contact: '+60198765432',
            vehicle_type: 'motorcycle'
        },
        restaurant_name: 'Nasi Lemak Corner',
        restaurant_phone: '+603456789',
        estimated_delivery_time: new Date(Date.now() + 20 * 60000).toISOString(),
        tracking_url: 'https://track.foodpanda.my/FP1234567890'
    },
    'BEP88888888': {
        order_id: 'BEP88888888',
        delivery_partner: 'lalamove',
        delivery_tracking_id: 'LM87654321',
        status: 'in_transit',
        created_at: new Date(Date.now() - 30 * 60000).toISOString()
    }
};

// Lalamove endpoints
app.get('/v2/orders/:orderId', (req, res) => {
    console.log(`[MOCK] Lalamove request for order: ${req.params.orderId}`);
    
    const order = mockOrders[req.params.orderId];
    if (order && order.orderId) {
        res.json(order);
    } else {
        res.status(404).json({ message: 'Order not found' });
    }
});

// Foodpanda endpoints
app.get('/v1/orders/:orderId/status', (req, res) => {
    console.log(`[MOCK] Foodpanda request for order: ${req.params.orderId}`);
    
    const order = mockOrders[req.params.orderId];
    if (order && order.order_id) {
        res.json(order);
    } else {
        res.status(404).json({ error: 'Order not found' });
    }
});

// IST endpoints
app.get('/api/orders/:orderId', (req, res) => {
    console.log(`[MOCK] IST request for order: ${req.params.orderId}`);
    
    const order = mockOrders[req.params.orderId];
    if (order) {
        res.json(order);
    } else {
        res.status(404).json({ error: 'Order not found' });
    }
});

app.post('/api/tickets', (req, res) => {
    console.log(`[MOCK] Creating ticket:`, req.body);
    
    res.json({
        id: `TICKET-${Date.now()}`,
        ...req.body,
        created_at: new Date().toISOString()
    });
});

// Intercom mock endpoints
app.post('/conversations/:conversationId/reply', (req, res) => {
    console.log(`[MOCK] Intercom reply to ${req.params.conversationId}:`, req.body.body);
    
    res.json({
        id: `reply-${Date.now()}`,
        conversation_id: req.params.conversationId,
        ...req.body
    });
});

app.put('/conversations/:conversationId', (req, res) => {
    console.log(`[MOCK] Intercom update conversation ${req.params.conversationId}:`, req.body);
    
    res.json({
        id: req.params.conversationId,
        ...req.body
    });
});

app.get('/tags', (req, res) => {
    res.json({
        data: [
            { id: '1', name: 'bot-escalation' },
            { id: '2', name: 'order-not-found' },
            { id: '3', name: 'requires-human' }
        ]
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy',
        service: 'mock-api-server',
        timestamp: new Date().toISOString()
    });
});

app.listen(PORT, () => {
    console.log(`🎭 Mock API Server running on port ${PORT}`);
    console.log('\nMock endpoints available:');
    console.log(`  Lalamove: http://localhost:${PORT}/v2/orders/:orderId`);
    console.log(`  Foodpanda: http://localhost:${PORT}/v1/orders/:orderId/status`);
    console.log(`  IST: http://localhost:${PORT}/api/orders/:orderId`);
    console.log(`  Intercom: http://localhost:${PORT}/conversations/:id/reply`);
    console.log('\nAvailable test orders:');
    console.log('  - LM12345678 (Lalamove, picked up)');
    console.log('  - FP1234567890 (Foodpanda, picked up)');
    console.log('  - BEP88888888 (Internal order)\n');
});