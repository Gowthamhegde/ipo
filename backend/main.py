from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import uvicorn
from datetime import datetime, timedelta
import logging
from typing import List, Optional

from database import get_db, engine, Base
from models import IPO, User, GMPData, Notification
from schemas import (
    IPOCreate, IPOResponse, UserCreate, UserResponse, 
    GMPDataResponse, NotificationResponse, UserPreferences
)
from services.data_fetcher import DataFetcher
from services.gmp_validator import GMPValidator
from services.notification_service import NotificationService
from services.ml_predictor import MLPredictor
from utils.auth import verify_token, create_access_token
from utils.logger import setup_logger

# Initialize FastAPI app
app = FastAPI(
    title="IPO GMP Analyzer & Notifier",
    description="Comprehensive IPO analysis with GMP tracking and notifications",
    version="1.0.0"
)

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://your-frontend-domain.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
data_fetcher = DataFetcher()
gmp_validator = GMPValidator()
notification_service = NotificationService()
ml_predictor = MLPredictor()
security = HTTPBearer()
logger = setup_logger()

# Create tables
Base.metadata.create_all(bind=engine)

@app.on_startup
async def startup_event():
    """Initialize background tasks and services"""
    logger.info("Starting IPO GMP Analyzer & Notifier")
    # Start background data fetching
    from tasks.scheduler import start_scheduler
    start_scheduler()

@app.get("/")
async def root():
    return {"message": "IPO GMP Analyzer & Notifier API", "status": "active"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow()}

# Authentication endpoints
@app.post("/auth/register", response_model=UserResponse)
async def register(user: UserCreate, db: Session = Depends(get_db)):
    """Register a new user"""
    # Check if user exists
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    db_user = User(
        email=user.email,
        name=user.name,
        hashed_password=user.password,  # In real app, hash this
        preferences=user.preferences.dict() if user.preferences else {}
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return db_user

@app.post("/auth/login")
async def login(email: str, password: str, db: Session = Depends(get_db)):
    """Login user and return access token"""
    user = db.query(User).filter(User.email == email).first()
    if not user or user.hashed_password != password:  # In real app, verify hash
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token({"sub": user.email})
    return {"access_token": token, "token_type": "bearer", "user": user}

# IPO endpoints
@app.get("/ipos", response_model=List[IPOResponse])
async def get_ipos(
    skip: int = 0, 
    limit: int = 100,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get all IPOs with optional filtering"""
    query = db.query(IPO)
    if status:
        query = query.filter(IPO.status == status)
    
    ipos = query.offset(skip).limit(limit).all()
    return ipos

@app.get("/ipos/{ipo_id}", response_model=IPOResponse)
async def get_ipo(ipo_id: int, db: Session = Depends(get_db)):
    """Get specific IPO details"""
    ipo = db.query(IPO).filter(IPO.id == ipo_id).first()
    if not ipo:
        raise HTTPException(status_code=404, detail="IPO not found")
    return ipo

@app.get("/ipos/{ipo_id}/gmp", response_model=List[GMPDataResponse])
async def get_ipo_gmp_history(ipo_id: int, db: Session = Depends(get_db)):
    """Get GMP history for an IPO"""
    gmp_data = db.query(GMPData).filter(GMPData.ipo_id == ipo_id).order_by(GMPData.timestamp.desc()).all()
    return gmp_data

@app.post("/ipos/refresh")
async def refresh_ipo_data(background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Manually trigger IPO data refresh"""
    background_tasks.add_task(data_fetcher.fetch_all_sources, db)
    return {"message": "Data refresh initiated"}

# User preferences
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
    
    return {"message": "Preferences updated successfully"}

# Notifications
@app.get("/notifications", response_model=List[NotificationResponse])
async def get_notifications(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """Get user notifications"""
    user_email = verify_token(credentials.credentials)
    user = db.query(User).filter(User.email == user_email).first()
    
    notifications = db.query(Notification).filter(
        Notification.user_id == user.id
    ).order_by(Notification.created_at.desc()).limit(50).all()
    
    return notifications

# ML Predictions
@app.get("/ipos/{ipo_id}/prediction")
async def get_listing_prediction(ipo_id: int, db: Session = Depends(get_db)):
    """Get ML-based listing gain prediction"""
    ipo = db.query(IPO).filter(IPO.id == ipo_id).first()
    if not ipo:
        raise HTTPException(status_code=404, detail="IPO not found")
    
    prediction = ml_predictor.predict_listing_gain(ipo)
    return {
        "ipo_id": ipo_id,
        "predicted_gain_percentage": prediction.get("gain_percentage"),
        "confidence_score": prediction.get("confidence"),
        "factors": prediction.get("factors", [])
    }

# Admin endpoints
@app.get("/admin/stats")
async def get_admin_stats(db: Session = Depends(get_db)):
    """Get system statistics for admin dashboard"""
    total_ipos = db.query(IPO).count()
    active_ipos = db.query(IPO).filter(IPO.status == "open").count()
    total_users = db.query(User).count()
    
    return {
        "total_ipos": total_ipos,
        "active_ipos": active_ipos,
        "total_users": total_users,
        "last_update": datetime.utcnow()
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)