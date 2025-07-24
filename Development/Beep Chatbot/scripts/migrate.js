// scripts/migrate.js - Database migration script
require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const { neon } = require('@neondatabase/serverless');

async function migrate() {
    if (!process.env.DATABASE_URL) {
        console.error('❌ DATABASE_URL not found in environment variables');
        process.exit(1);
    }
    
    const sql = neon(process.env.DATABASE_URL);
    
    try {
        console.log('🚀 Starting database migration...');
        
        // Read schema file
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = await fs.readFile(schemaPath, 'utf-8');
        
        // Split schema into individual statements
        const statements = schema
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0);
        
        // Execute each statement
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i] + ';';
            
            try {
                await sql(statement);
                console.log(`✅ Executed statement ${i + 1}/${statements.length}`);
            } catch (error) {
                console.error(`❌ Failed to execute statement ${i + 1}:`, error.message);
                throw error;
            }
        }
        
        console.log('✅ Database migration completed successfully!');
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

// Run migration if called directly
if (require.main === module) {
    migrate();
}

module.exports = migrate;