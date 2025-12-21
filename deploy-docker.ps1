# IPO GMP Analyzer - Docker Deployment Script (PowerShell)
param(
    [Parameter(Position=0)]
    [ValidateSet("simple", "dev", "prod", "stop", "logs", "clean")]
    [string]$Command = "simple"
)

Write-Host "🚀 Starting IPO GMP Analyzer Docker Deployment..." -ForegroundColor Green

# Check if Docker is installed
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker is not installed. Please install Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Check if Docker Compose is available
if (-not (Get-Command docker-compose -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker Compose is not available. Please install Docker Compose first." -ForegroundColor Red
    exit 1
}

function Deploy-Application {
    param(
        [string]$ConfigFile,
        [string]$DeploymentType
    )
    
    Write-Host "📦 Building and deploying with $DeploymentType configuration..." -ForegroundColor Yellow
    
    # Stop existing containers
    Write-Host "🛑 Stopping existing containers..." -ForegroundColor Yellow
    docker-compose -f $ConfigFile down
    
    # Build images
    Write-Host "🔨 Building Docker images..." -ForegroundColor Yellow
    docker-compose -f $ConfigFile build --no-cache
    
    # Start services
    Write-Host "🚀 Starting services..." -ForegroundColor Yellow
    docker-compose -f $ConfigFile up -d
    
    # Wait for services to be ready
    Write-Host "⏳ Waiting for services to be ready..." -ForegroundColor Yellow
    Start-Sleep -Seconds 30
    
    # Check service health
    Write-Host "🔍 Checking service health..." -ForegroundColor Yellow
    
    # Check frontend
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -UseBasicParsing -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Frontend is healthy" -ForegroundColor Green
        }
    }
    catch {
        Write-Host "❌ Frontend health check failed" -ForegroundColor Red
    }
    
    # Check backend
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8000/health" -UseBasicParsing -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Backend is healthy" -ForegroundColor Green
        }
    }
    catch {
        Write-Host "❌ Backend health check failed" -ForegroundColor Red
    }
    
    Write-Host "🎉 Deployment completed!" -ForegroundColor Green
    Write-Host "📱 Frontend: http://localhost:3000" -ForegroundColor Cyan
    Write-Host "🔧 Backend API: http://localhost:8000" -ForegroundColor Cyan
    Write-Host "📊 Database: localhost:5432" -ForegroundColor Cyan
    Write-Host "🗄️ Redis: localhost:6379" -ForegroundColor Cyan
}

switch ($Command) {
    "simple" {
        Deploy-Application "docker-compose.simple.yml" "Simple"
    }
    "dev" {
        Deploy-Application "docker-compose.yml" "Development"
    }
    "prod" {
        Deploy-Application "docker-compose.prod.yml" "Production"
    }
    "stop" {
        Write-Host "🛑 Stopping all services..." -ForegroundColor Yellow
        docker-compose -f docker-compose.simple.yml down
        docker-compose -f docker-compose.yml down
        docker-compose -f docker-compose.prod.yml down
        Write-Host "✅ All services stopped" -ForegroundColor Green
    }
    "logs" {
        Write-Host "📋 Showing logs..." -ForegroundColor Yellow
        docker-compose -f docker-compose.simple.yml logs -f
    }
    "clean" {
        Write-Host "🧹 Cleaning up Docker resources..." -ForegroundColor Yellow
        docker-compose -f docker-compose.simple.yml down -v
        docker-compose -f docker-compose.yml down -v
        docker-compose -f docker-compose.prod.yml down -v
        docker system prune -f
        Write-Host "✅ Cleanup completed" -ForegroundColor Green
    }
    default {
        Write-Host "Usage: .\deploy-docker.ps1 {simple|dev|prod|stop|logs|clean}" -ForegroundColor White
        Write-Host ""
        Write-Host "Commands:" -ForegroundColor White
        Write-Host "  simple  - Deploy with simple configuration (default)" -ForegroundColor Gray
        Write-Host "  dev     - Deploy with development configuration" -ForegroundColor Gray
        Write-Host "  prod    - Deploy with production configuration" -ForegroundColor Gray
        Write-Host "  stop    - Stop all running services" -ForegroundColor Gray
        Write-Host "  logs    - Show service logs" -ForegroundColor Gray
        Write-Host "  clean   - Clean up all Docker resources" -ForegroundColor Gray
    }
}