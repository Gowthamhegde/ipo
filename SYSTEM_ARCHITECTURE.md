# IPO GMP Analyzer - System Architecture

## Overview
The IPO GMP Analyzer is a comprehensive system for tracking, validating, and analyzing Grey Market Premium (GMP) data for Indian stock market IPOs. The system provides real-time notifications, ML-based predictions, and intelligent filtering for profitable investment opportunities.

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                 USER LAYER                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│  Web Browser  │  Mobile App  │  Email Client  │  SMS  │  Push Notifications    │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND LAYER                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                            Next.js Application                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│  │ Dashboard   │  │ IPO Cards   │  │ Filters     │  │ Analytics   │           │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│  │ User Auth   │  │ Preferences │  │ Notifications│  │ Admin Panel │           │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘           │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                               API GATEWAY                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                    FastAPI Backend Application                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│  │ Auth API    │  │ IPO API     │  │ User API    │  │ Admin API   │           │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│  │ GMP API     │  │ Predict API │  │ Notify API  │  │ Health API  │           │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘           │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                    ┌───────────────────┼───────────────────┐
                    ▼                   ▼                   ▼
┌─────────────────────────┐  ┌─────────────────────────┐  ┌─────────────────────────┐
│     SERVICE LAYER       │  │    BACKGROUND JOBS      │  │    NOTIFICATION         │
├─────────────────────────┤  ├─────────────────────────┤  ├─────────────────────────┤
│ ┌─────────────────────┐ │  │ ┌─────────────────────┐ │  │ ┌─────────────────────┐ │
│ │   Data Fetcher      │ │  │ │   Scheduler         │ │  │ │   Email Service     │ │
│ │ - NSE, BSE APIs     │ │  │ │ - Cron Jobs         │ │  │ │ - SMTP              │ │
│ │ - Chittorgarh       │ │  │ │ - Celery Workers    │ │  │ │ - Templates         │ │
│ │ - IPOWatch          │ │  │ │ - Task Queue        │ │  │ └─────────────────────┘ │
│ └─────────────────────┘ │  │ └─────────────────────┘ │  │ ┌─────────────────────┐ │
│ ┌─────────────────────┐ │  │ ┌─────────────────────┐ │  │ │   SMS Service       │ │
│ │   GMP Validator     │ │  │ │   Data Refresh      │ │  │ │ - Twilio            │ │
│ │ - Cross Validation  │ │  │ │ - Every 2 hours     │ │  │ │ - Message Queue     │ │
│ │ - Confidence Score  │ │  │ │ - Error Handling    │ │  │ └─────────────────────┘ │
│ │ - Outlier Detection │ │  │ └─────────────────────┘ │  │ ┌─────────────────────┐ │
│ └─────────────────────┘ │  │ ┌─────────────────────┐ │  │ │   Push Service      │ │
│ ┌─────────────────────┐ │  │ │   GMP Validation    │ │  │ │ - FCM/APNS          │ │
│ │   ML Predictor      │ │  │ │ - Every 30 min      │ │  │ │ - Web Push          │ │
│ │ - Random Forest     │ │  │ │ - Spike Detection   │ │  │ └─────────────────────┘ │
│ │ - Gradient Boost    │ │  │ └─────────────────────┘ │  └─────────────────────────┘
│ │ - Feature Engineer  │ │  │ ┌─────────────────────┐ │
│ └─────────────────────┘ │  │ │   Notifications     │ │
└─────────────────────────┘  │ │ - Daily Reminders   │ │
                             │ │ - Profitable IPOs   │ │
                             │ └─────────────────────┘ │
                             └─────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                               DATA LAYER                                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────┐  ┌─────────────────────────┐  ┌─────────────────────┐ │
