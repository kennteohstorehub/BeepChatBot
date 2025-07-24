// tests/integration/api.test.js
const axios = require('axios');
const nock = require('nock');

// Use mock for now until delivery-client is implemented
const { getDeliveryStatus } = require('../../lib/delivery-client-mock');

describe('API Integration Tests', () => {
    beforeEach(() => {
        nock.cleanAll();
    });

    describe('Mock Delivery API', () => {
        it('should retrieve Lalamove order status successfully', async () => {
            const result = await getDeliveryStatus('LM12345678');
            
            expect(result.platform).toBe('lalamove');
            expect(result.orderId).toBe('LM12345678');
            expect(result.status).toBe('PICKED_UP');
            expect(result.driverInfo.name).toBe('Ahmad Rahman');
        });

        it('should handle order not found', async () => {
            await expect(getDeliveryStatus('LM99999999'))
                .rejects.toThrow('Order not found');
        });
    });

    describe('Foodpanda API', () => {
        it('should retrieve order status successfully', async () => {
            const result = await getDeliveryStatus('FP1234567890');
            
            expect(result.platform).toBe('foodpanda');
            expect(result.order_id).toBe('FP1234567890');
            expect(result.status).toBe('picked_up');
            expect(result.delivery.rider_name).toBe('Ali Hassan');
        });
    });

    describe('IST API', () => {
        it('should retrieve internal order status', async () => {
            const result = await getDeliveryStatus('BEP88888888');
            
            expect(result.platform).toBe('internal');
            expect(result.order_id).toBe('BEP88888888');
            expect(result.delivery_partner).toBe('lalamove');
            expect(result.status).toBe('in_transit');
        });
    });
});