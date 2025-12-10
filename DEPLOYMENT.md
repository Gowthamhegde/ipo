# IPO GMP Analyzer - Deployment Guide

## Overview
This guide covers deployment options for the IPO GMP Analyzer system on various platforms including AWS, Render, and local Docker setup.

## Architecture
```
Frontend (Next.js) ↔ Backend (FastAPI) ↔ Database (PostgreSQL)
                           ↓
                    Cache (Redis)
                           ↓
                    Background Jobs (Celery)
                           ↓
                    External APIs (NSE, BSE, etc.)
```

## Prerequisites
- Docker and Docker Compose
- Node.js 18+ and Python 3.11+
- PostgreSQL 15+ and Redis 7+
- AWS CLI (for AWS deployment)

## Local Development Setup

### 1. Clone and Setup
```bash
git clone <repository-url>
cd ipo-gmp-analyzer

# Backend setup
cd backend
cp .env.example .env
# Edit .env with your configuration
pip install -r requirements.txt

# Frontend setup
cd ..
npm install
```

### 2. Database Setup
```bash
# Start PostgreSQL and Redis
docker-compose up -d db redis

# Run migrations
cd backend
alembic upgrade head
```

### 3. Start Services
```bash
# Terminal 1: Backend
cd backend
uvicorn main:app --reload

# Terminal 2: Frontend
npm run dev

# Terminal 3: Background tasks
cd backend
python -m tasks.scheduler
```

## Docker Deployment

### Full Stack with Docker Compose
```bash
# Start all services
docker-compose -f deployment/docker-compose.yml up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Individual Service Build
```bash
# Backend
cd backend
docker build -t ipo-analyzer-backend .

# Frontend
docker build -t ipo-analyzer-frontend .
```

## AWS Deployment

### 1. Prerequisites
- AWS CLI configured
- ECR repositories created
- RDS PostgreSQL instance
- ElastiCache Redis cluster
- ECS cluster setup

### 2. Build and Push Images
```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account>.dkr.ecr.us-east-1.amazonaws.com

# Build and push backend
cd backend
docker build -t ipo-analyzer-backend .
docker tag ipo-analyzer-backend:latest <account>.dkr.ecr.us-east-1.amazonaws.com/ipo-analyzer-backend:latest
docker push <account>.dkr.ecr.us-east-1.amazonaws.com/ipo-analyzer-backend:latest

# Build and push frontend
cd ..
docker build -t ipo-analyzer-frontend .
docker tag ipo-analyzer-frontend:latest <account>.dkr.ecr.us-east-1.amazonaws.com/ipo-analyzer-frontend:latest
docker push <account>.dkr.ecr.us-east-1.amazonaws.com/ipo-analyzer-frontend:latest
```

### 3. Infrastructure Setup
```bash
# Create RDS instance
aws rds create-db-instance \
  --db-instance-identifier ipo-analyzer-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username postgres \
  --master-user-password <password> \
  --allocated-storage 20

# Create ElastiCache cluster
aws elasticache create-cache-cluster \
  --cache-cluster-id ipo-analyzer-redis \
  --cache-node-type cache.t3.micro \
  --engine redis \
  --num-cache-nodes 1
```

### 4. ECS Task Definition
Use the configuration in `deployment/aws-deploy.yml` to create ECS task definitions and services.

### 5. Environment Variables
Store sensitive configuration in AWS Systems Manager Parameter Store:
```bash
aws ssm put-parameter --name "/ipo-analyzer/database-url" --value "<database-url>" --type "SecureString"
aws ssm put-parameter --name "/ipo-analyzer/secret-key" --value "<secret-key>" --type "SecureString"
```

## Render Deployment

### 1. Repository Setup
- Connect your GitHub repository to Render
- Use the configuration in `deployment/render-deploy.yml`

### 2. Service Creation
1. **Backend Web Service**
   - Environment: Python
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - Root Directory: `backend`

2. **Frontend Web Service**
   - Environment: Node
   - Build Command: `npm ci && npm run build`
   - Start Command: `npm start`

3. **PostgreSQL Database**
   - Create a PostgreSQL database service
   - Note the connection string for backend configuration

4. **Redis Cache**
   - Create a Redis service
   - Note the connection string for backend configuration

### 3. Environment Variables
Configure the following environment variables in Render:
- `DATABASE_URL`: From PostgreSQL service
- `REDIS_URL`: From Redis service
- `SECRET_KEY`: Generate a secure key
- `EMAIL_USER`, `EMAIL_PASSWORD`: SMTP credentials
- `TWILIO_SID`, `TWILIO_TOKEN`: SMS service credentials

### 4. Background Jobs
Set up cron jobs for:
- Data fetching: Every 2 hours
- GMP validation: Every 30 minutes
- Daily notifications: Once daily

## Production Configuration

### Environment Variables
```bash
# Required
DATABASE_URL=postgresql://user:pass@host:5432/dbname
REDIS_URL=redis://host:6379
SECRET_KEY=your-super-secret-key

