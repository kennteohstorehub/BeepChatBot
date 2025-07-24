// lib/intercom-client.js - Intercom API wrapper
const axios = require('axios');
const winston = require('winston');

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.simple(),
    transports: [new winston.transports.Console()]
});

class IntercomClient {
    constructor() {
        this.baseURL = 'https://api.intercom.io';
        this.accessToken = process.env.INTERCOM_ACCESS_TOKEN;
        this.botAdminId = process.env.INTERCOM_BOT_ADMIN_ID;
        
        this.client = axios.create({
            baseURL: this.baseURL,
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });
    }
    
    async sendReply(conversationId, message) {
        try {
            const response = await this.client.post(
                `/conversations/${conversationId}/reply`,
                {
                    type: 'admin',
                    admin_id: this.botAdminId,
                    message_type: 'comment',
                    body: message
                }
            );
            
            logger.info(`Sent reply to conversation ${conversationId}`);
            return response.data;
            
        } catch (error) {
            logger.error('Failed to send Intercom reply:', error.response?.data || error.message);
            throw error;
        }
    }
    
    async addNote(conversationId, note) {
        try {
            const response = await this.client.post(
                `/conversations/${conversationId}/reply`,
                {
                    type: 'admin',
                    admin_id: this.botAdminId,
                    message_type: 'note',
                    body: note
                }
            );
            
            logger.info(`Added note to conversation ${conversationId}`);
            return response.data;
            
        } catch (error) {
            logger.error('Failed to add Intercom note:', error.response?.data || error.message);
            throw error;
        }
    }
    
    async tagConversation(conversationId, tags) {
        try {
            // First, get existing tags
            const conversation = await this.getConversation(conversationId);
            const existingTagIds = conversation.tags.tags.map(tag => tag.id);
            
            // Get tag IDs for the tags we want to add
            const tagIds = await this.getTagIds(tags);
            
            // Combine existing and new tags
            const allTagIds = [...new Set([...existingTagIds, ...tagIds])];
            
            // Update conversation with all tags
            const response = await this.client.put(
                `/conversations/${conversationId}`,
                {
                    tags: allTagIds
                }
            );
            
            logger.info(`Tagged conversation ${conversationId} with: ${tags.join(', ')}`);
            return response.data;
            
        } catch (error) {
            logger.error('Failed to tag conversation:', error.response?.data || error.message);
            throw error;
        }
    }
    
    async assignToTeam(conversationId, teamId) {
        try {
            const response = await this.client.put(
                `/conversations/${conversationId}`,
                {
                    assignee_type: 'team',
                    assignee_id: teamId
                }
            );
            
            logger.info(`Assigned conversation ${conversationId} to team ${teamId}`);
            return response.data;
            
        } catch (error) {
            logger.error('Failed to assign conversation:', error.response?.data || error.message);
            throw error;
        }
    }
    
    async getConversation(conversationId) {
        try {
            const response = await this.client.get(`/conversations/${conversationId}`);
            return response.data;
        } catch (error) {
            logger.error('Failed to get conversation:', error.response?.data || error.message);
            throw error;
        }
    }
    
    async getTagIds(tagNames) {
        try {
            const response = await this.client.get('/tags');
            const tags = response.data.data;
            
            const tagIds = [];
            for (const tagName of tagNames) {
                const tag = tags.find(t => t.name === tagName);
                if (tag) {
                    tagIds.push(tag.id);
                } else {
                    // Create tag if it doesn't exist
                    const newTag = await this.createTag(tagName);
                    tagIds.push(newTag.id);
                }
            }
            
            return tagIds;
        } catch (error) {
            logger.error('Failed to get tag IDs:', error.response?.data || error.message);
            throw error;
        }
    }
    
    async createTag(tagName) {
        try {
            const response = await this.client.post('/tags', {
                name: tagName
            });
            
            logger.info(`Created new tag: ${tagName}`);
            return response.data;
        } catch (error) {
            logger.error('Failed to create tag:', error.response?.data || error.message);
            throw error;
        }
    }
}

module.exports = { IntercomClient };