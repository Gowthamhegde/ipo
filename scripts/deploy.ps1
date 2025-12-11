# IPO GMP Analyzer - Production Deployment Script (PowerShell)
# This script deploys the complete system to production on Windows

param(
    [Parameter(Position=0)]
    [ValidateSet("development", "production", "dev", "prod")]
    [string]$Environment = "development"
)

# Configuration
$ProjectName = "ipo-gmp-analyzer"
$BackupDir = "./backups/$(Get-Date -Format 'yyyyMMdd_HHmmss')"
$LogFile = "./logs/deployment_$(Get-Date -Format 'yyyyMMdd_HHmmss').log"

# Ensure logs directory exists
if (!(Test-Path "logs")) {
    New-Item -ItemType Directory -Path "logs" -Force | Out-Null
}

# Functions
function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] $Level: $Message"
    
    switch ($Level) {
        "ERROR" { Write-Host $logMessage -ForegroundColor Red }
        "WARN" { Write-Host $logMessage -ForegroundColor Yellow }
        "SUCCESS" { Write-Host $logMessage -ForegroundColor Green }
        default { Write-Host $logMessage -ForegroundColor Cyan }
    }
    
    Add-Content -Path $LogFile -Value $logMessage
}

function Test-Prerequisites {
    Write-Log "Checking prerequisites..."
    
    # Check Docker
    try {
        docker --version | Out-Null
        Write-Log "Docker is installed ✓" "SUCCESS"
    }
    catch {
        Write-Log "Docker is not installed. Please install Docker Desktop first." "ERROR"
        exit 1
    }
    
    # Check Docker Compose
    try {
        docker-compose --version | Out-Null
        Write-Log "Docker Compose is installed ✓" "SUCCESS"
    }
    catch {
        Write-Log "Docker Compose is not installed. Please install Docker Compose first." "ERROR"
        exit 1
    }
    
    # Check environment file
    if ($Environment -eq "production" -and !(Test-Path ".env.prod")) {
        Write-Log ".env.prod file not found. Please create it from .env.prod template" "ERROR"
        exit 1
    }
    
    Write-Log "Prerequisites check completed ✓" "SUCCESS"
}

function New-Directories {
    Write-Log "Creating necessary directories..."
    
    $directories = @(
        "logs/frontend",
        "logs/backend", 
        "logs/nginx",
        "logs/celery",
        "logs/celery-beat",
        "monitoring/prometheus",
        "monitoring/grafana/dashboards",
        "monitoring/grafana/datasources",
        "nginx/ssl",
        "database",
        "backups",
        "static"
    )
    
    foreach ($dir in $directories) {
        if (!(Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
        }
    }
    
    Write-Log "Directories created ✓" "SUCCESS"
}

function Backup-Data {
    if ($Environment -eq "production") {
        Write-Log "Creating backup of existing data..."
        
        if (!(Test-Path $BackupDir)) {
            New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
        }
        
        # Check if containers are running
        $postgresRunning = docker-compose -f docker-compose.prod.yml ps postgres | Select-String "Up"
        
        if ($postgresRunning) {
            Write-Log "Backing up database..."
            docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump -U postgres ipo_gmp_analyzer > "$BackupDir/database_backup.sql"
            Write-Log "Database backup created ✓" "SUCCESS"
        }
        
        Write-Log "Data backup completed ✓" "SUCCESS"
    }
}

function Start-Deployment {
    param([string]$Env)
    
    $composeFile = if ($Env -eq "production") { "docker-compose.prod.yml" } else { "docker-compose.yml" }
    
    Write-Log "Starting deployment to $Env environment..."
    
    # Pull latest images
    Write-Log "Pulling latest base images..."
    docker-compose -f $composeFile pull
    
    # Build services
    Write-Log "Building services..."
    docker-compose -f $composeFile build --no-cache
    
    # Start services
    Write-Log "Starting services..."
    if ($Env -eq "production") {
        docker-compose -f $composeFile --env-file .env.prod up -d
    } else {
        docker-compose -f $composeFile up -d
    }
    
    # Wait for services
    Write-Log "Waiting for services to start..."
    Start-Sleep -Seconds 30
    
    # Check health
    Test-ServiceHealth $composeFile
    
    Write-Log "Deployment completed successfully ✓" "SUCCESS"
}

function Test-ServiceHealth {
    param([string]$ComposeFile)
    
    Write-Log "Checking service health..."
    
    # Check backend health
    $maxAttempts = 30
    $attempt = 1
    
    while ($attempt -le $maxAttempts) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:8000/health" -UseBasicParsing -TimeoutSec 5
            if ($response.StatusCode -eq 200) {
                Write-Log "Backend service is healthy ✓" "SUCCESS"
                break
            }
        }
        catch {
            if ($attempt -eq $maxAttempts) {
                Write-Log "Backend service health check failed after $maxAttempts attempts" "ERROR"
                exit 1
            }
            Write-Log "Waiting for backend service... (attempt $attempt/$maxAttempts)"
            Start-Sleep -Seconds 10
            $attempt++
        }
    }
    
    # Check frontend health
    $attempt = 1
    while ($attempt -le $maxAttempts) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 5
            if ($response.StatusCode -eq 200) {
                Write-Log "Frontend service is healthy ✓" "SUCCESS"
                break
            }
        }
        catch {
            if ($attempt -eq $maxAttempts) {
                Write-Log "Frontend service health check failed after $maxAttempts attempts" "ERROR"
                exit 1
            }
            Write-Log "Waiting for frontend service... (attempt $attempt/$maxAttempts)"
            Start-Sleep -Seconds 10
            $attempt++
        }
    }
    
    Write-Log "All services are healthy ✓" "SUCCESS"
}

