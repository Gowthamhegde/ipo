#!/bin/bash

# IPO GMP Analyzer - Docker Deployment Script
echo "🚀 Starting IPO GMP Analyzer Docker Deployment..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Function to deploy with different configurations
deploy() {
    local config_file=$1
    local deployment_type=$2
    
    echo "📦 Building and deploying with $deployment_type configuration..."
    
    # Stop existing containers
    echo "🛑 Stopping existing containers..."
    docker-compose -f $config_file down
    
    # Build images
    echo "🔨 Building Docker images..."
    docker-compose -f $config_file build --no-cache
    
    # Start services
    echo "🚀 Starting services..."
    docker-compose -f $config_file up -d
    
    # Wait for services to be ready
    echo "⏳ Waiting for services to be ready..."
    sleep 30
    
    # Check service health
    echo "🔍 Checking service health..."
    
    # Check frontend
    if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
        echo "✅ Frontend is healthy"
    else
        echo "❌ Frontend health check failed"
    fi
    
    # Check backend
    if curl -f http://localhost:8000/health > /dev/null 2>&1; then
        echo "✅ Backend is healthy"
    else
        echo "❌ Backend health check failed"
    fi
    
    echo "🎉 Deployment completed!"
    echo "📱 Frontend: http://localhost:3000"
    echo "🔧 Backend API: http://localhost:8000"
    echo "📊 Database: localhost:5432"
    echo "🗄️ Redis: localhost:6379"
}

# Parse command line arguments
case "$1" in
    "simple"|"")
        deploy "docker-compose.simple.yml" "Simple"
        ;;
    "dev")
        deploy "docker-compose.yml" "Development"
        ;;
    "prod")
        deploy "docker-compose.prod.yml" "Production"
        ;;
    "stop")
        echo "🛑 Stopping all services..."
        docker-compose -f docker-compose.simple.yml down
        docker-compose -f docker-compose.yml down
        docker-compose -f docker-compose.prod.yml down
        echo "✅ All services stopped"
        ;;
    "logs")
        echo "📋 Showing logs..."
        docker-compose -f docker-compose.simple.yml logs -f
        ;;
    "clean")
        echo "🧹 Cleaning up Docker resources..."
        docker-compose -f docker-compose.simple.yml down -v
        docker-compose -f docker-compose.yml down -v
        docker-compose -f docker-compose.prod.yml down -v
        docker system prune -f
        echo "✅ Cleanup completed"
        ;;
    *)
        echo "Usage: $0 {simple|dev|prod|stop|logs|clean}"
        echo ""
        echo "Commands:"
        echo "  simple  - Deploy with simple configuration (default)"
        echo "  dev     - Deploy with development configuration"
        echo "  prod    - Deploy with production configuration"
        echo "  stop    - Stop all running services"
        echo "  logs    - Show service logs"
        echo "  clean   - Clean up all Docker resources"
        exit 1
        ;;
esac