# 🚀 Quick Docker Setup

## Prerequisites
1. **Install Docker Desktop** from https://www.docker.com/products/docker-desktop/
2. **Start Docker Desktop** and wait for it to be ready

## Simple Deployment (Recommended)

### Step 1: Start Docker Desktop
Make sure Docker Desktop is running (you'll see the Docker icon in your system tray).

### Step 2: Deploy with PowerShell
```powershell
# Navigate to your project directory
cd C:\Users\ASUS\OneDrive\Desktop\ipo

# Deploy the application
.\deploy-docker.ps1 simple
```

### Step 3: Access Your Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Database**: localhost:5432
- **Redis**: localhost:6379

## Manual Deployment

If the script doesn't work, run these commands manually:

```powershell
# Build and start services
docker-compose -f docker-compose.simple.yml up -d --build

# Check if services are running
docker-compose -f docker-compose.simple.yml ps

# View logs
docker-compose -f docker-compose.simple.yml logs -f

# Stop services
docker-compose -f docker-compose.simple.yml down
```

## Troubleshooting

### Docker Desktop Not Running
```
Error: error during connect: Head "http://%2F%2F.%2Fpipe%2FdockerDesktopLinuxEngine/_ping"
```
**Solution**: Start Docker Desktop and wait for it to be ready.

### Port Already in Use
```
Error: Port 3000 is already in use
```
**Solution**: 
```powershell
# Find what's using the port
netstat -ano | findstr :3000

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

### Build Failures
```powershell
# Clean Docker cache
docker system prune -a

# Rebuild without cache
docker-compose -f docker-compose.simple.yml build --no-cache
```

## What Gets Deployed

The simple deployment includes:
- ✅ **Next.js Frontend** (Port 3000)
- ✅ **Python Backend** (Port 8000)
- ✅ **PostgreSQL Database** (Port 5432)
- ✅ **Redis Cache** (Port 6379)

## Next Steps

1. **Test the Application**: Visit http://localhost:3000
2. **Check API**: Visit http://localhost:8000/docs for API documentation
3. **Monitor Logs**: Use `docker-compose -f docker-compose.simple.yml logs -f`
4. **Stop When Done**: Use `.\deploy-docker.ps1 stop`

## Production Deployment

For production deployment with monitoring and load balancing:
```powershell
.\deploy-docker.ps1 prod
```

This includes:
- Load balancer (Nginx)
- Monitoring (Prometheus + Grafana)
- Log aggregation (ELK Stack)
- Health checks and auto-restart