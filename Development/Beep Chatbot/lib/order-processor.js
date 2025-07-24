// lib/order-processor.js - Order processing logic
class OrderProcessor {
    constructor() {
        this.orderPatterns = [
            /\b([A-Z]{2,3}\d{8,10})\b/,  // Priority pattern for order IDs
            /order\s*#?\s*([A-Z0-9]+)/i,
            /pesanan\s*#?\s*([A-Z0-9]+)/i,
            /tracking\s*#?\s*([A-Z0-9]+)/i,
            /mana\s+(?:order|pesanan)\s*([A-Z0-9]+)/i,
            /where.*order\s*([A-Z0-9]+)/i,
            /track.*\s+([A-Z0-9]+)/i
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
            'track', 'delivery', 'penghantaran', 'check',
            'tolong', 'cek', 'di mana'  // Additional Malay keywords
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
            'Your order has been delivered': '\n\n✅ Your order has been delivered. Enjoy your meal! 🍽️',
            'Order was cancelled': '\n\n❌ This order was cancelled. Please contact support if you need assistance.',
            'Order was rejected': '\n\n❌ This order was rejected. Please contact support for more information.'
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

// Helper functions for tests
function extractOrderInfo(message) {
    const processor = new OrderProcessor();
    return processor.extractOrderInfo(message);
}

function formatStatusResponse(orderData) {
    const processor = new OrderProcessor();
    
    // Transform data to expected format
    const orderStatus = {
        platform: orderData.platform,
        status: orderData.status ? orderData.status.replace(/_/g, ' ').toLowerCase() : 'unknown',
        rawStatus: orderData.status,
        driver: orderData.driverInfo,
        rider: orderData.delivery,
        estimatedTime: orderData.estimatedCompletedAt || orderData.estimated_delivery_time,
        trackingUrl: orderData.shareLink || orderData.tracking_url,
        orderNumber: orderData.orderId || orderData.order_id
    };
    
    // Handle different status formats
    if (orderStatus.status === 'picked up') {
        orderStatus.status = 'Your order has been picked up and is on the way';
    } else if (orderStatus.status === 'in transit') {
        orderStatus.status = 'Your order has been picked up and is on the way';
    } else if (orderStatus.status === 'pending') {
        orderStatus.status = 'Finding a driver for your order';
    }
    
    // Build response
    let response = `📦 Your order ${orderStatus.orderNumber} has been ${orderStatus.rawStatus ? orderStatus.rawStatus.toLowerCase().replace(/_/g, ' ') : 'found'}!\n\n`;
    
    if (orderStatus.driver?.name) {
        response += `Driver: ${orderStatus.driver.name}\n`;
        if (orderStatus.driver.phone) response += `Contact: ${orderStatus.driver.phone}\n`;
        if (orderStatus.driver.plateNumber) response += `Vehicle: ${orderStatus.driver.plateNumber}\n`;
    }
    
    if (orderStatus.rider?.rider_name) {
        response += `Rider: ${orderStatus.rider.rider_name}\n`;
        if (orderStatus.rider.rider_contact) response += `Contact: ${orderStatus.rider.rider_contact}\n`;
    }
    
    if (orderData.restaurant_name) {
        response += `Restaurant: ${orderData.restaurant_name}\n`;
    }
    
    if (orderData.delivery_partner) {
        response += `Delivery Partner: ${orderData.delivery_partner.charAt(0).toUpperCase() + orderData.delivery_partner.slice(1)}\n`;
        if (orderData.delivery_tracking_id) {
            response += `Tracking ID: ${orderData.delivery_tracking_id}\n`;
        }
    }
    
    if (orderStatus.trackingUrl) {
        response += `\nTrack your order: ${orderStatus.trackingUrl}`;
    }
    
    return response;
}

module.exports = { OrderProcessor, extractOrderInfo, formatStatusResponse };