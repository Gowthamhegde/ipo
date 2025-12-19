from typing import List, Optional, Dict, Any
from datetime import datetime
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from utils.logger import get_logger

logger = get_logger(__name__)

class NotificationService:
    """Simple notification service"""
    
    def __init__(self):
        self.logger = logger
    
    def send_email_notification(
        self, 
        to_email: str, 
        subject: str, 
        message: str,
        html_content: Optional[str] = None
    ) -> bool:
        """Send email notification (mock implementation)"""
        try:
            self.logger.info(f"Mock email sent to {to_email}: {subject}")
            return True
        except Exception as e:
            self.logger.error(f"Failed to send email: {e}")
            return False
    
    def send_sms_notification(
        self, 
        phone_number: str, 
        message: str
    ) -> bool:
        """Send SMS notification (mock implementation)"""
        try:
            self.logger.info(f"Mock SMS sent to {phone_number}: {message}")
            return True
        except Exception as e:
            self.logger.error(f"Failed to send SMS: {e}")
            return False
    
    def send_push_notification(
        self, 
        user_id: int, 
        title: str, 
        message: str,
        data: Optional[Dict[str, Any]] = None
    ) -> bool:
        """Send push notification (mock implementation)"""
        try:
            self.logger.info(f"Mock push notification sent to user {user_id}: {title}")
            return True
        except Exception as e:
            self.logger.error(f"Failed to send push notification: {e}")
            return False
    
    def notify_new_ipo(self, ipo_name: str, users: List[int]) -> bool:
        """Notify users about new IPO"""
        try:
            for user_id in users:
                self.send_push_notification(
                    user_id=user_id,
                    title="New IPO Alert",
                    message=f"New IPO available: {ipo_name}",
                    data={"type": "new_ipo", "ipo_name": ipo_name}
                )
            return True
        except Exception as e:
            self.logger.error(f"Failed to notify new IPO: {e}")
            return False
    
    def notify_gmp_update(self, ipo_name: str, gmp_value: float, users: List[int]) -> bool:
        """Notify users about GMP update"""
        try:
            for user_id in users:
                self.send_push_notification(
                    user_id=user_id,
                    title="GMP Update",
                    message=f"{ipo_name} GMP updated to ₹{gmp_value}",
                    data={"type": "gmp_update", "ipo_name": ipo_name, "gmp": gmp_value}
                )
            return True
        except Exception as e:
            self.logger.error(f"Failed to notify GMP update: {e}")
            return False
    
    def notify_profitable_ipo(self, ipo_name: str, gmp_percentage: float, users: List[int]) -> bool:
        """Notify users about profitable IPO"""
        try:
            for user_id in users:
                self.send_push_notification(
                    user_id=user_id,
                    title="Profitable IPO Alert",
                    message=f"{ipo_name} showing {gmp_percentage:.1f}% premium!",
                    data={"type": "profitable_ipo", "ipo_name": ipo_name, "premium": gmp_percentage}
                )
            return True
        except Exception as e:
            self.logger.error(f"Failed to notify profitable IPO: {e}")
            return False