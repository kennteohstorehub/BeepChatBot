# Development Workflow Guide

This guide outlines the complete development workflow for the BEEP Chatbot in a safe development environment.

## 🎯 Development Philosophy

**"Break things in development, not in production!"**

We're using a completely separate development environment where you can:
- Experiment freely with $0 cost
- Test integrations without affecting production
- Learn how services interact
- Break things and fix them without pressure

## 🏗️ Development Infrastructure

### All Development Services (Free Tier)
- **Database**: Neon PostgreSQL `beep-chatbot-dev` (Free tier)
- **Redis**: Render Redis `beep-redis-dev` (Free tier - 25MB)
- **API**: Render Web Service `beep-chatbot-api-dev` (Free tier)
- **Worker**: Render Background Worker `beep-chatbot-worker-dev` (Free tier)
- **Intercom**: Development workspace with test data

### Free Tier Characteristics
- Services sleep after 15 minutes of inactivity
- First request takes 30-60 seconds to wake up
- Perfect for development and testing
- Total cost: $0

## 📋 Development Setup Checklist

### Phase 1: Local Development
```bash
# 1. Clone and setup
git clone https://github.com/kennteohstorehub/BeepChatBot.git
cd BeepChatBot
npm install

# 2. Use development environment
cp .env.development .env

# 3. Test with mock services (no external APIs needed)
npm run dev:mock

# 4. Test webhook locally
npm run test:webhook -- --scenario=order-status
```

### Phase 2: Cloud Development Setup

#### Step 1: Database (Neon)
1. Create account at https://neon.tech
2. Create project: `beep-chatbot-dev`
3. Use free tier
4. Copy connection string

#### Step 2: Deploy to Render
1. Create services manually (not Blueprint):
   - `beep-chatbot-api-dev` (Web Service, Free)
   - `beep-chatbot-worker-dev` (Background Worker, Free)
   - `beep-redis-dev` (Redis, Free)
2. Add environment variables
3. Deploy from GitHub

#### Step 3: Configure Intercom
1. Create Developer App: "BEEP Bot - Development"
2. Generate OAuth token
3. Configure webhook with Render URL
4. Create test conversations

## 🧪 Testing Workflow

### Local Testing (Quick Iteration)
```bash
# Start mock environment
npm run dev:mock

# In another terminal, run tests
npm test
npm run test:integration
npm run test:webhook
```

### Render Development Testing
```bash
# Wake up service (if sleeping)
curl https://beep-chatbot-api-dev.onrender.com/health

# Test webhook endpoint
npm run test:webhook -- --url=https://beep-chatbot-api-dev.onrender.com/webhook

# Test different scenarios
npm run test:webhook -- --url=https://beep-chatbot-api-dev.onrender.com/webhook --scenario=foodpanda
npm run test:webhook -- --url=https://beep-chatbot-api-dev.onrender.com/webhook --scenario=escalation
```

### Available Test Scenarios
- `order-status` - Basic Lalamove order query
- `order-not-found` - Non-existent order
- `foodpanda` - Foodpanda order query
- `escalation` - Human agent request
- `malay` - Malay language query

## 🔄 Development Cycle

### 1. Feature Development
```bash
# Create feature branch
git checkout -b feature/new-feature

# Develop locally with mock services
npm run dev:mock

# Write tests
npm test -- --watch

# Test webhook integration
npm run test:webhook
```

### 2. Development Deployment
```bash
# Push to GitHub
git add .
git commit -m "feat: add new feature"
git push origin feature/new-feature

# Render auto-deploys from GitHub
# Monitor deployment in Render dashboard
```

### 3. Integration Testing
```bash
# Test against development Render services
WEBHOOK_URL=https://beep-chatbot-api-dev.onrender.com/webhook npm run test:webhook

# Monitor logs in Render
# Check database for results
```

### 4. Debugging
```bash
# Enable debug logging
LOG_LEVEL=debug npm run dev

# Check Render logs
# API logs: beep-chatbot-api-dev → Logs
# Worker logs: beep-chatbot-worker-dev → Logs

# Query development database
psql $DATABASE_URL
```

## 🛠️ Common Development Tasks

### Adding New API Integration
1. Create mock response in `scripts/mock-api-server.js`
2. Implement client in `lib/delivery-client.js`
3. Test locally with mock server
4. Add integration tests
5. Deploy to development Render
6. Test with real(ish) data

### Modifying Webhook Handler
1. Update handler in `app.js`
2. Test with local webhook tester
3. Deploy to development
4. Update Intercom webhook URL if needed
5. Test with Intercom test conversations

### Database Schema Changes
1. Create migration in `migrations/`
2. Test migration locally
3. Run migration on development database
4. Update models and queries
5. Test all affected features

## 📊 Development Monitoring

### Check Service Health
```bash
# API health
curl https://beep-chatbot-api-dev.onrender.com/health

# Check metrics
curl https://beep-chatbot-api-dev.onrender.com/metrics
```

### Database Queries
```sql
-- Recent order lookups
SELECT * FROM order_lookups 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;

-- Bot performance
SELECT * FROM hourly_metrics 
ORDER BY hour DESC 
LIMIT 24;

-- Error tracking
SELECT * FROM error_logs 
WHERE created_at > NOW() - INTERVAL '1 day'
ORDER BY created_at DESC;
```

### Redis Monitoring
```bash
# Connect to Redis CLI (if available)
redis-cli -u $REDIS_URL

# Check queue depth
LLEN bull:order-status-queue:waiting

# Check processing jobs
ZCARD bull:order-status-queue:active
```

## 🚀 Moving to Production

### When You're Ready
After thorough testing in development:

1. **Document What Works**
   - API configurations
   - Webhook settings
   - Performance benchmarks
   - Known issues and solutions

2. **Create Production Services**
   - Remove `-dev` suffix
   - Use paid tiers
   - Production database
   - Production Intercom workspace

3. **Migration Checklist**
   - [ ] All tests passing
   - [ ] Performance acceptable
   - [ ] Error rates < 5%
   - [ ] Documentation complete
   - [ ] Runbooks created

## 💡 Development Tips

### Free Tier Optimization
- Services sleep is normal - don't panic
- Use health checks to wake services
- Batch tests to avoid multiple wake-ups
- Monitor logs even when sleeping

### Cost Management
- Development environment: $0
- Test everything in dev first
- Only move to production when ready
- Start with minimum paid tiers

### Best Practices
- Always test webhooks with script first
- Check logs before assuming failure
- Use mock services for rapid development
- Keep development and production separate

## 🆘 Getting Help

### Debugging Checklist
1. Check service is awake (health endpoint)
2. Verify environment variables
3. Check logs in Render dashboard
4. Test with webhook script
5. Verify database connectivity
6. Check Redis connection

### Common Solutions
- **Slow first response**: Normal for free tier
- **Webhook fails**: Check signature and URL
- **Database errors**: Verify connection string
- **Redis timeout**: Use internal URL

### Support Resources
- Check logs first
- Review error messages
- Test with simpler scenarios
- Consult documentation

---

Remember: This is your safe development space. Break things, learn, and iterate quickly. Everything here is designed to let you experiment without risk!