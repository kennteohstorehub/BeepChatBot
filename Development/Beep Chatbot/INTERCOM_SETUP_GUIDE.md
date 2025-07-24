# Intercom Setup Guide for BEEP Chatbot

This guide walks you through all the steps needed to set up Intercom and other services for the BEEP Chatbot.

## 📋 Prerequisites Checklist

### Intercom Setup Tasks

#### 1. Create Intercom Developer App
- [ ] Go to https://app.intercom.com/a/apps/YOUR_APP_ID/developer-hub
- [ ] Click "New app" 
- [ ] Name it: "BEEP Order Status Bot"
- [ ] Choose "Private app" (for internal use only)
- [ ] Save the app

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

#### 3. Configure Webhook
- [ ] In your developer app, go to "Webhooks"
- [ ] Click "New webhook"
- [ ] Set webhook URL:
  - Development: `https://YOUR-NGROK-URL.ngrok.io/webhook`
  - Production: `https://YOUR-APP.onrender.com/webhook`
- [ ] Select topic: `conversation.user.replied`
- [ ] Save webhook
- [ ] Copy the webhook secret → Save as `WEBHOOK_SECRET`

#### 4. Create Bot Admin User
- [ ] Go to Settings → Teammates
- [ ] Create new teammate:
  - Name: "BEEP Bot"
  - Email: bot@yourdomain.com
  - Role: Admin (or custom role with conversation access)
- [ ] Get the admin ID from the teammate's URL or API
- [ ] Save as `INTERCOM_BOT_ADMIN_ID`

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

### Infrastructure Setup

#### 10. Neon PostgreSQL Database
- [ ] Go to https://neon.tech
- [ ] Create new project: "beep-chatbot"
- [ ] Choose region: Singapore (or closest)
- [ ] Copy connection string → Save as `DATABASE_URL`
- [ ] Enable connection pooling

#### 11. Redis Setup (Choose one)

**Option A: Render Redis**
- [ ] Go to https://render.com
- [ ] Create new Redis instance
- [ ] Choose plan: Starter or Pro
- [ ] Region: Singapore
- [ ] Copy Redis URL → Save as `REDIS_URL`

**Option B: Upstash Redis**
- [ ] Go to https://upstash.com
- [ ] Create new Redis database
- [ ] Region: ap-southeast-1 (Singapore)
- [ ] Copy Redis URL → Save as `REDIS_URL`

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

# Database
DATABASE_URL=postgresql://user:password@ep-xxx.ap-southeast-1.aws.neon.tech/beep-chatbot?sslmode=require

# Redis
REDIS_URL=redis://default:password@redis.render.com:6379

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

## 🧪 Testing Webhook Locally

### 1. Install ngrok
```bash
brew install ngrok  # macOS
# or download from https://ngrok.com
```

### 2. Start ngrok tunnel
```bash
ngrok http 3000
```

### 3. Update Intercom webhook URL
- Copy ngrok URL (e.g., https://abc123.ngrok.io)
- Update webhook in Intercom to: https://abc123.ngrok.io/webhook

### 4. Test webhook
```bash
npm run test:webhook
```

## 🚀 Production Deployment

### Render.com Setup
1. Connect GitHub repository
2. Create Web Service for API
3. Create Background Worker for queue processor
4. Add environment variables from .env
5. Deploy!

### Verify Deployment
- [ ] Health check: https://your-app.onrender.com/health
- [ ] Update Intercom webhook URL to production URL
- [ ] Send test message in Intercom
- [ ] Monitor logs for processing

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

---

Remember to keep all credentials secure and never commit them to version control!