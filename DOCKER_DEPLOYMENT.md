# 🐳 Docker Deployment Guide

## Quick Start

### Windows (PowerShell)
```powershell
# Simple deployment (recommended for testing)
.\deploy-docker.ps1 simple

# Development deployment (with monitoring)
.\deploy-docker.ps1 dev

# Production deployment (full stack)
.\deploy-docker.ps1 prod
```

### Linux/Mac (Bash)
```bash
# Make script executable
chmod +x deploy-docker.sh

# Simple deployment (recommended for testing)
./deploy-docker.sh simple

# Development deployment (with monitoring)
./deploy-docker.sh dev

# Production deployment (full stack)
./deploy-docker.sh prod
```

## Manual Deployment

### 1. Simple Deployment (Recommended)
```bash
# Build and start services
docker-compose -f docker-compose.simple.yml up -d --build

# Check status
docker-compose -f docker-compose.simple.yml ps

# View logs
docker-compose -f docker-compose.simple.yml logs -f
```

### 2. Development Deployment
```bash
# Full development stack with monitoring
docker-compose up -d --build
```

### 3. Production Deployment
```bash
# Production-ready with load balancing and monitoring
docker-compose -f docker-compose.prod.yml up -d --build
```

## Services & Ports

### Simple Deployment
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

### Development Deployment
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001

### Production Deployment
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Nginx**: http://localhost:80, https://localhost:443
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001
- **Kibana**: http://localhost:5601

## Environment Variables

Create a `.env` file in the root directory:

```env
# Database
POSTGRES_PASSWORD=your-secure-password

# Security
SECRET_KEY=your-super-secret-key-change-this

# Monitoring
GRAFANA_PASSWORD=admin123

# Email (Optional)
SENDGRID_API_KEY=your-sendgrid-key

# SMS (Optional)
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token

# Error Tracking (Optional)
SENTRY_DSN=your-sentry-dsn
```

## Management Commands

### Stop Services
```bash
# Windows
.\deploy-docker.ps1 stop

# Linux/Mac
./deploy-docker.sh stop
```

### View Logs
```bash
# Windows
.\deploy-docker.ps1 logs

# Linux/Mac
./deploy-docker.sh logs
```

### Clean Up
```bash
# Windows
.\deploy-docker.ps1 clean

# Linux/Mac
./deploy-docker.sh clean
```

## Health Checks

### Frontend Health
```bash
curl http://localhost:3000/api/health
```

### Backend Health
```bash
curl http://localhost:8000/health
```

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Check what's using the port
   netstat -tulpn | grep :3000
   
   # Kill the process
   sudo kill -9 <PID>
   ```

2. **Docker Build Fails**
   ```bash
   # Clean Docker cache
   docker system prune -a
   
   # Rebuild without cache
   docker-compose build --no-cache
   ```

3. **Database Connection Issues**
   ```bash
   # Check PostgreSQL logs
   docker-compose logs postgres
   
   # Reset database
   docker-compose down -v
   docker-compose up -d
   ```

4. **Frontend Build Errors**
   ```bash
   # Check frontend logs
   docker-compose logs frontend
   
   # Rebuild frontend
   docker-compose build --no-cache frontend
   ```

### Performance Optimization

1. **Increase Docker Resources**
   - Memory: 4GB minimum, 8GB recommended
   - CPU: 2 cores minimum, 4 cores recommended

2. **Database Optimization**
   ```sql
   -- Connect to PostgreSQL
   docker exec -it <postgres_container> psql -U postgres -d ipo_gmp_analyzer
   
   -- Check database size
   SELECT pg_size_pretty(pg_database_size('ipo_gmp_analyzer'));
   
   -- Optimize tables
   VACUUM ANALYZE;
   ```

3. **Redis Optimization**
   ```bash
   # Check Redis memory usage
   docker exec -it <redis_container> redis-cli info memory
   
   # Clear cache if needed
   docker exec -it <redis_container> redis-cli flushall
   ```

## Monitoring

### Grafana Dashboard
1. Open http://localhost:3001
2. Login: admin / admin123 (or your custom password)
3. Import dashboard from `monitoring/grafana/dashboards/`

### Prometheus Metrics
1. Open http://localhost:9090
2. Query metrics:
   - `up` - Service availability
   - `http_requests_total` - Request count
   - `http_request_duration_seconds` - Response time

## Backup & Restore

### Database Backup
```bash
# Create backup
docker exec <postgres_container> pg_dump -U postgres ipo_gmp_analyzer > backup.sql

# Restore backup
docker exec -i <postgres_container> psql -U postgres ipo_gmp_analyzer < backup.sql
```

### Volume Backup
```bash
# Backup volumes
docker run --rm -v ipo_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup.tar.gz /data

# Restore volumes
docker run --rm -v ipo_postgres_data:/data -v $(pwd):/backup alpine tar xzf /backup/postgres_backup.tar.gz -C /
```

## Security Considerations

1. **Change Default Passwords**
   - PostgreSQL password
   - Grafana admin password
   - Application secret key

2. **Network Security**
   - Use custom Docker networks
   - Limit exposed ports
   - Enable SSL/TLS in production

3. **Container Security**
   - Run containers as non-root users
   - Use official base images
   - Regular security updates

## Production Deployment

For production deployment:

1. **Use Production Configuration**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

2. **Set Up SSL/TLS**
   - Configure SSL certificates in `nginx/ssl/`
   - Update `nginx/nginx.prod.conf`

3. **Configure Domain**
   - Update environment variables
   - Set up DNS records
   - Configure reverse proxy

4. **Enable Monitoring**
   - Set up alerts in Grafana
   - Configure log aggregation
   - Monitor resource usage

## Support

For issues and questions:
- Check logs: `docker-compose logs <service>`
- GitHub Issues: [Create an issue](https://github.com/your-repo/issues)
- Documentation: [Full Documentation](README.md)