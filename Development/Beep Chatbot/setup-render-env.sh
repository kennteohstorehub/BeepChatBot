#!/bin/bash
# Script to set up Render environment variables
# Run this script locally with your Render CLI

SERVICE_ID="srv-d20t6695pdvs739e186g"

echo "Setting up environment variables for BeepChatBot..."

# Add all environment variables
render env:set NODE_ENV=development --service $SERVICE_ID
render env:set PORT=3000 --service $SERVICE_ID
render env:set LOG_LEVEL=info --service $SERVICE_ID

# Database and Redis (placeholders - update these)
render env:set DATABASE_URL=postgresql://user:pass@host/dbname --service $SERVICE_ID
render env:set REDIS_URL=redis://localhost:6379 --service $SERVICE_ID

# Intercom (placeholders - update these)
render env:set INTERCOM_ACCESS_TOKEN=your_token_here --service $SERVICE_ID
render env:set INTERCOM_BOT_ADMIN_ID=12345 --service $SERVICE_ID
render env:set WEBHOOK_SECRET=your_secret_here --service $SERVICE_ID
render env:set SUPPORT_TEAM_ID=67890 --service $SERVICE_ID

# API Keys (development values)
render env:set LALAMOVE_API_KEY=dev_test_key --service $SERVICE_ID
render env:set LALAMOVE_API_SECRET=dev_test_secret --service $SERVICE_ID
render env:set FOODPANDA_API_URL=https://api.foodpanda.my --service $SERVICE_ID
render env:set FOODPANDA_API_KEY=dev_test_key --service $SERVICE_ID
render env:set IST_API_URL=https://api.storehub.com --service $SERVICE_ID
render env:set IST_API_KEY=dev_test_key --service $SERVICE_ID

# Feature flags
render env:set ENABLE_LALAMOVE=true --service $SERVICE_ID
render env:set ENABLE_FOODPANDA=true --service $SERVICE_ID
render env:set ENABLE_CACHE=true --service $SERVICE_ID
render env:set CACHE_TTL_SECONDS=300 --service $SERVICE_ID
render env:set MAX_CONCURRENT_JOBS=10 --service $SERVICE_ID
render env:set JOB_TIMEOUT_MS=30000 --service $SERVICE_ID
render env:set API_TIMEOUT_MS=5000 --service $SERVICE_ID

echo "✅ Environment variables set successfully!"
echo "Note: You'll need to update DATABASE_URL, REDIS_URL, and INTERCOM variables with real values"