from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
import uvicorn
from datetime import datetime, timedelta
import logging
from typing import List, Optional
import asyncio
from contextlib import asynccontextmanager

from database import get_db, engine, Base, check_database_health
from models import IPO, User, GMPData, Notification, MLModel, SystemLog
from schemas import (
    IPOCreate, IPOResponse, UserCreate, UserResponse, 
    GMPDataResponse, NotificationResponse, UserPreferences,
    MLPredictionResponse, SystemStatsResponse
)
from services.data_fetcher import DataFetcher
from services.gmp_validator import GMPValidator
from services.notification_service import NotificationService
from services.ml_predictor import MLPredictor
from services.real_time_ipo_service import real_time_ipo_service
from services.gemini_ipo_service import gemini_ipo_service
from utils.auth import verify_token, create_access_token, hash_password, verify_password
from utils.logger import setup_logger
from utils.cache import cache_manager
from utils.rate_limiter import RateLimiter
from config import settings
from api.realtime_ipo import router as realtime_ipo_router
from api.gemini_ipo import router as gemini_ipo_router

# Setup logging
logger = setup_logger()

# Initialize services (simplified - some services are mocked)
# data_fetcher = DataFetcher()
# gmp_validator = GMPValidator()
notification_service = NotificationService()
# ml_predictor = MLPredictor()
rate_limiter = RateLimiter()
security = HTTPBearer()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan management"""
    # Startup
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    
    # Create database tables
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully")
    except Exception as e:
        logger.warning(f"Database table creation failed: {e}")
    
    logger.info("Application startup complete")
    
    yield
    
    # Shutdown
    logger.info("Application shutdown complete")

# Initialize FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    description="Complete IPO GMP Analyzer with ML Predictions & Real-time Notifications",
    version=settings.APP_VERSION,
    lifespan=lifespan,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None
)

# Add middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Enabled TrustedHostMiddleware
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["*"] if settings.DEBUG else ["localhost", "127.0.0.1", "your-production-domain.com"]
)

# Include routers
app.include_router(realtime_ipo_router)
app.include_router(gemini_ipo_router)

# Rate limiting middleware
@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    # Skip rate limiting for static files or specific paths if needed
    if request.url.path.startswith("/static"):
        return await call_next(request)
        
    client_ip = request.client.host
    # rate_limiter needs to be initialized/imported correctly. 
    # Assuming RateLimiter class exists and has is_allowed method.
    # For now, we instantiate a global limiter or use the one from dependencies
    if not await rate_limiter.is_allowed(client_ip):
        return JSONResponse(status_code=429, content={"detail": "Rate limit exceeded"})
    
    response = await call_next(request)
    return response

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": f"{settings.APP_NAME} API",
        "version": settings.APP_VERSION,
        "status": "active",
        "timestamp": datetime.utcnow().isoformat()
    }

# Health check endpoint
@app.get("/health")
async def health_check():
    """Comprehensive health check"""
    # ... (rest of health check logic)
    health_status = {
        "status": "healthy",
        "timestamp": datetime.utcnow(),
        "database": check_database_health(),
        "cache": await cache_manager.health_check(),
        "services": {
            "real_time_ipo_service": real_time_ipo_service.get_status(), # Use real service
            "notification_service": notification_service.is_healthy(),
            # "ml_predictor": ml_predictor.is_healthy()
        }
    }
    
    overall_healthy = all([
        health_status["database"],
        health_status["cache"],
        # Add service checks here
    ])
    
    if not overall_healthy:
        health_status["status"] = "unhealthy"
        return JSONResponse(
            status_code=503,
            content=health_status
        )
    
    return health_status

# ... (Authentication endpoints)

# ... (IPO endpoints)

@app.post("/ipos/refresh")
async def refresh_ipo_data(
    background_tasks: BackgroundTasks, 
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """Manually trigger IPO data refresh (Admin only)"""
    user_email = verify_token(credentials.credentials)
    user = db.query(User).filter(User.email == user_email).first()
    
    if not user or not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Use real_time_ipo_service instead of data_fetcher
    background_tasks.add_task(real_time_ipo_service.fetch_all_ipo_data)
    
    logger.info(f"Manual data refresh triggered by {user_email}")
    return {"message": "Data refresh initiated"}

# ML Predictions
@app.get("/ipos/{ipo_id}/prediction", response_model=MLPredictionResponse)
async def get_listing_prediction(ipo_id: int, db: Session = Depends(get_db)):
    """Get ML-based listing gain prediction"""
    cache_key = f"prediction:{ipo_id}"
    cached_result = await cache_manager.get(cache_key)
    if cached_result:
        return cached_result
    
    ipo = db.query(IPO).filter(IPO.id == ipo_id).first()
    if not ipo:
        raise HTTPException(status_code=404, detail="IPO not found")
    
    prediction = await ml_predictor.predict_listing_gain(ipo)
    
    await cache_manager.set(cache_key, prediction, ttl=1800)  # 30 minutes
    return prediction

# User management
@app.put("/users/preferences")
async def update_preferences(
    preferences: UserPreferences,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """Update user notification preferences"""
    user_email = verify_token(credentials.credentials)
    user = db.query(User).filter(User.email == user_email).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.preferences = preferences.dict()
    db.commit()
    
    # Clear user cache
    await cache_manager.delete(f"user:{user.email}")
    
    logger.info(f"Preferences updated for user: {user_email}")
    return {"message": "Preferences updated successfully"}

# Notifications
@app.get("/notifications", response_model=List[NotificationResponse])
async def get_notifications(
    skip: int = 0,
    limit: int = 50,
    unread_only: bool = False,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """Get user notifications"""
    user_email = verify_token(credentials.credentials)
    user = db.query(User).filter(User.email == user_email).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    query = db.query(Notification).filter(Notification.user_id == user.id)
    
    if unread_only:
        query = query.filter(Notification.is_read == False)
    
    notifications = query.order_by(
        Notification.created_at.desc()
    ).offset(skip).limit(limit).all()
    
    return notifications

@app.put("/notifications/{notification_id}/read")
async def mark_notification_read(
    notification_id: int,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """Mark notification as read"""
    user_email = verify_token(credentials.credentials)
    user = db.query(User).filter(User.email == user_email).first()
    
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == user.id
    ).first()
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    notification.is_read = True
    db.commit()
    
    return {"message": "Notification marked as read"}

# Analytics and Statistics
@app.get("/analytics/stats", response_model=SystemStatsResponse)
async def get_system_stats(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """Get comprehensive system statistics"""
    user_email = verify_token(credentials.credentials)
    user = db.query(User).filter(User.email == user_email).first()
    
    if not user or not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    cache_key = "system_stats"
    cached_result = await cache_manager.get(cache_key)
    if cached_result:
        return cached_result
    
    # Calculate statistics
    total_ipos = db.query(IPO).count()
    active_ipos = db.query(IPO).filter(IPO.status == "open").count()
    profitable_ipos = db.query(IPO).filter(IPO.is_profitable == True).count()
    total_users = db.query(User).count()
    active_users = db.query(User).filter(User.is_active == True).count()
    
    # Recent activity
    recent_notifications = db.query(Notification).filter(
        Notification.created_at >= datetime.utcnow() - timedelta(days=7)
    ).count()
    
    stats = {
        "total_ipos": total_ipos,
        "active_ipos": active_ipos,
        "profitable_ipos": profitable_ipos,
        "total_users": total_users,
        "active_users": active_users,
        "recent_notifications": recent_notifications,
        "profitability_rate": (profitable_ipos / total_ipos * 100) if total_ipos > 0 else 0,
        "last_update": datetime.utcnow()
    }
    
    await cache_manager.set(cache_key, stats, ttl=300)
    return stats

if __name__ == "__main__":
    uvicorn.run(
        "main:app", 
        host="0.0.0.0", 
        port=8000, 
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower()
    )