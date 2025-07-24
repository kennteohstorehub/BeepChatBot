# Render Development Deployment Guide

This guide walks you through deploying the BEEP Chatbot to Render in a **development environment** for safe experimentation.

## 🧪 Development Environment Setup

We're creating a complete development environment where you can:
- Test all features safely
- Break things without consequences
- Use free tier services
- Experiment with configurations

## 📋 Prerequisites

- GitHub repository connected to Render
- Render account (free tier is perfect for development)
- Development environment variables (placeholders are fine to start)

## 🚀 Deployment Steps

### Step 1: Manual Development Service Creation

For development, we'll create services manually to use free tier:

1. **Log in to Render Dashboard**
   - Go to https://dashboard.render.com

2. **Create Web Service (API)**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - Name: `beep-chatbot-api-dev`
     - Environment: Node
     - Build Command: `npm install`
     - Start Command: `npm start`
     - Plan: **Free**
   - Add environment variables (placeholders OK)

3. **Create Background Worker**
   - Click "New +" → "Background Worker"
   - Same repository
   - Configure:
     - Name: `beep-chatbot-worker-dev`
     - Environment: Node
     - Build Command: `npm install`
     - Start Command: `npm run start:worker`
     - Plan: **Free**
   - Use same environment variables

4. **Create Redis**
   - Click "New +" → "Redis"
   - Configure:
     - Name: `beep-redis-dev`
     - Plan: **Free** (25MB storage)
     - Region: Same as your services

### Step 2: Get Your Service URLs

After deployment completes:

1. **API Service URL**
   - Go to `beep-chatbot-api-dev` service
   - Copy the URL (e.g., `https://beep-chatbot-api-dev.onrender.com`)
   - This is your development webhook URL for Intercom

2. **Redis Connection**
   - Go to `beep-redis-dev` service
   - Copy the **Internal** Redis URL (not External)
   - Update your environment variables with this URL

⚠️ **Free Tier Behavior**: 
- Services sleep after 15 minutes of inactivity (normal for development)
- First request takes 30-60 seconds to wake up the service
- Subsequent requests are fast until next sleep cycle
- Perfect for development testing at $0 cost
- Logs persist even when services are sleeping

### Step 3: Update Environment Variables

1. Go to each service (API and Worker)
2. Navigate to "Environment" tab
3. Add these development variables:
   ```
   # Development Database (Neon)
   DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/beep-chatbot-dev
   
   # Development Redis (from Render)
   REDIS_URL=redis://red-xxx.render.com:6379
   
   # Development Intercom
   INTERCOM_ACCESS_TOKEN=<your-dev-intercom-token>
   WEBHOOK_SECRET=<from-dev-intercom-webhook>
   
   # For initial testing, you can use mock values:
   LALAMOVE_API_KEY=dev_test_key
   FOODPANDA_API_KEY=dev_test_key
   IST_API_KEY=dev_test_key
   ```

### Step 4: Configure Intercom Webhook

Now that you have your Render URL:

1. Go to your **development** Intercom workspace
2. In your development app, go to "Webhooks"
3. Create new webhook:
   - URL: `https://beep-chatbot-api-dev.onrender.com/webhook`
   - Topic: `conversation.user.replied`
4. Save and copy the webhook secret
5. Update `WEBHOOK_SECRET` in Render environment variables for both services

### Step 5: Verify Deployment

1. **Check Health Endpoint**
   ```bash
   curl https://beep-chatbot-api-dev.onrender.com/health
   ```
   
   Note: If service was sleeping, this will take 30-60 seconds
   
   Should return:
   ```json
   {
     "status": "healthy",
     "database": "connected",
     "queue": "ready",
     "timestamp": "2025-01-24T..."
   }
   ```

2. **Check Service Logs**
   - In Render Dashboard, go to each service
   - Click "Logs" tab
   - Look for startup messages

3. **Test Webhook**
   ```bash
   # Using environment variable:
   WEBHOOK_URL=https://beep-chatbot-api-dev.onrender.com/webhook npm run test:webhook
   
   # Using --url flag:
   npm run test:webhook -- --url=https://beep-chatbot-api-dev.onrender.com/webhook
   
   # Test different scenarios:
   npm run test:webhook -- --url=https://beep-chatbot-api-dev.onrender.com/webhook --scenario=order-status
   npm run test:webhook -- --url=https://beep-chatbot-api-dev.onrender.com/webhook --scenario=foodpanda
   npm run test:webhook -- --url=https://beep-chatbot-api-dev.onrender.com/webhook --scenario=order-not-found
   npm run test:webhook -- --url=https://beep-chatbot-api-dev.onrender.com/webhook --scenario=escalation
   npm run test:webhook -- --url=https://beep-chatbot-api-dev.onrender.com/webhook --scenario=malay
   ```

