# CLAUDE.md - Beep Chatbot Development Guide

This file provides specific guidance for developing the StoreHub BEEP Intercom Chatbot. It follows the principles from the master CLAUDE.md while focusing on this project's unique requirements.

## 🎯 Project Overview

The BEEP Intercom Chatbot automates customer order status inquiries, reducing support team workload by 60% through intelligent order tracking across multiple delivery platforms (Lalamove, Foodpanda, StoreHub IST).

**Current Status**: Phase 1 MVP Complete ✓

## ⚡ CRITICAL WORKFLOW - ALWAYS FOLLOW THIS!

### Research → Plan → Implement → Validate
1. **Research**: Explore existing Intercom webhooks, API integrations, and order tracking patterns
2. **Plan**: Create detailed implementation plan for each phase
3. **Implement**: Build with continuous validation checkpoints
4. **Validate**: Test with real order scenarios before marking complete

### Reality Checkpoints for This Project
**Stop and validate** at these moments:
- After implementing each API integration (Intercom, Lalamove, Foodpanda, IST)
- Before declaring any phase complete
- After handling 10 test conversations
- When error rates exceed 5%

Run validation suite:
```bash
npm test                    # Unit tests
npm run test:integration    # API integration tests
npm run test:webhook        # Webhook endpoint tests
npm run test:e2e           # End-to-end conversation flows
```

## 📁 Project Structure

```
beep-chatbot/
├── app.js                  # Main webhook handler service
├── worker.js              # Background job processor
├── lib/
│   ├── delivery-client.js # Multi-platform API client
│   ├── intercom-client.js # Intercom API wrapper
│   ├── order-processor.js # Order extraction & response logic
│   └── redis-client.js    # Cache management
├── tests/
│   ├── unit/             # Unit tests
│   ├── integration/      # API integration tests
│   └── fixtures/         # Test data
├── scripts/
│   ├── migrate.js        # Database migrations
│   ├── seed.js          # Seed test data
│   └── test-webhook.js   # Webhook tester
└── config/
    └── index.js          # Configuration management
```

## 🚀 Development Commands

### Local Development
```bash
# Setup
npm install
cp .env.example .env        # Configure environment variables

# Database setup
npm run migrate            # Run database migrations
npm run seed              # Seed test data

# Development
npm run dev:all           # Start API + Worker with hot reload
npm run dev               # Start API only
npm run dev:worker        # Start Worker only

# Testing
npm test                  # Run all tests
npm run test:watch        # Watch mode
npm run test:coverage     # Coverage report
```

### Testing Webhooks Locally
```bash
# Start local webhook server
npm run dev

# In another terminal, test with mock payloads
node scripts/test-webhook.js --scenario order-status
node scripts/test-webhook.js --scenario order-not-found
node scripts/test-webhook.js --scenario escalation
```

### Production Commands
```bash
npm start                 # Start production API
npm run start:worker      # Start production worker
npm run start:all         # Start both services
```

## 🔐 Security Requirements

### API Keys Management
```bash
# NEVER commit these to Git
INTERCOM_ACCESS_TOKEN=     # OAuth token from Intercom
WEBHOOK_SECRET=            # For signature verification
LALAMOVE_API_KEY=         # Platform API credentials
LALAMOVE_API_SECRET=
FOODPANDA_API_KEY=
IST_API_KEY=              # Internal service key
```

### Webhook Security
All incoming webhooks MUST be verified:
```javascript
// ALWAYS verify signatures
if (!verifyIntercomSignature(payload, signature, secret)) {
    return res.status(401).send('Unauthorized');
}
```

## 📋 Implementation Checklist

### Phase 1: MVP ✓
- [x] Webhook endpoint setup
- [x] Signature verification
- [x] Order number extraction
- [x] IST API integration
- [x] Basic response formatting
- [x] Error handling
- [x] Database schema
- [x] Deployment configuration

### Phase 2: 3PL Integration (Current)
- [ ] Lalamove API client
  - [ ] HMAC signature generation
  - [ ] Order status endpoint
  - [ ] Response formatting
  - [ ] Error handling
- [ ] Foodpanda API client
  - [ ] API key authentication
  - [ ] Status retrieval
  - [ ] Response formatting
- [ ] Multi-platform order detection
- [ ] Response caching (Redis)
- [ ] Circuit breakers

### Phase 3: Intelligence
- [ ] NLP for better order extraction
- [ ] Multi-language support (English, Malay, Chinese)
- [ ] Sentiment analysis
- [ ] Smart escalation rules
- [ ] Analytics dashboard

### Phase 4: Optimization
- [ ] Performance tuning (<2s response time)
- [ ] A/B testing framework
- [ ] Advanced caching strategies
- [ ] Cost optimization
- [ ] Monitoring enhancement

## 🧪 Testing Strategy

### Unit Tests (lib/)
Test each component in isolation:
```javascript
// Test order extraction
describe('OrderProcessor', () => {
  it('extracts Lalamove order numbers', () => {
    const result = processor.extractOrderInfo('Where is my order LM12345678?');
    expect(result.orderNumber).toBe('LM12345678');
    expect(result.platform).toBe('lalamove');
  });
});
```

