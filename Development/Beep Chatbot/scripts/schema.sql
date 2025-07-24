-- Neon PostgreSQL Schema for BEEP Intercom Chatbot
-- Create database tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Conversations table
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    intercom_id VARCHAR(255) UNIQUE NOT NULL,
    user_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active',
    first_message TEXT,
    last_message TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Order lookups table
CREATE TABLE order_lookups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id VARCHAR(255),
    order_number VARCHAR(100),
    platform VARCHAR(50),
    status VARCHAR(100),
    response_time_ms INTEGER,
    cache_hit BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Support tickets table
CREATE TABLE support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id VARCHAR(100),
    conversation_id VARCHAR(255),
    order_number VARCHAR(100),
    reason VARCHAR(100),
    priority VARCHAR(20) DEFAULT 'medium',
    status VARCHAR(50) DEFAULT 'open',
    assigned_to VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    resolved_at TIMESTAMP
);

-- API logs table for monitoring
CREATE TABLE api_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    platform VARCHAR(50),
    endpoint VARCHAR(500),
    method VARCHAR(10),
    request_data JSONB,
    response_data JSONB,
    status_code INTEGER,
    response_time_ms INTEGER,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Delivery status cache
CREATE TABLE delivery_status_cache (
    order_number VARCHAR(100) PRIMARY KEY,
    platform VARCHAR(50),
    status_data JSONB,
    raw_response JSONB,
    cached_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '5 minutes'
);

-- Bot interactions table
CREATE TABLE bot_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id VARCHAR(255),
    message_type VARCHAR(50), -- 'user' or 'bot'
    message TEXT,
    intent VARCHAR(100),
    confidence DECIMAL(3, 2),
    entities JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Performance metrics table
CREATE TABLE performance_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_name VARCHAR(100),
    metric_value DECIMAL(10, 2),
    metric_unit VARCHAR(50),
    tags JSONB DEFAULT '{}',
    recorded_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_conversations_intercom_id ON conversations(intercom_id);
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_conversations_created_at ON conversations(created_at DESC);

CREATE INDEX idx_order_lookups_conversation_id ON order_lookups(conversation_id);
CREATE INDEX idx_order_lookups_order_number ON order_lookups(order_number);
CREATE INDEX idx_order_lookups_created_at ON order_lookups(created_at DESC);

CREATE INDEX idx_tickets_conversation_id ON support_tickets(conversation_id);
CREATE INDEX idx_tickets_order_number ON support_tickets(order_number);
CREATE INDEX idx_tickets_status ON support_tickets(status);
CREATE INDEX idx_tickets_created_at ON support_tickets(created_at DESC);

CREATE INDEX idx_api_logs_platform ON api_logs(platform);
CREATE INDEX idx_api_logs_status_code ON api_logs(status_code);
CREATE INDEX idx_api_logs_created_at ON api_logs(created_at DESC);

CREATE INDEX idx_cache_order_number ON delivery_status_cache(order_number);
CREATE INDEX idx_cache_expires_at ON delivery_status_cache(expires_at);

CREATE INDEX idx_interactions_conversation_id ON bot_interactions(conversation_id);
CREATE INDEX idx_interactions_created_at ON bot_interactions(created_at DESC);

-- Create views for analytics
CREATE VIEW hourly_metrics AS
SELECT 
    DATE_TRUNC('hour', created_at) as hour,
    COUNT(*) as total_lookups,
    COUNT(DISTINCT conversation_id) as unique_conversations,
    AVG(response_time_ms) as avg_response_time,
    SUM(CASE WHEN cache_hit THEN 1 ELSE 0 END)::FLOAT / COUNT(*) as cache_hit_rate
FROM order_lookups
GROUP BY DATE_TRUNC('hour', created_at);

CREATE VIEW daily_platform_stats AS
SELECT 
    DATE_TRUNC('day', created_at) as day,
    platform,
    COUNT(*) as total_requests,
    AVG(response_time_ms) as avg_response_time
FROM order_lookups
GROUP BY DATE_TRUNC('day', created_at), platform;

-- Function to clean up expired cache
CREATE OR REPLACE FUNCTION cleanup_expired_cache() RETURNS void AS $$
BEGIN
    DELETE FROM delivery_status_cache WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to update conversation updated_at timestamp
CREATE OR REPLACE FUNCTION update_conversation_timestamp() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating conversation timestamp
CREATE TRIGGER update_conversation_timestamp_trigger
BEFORE UPDATE ON conversations
FOR EACH ROW
EXECUTE FUNCTION update_conversation_timestamp();