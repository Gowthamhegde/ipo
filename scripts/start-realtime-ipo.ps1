# Real-time IPO Data Fetcher Startup Script for Windows
# Initializes and starts the automatic IPO data fetching service

param(
    [switch]$Background,
    [switch]$Help
)

if ($Help) {
    Write-Host "Real-time IPO Data Fetcher Startup Script" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage:"
    Write-Host "  .\start-realtime-ipo.ps1           # Start in foreground"
    Write-Host "  .\start-realtime-ipo.ps1 -Background  # Start in background"
    Write-Host "  .\start-realtime-ipo.ps1 -Help        # Show this help"
    Write-Host ""
    exit 0
}

Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host "🎯 IPO GMP Analyzer - Real-time Data Fetcher" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host ""

# Check if Python is installed
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✅ Python found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python not found. Please install Python 3.8 or higher." -ForegroundColor Red
    exit 1
}

# Check if we're in the correct directory
if (-not (Test-Path "backend\requirements.txt")) {
    Write-Host "❌ Please run this script from the project root directory." -ForegroundColor Red
    exit 1
}

# Check if virtual environment exists
$venvPath = "backend\venv"
if (-not (Test-Path $venvPath)) {
    Write-Host "⚠️  Virtual environment not found. Creating one..." -ForegroundColor Yellow
    
    try {
        Set-Location backend
        python -m venv venv
        Write-Host "✅ Virtual environment created" -ForegroundColor Green
        Set-Location ..
    } catch {
        Write-Host "❌ Failed to create virtual environment: $_" -ForegroundColor Red
        exit 1
    }
}

# Activate virtual environment
Write-Host "🔄 Activating virtual environment..." -ForegroundColor Blue
try {
    & "$venvPath\Scripts\Activate.ps1"
    Write-Host "✅ Virtual environment activated" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to activate virtual environment: $_" -ForegroundColor Red
    exit 1
}

# Install/update dependencies
Write-Host "📦 Installing/updating dependencies..." -ForegroundColor Blue
try {
    Set-Location backend
    pip install -r requirements.txt --quiet
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
    Set-Location ..
} catch {
    Write-Host "❌ Failed to install dependencies: $_" -ForegroundColor Red
    exit 1
}

# Check if .env file exists
if (-not (Test-Path "backend\.env")) {
    Write-Host "⚠️  .env file not found. Creating from template..." -ForegroundColor Yellow
    
    if (Test-Path "backend\.env.example") {
        Copy-Item "backend\.env.example" "backend\.env"
        Write-Host "✅ .env file created from template" -ForegroundColor Green
        Write-Host "📝 Please edit backend\.env with your configuration" -ForegroundColor Yellow
    } else {
        Write-Host "❌ .env.example not found. Please create backend\.env manually." -ForegroundColor Red
    }
}

# Start the real-time IPO service
Write-Host ""
Write-Host "🚀 Starting Real-time IPO Data Fetcher..." -ForegroundColor Cyan
Write-Host ""

try {
    if ($Background) {
        Write-Host "🔄 Starting service in background..." -ForegroundColor Blue
        $job = Start-Job -ScriptBlock {
            Set-Location $using:PWD
            python scripts\start-realtime-ipo.py
        }
        
        Write-Host "✅ Service started in background (Job ID: $($job.Id))" -ForegroundColor Green
        Write-Host "📊 Use 'Get-Job' to check status" -ForegroundColor Blue
        Write-Host "🛑 Use 'Stop-Job $($job.Id)' to stop the service" -ForegroundColor Blue
        
    } else {
        Write-Host "🔄 Starting service in foreground..." -ForegroundColor Blue
        Write-Host "🛑 Press Ctrl+C to stop the service" -ForegroundColor Yellow
        Write-Host ""
        
        python scripts\start-realtime-ipo.py
    }
    
} catch {
    Write-Host "❌ Failed to start Real-time IPO service: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "👋 Real-time IPO Data Fetcher stopped" -ForegroundColor Cyan