// lib/queue.js - Simple queue implementation for testing
const Bull = require('bull');

class Queue {
    constructor() {
        // In test/dev mode, use simple in-memory queue
        if (process.env.NODE_ENV === 'test' || !process.env.REDIS_URL) {
            this.jobs = [];
            this.mockMode = true;
        } else {
            this.queue = new Bull('order-status-queue', process.env.REDIS_URL);
            this.mockMode = false;
        }
    }
    
    async addJob(type, data) {
        if (this.mockMode) {
            const job = {
                id: `job-${Date.now()}`,
                type,
                data,
                createdAt: new Date()
            };
            this.jobs.push(job);
            return job;
        }
        
        return await this.queue.add(type, data, {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 2000
            }
        });
    }
    
    async process(type, handler) {
        if (this.mockMode) {
            // In mock mode, process jobs immediately
            setInterval(() => {
                const job = this.jobs.find(j => j.type === type && !j.processed);
                if (job) {
                    job.processed = true;
                    handler({ data: job.data });
                }
            }, 100);
            return;
        }
        
        this.queue.process(type, handler);
    }
}

module.exports = new Queue();