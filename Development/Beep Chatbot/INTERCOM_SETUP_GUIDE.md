# Intercom Setup Guide for BEEP Chatbot (Development Environment)

This guide walks you through setting up the BEEP Chatbot in a **development workspace** where you can safely experiment before moving to production.

⚠️ **Important**: We're setting everything up in a development environment first:
- Development Intercom workspace
- Development Render services  
- Development Neon PostgreSQL database
- This is a safe space to test and experiment!

## 📋 Prerequisites Checklist

### Intercom Setup Tasks

#### 1. Create Intercom Developer App (Development)
- [ ] Go to your **development** Intercom workspace
- [ ] Navigate to https://app.intercom.com/a/apps/YOUR_DEV_APP_ID/developer-hub
- [ ] Click "New app" 
- [ ] Name it: "BEEP Bot - Development"
- [ ] Choose "Private app" (for internal testing)
- [ ] Save the app
- [ ] Note: This is separate from production - safe to experiment!

#### 2. Get OAuth Access Token
- [ ] In your developer app, go to "Authentication"
- [ ] Click "Generate access token"
- [ ] Select these permissions:
  - ✅ Read conversations
  - ✅ Write conversations
  - ✅ Read admins
  - ✅ Write tags
  - ✅ Read teams
- [ ] Copy the token → Save as `INTERCOM_ACCESS_TOKEN`

#### 3. Configure Webhook (After Render Deployment)
- [ ] First deploy to Render development environment (see below)
- [ ] In your developer app, go to "Webhooks"
- [ ] Click "New webhook"
- [ ] Set webhook URL: `https://beep-chatbot-api-dev.onrender.com/webhook`
  - Note: We'll use `-dev` suffix for all development services
  - Important: Include `api` in the URL: `beep-chatbot-api-dev`
- [ ] Select topic: `conversation.user.replied`
- [ ] Save webhook
- [ ] Copy the webhook secret → Save as `WEBHOOK_SECRET`

#### 4. Create Bot Admin User (Development)
- [ ] Go to Settings → Teammates
- [ ] Create new teammate:
  - Name: "BEEP Bot (Dev)"
  - Email: bot-dev@yourdomain.com
  - Role: Admin (or custom role with conversation access)
- [ ] Get the admin ID from the teammate's URL or API
- [ ] Save as `INTERCOM_BOT_ADMIN_ID`
- [ ] This bot is only for development testing

#### 5. Get Support Team ID
- [ ] Go to Settings → Teams
- [ ] Find or create "Support Team"
- [ ] Get team ID from URL: `teams/TEAM_ID/details`
- [ ] Save as `SUPPORT_TEAM_ID`

#### 6. Create Required Tags
Create these tags in Settings → Tags:
- [ ] `bot-escalation`
- [ ] `order-not-found`
- [ ] `api-error`
- [ ] `complex-query`
- [ ] `requires-human`
- [ ] `bot-error`

### External API Credentials

#### 7. Lalamove API Setup
- [ ] Go to https://developers.lalamove.com
- [ ] Register for partner account
- [ ] Get credentials:
  - API Key → Save as `LALAMOVE_API_KEY`
  - API Secret → Save as `LALAMOVE_API_SECRET`
- [ ] Verify market access for Malaysia (MY)

#### 8. Foodpanda API Setup
- [ ] Contact Foodpanda partner support
- [ ] Request API access for order tracking
- [ ] Get API Key → Save as `FOODPANDA_API_KEY`
- [ ] Confirm API URL → Save as `FOODPANDA_API_URL`

#### 9. IST (Internal Service Tool) API
- [ ] Contact StoreHub internal team
- [ ] Request IST API access
- [ ] Get JWT token → Save as `IST_API_KEY`
- [ ] Confirm API URL → Save as `IST_API_URL`

### Infrastructure Setup (Development Environment)

#### 10. Neon PostgreSQL Database (Development) ✅ COMPLETED
- [x] Created Neon project: "BeepChatBot"
- [x] Region: Singapore (ap-southeast-1)
- [x] Database name: neondb
- [x] Using pooled connection string
- [x] DATABASE_URL configured in Render
- [x] Free tier: 0.5 GB storage

