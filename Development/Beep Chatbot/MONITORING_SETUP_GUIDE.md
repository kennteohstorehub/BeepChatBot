# Monitoring Setup Guide (Optional)

This guide covers optional monitoring services for production environments. These are **NOT required** for development.

## 🎯 Why Monitoring?

In production, monitoring helps you:
- Track errors before users report them
- Monitor performance and response times
- Get alerts for critical issues
- Analyze usage patterns

## 🛡️ Sentry (Error Tracking)

### Development Setup (Optional)
1. Go to https://sentry.io
2. Create free account (50K events/month)
3. Create new project:
   - Platform: Node.js
   - Project name: `beep-chatbot-dev`
4. Copy DSN from project settings
5. Add to `.env`:
   ```env
   SENTRY_DSN=https://xxx@o123456.ingest.sentry.io/789012
   ```

### What It Monitors
- Uncaught exceptions
- API errors
- Queue processing failures
- Performance bottlenecks

### Integration (Already in Code)
```javascript
// If SENTRY_DSN is set, errors are automatically reported
if (process.env.SENTRY_DSN) {
    Sentry.init({ dsn: process.env.SENTRY_DSN });
}
```

## 📊 Datadog (APM & Metrics)

### Development Setup (Optional)
1. Go to https://www.datadoghq.com
2. Start free trial (14 days)
3. Create API key:
   - Organization Settings → API Keys
   - Create new key: `beep-chatbot-dev`
4. Add to `.env`:
   ```env
   DATADOG_API_KEY=your_api_key_here
   ```

### What It Monitors
- Request latency
- Database query performance
- Queue depth and processing time
- Custom business metrics

## 🚀 Production Monitoring

For production, consider:

### Essential Monitoring
1. **Render Metrics** (Built-in)
   - CPU and memory usage
   - Request count and latency
   - Already included with Render

2. **Database Monitoring**
   - Neon Dashboard (included)
   - Query performance
   - Connection pool stats

### Nice to Have
1. **Sentry** - For error tracking
2. **Datadog/New Relic** - For APM
3. **Custom Dashboards** - Business metrics

## 💰 Cost Considerations

### Development (Free)
- Sentry: Free tier (5K events/month)
- Datadog: 14-day trial
- Render: Built-in metrics
- Neon: Built-in dashboard

### Production
- Sentry: ~$26/month (Team plan)
- Datadog: ~$15/host/month
- Or use Render's built-in monitoring

## 🎯 Recommendation

For development:
- Skip external monitoring initially
- Use Render's built-in logs and metrics
- Add Sentry only if debugging production issues

For production:
- Start with Sentry (error tracking)
- Add APM tool if performance becomes critical
- Use built-in tools first, upgrade as needed

## 📝 Quick Setup Priority

1. **Must Have**: None (for development)
2. **Nice to Have**: Sentry (free tier)
3. **Later**: Datadog or similar APM

Remember: You can always add monitoring later. Focus on getting the core functionality working first!