# Email (SMTP)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# SMS (Twilio)
TWILIO_SID=your-twilio-sid
TWILIO_TOKEN=your-twilio-token
TWILIO_PHONE=+1234567890

# Optional
PUSH_SERVICE_URL=https://your-push-service.com
PUSH_API_KEY=your-push-api-key
```

### Security Considerations
1. **Use HTTPS**: Always use SSL/TLS in production
2. **Secure Secrets**: Store sensitive data in secure vaults
3. **Database Security**: Use connection pooling and read replicas
4. **Rate Limiting**: Implement API rate limiting
5. **Monitoring**: Set up logging and monitoring
6. **Backup**: Regular database backups

### Performance Optimization
1. **Caching**: Redis for API responses and session data
2. **CDN**: Use CloudFront or similar for static assets
3. **Database**: Optimize queries and use indexes
4. **Background Jobs**: Use Celery for heavy tasks
5. **Load Balancing**: Multiple instances behind load balancer

### Monitoring and Logging
1. **Application Logs**: Structured logging with log levels
2. **Error Tracking**: Sentry or similar service
3. **Performance Monitoring**: APM tools
4. **Health Checks**: Endpoint monitoring
5. **Alerts**: Set up alerts for critical issues

### Backup and Recovery
1. **Database Backups**: Automated daily backups
2. **Code Backups**: Version control with Git
3. **Configuration Backups**: Infrastructure as Code
4. **Disaster Recovery**: Multi-region setup for critical systems

## Scaling Considerations

### Horizontal Scaling
- Multiple backend instances behind load balancer
- Database read replicas for read-heavy operations
- Redis cluster for high availability
- CDN for static content delivery

### Vertical Scaling
- Increase instance sizes based on load
- Monitor CPU, memory, and database performance
- Optimize database queries and indexes

### Cost Optimization
- Use spot instances for non-critical workloads
- Implement auto-scaling based on demand
- Regular cost analysis and optimization
- Use reserved instances for predictable workloads

## Troubleshooting

### Common Issues
1. **Database Connection**: Check connection strings and network access
2. **Redis Connection**: Verify Redis service is running
3. **API Errors**: Check logs for detailed error messages
4. **Background Jobs**: Ensure Celery workers are running
5. **External APIs**: Handle rate limits and timeouts

### Debug Commands
```bash
# Check service status
docker-compose ps

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Database connection test
python -c "from database import engine; print(engine.execute('SELECT 1').scalar())"

# Redis connection test
python -c "from utils.cache import cache_manager; cache_manager.set('test', 'value'); print(cache_manager.get('test'))"
```

### Performance Monitoring
- Monitor API response times
- Track database query performance
- Monitor memory and CPU usage
- Set up alerts for high error rates

## Support and Maintenance

### Regular Tasks
1. **Security Updates**: Keep dependencies updated
2. **Database Maintenance**: Regular VACUUM and ANALYZE
3. **Log Rotation**: Prevent log files from growing too large
4. **Performance Review**: Regular performance analysis
5. **Backup Verification**: Test backup restoration procedures

### Monitoring Checklist
- [ ] All services are running
- [ ] Database connections are healthy
- [ ] Redis cache is operational
- [ ] Background jobs are processing
- [ ] External API calls are successful
- [ ] Error rates are within acceptable limits
- [ ] Response times are optimal