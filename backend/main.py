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
# rate_limiter = RateLimiter()
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

# Disabled TrustedHostMiddleware for development
# app.add_middleware(
#     TrustedHostMiddleware,
#     allowed_hosts=["*"] if settings.DEBUG else ["your-domain.com"]
# )

# Include routers
app.include_router(realtime_ipo_router)
app.include_router(gemini_ipo_router)

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "IPO GMP Analyzer API",
        "version": settings.APP_VERSION,
        "status": "running"
    }

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": settings.APP_VERSION
    }

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )

# Rate limiting middleware (disabled for now)
# @app.middleware("http")
# async def rate_limit_middleware(request: Request, call_next):
#     client_ip = request.client.host
#     if not await rate_limiter.is_allowed(client_ip):
#         return JSONResponse(
#             status_code=429,
#             content={"detail": "Rate limit exceeded"}
#         )
#     response = await call_next(request)
#     return response

# Health check endpoints
@app.get("/")
async def root():
    return {
        "message": f"{settings.APP_NAME} API",
        "version": settings.APP_VERSION,
        "status": "active",
        "timestamp": datetime.utcnow()
    }

@app.get("/health")
async def health_check():
    """Comprehensive health check"""
    health_status = {
        "status": "healthy",
        "timestamp": datetime.utcnow(),
        "database": check_database_health(),
        "cache": await cache_manager.health_check(),
        "services": {
            "data_fetcher": data_fetcher.is_healthy(),
            "gmp_validator": gmp_validator.is_healthy(),
            "notification_service": notification_service.is_healthy(),
            "ml_predictor": ml_predictor.is_healthy()
        }
    }
    
    overall_healthy = all([
        health_status["database"],
        health_status["cache"],
        all(health_status["services"].values())
    ])
    
    if not overall_healthy:
        health_status["status"] = "unhealthy"
        return JSONResponse(
            status_code=503,
            content=health_status
        )
    
    return health_status

# Authentication endpoints
@app.post("/auth/register", response_model=UserResponse)
async def register(user: UserCreate, db: Session = Depends(get_db)):
    """Register a new user"""
    # Check if user exists
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(
            status_code=400, 
            detail="Email already registered"
        )
    
    # Create new user
    hashed_password = hash_password(user.password)
    db_user = User(
        email=user.email,
        name=user.name,
        hashed_password=hashed_password,
        preferences=user.preferences.dict() if user.preferences else {}
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    logger.info(f"New user registered: {user.email}")
    return db_user

@app.post("/auth/login")
async def login(email: str, password: str, db: Session = Depends(get_db)):
    """Login user and return access token"""
    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=401, 
            detail="Invalid credentials"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=401, 
            detail="Account is disabled"
        )
    
    # Update last login
    user.last_login = datetime.utcnow()
    user.login_count = (user.login_count or 0) + 1
    db.commit()
    
    token = create_access_token({"sub": user.email})
    
    logger.info(f"User logged in: {user.email}")
    return {
        "access_token": token, 
        "token_type": "bearer", 
        "user": user,
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    }

