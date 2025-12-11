#!/bin/bash

# IPO GMP Analyzer - Production Deployment Script
# This script deploys the complete system to production

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="ipo-gmp-analyzer"
BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"
LOG_FILE="./logs/deployment_$(date +%Y%m%d_%H%M%S).log"

# Functions
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "$LOG_FILE"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}" | tee -a "$LOG_FILE"
    exit 1
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}" | tee -a "$LOG_FILE"
}

# Create necessary directories
create_directories() {
    log "Creating necessary directories..."
    mkdir -p logs/{frontend,backend,nginx,celery,celery-beat}
    mkdir -p monitoring/{prometheus,grafana/{dashboards,datasources}}
    mkdir -p nginx/ssl
    mkdir -p database
    mkdir -p backups
    mkdir -p static
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed. Please install Docker first."
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed. Please install Docker Compose first."
    fi
    
    # Check if .env.prod exists
    if [ ! -f ".env.prod" ]; then
        error ".env.prod file not found. Please create it from .env.prod.example"
    fi
    
    # Check if SSL certificates exist (for production)
    if [ "$1" = "production" ] && [ ! -f "nginx/ssl/fullchain.pem" ]; then
        warn "SSL certificates not found. HTTPS will not work properly."
        warn "Please obtain SSL certificates and place them in nginx/ssl/"
    fi
    
    log "Prerequisites check completed ✓"
}

# Backup existing data
backup_data() {
    if [ "$1" = "production" ]; then
        log "Creating backup of existing data..."
        mkdir -p "$BACKUP_DIR"
        
        # Backup database
        if docker-compose -f docker-compose.prod.yml ps postgres | grep -q "Up"; then
            docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump -U postgres ipo_gmp_analyzer > "$BACKUP_DIR/database_backup.sql"
            log "Database backup created ✓"
        fi
        
        # Backup volumes
        docker run --rm -v ipo-gmp-analyzer_postgres_data:/data -v "$(pwd)/$BACKUP_DIR":/backup alpine tar czf /backup/postgres_data.tar.gz -C /data .
        docker run --rm -v ipo-gmp-analyzer_redis_data:/data -v "$(pwd)/$BACKUP_DIR":/backup alpine tar czf /backup/redis_data.tar.gz -C /data .
        
        log "Data backup completed ✓"
    fi
}

# Build and deploy
deploy() {
    local environment=$1
    local compose_file="docker-compose.yml"
    
    if [ "$environment" = "production" ]; then
        compose_file="docker-compose.prod.yml"
    fi
    
    log "Starting deployment to $environment environment..."
    
    # Pull latest images
    log "Pulling latest base images..."
    docker-compose -f "$compose_file" pull
    
    # Build services
    log "Building services..."
    docker-compose -f "$compose_file" build --no-cache
    
    # Start services
    log "Starting services..."
    if [ "$environment" = "production" ]; then
        docker-compose -f "$compose_file" --env-file .env.prod up -d
    else
        docker-compose -f "$compose_file" up -d
    fi
    
    # Wait for services to be healthy
    log "Waiting for services to be healthy..."
    sleep 30
    
    # Check service health
    check_health "$compose_file"
    
    log "Deployment completed successfully ✓"
}

# Check service health
check_health() {
    local compose_file=$1
    log "Checking service health..."
    
    # Check if all services are running
    if ! docker-compose -f "$compose_file" ps | grep -q "Up"; then
        error "Some services failed to start. Check logs with: docker-compose -f $compose_file logs"
    fi
    
    # Check backend health
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f http://localhost:8000/health &> /dev/null; then
            log "Backend service is healthy ✓"
            break
        fi
        
        if [ $attempt -eq $max_attempts ]; then
            error "Backend service health check failed after $max_attempts attempts"
        fi
        
        info "Waiting for backend service... (attempt $attempt/$max_attempts)"
        sleep 10
        ((attempt++))
    done
    
    # Check frontend health
    attempt=1
    while [ $attempt -le $max_attempts ]; do
        if curl -f http://localhost:3000 &> /dev/null; then
            log "Frontend service is healthy ✓"
            break
        fi
        
        if [ $attempt -eq $max_attempts ]; then
            error "Frontend service health check failed after $max_attempts attempts"
        fi
        
        info "Waiting for frontend service... (attempt $attempt/$max_attempts)"
        sleep 10
        ((attempt++))
    done
    
    log "All services are healthy ✓"
}

