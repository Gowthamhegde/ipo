import logging
import sys
from pathlib import Path
from datetime import datetime
import structlog
from config import settings

def setup_logger():
    """Setup structured logging with proper configuration"""
    
    # Create logs directory if it doesn't exist
    log_dir = Path("logs")
    log_dir.mkdir(exist_ok=True)
    
    # Configure structlog
    structlog.configure(
        processors=[
            structlog.stdlib.filter_by_level,
            structlog.stdlib.add_logger_name,
            structlog.stdlib.add_log_level,
            structlog.stdlib.PositionalArgumentsFormatter(),
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.UnicodeDecoder(),
            structlog.processors.JSONRenderer()
        ],
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )
    
    # Configure standard logging
    logging.basicConfig(
        level=getattr(logging, settings.LOG_LEVEL.upper()),
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        handlers=[
            logging.StreamHandler(sys.stdout),
            logging.FileHandler(settings.LOG_FILE, encoding='utf-8')
        ]
    )
    
    # Get logger
    logger = structlog.get_logger("ipo_gmp_analyzer")
    
    return logger

class IPOLogger:
    """Custom logger for IPO-specific events"""
    
    def __init__(self):
        self.logger = structlog.get_logger("ipo_events")
    
    def log_ipo_created(self, ipo_name: str, ipo_id: int):
        """Log IPO creation"""
        self.logger.info(
            "IPO created",
            ipo_name=ipo_name,
            ipo_id=ipo_id,
            event_type="ipo_created"
        )
    
    def log_gmp_update(self, ipo_id: int, old_gmp: float, new_gmp: float, source: str):
        """Log GMP update"""
        self.logger.info(
            "GMP updated",
            ipo_id=ipo_id,
            old_gmp=old_gmp,
            new_gmp=new_gmp,
            source=source,
            change=new_gmp - old_gmp,
            event_type="gmp_updated"
        )
    
    def log_profitable_ipo(self, ipo_id: int, ipo_name: str, gmp_percentage: float):
        """Log profitable IPO detection"""
        self.logger.info(
            "Profitable IPO detected",
            ipo_id=ipo_id,
            ipo_name=ipo_name,
            gmp_percentage=gmp_percentage,
            event_type="profitable_ipo"
        )
    
    def log_notification_sent(self, user_id: int, notification_type: str, ipo_id: int = None):
        """Log notification sent"""
        self.logger.info(
            "Notification sent",
            user_id=user_id,
            notification_type=notification_type,
            ipo_id=ipo_id,
            event_type="notification_sent"
        )
    
    def log_data_fetch_error(self, source: str, error: str):
        """Log data fetching error"""
        self.logger.error(
            "Data fetch failed",
            source=source,
            error=error,
            event_type="data_fetch_error"
        )
    
    def log_ml_prediction(self, ipo_id: int, predicted_gain: float, confidence: float):
        """Log ML prediction"""
        self.logger.info(
            "ML prediction generated",
            ipo_id=ipo_id,
            predicted_gain=predicted_gain,
            confidence=confidence,
            event_type="ml_prediction"
        )

class PerformanceLogger:
    """Logger for performance metrics"""
    
    def __init__(self):
        self.logger = structlog.get_logger("performance")
    
    def log_api_request(self, endpoint: str, method: str, response_time: float, status_code: int):
        """Log API request performance"""
        self.logger.info(
            "API request",
            endpoint=endpoint,
            method=method,
            response_time=response_time,
            status_code=status_code,
            event_type="api_request"
        )
    
    def log_database_query(self, query_type: str, execution_time: float, table: str = None):
        """Log database query performance"""
        self.logger.info(
            "Database query",
            query_type=query_type,
            execution_time=execution_time,
            table=table,
            event_type="db_query"
        )
    
    def log_cache_operation(self, operation: str, key: str, hit: bool = None, execution_time: float = None):
        """Log cache operations"""
        self.logger.info(
            "Cache operation",
            operation=operation,
            key=key,
            hit=hit,
            execution_time=execution_time,
            event_type="cache_operation"
        )

class SecurityLogger:
    """Logger for security events"""
    
    def __init__(self):
        self.logger = structlog.get_logger("security")
    
    def log_login_attempt(self, email: str, success: bool, ip_address: str = None):
        """Log login attempts"""
        self.logger.info(
            "Login attempt",
            email=email,
            success=success,
            ip_address=ip_address,
            event_type="login_attempt"
        )
    
    def log_rate_limit_exceeded(self, ip_address: str, endpoint: str):
        """Log rate limit violations"""
        self.logger.warning(
            "Rate limit exceeded",
            ip_address=ip_address,
            endpoint=endpoint,
            event_type="rate_limit_exceeded"
        )
    
    def log_unauthorized_access(self, ip_address: str, endpoint: str, user_agent: str = None):
        """Log unauthorized access attempts"""
        self.logger.warning(
            "Unauthorized access attempt",
            ip_address=ip_address,
            endpoint=endpoint,
            user_agent=user_agent,
            event_type="unauthorized_access"
        )

# Create logger instances
main_logger = setup_logger()
ipo_logger = IPOLogger()
performance_logger = PerformanceLogger()
security_logger = SecurityLogger()