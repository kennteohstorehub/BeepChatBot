// lib/delivery-client.js - Multi-platform delivery API client
const axios = require('axios');
const crypto = require('crypto');
const CircuitBreaker = require('opossum');
const winston = require('winston');
const Redis = require('ioredis');

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.simple(),
    transports: [new winston.transports.Console()]
});

class DeliveryAPIClient {
    constructor() {
        this.redis = new Redis(process.env.REDIS_URL);
        
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
                logger.warn(`${platform} API circuit breaker opened`);
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
                logger.info(`Cache hit for order ${orderNumber}`);
                return { ...cached, fromCache: true };
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
            logger.error('Delivery API error:', error);
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
            logger.debug('IST lookup failed, trying other platforms');
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
        try {
            const cached = await this.redis.get(`order:${orderNumber}`);
            return cached ? JSON.parse(cached) : null;
        } catch (error) {
            logger.error('Cache retrieval error:', error);
            return null;
        }
    }
    
    async cacheStatus(orderNumber, status) {
        try {
            await this.redis.setex(
                `order:${orderNumber}`,
                parseInt(process.env.CACHE_TTL_SECONDS) || 300, // 5 minutes default
                JSON.stringify(status)
            );
        } catch (error) {
            logger.error('Cache storage error:', error);
        }
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
        if (!this.apiKey || !this.apiSecret) {
            logger.error('Lalamove API credentials not configured');
            return null;
        }
        
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
            logger.error('Lalamove API error:', error.response?.data || error.message);
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
        if (!this.apiKey) {
            logger.error('Foodpanda API key not configured');
            return null;
        }
        
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
            logger.error('Foodpanda API error:', error.response?.data || error.message);
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
        if (!this.apiKey) {
            logger.error('IST API key not configured');
            return null;
        }
        
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
            logger.error('IST API error:', error.response?.data || error.message);
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
            logger.error('Failed to create IST ticket:', error.response?.data || error.message);
            throw error;
        }
    }
}

module.exports = { DeliveryAPIClient };