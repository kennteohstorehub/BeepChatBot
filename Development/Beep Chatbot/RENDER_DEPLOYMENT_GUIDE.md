# Render Deployment Guide

This guide walks you through deploying the BEEP Chatbot to Render.

## 📋 Prerequisites

- GitHub repository connected to Render
- Render account (free tier works for testing)
- Environment variables ready (can use placeholders initially)

## 🚀 Deployment Steps

### Step 1: Create Render Blueprint

The repository includes a `render.yaml` file that defines all services:
- Web Service (API)
- Background Worker 
- Redis instance

To deploy:

1. **Log in to Render Dashboard**
   - Go to https://dashboard.render.com

2. **Create New Blueprint**
   - Click "New +" → "Blueprint"
   - Connect your GitHub account if not connected
   - Select the `BeepChatBot` repository
   - Render will detect the `render.yaml` file

3. **Configure Environment Groups**
   - You'll see two environment groups:
     - `beep-secrets` - For sensitive credentials
     - `beep-config` - For non-sensitive config
   - Fill in the values or use placeholders for now

4. **Deploy**
   - Click "Apply" to create all services
   - Render will create:
     - `beep-chatbot-api` (Web Service)
     - `beep-chatbot-worker` (Background Worker)
     - `beep-redis` (Redis instance)

### Step 2: Get Your Service URLs

After deployment completes:

1. **API Service URL**
   - Go to `beep-chatbot-api` service
   - Copy the URL (e.g., `https://beep-chatbot-api.onrender.com`)
   - This is your webhook URL for Intercom

2. **Redis Connection**
   - Go to `beep-redis` service
   - Copy the Internal Redis URL
   - Update your environment variables with this URL

### Step 3: Update Environment Variables

1. Go to each service (API and Worker)
2. Navigate to "Environment" tab
3. Update these critical variables:
   ```
   DATABASE_URL=<your-neon-postgresql-url>
   REDIS_URL=<internal-redis-url-from-render>
   INTERCOM_ACCESS_TOKEN=<your-intercom-token>
   WEBHOOK_SECRET=<from-intercom-webhook-setup>
   ```

### Step 4: Configure Intercom Webhook

Now that you have your Render URL:

1. Go to Intercom Developer Hub
2. In your app, go to "Webhooks"
3. Create new webhook:
   - URL: `https://beep-chatbot-api.onrender.com/webhook`
   - Topic: `conversation.user.replied`
4. Save and copy the webhook secret
5. Update `WEBHOOK_SECRET` in Render environment variables

### Step 5: Verify Deployment

1. **Check Health Endpoint**
   ```bash
   curl https://beep-chatbot-api.onrender.com/health
   ```
   
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
   WEBHOOK_URL=https://beep-chatbot-api.onrender.com/webhook npm run test:webhook
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

1. **Database Connection Failed**
   - Check DATABASE_URL format
   - Ensure Neon allows Render IPs
   - Verify SSL mode is correct

2. **Redis Connection Failed**
   - Use Internal Redis URL (not External)
   - Check Redis service is running
   - Verify URL format

3. **Webhook Not Working**
   - Verify webhook URL in Intercom
   - Check WEBHOOK_SECRET matches
   - Monitor API logs for errors

4. **Worker Not Processing**
   - Check worker service is running
   - Verify Redis connection
   - Check for job processing errors

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

## 💰 Cost Optimization

### Free Tier Limitations
- Services spin down after 15 minutes of inactivity
- Limited to 750 hours/month
- First request after spin-down is slow

### Recommended for Production
- Use Render Pro for always-on services
- Consider Reserved Instances for cost savings
- Monitor usage to optimize resources

## 🔗 Useful Links

- [Render Documentation](https://render.com/docs)
- [Render Status Page](https://status.render.com)
- [Render CLI](https://render.com/docs/cli)
- [Blueprint Specification](https://render.com/docs/blueprint-spec)

---

Remember to keep your environment variables secure and regularly monitor your services for optimal performance!