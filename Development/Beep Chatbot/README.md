# BEEP Intercom Chatbot

An intelligent chatbot for Intercom that automates customer order status inquiries for StoreHub's BEEP delivery platform. The bot integrates with multiple delivery partners (Lalamove, Foodpanda) to provide real-time order tracking information.

## 🚀 Features

- **Automated Order Status Queries**: Handles "Where is my order?" inquiries automatically
- **Multi-Platform Support**: Integrates with Lalamove, Foodpanda, and internal IST system
- **Smart Order Detection**: Extracts order numbers from natural language queries
- **Real-time Tracking**: Provides live order status with driver information and ETAs
- **Intelligent Escalation**: Automatically escalates complex issues to human agents
- **Response Caching**: Reduces API calls with smart caching (5-minute TTL)
- **Multi-language Ready**: Supports English, with Malay and Chinese coming soon

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL database (Neon recommended)
- Redis instance (for queuing and caching)
- Intercom workspace with admin access
- API credentials for delivery partners

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/kennteohstorehub/BeepChatBot.git
   cd BeepChatBot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your actual credentials

4. **Set up the database**
   ```bash
   npm run migrate
   ```

5. **Configure Intercom webhook**
   - Go to Intercom Developer Hub
   - Create a new app or use existing
   - Set webhook endpoint to: `https://your-domain.com/webhook`
   - Subscribe to `conversation.user.replied` topic
   - Copy the webhook secret to your `.env`

## 🏃‍♂️ Running the Application

### Development Mode
```bash
# Run both API and worker with hot reload
npm run dev:all

# Or run separately:
npm run dev          # API only
npm run dev:worker   # Worker only
```

### Production Mode
```bash
# Run both services
npm run start:all

# Or run separately:
npm start            # API only
npm run start:worker # Worker only
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Test webhook endpoint
npm run test:webhook
```

## 📁 Project Structure

```
beep-chatbot/
├── app.js                  # Main webhook handler
├── worker.js              # Background job processor
├── lib/
│   ├── delivery-client.js # Multi-platform API client
│   ├── intercom-client.js # Intercom API wrapper
│   ├── order-processor.js # Order extraction logic
│   └── redis-client.js    # Redis connection
├── scripts/
│   ├── migrate.js         # Database migration
│   └── schema.sql         # Database schema
├── tests/                 # Test suites
├── .env.example          # Environment template
└── README.md             # This file
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `REDIS_URL` | Redis connection string | Yes |
| `INTERCOM_ACCESS_TOKEN` | Intercom OAuth token | Yes |
| `WEBHOOK_SECRET` | Webhook signature secret | Yes |
| `LALAMOVE_API_KEY` | Lalamove API credentials | Yes* |
| `FOODPANDA_API_KEY` | Foodpanda API key | Yes* |
| `IST_API_KEY` | Internal service API key | Yes |

*Required only if platform is enabled

### Feature Flags

- `ENABLE_LALAMOVE`: Enable/disable Lalamove integration
- `ENABLE_FOODPANDA`: Enable/disable Foodpanda integration  
- `ENABLE_CACHE`: Enable/disable response caching
- `CACHE_TTL_SECONDS`: Cache time-to-live (default: 300)

## 📊 Monitoring

### Health Check
```bash
GET /health
```

### Key Metrics
- Response time by platform
- Cache hit rate
- Error rates
- Escalation rates

### Database Views
- `hourly_metrics`: Hourly performance metrics
- `daily_platform_stats`: Platform-specific daily stats

## 🚀 Deployment

### Render.com

1. Connect your GitHub repository
2. Use the provided `render.yaml` configuration
3. Set environment variables in Render dashboard
4. Deploy!

### Manual Deployment

1. Set up PostgreSQL database
2. Set up Redis instance
3. Configure environment variables
4. Run database migrations
5. Start both services (API + Worker)
6. Configure Intercom webhook URL

## 🤝 Bot Responses

### Success Response
```
📦 I found your Lalamove order!

**Status**: Your order has been picked up and is on the way
🚗 **Driver**: Ahmad Rahman
📞 **Contact**: +60123456789
⏱️ **Estimated arrival**: 2:45 PM (in 15 minutes)

🔗 [Track your order live](https://track.lalamove.com/LM12345678)

🎉 Great news! Your order is on the way!
```

### Order Not Found
```
I couldn't find order LM12345678 in our system. This could mean:

• The order number might be incorrect
• The order is still being processed
• It's from a different platform

I'm creating a support ticket for you, and our team will look into this right away.
```

## 🐛 Troubleshooting

### Common Issues

1. **Webhook not receiving events**
   - Verify webhook URL in Intercom
   - Check signature verification
   - Monitor server logs

2. **Order not found**
   - Check order number format
   - Verify API credentials
   - Test API directly

3. **High response times**
   - Check cache configuration
   - Monitor API latencies
   - Verify Redis connection

## 📈 Performance

- Target response time: < 2 seconds (95th percentile)
- Automation rate goal: 60%
- Supported load: 1,000 concurrent conversations

## 🔒 Security

- Webhook signature verification
- API key encryption
- No PII storage
- 30-day data retention

## 📝 License

MIT License - see LICENSE file for details

## 👥 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For issues and questions:
- Create a GitHub issue
- Contact the development team

---

Built with ❤️ by StoreHub Team