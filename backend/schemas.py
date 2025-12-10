from pydantic import BaseModel, EmailStr, validator
from datetime import datetime
from typing import Optional, List, Dict, Any
from enum import Enum

class IPOStatus(str, Enum):
    upcoming = "upcoming"
    open = "open"
    closed = "closed"
    listed = "listed"

class NotificationType(str, Enum):
    new_ipo = "new_ipo"
    gmp_spike = "gmp_spike"
    listing_reminder = "listing_reminder"
    profitable_ipo = "profitable_ipo"

# User schemas
class UserPreferences(BaseModel):
    min_profit_percentage: float = 10.0
    min_absolute_profit: float = 20.0
    preferred_industries: List[str] = []
    risk_level: str = "medium"  # low, medium, high
    notification_channels: Dict[str, bool] = {
        "email": True,
        "sms": False,
        "push": True
    }
    gmp_spike_threshold: float = 8.0

class UserCreate(BaseModel):
    email: EmailStr
    name: str
    password: str
    preferences: Optional[UserPreferences] = None

class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    is_active: bool
    preferences: Dict[str, Any]
    created_at: datetime
    
    class Config:
        from_attributes = True

# IPO schemas
class IPOBase(BaseModel):
    name: str
    company_name: str
    issue_price_min: float
    issue_price_max: float
    issue_size: Optional[float] = None
    lot_size: Optional[int] = None
    open_date: Optional[datetime] = None
    close_date: Optional[datetime] = None
    listing_date: Optional[datetime] = None
    status: IPOStatus = IPOStatus.upcoming
    industry: Optional[str] = None
    lead_managers: Optional[str] = None
    registrar: Optional[str] = None

class IPOCreate(IPOBase):
    pass

class IPOResponse(IPOBase):
    id: int
    current_gmp: float
    gmp_percentage: float
    confidence_score: float
    is_profitable: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# GMP Data schemas
class GMPDataBase(BaseModel):
    ipo_id: int
    source: str
    gmp_value: float
    gmp_percentage: float
    is_valid: bool = True
    confidence: float = 1.0

class GMPDataCreate(GMPDataBase):
    pass

class GMPDataResponse(GMPDataBase):
    id: int
    timestamp: datetime
    
    class Config:
        from_attributes = True

# Notification schemas
class NotificationBase(BaseModel):
    type: NotificationType
    title: str
    message: str

class NotificationCreate(NotificationBase):
    user_id: int
    ipo_id: Optional[int] = None

class NotificationResponse(NotificationBase):
    id: int
    user_id: int
    ipo_id: Optional[int]
    is_sent: bool
    is_read: bool
    sent_at: Optional[datetime]
    created_at: datetime
    email_sent: bool
    sms_sent: bool
    push_sent: bool
    
    class Config:
        from_attributes = True

# Data validation schemas
class GMPValidationResult(BaseModel):
    ipo_id: int
    validated_gmp: float
    confidence_score: float
    sources_count: int
    is_reliable: bool
    variance: float
    outliers: List[str] = []

class DataSourceStatus(BaseModel):
    name: str
    is_active: bool
    last_fetch: Optional[datetime]
    success_rate: float
    avg_response_time: float
    status: str  # "healthy", "degraded", "down"

# ML Prediction schemas
class PredictionFeatures(BaseModel):
    issue_size: float
    price_band_width: float
    industry_performance: float
    market_sentiment: float
    subscription_ratio: Optional[float] = None
    gmp_trend: float
    days_to_listing: int

class ListingPrediction(BaseModel):
    ipo_id: int
    predicted_gain_percentage: float
    confidence_score: float
    risk_level: str
    factors: List[Dict[str, Any]]
    model_version: str

# System monitoring schemas
class SystemHealth(BaseModel):
    status: str
    uptime: float
    active_data_sources: int
    total_data_sources: int
    last_data_update: datetime
    pending_notifications: int
    error_rate: float

class AdminStats(BaseModel):
    total_ipos: int
    active_ipos: int
    total_users: int
    notifications_sent_today: int
    avg_gmp_accuracy: float
    system_health: SystemHealth