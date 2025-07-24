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
```

## 📋 For Production Setup

Follow these steps in order:

### 1. Intercom Configuration Checklist

Run the setup helper:
```bash
npm run setup
```

Or manually configure these in Intercom:

- [ ] Create Developer App in Intercom
- [ ] Generate OAuth Access Token with required permissions
- [ ] Set up Webhook with topic `conversation.user.replied`
- [ ] Create Bot Admin User
- [ ] Get Support Team ID
- [ ] Create required tags

### 2. External Services

You'll need accounts and API credentials for:

- [ ] **Neon PostgreSQL** - https://neon.tech
- [ ] **Redis** - Render or Upstash
- [ ] **Lalamove API** - Partner account required
- [ ] **Foodpanda API** - Contact partner support
- [ ] **IST API** - Internal StoreHub service

### 3. Deploy to Render First

Since you're using Render, you need to deploy before setting up Intercom webhooks:

```bash
# 1. Configure your .env with real credentials
npm run setup

# 2. Deploy to Render
# Option A: Use Render Dashboard to create Blueprint from your repo
# Option B: Use Render CLI
# The render.yaml file is already configured in the repo

# 3. After deployment, get your Render URL:
# https://beep-chatbot-api.onrender.com

# 4. Configure Intercom webhook with Render URL
# Go to Intercom Developer Hub and set webhook URL
```

## 🧪 Testing Order Queries

### With Mock Server:
```bash
# These orders are available in mock mode:
- LM12345678    # Lalamove order (picked up)
- FP1234567890  # Foodpanda order (picked up)  
- BEP88888888   # Internal order
```

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