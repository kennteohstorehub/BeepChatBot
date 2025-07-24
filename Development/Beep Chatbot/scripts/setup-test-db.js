// scripts/setup-test-db.js - Simple in-memory database for testing
const fs = require('fs');
const path = require('path');

// Create a simple JSON file to simulate database
const dbPath = path.join(__dirname, '..', 'test-db.json');

const initialData = {
    order_lookups: [],
    bot_interactions: [],
    hourly_metrics: [],
    error_logs: []
};

// Create test database
fs.writeFileSync(dbPath, JSON.stringify(initialData, null, 2));

console.log('✅ Test database created at:', dbPath);
console.log('📊 Tables created:');
console.log('  - order_lookups');
console.log('  - bot_interactions');
console.log('  - hourly_metrics');
console.log('  - error_logs');