# Run database migrations
run_migrations() {
    log "Running database migrations..."
    docker-compose -f docker-compose.prod.yml exec backend python -c "
from database import engine, Base
from models import *
Base.metadata.create_all(bind=engine)
print('Database tables created successfully')
"
    log "Database migrations completed ✓"
}

# Setup monitoring
setup_monitoring() {
    log "Setting up monitoring..."
    
    # Create Prometheus configuration
    cat > monitoring/prometheus.prod.yml << EOF
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "rules/*.yml"

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

  - job_name: 'nginx'
    static_configs:
      - targets: ['nginx:80']

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093
EOF

    # Create Grafana datasource
    mkdir -p monitoring/grafana/datasources
    cat > monitoring/grafana/datasources/prometheus.yml << EOF
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
EOF

    log "Monitoring setup completed ✓"
}

# Generate SSL certificates (Let's Encrypt)
setup_ssl() {
    if [ "$1" = "production" ]; then
        log "Setting up SSL certificates..."
        
        # Check if certbot is installed
        if ! command -v certbot &> /dev/null; then
            warn "Certbot not found. Installing certbot..."
            sudo apt-get update
            sudo apt-get install -y certbot
        fi
        
        # Generate certificates
        if [ ! -f "nginx/ssl/fullchain.pem" ]; then
            warn "Generating SSL certificates with Let's Encrypt..."
            warn "Make sure your domain points to this server before proceeding."
            read -p "Enter your domain name: " domain
            read -p "Enter your email: " email
            
            sudo certbot certonly --standalone -d "$domain" --email "$email" --agree-tos --non-interactive
            
            # Copy certificates
            sudo cp "/etc/letsencrypt/live/$domain/fullchain.pem" nginx/ssl/
            sudo cp "/etc/letsencrypt/live/$domain/privkey.pem" nginx/ssl/
            sudo chown $(whoami):$(whoami) nginx/ssl/*.pem
            
            log "SSL certificates generated ✓"
        fi
    fi
}

# Show deployment summary
show_summary() {
    local environment=$1
    
    echo ""
    log "🎉 Deployment Summary"
    echo "===================="
    echo ""
    echo "Environment: $environment"
    echo "Project: $PROJECT_NAME"
    echo "Deployment Time: $(date)"
    echo ""
    echo "🌐 Access URLs:"
    if [ "$environment" = "production" ]; then
        echo "  Frontend: https://your-domain.com"
        echo "  API: https://api.your-domain.com"
        echo "  API Docs: https://api.your-domain.com/docs"
        echo "  Monitoring: https://monitoring.your-domain.com"
    else
        echo "  Frontend: http://localhost:3000"
        echo "  API: http://localhost:8000"
        echo "  API Docs: http://localhost:8000/docs"
        echo "  Grafana: http://localhost:3001"
        echo "  Prometheus: http://localhost:9090"
    fi
    echo ""
    echo "📊 Service Status:"
    docker-compose -f "docker-compose$([ "$environment" = "production" ] && echo ".prod" || echo "").yml" ps
    echo ""
    echo "📝 Useful Commands:"
    echo "  View logs: docker-compose logs -f [service]"
    echo "  Restart service: docker-compose restart [service]"
    echo "  Scale service: docker-compose up -d --scale backend=3"
    echo "  Stop all: docker-compose down"
    echo ""
    log "Deployment completed successfully! 🚀"
}

# Main deployment function
main() {
    local environment=${1:-development}
    
    echo ""
    log "🚀 Starting IPO GMP Analyzer Deployment"
    log "Environment: $environment"
    echo ""
    
    # Create log file
    mkdir -p logs
    touch "$LOG_FILE"
    
    # Run deployment steps
    create_directories
    check_prerequisites "$environment"
    
    if [ "$environment" = "production" ]; then
        backup_data "$environment"
        setup_ssl "$environment"
    fi
    
    setup_monitoring
    deploy "$environment"
    
    if [ "$environment" = "production" ]; then
        run_migrations
    fi
    
    show_summary "$environment"
}

# Script usage
usage() {
    echo "Usage: $0 [development|production]"
    echo ""
    echo "Examples:"
    echo "  $0                    # Deploy to development"
    echo "  $0 development        # Deploy to development"
    echo "  $0 production         # Deploy to production"
    echo ""
    exit 1
}

# Handle script arguments
case "${1:-development}" in
    development|dev)
        main "development"
        ;;
    production|prod)
        main "production"
        ;;
    *)
        usage
        ;;
esac