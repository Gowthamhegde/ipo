import logging
import os
from datetime import datetime
from logging.handlers import RotatingFileHandler

def setup_logger():
    """Setup application logger"""
    
    # Create logs directory
    os.makedirs("logs", exist_ok=True)
    
    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            # Console handler
            logging.StreamHandler(),
            # File handler with rotation
            RotatingFileHandler(
                'logs/ipo_analyzer.log',
                maxBytes=10*1024*1024,  # 10MB
                backupCount=5
            )
        ]
    )
    
    return logging.getLogger(__name__)

def get_logger(name: str):
    """Get logger for specific module"""
    return logging.getLogger(name)