#### 11. Redis Setup ✅ COMPLETED
- [x] Using Upstash Redis (Render doesn't offer free Redis)
- [x] Created database: "beep-redis-dev"
- [x] Region: Asia Pacific (Singapore)
- [x] Endpoint: maximum-grub-60807.upstash.io:6379
- [x] Using rediss:// for TLS connection
- [x] REDIS_URL configured in Render
- [x] Free tier: 10,000 commands/day

## 🔧 Local Development Setup

### 1. Clone and Install
```bash
git clone https://github.com/kennteohstorehub/BeepChatBot.git
cd BeepChatBot
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with all the values collected above
```

### 3. Your .env should look like:
```env
# Node Environment
NODE_ENV=development
PORT=3000
LOG_LEVEL=info

# Database (Development)
DATABASE_URL=postgresql://user:password@ep-xxx.ap-southeast-1.aws.neon.tech/beep-chatbot-dev?sslmode=require

# Redis (Development - Render Internal URL)
REDIS_URL=redis://red-xxx.render.com:6379

# Intercom Configuration
INTERCOM_ACCESS_TOKEN=dG9rOmFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6...
INTERCOM_BOT_ADMIN_ID=6789012
WEBHOOK_SECRET=abc123def456...
SUPPORT_TEAM_ID=3456789

# Lalamove API
LALAMOVE_API_KEY=your_actual_key_here
LALAMOVE_API_SECRET=your_actual_secret_here

# Foodpanda API
FOODPANDA_API_URL=https://api.foodpanda.my
FOODPANDA_API_KEY=your_actual_key_here

# Internal APIs
IST_API_URL=https://api.storehub.com
IST_API_KEY=your_actual_jwt_token_here

# Feature Flags
ENABLE_LALAMOVE=true
ENABLE_FOODPANDA=true
ENABLE_CACHE=true
CACHE_TTL_SECONDS=300
```

### 4. Setup Database
```bash
npm run migrate
```

### 5. Start Development
```bash
npm run dev:all
```

## 🚀 Development Deployment to Render

We'll deploy everything to a development environment first - this is your safe space to experiment!

### 1. Initial Render Development Deployment ✅ COMPLETED

#### Web Service Created:
- [x] Service Name: BeepChatBot
- [x] Service ID: srv-d20t6695pdvs739e186g
- [x] Build Command: `npm install`
- [x] Start Command: `npm start`
- [x] Region: Singapore
- [x] Plan: Free tier
- [x] All environment variables configured
- [x] Currently deployed and running

#### Still Need to Create:
- [ ] Background Worker Service:
   - Name: `beep-chatbot-worker-dev`
   - Build Command: `npm install`
   - Start Command: `npm run start:worker`
   - Plan: **Free**
   - Same environment variables as API

⚠️ **Development Notes**: 
- Free tier services sleep after 15 minutes of inactivity - that's normal!
- First request after sleep takes 30-60 seconds to wake up
- This is perfect for development testing and costs $0
- Logs are retained even when services sleep

### 2. Get Your Development URLs ✅ COMPLETED
Your deployed service URLs:
- API URL: `https://beepchatbot-development.onrender.com`
- Webhook URL: `https://beepchatbot-development.onrender.com/webhook`
- Health Check: `https://beepchatbot-development.onrender.com/health`

### 3. Configure Webhook with Development URL
Now go back to your development Intercom workspace and set the webhook URL.

## 🧪 Testing Your Deployment

### Test Webhook on Render
Once deployed to Render:

1. **Check Health Endpoint**
   ```bash
   curl https://beepchatbot-development.onrender.com/health
   ```
   Note: First request might take 30-60 seconds if service was sleeping

2. **Test Webhook Directly**
   ```bash
   # Update WEBHOOK_URL to your development Render URL
   WEBHOOK_URL=https://beep-chatbot-api-dev.onrender.com/webhook npm run test:webhook
   
   # Or use the --url flag:
   npm run test:webhook -- --url=https://beep-chatbot-api-dev.onrender.com/webhook
   
   # Test different scenarios:
   npm run test:webhook -- --url=https://beep-chatbot-api-dev.onrender.com/webhook --scenario=foodpanda
   npm run test:webhook -- --url=https://beep-chatbot-api-dev.onrender.com/webhook --scenario=order-not-found
   ```

3. **Monitor Logs in Render**
   - Go to your service in Render Dashboard
   - Click on "Logs" tab
   - Watch for incoming webhook events

### Verify Deployment
- [ ] Health check returns healthy status
- [ ] Webhook test receives 200 OK response
- [ ] Logs show webhook processing
- [ ] Worker logs show job processing

## 📊 Post-Setup Verification

### Test Order Status Query
1. Start a conversation in Intercom
2. Send: "Where is my order LM12345678?"
3. Bot should respond with order status or create ticket

### Check Database
```sql
-- Check recent lookups
SELECT * FROM order_lookups ORDER BY created_at DESC LIMIT 10;

-- Check bot interactions
SELECT * FROM bot_interactions ORDER BY created_at DESC LIMIT 10;
```

### Monitor Performance
```sql
-- View hourly metrics
SELECT * FROM hourly_metrics ORDER BY hour DESC LIMIT 24;
```

## 🔍 Troubleshooting

### Webhook Not Receiving Events
1. Check webhook URL in Intercom
2. Verify webhook secret matches
3. Check ngrok tunnel is running (for local)
4. Monitor app logs

### Authentication Errors
1. Verify access token has correct permissions
2. Check token hasn't expired
3. Ensure bot admin ID is correct

### API Connection Issues
1. Verify all API credentials
2. Check API endpoints are correct
3. Monitor rate limits
4. Check circuit breaker status in logs

## 📞 Support Contacts

- **Intercom Support**: https://www.intercom.com/help
- **Lalamove API**: developers@lalamove.com
- **Neon Support**: https://neon.tech/docs
- **Render Support**: https://render.com/docs

## 🚀 Moving to Production (After Development Testing)

Once you've tested everything in the development environment and are ready for production:

### Production Deployment Steps
1. **Create Production Services**:
   - New Neon project: "beep-chatbot-prod"
   - New Render services without "-dev" suffix
   - Upgrade to paid plans for always-on service

2. **Production Intercom Setup**:
   - Use production Intercom workspace
   - Create new production app
   - Generate production credentials

3. **Environment Separation**:
   - Development: beep-chatbot-api-dev.onrender.com
   - Production: beep-chatbot-api.onrender.com
   - Never mix credentials between environments!

4. **Database Migration**:
   - Export any test data worth keeping
   - Set up fresh production database
   - Run migrations on production

---

Remember:
- 🧪 **Development First**: Test everything in dev environment
- 🔐 **Keep Credentials Separate**: Dev and prod credentials should never mix
- 📝 **Document Changes**: Track what works in dev before moving to prod
- 🎯 **Safe to Experiment**: Break things in dev, not in prod!