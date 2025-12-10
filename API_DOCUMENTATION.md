# IPO GMP Analyzer - API Documentation

## Overview
This document provides comprehensive API documentation for the IPO GMP Analyzer backend service. The API is built using FastAPI and provides endpoints for IPO data management, GMP tracking, user management, and notifications.

## Base URL
- **Development**: `http://localhost:8000`
- **Production**: `https://your-domain.com/api`

## Authentication
The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## API Endpoints

### Authentication

#### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "securepassword123",
  "preferences": {
    "min_profit_percentage": 10.0,
    "min_absolute_profit": 20.0,
    "preferred_industries": ["Technology", "Healthcare"],
    "risk_level": "medium",
    "notification_channels": {
      "email": true,
      "sms": false,
      "push": true
    },
    "gmp_spike_threshold": 8.0
  }
}
```

**Response:**
```json
{
  "id": 1,
  "email": "user@example.com",
  "name": "John Doe",
  "is_active": true,
  "preferences": {...},
  "created_at": "2024-01-15T10:30:00Z"
}
```

#### POST /auth/login
Authenticate user and receive access token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

### IPO Management

#### GET /ipos
Retrieve list of IPOs with optional filtering.

**Query Parameters:**
- `skip` (int, optional): Number of records to skip (default: 0)
- `limit` (int, optional): Maximum number of records to return (default: 100)
- `status` (string, optional): Filter by IPO status (upcoming, open, closed, listed)

**Response:**
```json
[
  {
    "id": 1,
    "name": "TechCorp IPO",
    "company_name": "TechCorp Solutions Ltd",
    "issue_price_min": 100,
    "issue_price_max": 105,
    "issue_size": 2500,
    "lot_size": 100,
    "open_date": "2024-01-15T00:00:00Z",
    "close_date": "2024-01-17T00:00:00Z",
    "listing_date": "2024-01-22T00:00:00Z",
    "status": "open",
    "industry": "Technology",
    "current_gmp": 45.0,
    "gmp_percentage": 43.2,
    "confidence_score": 0.85,
    "is_profitable": true,
    "created_at": "2024-01-10T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
]
```

#### GET /ipos/{ipo_id}
Retrieve detailed information for a specific IPO.

**Path Parameters:**
- `ipo_id` (int): IPO identifier

**Response:**
```json
{
  "id": 1,
  "name": "TechCorp IPO",
  "company_name": "TechCorp Solutions Ltd",
  "issue_price_min": 100,
  "issue_price_max": 105,
  "issue_size": 2500,
  "lot_size": 100,
  "open_date": "2024-01-15T00:00:00Z",
  "close_date": "2024-01-17T00:00:00Z",
  "listing_date": "2024-01-22T00:00:00Z",
  "status": "open",
  "industry": "Technology",
  "lead_managers": "ICICI Securities, Kotak Mahindra Capital",
  "registrar": "Link Intime India",
  "current_gmp": 45.0,
  "gmp_percentage": 43.2,
  "confidence_score": 0.85,
  "is_profitable": true,
  "created_at": "2024-01-10T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

#### GET /ipos/{ipo_id}/gmp
Retrieve GMP history for a specific IPO.

**Path Parameters:**
- `ipo_id` (int): IPO identifier

**Response:**
```json
[
  {
    "id": 1,
    "ipo_id": 1,
    "source": "chittorgarh",
    "gmp_value": 45.0,
    "gmp_percentage": 43.2,
    "timestamp": "2024-01-15T10:30:00Z",
    "is_valid": true,
    "confidence": 0.9
  },
  {
    "id": 2,
    "ipo_id": 1,
    "source": "ipowatch",
    "gmp_value": 47.0,
    "gmp_percentage": 45.1,
    "timestamp": "2024-01-15T10:25:00Z",
    "is_valid": true,
    "confidence": 0.8
  }
]
```

#### POST /ipos/refresh
Manually trigger IPO data refresh from all sources.

**Headers:**
- `Authorization: Bearer <token>` (Admin required)

**Response:**
```json
{
  "message": "Data refresh initiated"
}
```

### ML Predictions

#### GET /ipos/{ipo_id}/prediction
Get ML-based listing gain prediction for an IPO.

**Path Parameters:**
- `ipo_id` (int): IPO identifier

**Response:**
```json
{
  "ipo_id": 1,
  "predicted_gain_percentage": 38.5,
  "confidence_score": 0.82,
  "factors": [
    {
      "factor": "High GMP",
      "value": "₹45",
      "impact": "Positive",
      "weight": 0.8
    },
    {
      "factor": "Tech Sector Demand",
      "value": "Strong",
      "impact": "Positive",
      "weight": 0.7
    },
    {
      "factor": "Market Sentiment",
      "value": "75%",
      "impact": "Positive",
      "weight": 0.6
    }
  ]
}
```

### User Management

#### PUT /users/preferences
Update user notification preferences.

**Headers:**
- `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "min_profit_percentage": 15.0,
  "min_absolute_profit": 25.0,
  "preferred_industries": ["Technology", "Healthcare", "Financial Services"],
  "risk_level": "high",
  "notification_channels": {
    "email": true,
    "sms": true,
    "push": true
  },
  "gmp_spike_threshold": 10.0
}
```

**Response:**
```json
{
  "message": "Preferences updated successfully"
}
```

### Notifications

#### GET /notifications
Retrieve user notifications.

**Headers:**
- `Authorization: Bearer <token>`

**Query Parameters:**
- `limit` (int, optional): Maximum number of notifications (default: 50)
- `unread_only` (bool, optional): Filter unread notifications only

**Response:**
```json
[
  {
    "id": 1,
    "user_id": 1,
    "ipo_id": 1,
    "type": "gmp_spike",
    "title": "GMP Alert: TechCorp IPO",
    "message": "GMP increased by 12% in the last hour",
    "is_sent": true,
    "is_read": false,
    "sent_at": "2024-01-15T10:30:00Z",
    "created_at": "2024-01-15T10:30:00Z",
    "email_sent": true,
    "sms_sent": false,
    "push_sent": true
  }
]
```

#### PUT /notifications/{notification_id}/read
Mark a notification as read.

**Headers:**
- `Authorization: Bearer <token>`

**Path Parameters:**
- `notification_id` (int): Notification identifier

**Response:**
```json
{
  "message": "Notification marked as read"
}
```

### Admin Endpoints

#### GET /admin/stats
Get system statistics for admin dashboard.

**Headers:**
- `Authorization: Bearer <token>` (Admin required)

**Response:**
```json
{
  "total_ipos": 156,
  "active_ipos": 23,
  "total_users": 1247,
  "notifications_sent_today": 3456,
  "avg_gmp_accuracy": 94.5,
  "system_health": {
    "status": "healthy",
    "uptime": 99.8,
    "active_data_sources": 4,
    "total_data_sources": 4,
    "last_data_update": "2024-01-15T10:30:00Z",
    "pending_notifications": 12,
    "error_rate": 0.2
  },
  "last_update": "2024-01-15T10:30:00Z"
}
```

#### GET /admin/data-sources
Get status of all data sources.

**Headers:**
- `Authorization: Bearer <token>` (Admin required)

**Response:**
```json
[
  {
    "name": "chittorgarh",
    "is_active": true,
    "last_fetch": "2024-01-15T10:00:00Z",
    "success_rate": 98.5,
    "avg_response_time": 1.2,
    "status": "healthy"
  },
  {
    "name": "ipowatch",
    "is_active": true,
    "last_fetch": "2024-01-15T10:00:00Z",
    "success_rate": 96.8,
    "avg_response_time": 2.1,
    "status": "healthy"
  }
]
```

#### POST /admin/retrain-model
Trigger ML model retraining.

**Headers:**
- `Authorization: Bearer <token>` (Admin required)

**Response:**
```json
{
  "message": "Model retraining initiated",
  "job_id": "retrain_20240115_103000"
}
```

### Health Check

#### GET /health
System health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0.0",
  "database": "connected",
  "redis": "connected",
  "external_apis": {
    "nse": "available",
    "bse": "available",
    "chittorgarh": "available",
    "ipowatch": "available"
  }
}
```

#### GET /
Root endpoint with basic API information.

**Response:**
```json
{
  "message": "IPO GMP Analyzer & Notifier API",
  "status": "active",
  "version": "1.0.0",
  "documentation": "/docs"
}
```

## Error Responses

### Standard Error Format
All error responses follow this format:

```json
{
  "detail": "Error message description",
  "error_code": "SPECIFIC_ERROR_CODE",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Common HTTP Status Codes

#### 400 Bad Request
Invalid request data or parameters.

```json
{
  "detail": "Invalid email format",
  "error_code": "VALIDATION_ERROR"
}
```

#### 401 Unauthorized
Missing or invalid authentication token.

```json
{
  "detail": "Could not validate credentials",
  "error_code": "INVALID_TOKEN"
}
```

#### 403 Forbidden
Insufficient permissions for the requested operation.

```json
{
  "detail": "Admin access required",
  "error_code": "INSUFFICIENT_PERMISSIONS"
}
```

#### 404 Not Found
Requested resource not found.

```json
{
  "detail": "IPO not found",
  "error_code": "RESOURCE_NOT_FOUND"
}
```

#### 422 Unprocessable Entity
Request validation failed.

```json
{
  "detail": [
    {
      "loc": ["body", "email"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ],
  "error_code": "VALIDATION_ERROR"
}
```

#### 429 Too Many Requests
Rate limit exceeded.

```json
{
  "detail": "Rate limit exceeded. Try again in 60 seconds",
  "error_code": "RATE_LIMIT_EXCEEDED"
}
```

#### 500 Internal Server Error
Server-side error occurred.

```json
{
  "detail": "Internal server error",
  "error_code": "INTERNAL_ERROR"
}
```

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **Authenticated users**: 1000 requests per hour
- **Unauthenticated users**: 100 requests per hour
- **Admin endpoints**: 500 requests per hour

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1642248000
```

## Pagination

List endpoints support pagination using query parameters:

- `skip`: Number of records to skip (default: 0)
- `limit`: Maximum records per page (default: 100, max: 1000)

Response includes pagination metadata:
```json
{
  "items": [...],
  "total": 1500,
  "skip": 0,
  "limit": 100,
  "has_more": true
}
```

## Filtering and Sorting

### IPO Filtering
The `/ipos` endpoint supports filtering:

- `status`: Filter by IPO status
- `industry`: Filter by industry
- `min_gmp`: Minimum GMP value
- `max_gmp`: Maximum GMP value
- `profitable_only`: Show only profitable IPOs

Example:
```
GET /ipos?status=open&industry=Technology&min_gmp=20&profitable_only=true
```

### Sorting
Use the `sort` parameter with field names:

- `sort=created_at`: Sort by creation date (default)
- `sort=-gmp_percentage`: Sort by GMP percentage (descending)
- `sort=listing_date`: Sort by listing date

Example:
```
GET /ipos?sort=-gmp_percentage&limit=10
```

## WebSocket Endpoints

### Real-time GMP Updates
Connect to WebSocket for real-time GMP updates:

**Endpoint**: `ws://localhost:8000/ws/gmp-updates`

**Authentication**: Include JWT token in connection headers

**Message Format**:
```json
{
  "type": "gmp_update",
  "ipo_id": 1,
  "gmp_value": 47.5,
  "gmp_percentage": 45.7,
  "confidence_score": 0.88,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Notification Stream
Real-time notification delivery:

**Endpoint**: `ws://localhost:8000/ws/notifications`

**Message Format**:
```json
{
  "type": "notification",
  "notification_id": 123,
  "title": "GMP Alert: TechCorp IPO",
  "message": "GMP increased by 12%",
  "ipo_id": 1,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## SDK and Client Libraries

### Python Client
```python
from ipo_analyzer_client import IPOAnalyzerClient

client = IPOAnalyzerClient(
    base_url="https://api.ipo-analyzer.com",
    api_key="your-api-key"
)

# Get IPOs
ipos = client.get_ipos(status="open", profitable_only=True)

# Get predictions
prediction = client.get_prediction(ipo_id=1)
```

### JavaScript Client
```javascript
import { IPOAnalyzerClient } from 'ipo-analyzer-js-client';

const client = new IPOAnalyzerClient({
  baseURL: 'https://api.ipo-analyzer.com',
  apiKey: 'your-api-key'
});

// Get IPOs
const ipos = await client.getIPOs({ status: 'open', profitableOnly: true });

// Get predictions
const prediction = await client.getPrediction(1);
```

## Testing

### Test Environment
- **Base URL**: `https://api-test.ipo-analyzer.com`
- **Test API Key**: Contact support for test credentials

### Sample Requests
Use the provided Postman collection or curl commands:

```bash
# Get IPOs
curl -X GET "https://api.ipo-analyzer.com/ipos" \
  -H "Authorization: Bearer your-token"

# Create user
curl -X POST "https://api.ipo-analyzer.com/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test User","password":"password123"}'
```

## Support

For API support and questions:
- **Documentation**: `/docs` (Interactive Swagger UI)
- **Email**: api-support@ipo-analyzer.com
- **GitHub Issues**: https://github.com/your-repo/issues

## Changelog

### Version 1.0.0 (2024-01-15)
- Initial API release
- IPO management endpoints
- GMP validation and tracking
- ML-based predictions
- User management and notifications
- Admin dashboard endpoints