│ │    PostgreSQL DB        │  │      Redis Cache        │  │    File Storage     │ │
│ │ ┌─────────────────────┐ │  │ ┌─────────────────────┐ │  │ ┌─────────────────────┐ │
│ │ │ IPOs Table          │ │  │ │ API Responses       │ │  │ │ ML Models           │ │
│ │ │ - Basic Info        │ │  │ │ - 30min TTL         │ │  │ │ - Trained Models    │ │
│ │ │ - Dates & Status    │ │  │ │ - Source Data       │ │  │ │ - Preprocessors     │ │
│ │ └─────────────────────┘ │  │ └─────────────────────┘ │  │ └─────────────────────┘ │
│ │ ┌─────────────────────┐ │  │ ┌─────────────────────┐ │  │ ┌─────────────────────┐ │
│ │ │ GMP Data Table      │ │  │ │ User Sessions       │ │  │ │ Logs & Analytics    │ │
│ │ │ - Multi-source      │ │  │ │ - Auth Tokens       │ │  │ │ - Application Logs  │ │
│ │ │ - Timestamps        │ │  │ │ - Preferences       │ │  │ │ - Error Tracking    │ │
│ │ └─────────────────────┘ │  │ └─────────────────────┘ │  │ └─────────────────────┘ │
│ │ ┌─────────────────────┐ │  └─────────────────────────┘  └─────────────────────────┘ │
│ │ │ Users & Preferences │ │                                                         │
│ │ │ - Auth Data         │ │                                                         │
│ │ │ - Notification Prefs│ │                                                         │
│ │ └─────────────────────┘ │                                                         │
│ │ ┌─────────────────────┐ │                                                         │
│ │ │ Notifications Log   │ │                                                         │
│ │ │ - Delivery Status   │ │                                                         │
│ │ │ - User Interactions │ │                                                         │
│ │ └─────────────────────┘ │                                                         │
│ └─────────────────────────┘                                                         │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            EXTERNAL SERVICES                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────┐  ┌─────────────────────────┐  ┌─────────────────────┐ │
│ │    Stock Exchanges      │  │    GMP Data Sources     │  │   Market Data APIs  │ │
│ │ ┌─────────────────────┐ │  │ ┌─────────────────────┐ │  │ ┌─────────────────────┐ │
│ │ │ NSE API             │ │  │ │ Chittorgarh.com     │ │  │ │ Yahoo Finance       │ │
│ │ │ - IPO Listings      │ │  │ │ - GMP Data          │ │  │ │ - Market Indices    │ │
│ │ │ - Official Data     │ │  │ │ - Historical Data   │ │  │ │ - Sector Data       │ │
│ │ └─────────────────────┘ │  │ └─────────────────────┘ │  │ └─────────────────────┘ │
│ │ ┌─────────────────────┐ │  │ ┌─────────────────────┐ │  │ ┌─────────────────────┐ │
│ │ │ BSE API             │ │  │ │ IPOWatch.in         │ │  │ │ Economic Indicators │ │
│ │ │ - IPO Data          │ │  │ │ - Real-time GMP     │ │  │ │ - VIX, FII/DII      │ │
│ │ │ - Corporate Actions │ │  │ │ - Market Sentiment  │ │  │ │ - News Sentiment    │ │
│ │ └─────────────────────┘ │  │ └─────────────────────┘ │  │ └─────────────────────┘ │
│ └─────────────────────────┘  └─────────────────────────┘  └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Frontend Layer (Next.js)
- **Dashboard**: Main interface showing IPO overview and statistics
- **IPO Cards**: Detailed IPO information with GMP data and predictions
- **Filter Panel**: Advanced filtering options for users
- **User Management**: Authentication, preferences, and profile management
- **Admin Panel**: System monitoring and configuration

### 2. Backend API (FastAPI)
- **RESTful APIs**: Standard HTTP endpoints for all operations
- **Authentication**: JWT-based user authentication and authorization
- **Data Validation**: Pydantic models for request/response validation
- **Error Handling**: Comprehensive error handling and logging
- **Rate Limiting**: API rate limiting to prevent abuse

### 3. Data Services
- **Data Fetcher**: Multi-source data collection from NSE, BSE, Chittorgarh, IPOWatch
- **GMP Validator**: Cross-source validation with confidence scoring
- **ML Predictor**: Machine learning models for listing gain prediction
- **Notification Service**: Multi-channel notification delivery

### 4. Background Processing
- **Scheduler**: Cron-based task scheduling using Celery
- **Data Refresh**: Automated data updates every 2 hours
- **GMP Validation**: Real-time validation every 30 minutes
- **Notification Processing**: Asynchronous notification delivery

### 5. Data Storage
- **PostgreSQL**: Primary database for structured data
- **Redis**: Caching layer for performance optimization
- **File Storage**: ML models, logs, and static assets

## Data Flow

### 1. Data Collection Flow
```
External APIs → Data Fetcher → Raw Data → GMP Validator → Validated Data → Database
```

### 2. User Request Flow
```
User → Frontend → API Gateway → Service Layer → Database → Response → Frontend → User
```

### 3. Notification Flow
```
Background Job → Check Criteria → Generate Notification → Queue → Delivery Service → User
```

### 4. ML Prediction Flow
```
Historical Data → Feature Engineering → Model Training → Prediction → API Response
```

## Key Features Implementation

### 1. Multi-Source GMP Validation
- **Data Sources**: NSE, BSE, Chittorgarh, IPOWatch
- **Validation Logic**: Cross-source comparison with outlier detection
- **Confidence Scoring**: Weighted average based on source reliability
- **Real-time Updates**: 30-minute validation cycles

### 2. Profitability Criteria
- **Percentage Threshold**: GMP ≥ 10% of issue price
- **Absolute Threshold**: GMP ≥ ₹20
- **Combined Logic**: Either condition triggers profitable status
- **User Customization**: Adjustable thresholds per user

