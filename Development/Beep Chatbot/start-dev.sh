#!/bin/bash
# Start development services

echo "Starting BEEP Chatbot Development Environment..."

# Start mock API server
echo "Starting Mock API Server..."
node scripts/mock-server.js &
MOCK_PID=$!

# Wait for mock server to start
sleep 2

# Start main app
echo "Starting Webhook Handler..."
node app.js &
APP_PID=$!

# Start worker
echo "Starting Background Worker..."
node worker.js &
WORKER_PID=$!

echo ""
echo "✅ All services started!"
echo "   Mock API: http://localhost:4000"
echo "   Webhook:  http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for Ctrl+C
trap "kill $MOCK_PID $APP_PID $WORKER_PID; exit" INT
wait