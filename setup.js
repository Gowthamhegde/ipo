#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up IPO GMP Analyzer...\n');

// Function to run commands
function runCommand(command, description) {
  console.log(`📦 ${description}...`);
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description} completed\n`);
  } catch (error) {
    console.error(`❌ Error during ${description}:`, error.message);
    process.exit(1);
  }
}

// Check if Node.js version is compatible
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
if (majorVersion < 18) {
  console.error('❌ Node.js 18 or higher is required. Current version:', nodeVersion);
  process.exit(1);
}

console.log('✅ Node.js version check passed:', nodeVersion, '\n');

// Install frontend dependencies
runCommand('npm install --legacy-peer-deps', 'Installing frontend dependencies');

// Create necessary directories
const directories = [
  'src/app',
  'src/components',
  'src/lib',
  'backend/logs',
  'backend/models'
];

directories.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Created directory: ${dir}`);
  }
});

// Copy environment files if they don't exist
if (!fs.existsSync('.env.local')) {
  if (fs.existsSync('.env.local.example')) {
    fs.copyFileSync('.env.local.example', '.env.local');
    console.log('📄 Created .env.local from example');
  }
}

if (!fs.existsSync('backend/.env')) {
  if (fs.existsSync('backend/.env.example')) {
    fs.copyFileSync('backend/.env.example', 'backend/.env');
    console.log('📄 Created backend/.env from example');
  }
}

console.log('\n🎉 Setup completed successfully!');
console.log('\n📋 Next steps:');
console.log('1. Install Python dependencies: cd backend && pip install -r requirements.txt');
console.log('2. Start the backend: cd backend && uvicorn main:app --reload');
console.log('3. Start the frontend: npm run dev');
console.log('4. Open http://localhost:3000 in your browser');
console.log('\n💡 For detailed instructions, see QUICK_START.md');