### 3. Smart Notifications
- **Trigger Conditions**: New IPO, GMP spike (≥8%), listing reminder, profitable IPO
- **Delivery Channels**: Email, SMS, Push notifications
- **User Preferences**: Customizable filters and delivery options
- **Rate Limiting**: Prevent notification spam

### 4. ML-Based Predictions
- **Features**: Issue size, GMP trend, market sentiment, industry performance
- **Models**: Random Forest, Gradient Boosting ensemble
- **Training Data**: 5+ years of historical IPO data
- **Accuracy Tracking**: Model performance monitoring and retraining

## Security Architecture

### 1. Authentication & Authorization
- **JWT Tokens**: Stateless authentication with expiration
- **Role-Based Access**: User and admin role separation
- **Password Security**: Bcrypt hashing with salt
- **Session Management**: Redis-based session storage

### 2. Data Protection
- **Input Validation**: Comprehensive input sanitization
- **SQL Injection Prevention**: Parameterized queries with SQLAlchemy
- **XSS Protection**: Content Security Policy headers
- **HTTPS Enforcement**: SSL/TLS encryption for all communications

### 3. API Security
- **Rate Limiting**: Request throttling per user/IP
- **CORS Configuration**: Restricted cross-origin requests
- **API Key Management**: Secure external API key storage
- **Error Handling**: No sensitive information in error responses

## Performance Optimization

### 1. Caching Strategy
- **Redis Cache**: API responses, user sessions, computed data
- **TTL Management**: Appropriate cache expiration times
- **Cache Invalidation**: Smart cache updates on data changes
- **Memory Management**: Efficient cache size limits

### 2. Database Optimization
- **Indexing**: Strategic database indexes for query performance
- **Connection Pooling**: Efficient database connection management
- **Query Optimization**: Optimized SQL queries and ORM usage
- **Read Replicas**: Separate read/write database instances

### 3. Background Processing
- **Async Operations**: Non-blocking I/O for external API calls
- **Task Queues**: Celery for heavy computational tasks
- **Batch Processing**: Efficient bulk data operations
- **Error Recovery**: Retry logic for failed operations

## Scalability Considerations

### 1. Horizontal Scaling
- **Stateless Design**: No server-side state dependencies
- **Load Balancing**: Multiple backend instances
- **Database Sharding**: Horizontal database partitioning
- **CDN Integration**: Static asset delivery optimization

### 2. Vertical Scaling
- **Resource Monitoring**: CPU, memory, and I/O tracking
- **Auto-scaling**: Dynamic resource allocation
- **Performance Metrics**: Response time and throughput monitoring
- **Capacity Planning**: Proactive resource planning

### 3. Microservices Architecture
- **Service Separation**: Independent service deployment
- **API Gateway**: Centralized request routing
- **Service Discovery**: Dynamic service location
- **Circuit Breakers**: Fault tolerance patterns

## Monitoring & Observability

### 1. Application Monitoring
- **Health Checks**: Service availability monitoring
- **Performance Metrics**: Response times, error rates
- **Business Metrics**: User engagement, notification delivery
- **Custom Dashboards**: Real-time system overview

### 2. Logging Strategy
- **Structured Logging**: JSON-formatted log entries
- **Log Levels**: Appropriate logging granularity
- **Centralized Logging**: Aggregated log collection
- **Log Retention**: Appropriate log storage policies

### 3. Error Tracking
- **Exception Monitoring**: Automatic error detection
- **Error Aggregation**: Similar error grouping
- **Alert Configuration**: Critical error notifications
- **Root Cause Analysis**: Detailed error context

## Deployment Architecture

### 1. Container Strategy
- **Docker Containers**: Consistent deployment environments
- **Multi-stage Builds**: Optimized container images
- **Health Checks**: Container health monitoring
- **Resource Limits**: Container resource constraints

### 2. Orchestration
- **Docker Compose**: Local development orchestration
- **Kubernetes**: Production container orchestration
- **Service Mesh**: Inter-service communication
- **Rolling Updates**: Zero-downtime deployments

### 3. Infrastructure as Code
- **Terraform**: Infrastructure provisioning
- **Ansible**: Configuration management
- **CI/CD Pipelines**: Automated deployment workflows
- **Environment Parity**: Consistent environments across stages

## Disaster Recovery

### 1. Backup Strategy
- **Database Backups**: Automated daily backups
- **Point-in-time Recovery**: Transaction log backups
- **Cross-region Replication**: Geographic backup distribution
- **Backup Testing**: Regular restore procedure validation

### 2. High Availability
- **Multi-AZ Deployment**: Availability zone redundancy
- **Load Balancer Health Checks**: Automatic failover
- **Database Clustering**: Master-slave replication
- **Circuit Breakers**: Graceful degradation

### 3. Recovery Procedures
- **RTO/RPO Targets**: Recovery time and data loss objectives
- **Runbook Documentation**: Step-by-step recovery procedures
- **Disaster Recovery Testing**: Regular DR drills
- **Communication Plans**: Incident response procedures