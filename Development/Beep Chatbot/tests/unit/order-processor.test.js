// tests/unit/order-processor.test.js
const { extractOrderInfo, formatStatusResponse } = require('../../lib/order-processor');

describe('Order Processor', () => {
    describe('extractOrderInfo', () => {
        it('should extract Lalamove order number', () => {
            const messages = [
                'Where is my order LM12345678?',
                'Check order LM12345678 please',
                'LM12345678 status?',
                'I need to track LM12345678'
            ];

            messages.forEach(msg => {
                const result = extractOrderInfo(msg);
                expect(result.orderNumber).toBe('LM12345678');
                expect(result.platform).toBe('lalamove');
            });
        });

        it('should extract Foodpanda order number', () => {
            const messages = [
                'Track my foodpanda order FP1234567890',
                'FP1234567890 where is it?',
                'Order FP1234567890 status'
            ];

            messages.forEach(msg => {
                const result = extractOrderInfo(msg);
                expect(result.orderNumber).toBe('FP1234567890');
                expect(result.platform).toBe('foodpanda');
            });
        });

        it('should extract StoreHub internal order number', () => {
            const messages = [
                'BEP88888888 order status',
                'Where is BEP88888888?',
                'Track BEP88888888'
            ];

            messages.forEach(msg => {
                const result = extractOrderInfo(msg);
                expect(result.orderNumber).toBe('BEP88888888');
                expect(result.platform).toBe('internal');
            });
        });

        it('should return null for messages without order numbers', () => {
            const messages = [
                'I want to speak to a human',
                'What are your operating hours?',
                'Help me with my order'
            ];

            messages.forEach(msg => {
                const result = extractOrderInfo(msg);
                expect(result).toBeNull();
            });
        });

        it('should handle Malay language queries', () => {
            const messages = [
                'Mana pesanan saya LM87654321?',
                'Di mana order LM87654321?',
                'Tolong cek LM87654321'
            ];

            messages.forEach(msg => {
                const result = extractOrderInfo(msg);
                expect(result.orderNumber).toBe('LM87654321');
                expect(result.platform).toBe('lalamove');
            });
        });

        it('should handle case insensitive order numbers', () => {
            const result = extractOrderInfo('Where is my order lm12345678?');
            expect(result.orderNumber).toBe('LM12345678');
            expect(result.platform).toBe('lalamove');
        });
    });

    describe('formatStatusResponse', () => {
        it('should format Lalamove picked up status', () => {
            const orderData = {
                platform: 'lalamove',
                orderId: 'LM12345678',
                status: 'PICKED_UP',
                driverInfo: {
                    name: 'Ahmad Rahman',
                    phone: '+60123456789',
                    plateNumber: 'WXY 1234'
                },
                shareLink: 'https://track.lalamove.com/LM12345678',
                estimatedCompletedAt: new Date(Date.now() + 15 * 60000).toISOString()
            };

            const response = formatStatusResponse(orderData);
            expect(response).toContain('Your order LM12345678 has been picked up');
            expect(response).toContain('Ahmad Rahman');
            expect(response).toContain('+60123456789');
            expect(response).toContain('WXY 1234');
            expect(response).toContain('track.lalamove.com');
        });

        it('should format Foodpanda status', () => {
            const orderData = {
                platform: 'foodpanda',
                order_id: 'FP1234567890',
                status: 'picked_up',
                delivery: {
                    rider_name: 'Ali Hassan',
                    rider_contact: '+60198765432'
                },
                restaurant_name: 'Nasi Lemak Corner',
                tracking_url: 'https://track.foodpanda.my/FP1234567890'
            };

            const response = formatStatusResponse(orderData);
            expect(response).toContain('FP1234567890');
            expect(response).toContain('Ali Hassan');
            expect(response).toContain('+60198765432');
            expect(response).toContain('Nasi Lemak Corner');
        });

        it('should format internal order status', () => {
            const orderData = {
                platform: 'internal',
                order_id: 'BEP88888888',
                delivery_partner: 'lalamove',
                delivery_tracking_id: 'LM87654321',
                status: 'in_transit'
            };

            const response = formatStatusResponse(orderData);
            expect(response).toContain('BEP88888888');
            expect(response).toContain('in transit');
            expect(response).toContain('Lalamove');
            expect(response).toContain('LM87654321');
        });

        it('should handle missing tracking info gracefully', () => {
            const orderData = {
                platform: 'lalamove',
                orderId: 'LM12345678',
                status: 'PENDING'
            };

            const response = formatStatusResponse(orderData);
            expect(response).toContain('LM12345678');
            expect(response).toContain('pending');
            expect(response).not.toContain('undefined');
        });
    });
});