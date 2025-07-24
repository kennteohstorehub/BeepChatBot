#!/usr/bin/env node
// scripts/dev-setup.js - Development setup helper

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const envPath = path.join(__dirname, '..', '.env');

console.log('🚀 BEEP Chatbot Development Setup\n');

// Check if .env exists
if (!fs.existsSync(envPath)) {
    console.log('❌ .env file not found. Creating from .env.example...');
    const examplePath = path.join(__dirname, '..', '.env.example');
    fs.copyFileSync(examplePath, envPath);
    console.log('✅ .env file created\n');
}

// Read current .env
let envContent = fs.readFileSync(envPath, 'utf-8');

const requiredVars = [
    {
        name: 'DATABASE_URL',
        description: 'Neon PostgreSQL connection string',
        example: 'postgresql://user:pass@host.neon.tech/db?sslmode=require'
    },
    {
        name: 'REDIS_URL',
        description: 'Redis connection string',
        example: 'redis://default:password@redis.render.com:6379'
    },
    {
        name: 'INTERCOM_ACCESS_TOKEN',
        description: 'Intercom OAuth token',
        example: 'dG9rOmFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6...'
    },
    {
        name: 'WEBHOOK_SECRET',
        description: 'Intercom webhook secret',
        example: 'abc123def456...'
    },
    {
        name: 'INTERCOM_BOT_ADMIN_ID',
        description: 'Bot admin user ID in Intercom',
        example: '6789012'
    },
    {
        name: 'SUPPORT_TEAM_ID',
        description: 'Support team ID for escalation',
        example: '3456789'
    }
];

function checkEnvVar(varName) {
    const regex = new RegExp(`^${varName}=(.*)$`, 'm');
    const match = envContent.match(regex);
    if (match && match[1] && !match[1].includes('your_')) {
        return true;
    }
    return false;
}

console.log('📋 Checking required environment variables:\n');

const missingVars = [];
requiredVars.forEach(varDef => {
    const isSet = checkEnvVar(varDef.name);
    console.log(`${isSet ? '✅' : '❌'} ${varDef.name}`);
    if (!isSet) {
        missingVars.push(varDef);
    }
});

if (missingVars.length === 0) {
    console.log('\n✅ All required variables are set!');
    console.log('\nYou can now run:');
    console.log('  npm install        # Install dependencies');
    console.log('  npm run migrate    # Set up database');
    console.log('  npm run dev:all    # Start development\n');
    process.exit(0);
}

console.log(`\n⚠️  ${missingVars.length} variables need to be configured.\n`);

// Interactive setup
function askQuestion(varDef, callback) {
    console.log(`\n${varDef.description}`);
    console.log(`Example: ${varDef.example}`);
    rl.question(`Enter ${varDef.name}: `, (answer) => {
        if (answer.trim()) {
            // Update .env content
            const regex = new RegExp(`^${varDef.name}=.*$`, 'm');
            envContent = envContent.replace(regex, `${varDef.name}=${answer.trim()}`);
            console.log(`✅ ${varDef.name} set`);
        } else {
            console.log(`⏭️  Skipping ${varDef.name}`);
        }
        callback();
    });
}

// Process missing vars one by one
let index = 0;
function processNextVar() {
    if (index < missingVars.length) {
        askQuestion(missingVars[index], () => {
            index++;
            processNextVar();
        });
    } else {
        // Save updated .env
        fs.writeFileSync(envPath, envContent);
        console.log('\n✅ Environment configuration updated!');
        console.log('\nNext steps:');
        console.log('  1. Complete any remaining manual configuration');
        console.log('  2. Run: npm install');
        console.log('  3. Run: npm run migrate');
        console.log('  4. Run: npm run dev:all\n');
        rl.close();
    }
}

console.log('Would you like to configure these now? (y/n)');
rl.question('> ', (answer) => {
    if (answer.toLowerCase() === 'y') {
        processNextVar();
    } else {
        console.log('\nPlease update your .env file manually with the required values.');
        console.log('Refer to INTERCOM_SETUP_GUIDE.md for detailed instructions.\n');
        rl.close();
    }
});