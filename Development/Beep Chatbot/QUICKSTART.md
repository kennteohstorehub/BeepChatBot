# Quick Start Guide

## 🚀 For Development (No Real APIs Needed)

If you want to test the bot without setting up all the external services:

```bash
# 1. Install dependencies
npm install

# 2. Use development environment
cp .env.development .env

# 3. Start mock services and bot
npm run dev:mock
```

This will start:
- Mock API server on port 4000 (simulates Lalamove, Foodpanda, IST)
- Webhook handler on port 3000
- Background worker for processing

### Test the bot locally:
```bash
# In another terminal, test with mock order
npm run test:webhook -- --scenario=order-status

# Or test with a specific URL:
npm run test:webhook -- --url=http://localhost:3000/webhook --scenario=order-status
```

## 📋 For Development Setup (Safe Environment)

We're setting everything up in a **development environment first** - this is your safe space to experiment!

### 1. Development Infrastructure Setup

Create your development services:

- [ ] **Neon PostgreSQL** 
  - Create project: "beep-chatbot-dev"
  - Free tier is perfect
  - https://neon.tech
  
- [ ] **Render Services**
  - Create manually (not Blueprint)
  - Use FREE tier for all:
    - beep-chatbot-api-dev
    - beep-chatbot-worker-dev
    - beep-redis-dev

### 2. Development Intercom Setup

In your development Intercom workspace:

- [ ] Create Developer App named "BEEP Bot - Development"
- [ ] Generate OAuth Access Token
- [ ] Create Bot Admin User "BEEP Bot (Dev)"
- [ ] Get Support Team ID
- [ ] Create required tags

### 3. Deploy and Configure

```bash
# 1. Deploy to Render FIRST
# Create services manually in Render Dashboard
# All with -dev suffix, all FREE tier

# 2. Get your development URLs:
# API: https://beep-chatbot-api-dev.onrender.com
# This is your webhook URL

# 3. Configure Intercom webhook
# Use your development Render URL

# 4. Update environment variables in Render
# Can use mock API keys initially
```

### 4. Test Your Development Setup

```bash
# Test webhook (service might need to wake up first - 30-60 seconds)
WEBHOOK_URL=https://beep-chatbot-api-dev.onrender.com/webhook npm run test:webhook

# Or use the --url flag:
npm run test:webhook -- --url=https://beep-chatbot-api-dev.onrender.com/webhook

# Test different scenarios:
npm run test:webhook -- --url=https://beep-chatbot-api-dev.onrender.com/webhook --scenario=foodpanda
npm run test:webhook -- --url=https://beep-chatbot-api-dev.onrender.com/webhook --scenario=escalation
```

## 🚀 Moving to Production (Later)

Once everything works in development:
1. Create new production services (without -dev suffix)
2. Use production Intercom workspace
3. Upgrade to paid Render plans
4. Use real API credentials

## 🧪 Testing Order Queries

### With Mock Server (Local Development):
```bash
# These orders are available in mock mode:
- LM12345678    # Lalamove order (picked up)
- FP1234567890  # Foodpanda order (picked up)  
- BEP88888888   # Internal order
```

### With Development Render:
Once deployed to Render development environment:
1. Free tier services sleep after 15 minutes - first request takes 30-60 seconds
2. Use the test:webhook script to send test payloads
3. Monitor logs in Render dashboard for debugging

### Test Scenarios:
```bash
# Order found
npm run test:webhook -- --scenario=order-status

# Order not found  
npm run test:webhook -- --scenario=order-not-found

# Foodpanda order
npm run test:webhook -- --scenario=foodpanda

# Request human agent
npm run test:webhook -- --scenario=escalation

# Malay language
npm run test:webhook -- --scenario=malay
```

## 📊 Monitoring

Check the application health:
```bash
curl http://localhost:3000/health
```

View logs:
- API logs: `combined.log`
- Worker logs: `worker-combined.log`
- Error logs: `error.log`, `worker-error.log`

## 🆘 Need Help?

1. Check `INTERCOM_SETUP_GUIDE.md` for detailed setup
2. Review logs for error messages
3. Verify all environment variables are set
4. Ensure all services are running

## 🎯 Next Steps

Once local development is working:

1. Deploy to Render.com
2. Update Intercom webhook to production URL
3. Test with real orders
4. Monitor performance metrics