import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Application
    APP_NAME: str = "IPO GMP Analyzer"
    APP_VERSION: str = "2.0.0"
    DEBUG: bool = False
    
    # Database
    DATABASE_URL: str = "postgresql://postgres:password@localhost:5432/ipo_gmp_analyzer"
    DATABASE_POOL_SIZE: int = 20
    DATABASE_MAX_OVERFLOW: int = 30
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    REDIS_CACHE_TTL: int = 3600  # 1 hour
    
    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # External APIs
    NSE_API_URL: str = "https://www.nseindia.com"
    BSE_API_URL: str = "https://www.bseindia.com"
    CHITTORGARH_URL: str = "https://www.chittorgarh.com"
    IPOWATCH_URL: str = "https://www.ipowatch.in"
    
    # Notification Services
    SENDGRID_API_KEY: Optional[str] = None
    TWILIO_ACCOUNT_SID: Optional[str] = None
    TWILIO_AUTH_TOKEN: Optional[str] = None
    TWILIO_PHONE_NUMBER: Optional[str] = None
    
    # Firebase (for push notifications)
    FIREBASE_CREDENTIALS_PATH: Optional[str] = None
    
    # ML Models
    ML_MODELS_PATH: str = "models/"
    MODEL_RETRAIN_INTERVAL: int = 86400  # 24 hours
    
    # Background Tasks
    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/2"
    
    # Data Fetching
    DATA_FETCH_INTERVAL: int = 7200  # 2 hours
    GMP_VALIDATION_INTERVAL: int = 1800  # 30 minutes
    
    # Monitoring
    SENTRY_DSN: Optional[str] = None
    PROMETHEUS_PORT: int = 8001
    
    # CORS
    ALLOWED_ORIGINS: list = [
        "http://localhost:3000",
        "http://localhost:3001",
        "https://your-frontend-domain.com"
    ]
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60
    RATE_LIMIT_BURST: int = 100
    
    # File Storage
    UPLOAD_DIR: str = "uploads/"
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    
    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "logs/app.log"
    
    class Config:
        env_file = ".env"
        case_sensitive = True

# Create settings instance
settings = Settings()

# Profitability criteria
PROFITABILITY_CRITERIA = {
    "min_gmp_percentage": 10.0,  # Minimum 10% GMP
    "min_gmp_absolute": 20.0,    # Minimum ₹20 GMP
    "confidence_threshold": 0.7   # Minimum confidence score
}

# Notification triggers
NOTIFICATION_TRIGGERS = {
    "new_ipo": True,
    "gmp_spike_threshold": 8.0,  # 8% spike in GMP
    "listing_reminder_days": 1,   # 1 day before listing
    "profitable_ipo": True
}

# Data source configurations
DATA_SOURCES = {
    "chittorgarh": {
        "url": "https://www.chittorgarh.com/ipo/ipo_grey_market_premium.asp",
        "reliability": 0.9,
        "fetch_interval": 3600
    },
    "ipowatch": {
        "url": "https://www.ipowatch.in/",
        "reliability": 0.8,
        "fetch_interval": 3600
    },
    "nse": {
        "url": "https://www.nseindia.com/market-data/securities-available-for-trading",
        "reliability": 1.0,
        "fetch_interval": 7200
    },
    "bse": {
        "url": "https://www.bseindia.com/corporates/List_Scrips.aspx",
        "reliability": 1.0,
        "fetch_interval": 7200
    }
}

# ML Model configurations
ML_CONFIG = {
    "models": {
        "random_forest": {
            "n_estimators": 100,
            "max_depth": 10,
            "min_samples_split": 5
        },
        "gradient_boosting": {
            "n_estimators": 100,
            "learning_rate": 0.1,
            "max_depth": 6
        }
    },
    "features": [
        "issue_size",
        "price_band_ratio",
        "sector_performance",
        "market_sentiment",
        "promoter_holding",
        "subscription_ratio",
        "gmp_trend"
    ]
}