function Initialize-Monitoring {
    Write-Log "Setting up monitoring..."
    
    # Create Prometheus configuration
    $prometheusConfig = @"
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'backend'
    static_configs:
      - targets: ['backend:8000']
    metrics_path: '/metrics'

  - job_name: 'frontend'
    static_configs:
      - targets: ['frontend:3000']
    metrics_path: '/api/metrics'

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres:5432']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis:6379']
"@

    Set-Content -Path "monitoring/prometheus.prod.yml" -Value $prometheusConfig
    
    # Create Grafana datasource
    $grafanaConfig = @"
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
"@

    Set-Content -Path "monitoring/grafana/datasources/prometheus.yml" -Value $grafanaConfig
    
    Write-Log "Monitoring setup completed ✓" "SUCCESS"
}

function Show-Summary {
    param([string]$Env)
    
    Write-Host ""
    Write-Log "🎉 Deployment Summary" "SUCCESS"
    Write-Host "===================="
    Write-Host ""
    Write-Host "Environment: $Env"
    Write-Host "Project: $ProjectName"
    Write-Host "Deployment Time: $(Get-Date)"
    Write-Host ""
    Write-Host "🌐 Access URLs:"
    
    if ($Env -eq "production") {
        Write-Host "  Frontend: https://your-domain.com"
        Write-Host "  API: https://api.your-domain.com"
        Write-Host "  API Docs: https://api.your-domain.com/docs"
        Write-Host "  Monitoring: https://monitoring.your-domain.com"
    } else {
        Write-Host "  Frontend: http://localhost:3000"
        Write-Host "  API: http://localhost:8000"
        Write-Host "  API Docs: http://localhost:8000/docs"
        Write-Host "  Grafana: http://localhost:3001"
        Write-Host "  Prometheus: http://localhost:9090"
    }
    
    Write-Host ""
    Write-Host "📊 Service Status:"
    $composeFile = if ($Env -eq "production") { "docker-compose.prod.yml" } else { "docker-compose.yml" }
    docker-compose -f $composeFile ps
    
    Write-Host ""
    Write-Host "📝 Useful Commands:"
    Write-Host "  View logs: docker-compose logs -f [service]"
    Write-Host "  Restart service: docker-compose restart [service]"
    Write-Host "  Scale service: docker-compose up -d --scale backend=3"
    Write-Host "  Stop all: docker-compose down"
    Write-Host ""
    
    Write-Log "Deployment completed successfully! 🚀" "SUCCESS"
}

# Main execution
function Main {
    param([string]$Env)
    
    Write-Host ""
    Write-Log "🚀 Starting IPO GMP Analyzer Deployment" "SUCCESS"
    Write-Log "Environment: $Env"
    Write-Host ""
    
    try {
        New-Directories
        Test-Prerequisites
        
        if ($Env -eq "production") {
            Backup-Data
        }
        
        Initialize-Monitoring
        Start-Deployment $Env
        Show-Summary $Env
    }
    catch {
        Write-Log "Deployment failed: $($_.Exception.Message)" "ERROR"
        exit 1
    }
}

# Normalize environment parameter
$normalizedEnv = switch ($Environment.ToLower()) {
    { $_ -in @("production", "prod") } { "production" }
    { $_ -in @("development", "dev") } { "development" }
    default { "development" }
}

# Run main function
Main -Env $normalizedEnv