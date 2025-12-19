# IPO GMP Analyzer - Quick Start Script (PowerShell)
Write-Host "🚀 Starting IPO GMP Analyzer Setup..." -ForegroundColor Green

function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARN] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Check if Python is installed
try {
    $pythonVersion = python --version 2>&1
    Write-Status "Python found: $pythonVersion"
} catch {
    Write-Error "Python is not installed. Please install Python 3.8+ first."
    exit 1
}

# Check if Node.js is installed
try {
    $nodeVersion = node --version 2>&1
    Write-Status "Node.js found: $nodeVersion"
} catch {
    Write-Error "Node.js is not installed. Please install Node.js 18+ first."
    exit 1
}

Write-Status "Setting up project structure..."

# Create necessary directories
$directories = @(
    "backend\api", "backend\ml", "backend\scrapers", "backend\utils", "backend\models", "backend\logs",
    "frontend\src\components", "frontend\src\hooks", "frontend\src\services", "frontend\src\utils", "frontend\public",
    "database", "logs"
)

foreach ($dir in $directories) {
    if (!(Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
}

# Setup backend
Write-Status "Setting up Python backend..."
Set-Location backend

# Create virtual environment if it doesn't exist
if (!(Test-Path "venv")) {
    python -m venv venv
    Write-Status "Created Python virtual environment"
}

# Activate virtual environment
if (Test-Path "venv\Scripts\Activate.ps1") {
    & "venv\Scripts\Activate.ps1"
} else {
    Write-Warning "Could not activate virtual environment"
}

# Install Python dependencies
if (Test-Path "requirements.txt") {
    pip install -r requirements.txt
    Write-Status "Installed Python dependencies"
} else {
    Write-Warning "requirements.txt not found, installing basic dependencies..."
    pip install fastapi uvicorn sqlalchemy psycopg2-binary redis pandas scikit-learn xgboost requests beautifulsoup4 python-jose passlib bcrypt
}

Set-Location ..

# Setup frontend
Write-Status "Setting up React frontend..."
Set-Location frontend

# Install Node.js dependencies
if (Test-Path "package.json") {
    npm install
    Write-Status "Installed Node.js dependencies"
} else {
    Write-Warning "package.json not found in frontend directory"
}

Set-Location ..

# Create environment files
Write-Status "Creating environment configuration..."

# Backend .env
if (!(Test-Path "backend\.env")) {
    $backendEnv = @"
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/ipo_gmp_analyzer

# Redis
REDIS_URL=redis://localhost:6379/0

# Security
SECRET_KEY=your-secret-key-change-in-production-minimum-32-characters
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Application
APP_NAME=IPO GMP Analyzer
APP_VERSION=1.0.0
DEBUG=true
LOG_LEVEL=INFO

# External APIs
NSE_API_URL=https://www.nseindia.com
BSE_API_URL=https://www.bseindia.com
CHITTORGARH_URL=https://www.chittorgarh.com
IPOWATCH_URL=https://www.ipowatch.in

# CORS
ALLOWED_ORIGINS=["http://localhost:3000","http://127.0.0.1:3000"]
"@
    Set-Content -Path "backend\.env" -Value $backendEnv
    Write-Status "Created backend .env file"
}

# Frontend .env
if (!(Test-Path "frontend\.env.local")) {
    $frontendEnv = @"
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_NAME=IPO GMP Analyzer
NEXT_PUBLIC_ENVIRONMENT=development
"@
    Set-Content -Path "frontend\.env.local" -Value $frontendEnv
    Write-Status "Created frontend .env.local file"
}

# Create database initialization script
$dbInit = @"
-- IPO GMP Analyzer Database Initialization
CREATE DATABASE IF NOT EXISTS ipo_gmp_analyzer;

-- Create user if not exists (PostgreSQL)
-- CREATE USER IF NOT EXISTS ipo_user WITH PASSWORD 'password';
-- GRANT ALL PRIVILEGES ON DATABASE ipo_gmp_analyzer TO ipo_user;

-- Basic tables will be created by SQLAlchemy
"@
Set-Content -Path "database\init.sql" -Value $dbInit
Write-Status "Created database initialization script"

# Create startup scripts
$backendScript = @"
@echo off
echo 🐍 Starting Python Backend...
cd backend
call venv\Scripts\activate.bat
python api\main.py
pause
"@
Set-Content -Path "start-backend.bat" -Value $backendScript

$frontendScript = @"
@echo off
echo ⚛️ Starting React Frontend...
cd frontend
npm run dev
pause
"@
Set-Content -Path "start-frontend.bat" -Value $frontendScript

Write-Status "Created startup scripts"

# Display instructions
Write-Host ""
Write-Host "🎉 Setup Complete!" -ForegroundColor Blue
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Green
Write-Host "1. 📊 Setup Database:"
Write-Host "   - Install PostgreSQL and create database 'ipo_gmp_analyzer'"
Write-Host "   - Or use SQLite by changing DATABASE_URL in backend\.env"
Write-Host ""
Write-Host "2. 🚀 Start the Application:"
Write-Host "   - Backend:  start-backend.bat  (or cd backend && python api\main.py)"
Write-Host "   - Frontend: start-frontend.bat (or cd frontend && npm run dev)"
Write-Host ""
Write-Host "3. 🌐 Access the Application:"
Write-Host "   - Frontend: http://localhost:3000"
Write-Host "   - Backend API: http://localhost:8000"
Write-Host "   - API Docs: http://localhost:8000/docs"
Write-Host ""
Write-Host "🔧 Development Commands:" -ForegroundColor Green
Write-Host "   - Backend tests: cd backend && python -m pytest"
Write-Host "   - Frontend tests: cd frontend && npm test"
Write-Host "   - Lint code: cd frontend && npm run lint"
Write-Host ""
Write-Host "📝 Notes:" -ForegroundColor Yellow
Write-Host "   - Update database credentials in backend\.env"
Write-Host "   - Install Redis for caching (optional but recommended)"
Write-Host "   - Check logs\ directory for application logs"
Write-Host ""
Write-Host "✅ Ready to develop your IPO GMP Analyzer!" -ForegroundColor Green