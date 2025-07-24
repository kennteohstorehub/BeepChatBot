// lib/delivery-client-mock.js - Mock delivery client for testing
const axios = require('axios');
const CircuitBreaker = require('opossum');

// Mock responses
const mockResponses = {
    'LM12345678': {
        platform: 'lalamove',
        orderId: 'LM12345678',
        status: 'PICKED_UP',
        driverInfo: {
            name: 'Ahmad Rahman',
            phone: '+60123456789',
            plateNumber: 'WXY 1234'
        },
        shareLink: 'https://track.lalamove.com/LM12345678'
    },
    'FP1234567890': {
        platform: 'foodpanda',
        order_id: 'FP1234567890',
        status: 'picked_up',
        delivery: {
            rider_name: 'Ali Hassan',
            rider_contact: '+60198765432'
        },
        restaurant_name: 'Nasi Lemak Corner'
    },
    'BEP88888888': {
        platform: 'internal',
        order_id: 'BEP88888888',
        delivery_partner: 'lalamove',
        delivery_tracking_id: 'LM87654321',
        status: 'in_transit'
    }
};

async function getDeliveryStatus(orderNumber) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Check if it's a known mock order
    if (mockResponses[orderNumber]) {
        return mockResponses[orderNumber];
    }
    
    // Otherwise throw not found error
    throw new Error('Order not found');
}

module.exports = { getDeliveryStatus };