### Integration Tests (APIs)
Test with mock API responses:
```javascript
// Test Lalamove integration
describe('LalamoveClient', () => {
  it('retrieves order status', async () => {
    nock('https://rest.lalamove.com')
      .get('/v2/orders/LM12345678')
      .reply(200, mockLalamoveResponse);
    
    const status = await client.getDeliveryStatus('LM12345678');
    expect(status.platform).toBe('lalamove');
  });
});
```

### E2E Tests (Conversations)
Test complete conversation flows:
```javascript
// Test order status flow
describe('Order Status Flow', () => {
  it('handles complete order inquiry', async () => {
    // Send webhook
    // Verify bot response
    // Check database logs
    // Validate metrics
  });
});
```

## 📊 Monitoring & Alerts

### Key Metrics to Track
```sql
-- Response time by platform
SELECT platform, AVG(response_time_ms) as avg_response
FROM order_lookups
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY platform;

-- Error rate monitoring
SELECT COUNT(*) as errors, platform
FROM api_logs
WHERE status_code >= 400
AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY platform;

-- Cache performance
SELECT 
  SUM(CASE WHEN cache_hit THEN 1 ELSE 0 END)::FLOAT / COUNT(*) as hit_rate
FROM order_lookups
WHERE created_at > NOW() - INTERVAL '1 hour';
```

### Alert Thresholds
- Response time > 3 seconds
- Error rate > 5%
- Cache hit rate < 50%
- Queue depth > 1000

## 🚨 Common Issues & Solutions

### Webhook Not Receiving Events
1. Verify webhook URL in Intercom settings
2. Check signature verification
3. Monitor server logs
4. Test with Intercom's webhook tester

### Order Not Found
1. Check order number format
2. Verify API credentials
3. Test direct API calls
4. Check platform detection logic

### High Response Times
1. Check cache hit rates
2. Monitor API latencies
3. Verify Redis connection
4. Check queue processing speed

### API Rate Limits
1. Implement exponential backoff
2. Increase cache TTL
3. Batch similar requests
4. Monitor rate limit headers

## 🔄 Deployment Process

### Pre-deployment Checklist
- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] API credentials verified
- [ ] Monitoring alerts configured

### Render Deployment
```bash
# Manual deployment
git push origin main

# Or using Render CLI
render deploy --service beep-chatbot-api
render deploy --service beep-chatbot-worker
```

### Post-deployment Validation
1. Check health endpoint: `curl https://your-app.onrender.com/health`
2. Send test webhook
3. Monitor error logs
4. Verify queue processing
5. Check response times

## 💡 Development Best Practices

### API Integration Patterns
```javascript
// ALWAYS use circuit breakers
const breaker = new CircuitBreaker(apiCall, {
  timeout: 5000,
  errorThresholdPercentage: 50,
  resetTimeout: 30000
});

// ALWAYS implement retries
async function withRetry(fn, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) throw error;
      await sleep(Math.pow(2, i) * 1000); // Exponential backoff
    }
  }
}
```

### Response Formatting
```javascript
// ALWAYS provide clear, actionable responses
const responses = {
  found: "📦 I found your order! Status: {status}",
  notFound: "I couldn't find that order. Creating a ticket for you.",
  error: "Having trouble right now. Connecting you to an agent."
};
```

### Error Handling
```javascript
// ALWAYS escalate gracefully
try {
  const status = await getOrderStatus(orderNumber);
  await sendResponse(status);
} catch (error) {
  await logError(error);
  await escalateToHuman(conversationId);
  await sendErrorResponse();
}
```

## 🎯 Success Metrics

Track these metrics weekly:
- **Automation Rate**: Target 60%
- **Response Time**: Target <2s (95th percentile)
- **Error Rate**: Target <5%
- **CSAT Score**: Target ≥4.0
- **Cost per Conversation**: Target 40% reduction

## 🔧 Troubleshooting Guide

### Debug Mode
```bash
# Enable detailed logging
DEBUG=* npm run dev:all

# Test specific components
DEBUG=delivery:* npm run dev:worker
DEBUG=intercom:* npm run dev
```

### Common Error Patterns
1. **ECONNREFUSED**: Redis not running
2. **401 Unauthorized**: Invalid API credentials
3. **429 Too Many Requests**: Rate limit hit
4. **ETIMEDOUT**: API timeout, check circuit breaker

## 📚 Resources

### Internal Documentation
- [PRD_COMPLETE.md](./PRD_COMPLETE.md) - Full requirements
- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - API specs
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Deployment steps

### External Resources
- [Intercom API Docs](https://developers.intercom.com/docs)
- [Lalamove API Reference](https://developers.lalamove.com)
- [Render Deployment Guide](https://render.com/docs)

## 🤝 Working Together

Remember the principles from master CLAUDE.md:
- **Measure twice, cut once**: Validate before implementing
- **Simple > Clever**: Choose clarity over complexity
- **Test everything**: No feature is complete without tests
- **Monitor proactively**: Set up alerts before issues arise

When stuck or unsure:
1. Check existing patterns in the codebase
2. Review similar implementations
3. Ask: "What's the simplest solution that works?"
4. Consider: "How will this fail, and how do we handle it?"

---

**Last Updated**: January 2025
**Project Phase**: 2 - 3PL Integration
**Next Milestone**: Lalamove + Foodpanda API integration complete