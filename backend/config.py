import os
from typing import Optional
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Settings:
    # Application
    APP_NAME: str = "IPO GMP Analyzer"
    APP_VERSION: str = "2.0.0"
    DEBUG: bool = False
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./ipo_gmp_analyzer.db")
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # External APIs
    NSE_API_URL: str = "https://www.nseindia.com"
    BSE_API_URL: str = "https://www.bseindia.com"
    CHITTORGARH_URL: str = "https://www.chittorgarh.com"
    IPOWATCH_URL: str = "https://www.ipowatch.in"
    
    # CORS
    ALLOWED_ORIGINS: list = [
        "http://localhost:3000",
        "http://localhost:3001",
        "https://your-frontend-domain.com"
    ]
    
    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "logs/app.log"

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