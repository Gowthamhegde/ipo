import logging
import sys
from pathlib import Path
from datetime import datetime

def setup_logger():
    """Setup basic logging configuration"""
    
    # Create logs directory if it doesn't exist
    log_dir = Path("logs")
    log_dir.mkdir(exist_ok=True)
    
    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        handlers=[
            logging.StreamHandler(sys.stdout),
            logging.FileHandler("logs/app.log", encoding='utf-8')
        ]
    )
    
    return logging.getLogger("ipo_gmp_analyzer")

def get_logger(name: str = "ipo_gmp_analyzer"):
    """Get a logger instance"""
    return logging.getLogger(name)

# Create default logger
logger = setup_logger()