## 🔧 Render Configuration Details

### Service Configuration

The `render.yaml` configures:

**Web Service (API)**
- Plan: Pro (for better performance)
- Region: Singapore
- Health check: `/health`
- Auto-deploy: Enabled

**Background Worker**
- Plan: Pro
- Region: Singapore
- Same environment as API

**Redis**
- Plan: Pro
- Region: Singapore
- Persistent storage

### Environment Groups

**beep-secrets** (Sensitive):
- DATABASE_URL
- INTERCOM_ACCESS_TOKEN
- WEBHOOK_SECRET
- API keys for Lalamove, Foodpanda, IST

**beep-config** (Non-sensitive):
- Service IDs
- API URLs
- Feature flags
- Performance settings

## 📊 Monitoring on Render

### View Logs
- Real-time logs for each service
- Filter by timestamp or search
- Download logs for analysis

### Metrics
- CPU and Memory usage
- Request count and latency
- Background job processing

### Alerts
Set up alerts in Render for:
- Service failures
- High error rates
- Performance degradation

## 🚨 Troubleshooting

### Common Issues

1. **Service Takes Long to Respond (Free Tier)**
   - This is normal! Services sleep after 15 minutes
   - First request takes 30-60 seconds to wake up
   - Solution: Just wait, or upgrade to paid tier later

2. **Database Connection Failed**
   - Check DATABASE_URL format
   - Ensure database name ends with `-dev`
   - Verify SSL mode is correct: `?sslmode=require`
   - Check Neon project is active

3. **Redis Connection Failed**
   - Use Internal Redis URL (not External)
   - Format: `redis://red-xxx.render.com:6379`
   - Check Redis service is running
   - No password needed for internal connections

4. **Webhook Not Working**
   - Verify webhook URL includes `api`: `beep-chatbot-api-dev`
   - Check WEBHOOK_SECRET matches exactly
   - Monitor API logs for signature verification errors
   - Test with scripts/test-webhook.js first

5. **Worker Not Processing**
   - Check worker service is running
   - Verify Redis connection in both services
   - Check for job processing errors in worker logs
   - Ensure same Redis URL in both API and Worker

### Debug Mode

To enable debug logging:
1. Go to Environment variables
2. Set `LOG_LEVEL=debug`
3. Redeploy service

## 🔄 Updating Your Deployment

### Automatic Deploys
With auto-deploy enabled:
1. Push changes to GitHub main branch
2. Render automatically rebuilds and deploys

### Manual Deploy
1. Go to service in Render
2. Click "Manual Deploy"
3. Select "Deploy latest commit"

### Rollback
If something goes wrong:
1. Go to service "Events" tab
2. Find previous successful deploy
3. Click "Rollback to this deploy"

## 🧪 Development vs Production

### Development Environment (Current Setup)
- **Services**: All with `-dev` suffix
- **Plans**: Free tier (perfect for testing)
- **Database**: Neon free tier (beep-chatbot-dev)
- **Redis**: Render free tier (25MB)
- **Behavior**: Services sleep after 15 min
- **Cost**: $0 - completely free!

### Production Environment (Future)
- **Services**: Remove `-dev` suffix
- **Plans**: Upgrade to Pro/Starter
- **Database**: Neon Pro (beep-chatbot-prod)
- **Redis**: Render Starter/Pro
- **Behavior**: Always-on services
- **Cost**: Based on usage

### Migration Checklist
When ready to move to production:
- [ ] Test thoroughly in development
- [ ] Document all working configurations
- [ ] Create new production services
- [ ] Use production Intercom workspace
- [ ] Update all API credentials
- [ ] Set up monitoring and alerts

## 💰 Cost Optimization

### Development Phase (Current)
- **Total Cost**: $0
- Use free tiers for everything
- Perfect for testing and experimentation
- Sleep behavior is acceptable

### Production Phase (Future)
- Start with Starter plans
- Scale up based on actual usage
- Consider Reserved Instances for savings
- Monitor usage to optimize resources

## 🔗 Useful Links

- [Render Documentation](https://render.com/docs)
- [Render Status Page](https://status.render.com)
- [Render CLI](https://render.com/docs/cli)
- [Blueprint Specification](https://render.com/docs/blueprint-spec)

---

Remember to keep your environment variables secure and regularly monitor your services for optimal performance!