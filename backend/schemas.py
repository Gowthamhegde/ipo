from pydantic import BaseModel, EmailStr, validator, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from decimal import Decimal
from enum import Enum

# Enums
class IPOStatus(str, Enum):
    upcoming = "upcoming"
    open = "open"
    closed = "closed"
    listed = "listed"

class RiskLevel(str, Enum):
    low = "Low"
    medium = "Medium"
    high = "High"

class SubscriptionCategory(str, Enum):
    retail = "retail"
    qib = "qib"
    hni = "hni"

# Base schemas
class BaseSchema(BaseModel):
    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            date: lambda v: v.isoformat(),
            Decimal: lambda v: float(v)
        }

# IPO Schemas
class IPOBase(BaseSchema):
    ipo_name: str = Field(..., min_length=1, max_length=255)
    company_name: str = Field(..., min_length=1, max_length=255)
    issue_price_min: Decimal = Field(..., gt=0, decimal_places=2)
    issue_price_max: Decimal = Field(..., gt=0, decimal_places=2)
    issue_size: Optional[Decimal] = Field(None, gt=0, decimal_places=2)
    lot_size: Optional[int] = Field(None, gt=0)
    sector: Optional[str] = Field(None, max_length=100)
    
    @validator('issue_price_max')
    def validate_price_range(cls, v, values):
        if 'issue_price_min' in values and v < values['issue_price_min']:
            raise ValueError('issue_price_max must be >= issue_price_min')
        return v

class IPOCreate(IPOBase):
    open_date: Optional[date] = None
    close_date: Optional[date] = None
    listing_date: Optional[date] = None
    status: IPOStatus = IPOStatus.upcoming
    
class IPOResponse(IPOBase):
    id: int
    open_date: Optional[date]
    close_date: Optional[date]
    listing_date: Optional[date]
    status: IPOStatus
    created_at: datetime
    updated_at: Optional[datetime]
    current_gmp: Optional[Decimal] = None
    subscription_status: Optional[Dict[str, Any]] = None

# User Schemas
class UserBase(BaseSchema):
    email: EmailStr
    full_name: Optional[str] = Field(None, max_length=255)
    username: Optional[str] = Field(None, min_length=3, max_length=100)

class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=100)
    phone_number: Optional[str] = Field(None, pattern=r'^\+?[1-9]\d{1,14}$')
    
    @validator('password')
    def validate_password(cls, v):
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one digit')
        return v

class UserUpdate(BaseSchema):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = Field(None, max_length=255)
    username: Optional[str] = Field(None, min_length=3, max_length=100)
    phone_number: Optional[str] = Field(None, pattern=r'^\+?[1-9]\d{1,14}$')
    preferences: Optional[Dict[str, Any]] = None

class UserResponse(UserBase):
    id: int
    phone_number: Optional[str]
    is_active: bool
    is_verified: bool
    created_at: datetime
    updated_at: Optional[datetime]
    last_login: Optional[datetime]

# GMP Data Schemas
class GMPDataResponse(BaseSchema):
    id: int
    ipo_id: int
    gmp_value: Decimal
    premium_percentage: float
    source: str
    recorded_at: datetime
    is_verified: bool = Field(default=False)

# Notification Schemas
class NotificationBase(BaseSchema):
    title: str = Field(..., min_length=1, max_length=255)
    message: str = Field(..., min_length=1, max_length=1000)
    notification_type: str = Field(..., max_length=50)
    is_read: bool = Field(default=False)

class NotificationCreate(NotificationBase):
    user_id: Optional[int] = None

class NotificationResponse(NotificationBase):
    id: int
    user_id: Optional[int]
    created_at: datetime
    updated_at: Optional[datetime]

# User Preferences Schema
class UserPreferences(BaseSchema):
    email_notifications: bool = Field(default=True)
    sms_notifications: bool = Field(default=False)
    push_notifications: bool = Field(default=True)
    notification_frequency: str = Field(default="daily", pattern="^(immediate|daily|weekly)$")
    preferred_sectors: List[str] = Field(default_factory=list)
    risk_tolerance: RiskLevel = Field(default=RiskLevel.medium)
    investment_amount_range: Optional[str] = Field(None, max_length=50)

# ML Prediction Schema
class MLPredictionResponse(BaseSchema):
    ipo_id: int
    predicted_gmp: Decimal
    confidence_score: float = Field(..., ge=0.0, le=1.0)
    prediction_date: datetime
    model_version: str
    features_used: Dict[str, Any]

# System Stats Schema
class SystemStatsResponse(BaseSchema):
    total_ipos: int
    active_ipos: int
    profitable_ipos: int
    total_users: int
    active_users: int
    recent_notifications: int
    profitability_rate: float
    last_update: datetime
    system_health: Dict[str, str]

# Prediction Schemas
class PredictionRequest(BaseSchema):
    ipo_id: int
    features: Dict[str, Any]

class PredictionResponse(BaseSchema):
    ipo_id: int
    predicted_value: Decimal
    confidence: float
    model_used: str
    prediction_date: datetime

# Error Response Schemas
class ErrorResponse(BaseSchema):
    error: str
    message: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class ValidationError(BaseSchema):
    field: str
    message: str
    value: Any

class ValidationErrorResponse(BaseSchema):
    error: str = "validation_error"
    message: str = "Input validation failed"
    details: List[ValidationError]
    timestamp: datetime = Field(default_factory=datetime.utcnow)

# Pagination Schemas
class PaginationParams(BaseSchema):
    page: int = Field(default=1, ge=1)
    size: int = Field(default=20, ge=1, le=100)
    sort_by: Optional[str] = Field(default="created_at")
    sort_order: Optional[str] = Field(default="desc", pattern="^(asc|desc)$")

class FilterParams(BaseSchema):
    status: Optional[IPOStatus] = None
    sector: Optional[str] = None
    min_gmp: Optional[Decimal] = None
    max_gmp: Optional[Decimal] = None
    min_issue_size: Optional[Decimal] = None
    max_issue_size: Optional[Decimal] = None
    risk_level: Optional[RiskLevel] = None
    has_prediction: Optional[bool] = None
    date_from: Optional[date] = None
    date_to: Optional[date] = None

# Bulk Operations
class BulkIPOCreate(BaseSchema):
    ipos: List[IPOCreate] = Field(..., min_items=1, max_items=100)

class BulkIPOResponse(BaseSchema):
    created: int
    failed: int
    errors: List[Dict[str, Any]]
    created_ids: List[int]

# Health Check Schema
class HealthCheck(BaseSchema):
    status: str
    timestamp: datetime
    version: str
    database: bool
    cache: bool
    external_apis: Dict[str, bool]
    system_load: Dict[str, Any]

# GMP Validation Schema
class GMPValidationResult(BaseSchema):
    is_valid: bool
    confidence_score: float = Field(..., ge=0.0, le=1.0)
    validation_source: str
    validation_timestamp: datetime
    anomalies: List[str] = Field(default_factory=list)
    suggested_gmp: Optional[Decimal] = None