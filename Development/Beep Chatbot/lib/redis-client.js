// lib/redis-client.js - Redis client wrapper
const Redis = require('ioredis');
const winston = require('winston');

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.simple(),
    transports: [new winston.transports.Console()]
});

let redis;

try {
    redis = new Redis(process.env.REDIS_URL);
    
    redis.on('connect', () => {
        logger.info('Redis connected successfully');
    });
    
    redis.on('error', (error) => {
        logger.error('Redis connection error:', error);
    });
    
} catch (error) {
    logger.error('Failed to initialize Redis:', error);
    process.exit(1);
}

module.exports = redis;