# IPO endpoints
@app.get("/ipos", response_model=List[IPOResponse])
async def get_ipos(
    skip: int = 0, 
    limit: int = 100,
    status: Optional[str] = None,
    sector: Optional[str] = None,
    profitable_only: bool = False,
    db: Session = Depends(get_db)
):
    """Get all IPOs with advanced filtering - Gemini AI Primary"""
    # Try cache first
    cache_key = f"ipos:{skip}:{limit}:{status}:{sector}:{profitable_only}"
    cached_result = await cache_manager.get(cache_key)
    if cached_result:
        return cached_result
    
    # Try Gemini AI first
    try:
        gemini_ipos = await gemini_ipo_service.fetch_current_ipos()
        if gemini_ipos and len(gemini_ipos) > 0:
            logger.info(f"✅ Serving {len(gemini_ipos)} IPOs from Gemini AI")
            
            # Apply filters to Gemini data
            filtered_ipos = gemini_ipos
            if status:
                filtered_ipos = [ipo for ipo in filtered_ipos if ipo.get('status', '').lower() == status.lower()]
            if sector:
                filtered_ipos = [ipo for ipo in filtered_ipos if ipo.get('industry', '').lower() == sector.lower()]
            if profitable_only:
                filtered_ipos = [ipo for ipo in filtered_ipos if ipo.get('is_profitable', False)]
            
            # Apply pagination
            paginated_ipos = filtered_ipos[skip:skip + limit]
            
            # Cache result
            await cache_manager.set(cache_key, paginated_ipos, ttl=300)  # 5 minutes
            return paginated_ipos
    except Exception as e:
        logger.warning(f"Gemini AI failed, falling back to database: {e}")
    
    # Fallback to database
    query = db.query(IPO)
    
    if status:
        query = query.filter(IPO.status == status)
    if sector:
        query = query.filter(IPO.industry == sector)
    if profitable_only:
        query = query.filter(IPO.is_profitable == True)
    
    ipos = query.order_by(IPO.open_date.desc()).offset(skip).limit(limit).all()
    
    # Cache result
    await cache_manager.set(cache_key, ipos, ttl=300)  # 5 minutes
    
    return ipos

@app.get("/ipos/profitable", response_model=List[IPOResponse])
async def get_profitable_ipos(db: Session = Depends(get_db)):
    """Get currently profitable IPOs - Gemini AI Primary"""
    cache_key = "profitable_ipos"
    cached_result = await cache_manager.get(cache_key)
    if cached_result:
        return cached_result
    
    # Try Gemini AI first
    try:
        gemini_ipos = await gemini_ipo_service.fetch_current_ipos()
        if gemini_ipos and len(gemini_ipos) > 0:
            # Filter for profitable IPOs
            profitable_ipos = [
                ipo for ipo in gemini_ipos 
                if ipo.get('is_profitable', False) and ipo.get('status', '').lower() in ['upcoming', 'open']
            ]
            
            # Sort by GMP percentage
            profitable_ipos.sort(key=lambda x: x.get('gmp_percent', 0), reverse=True)
            
            logger.info(f"✅ Serving {len(profitable_ipos)} profitable IPOs from Gemini AI")
            await cache_manager.set(cache_key, profitable_ipos, ttl=600)  # 10 minutes
            return profitable_ipos
    except Exception as e:
        logger.warning(f"Gemini AI failed for profitable IPOs: {e}")
    
    # Fallback to database
    profitable_ipos = db.query(IPO).filter(
        IPO.is_profitable == True,
        IPO.status.in_(["upcoming", "open"])
    ).order_by(IPO.gmp_percentage.desc()).all()
    
    await cache_manager.set(cache_key, profitable_ipos, ttl=600)  # 10 minutes
    return profitable_ipos

@app.get("/ipos/{ipo_id}", response_model=IPOResponse)
async def get_ipo(ipo_id: int, db: Session = Depends(get_db)):
    """Get specific IPO details"""
    cache_key = f"ipo:{ipo_id}"
    cached_result = await cache_manager.get(cache_key)
    if cached_result:
        return cached_result
    
    ipo = db.query(IPO).filter(IPO.id == ipo_id).first()
    if not ipo:
        raise HTTPException(status_code=404, detail="IPO not found")
    
    await cache_manager.set(cache_key, ipo, ttl=300)
    return ipo

@app.get("/ipos/{ipo_id}/gmp", response_model=List[GMPDataResponse])
async def get_ipo_gmp_history(
    ipo_id: int, 
    days: int = 7,
    db: Session = Depends(get_db)
):
    """Get GMP history for an IPO"""
    cache_key = f"gmp_history:{ipo_id}:{days}"
    cached_result = await cache_manager.get(cache_key)
    if cached_result:
        return cached_result
    
    start_date = datetime.utcnow() - timedelta(days=days)
    gmp_data = db.query(GMPData).filter(
        GMPData.ipo_id == ipo_id,
        GMPData.timestamp >= start_date
    ).order_by(GMPData.timestamp.desc()).all()
    
    await cache_manager.set(cache_key, gmp_data, ttl=600)
    return gmp_data

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
    
    background_tasks.add_task(data_fetcher.fetch_all_sources, db)
    
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