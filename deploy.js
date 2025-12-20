#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting IPO GMP Analyzer Deployment...\n');

// Start backend
console.log('📡 Starting backend server...');
const backend = spawn('python', ['simple_server.py'], {
  cwd: path.join(__dirname, 'backend'),
  stdio: 'inherit'
});

// Wait a bit for backend to start
setTimeout(() => {
  console.log('\n🌐 Starting frontend server...');
  
  // Start frontend
  const frontend = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit'
  });

  // Handle process termination
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down servers...');
    backend.kill();
    frontend.kill();
    process.exit(0);
  });

  frontend.on('close', (code) => {
    console.log(`Frontend process exited with code ${code}`);
    backend.kill();
  });

  backend.on('close', (code) => {
    console.log(`Backend process exited with code ${code}`);
    frontend.kill();
  });

}, 2000);

console.log('\n✨ Deployment complete!');
console.log('📊 Frontend: http://localhost:3000');
console.log('🔧 Backend: http://localhost:8000');
console.log('\nPress Ctrl+C to stop both servers');