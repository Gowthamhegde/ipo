import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from twilio.rest import Client
import requests
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
import logging
import os
from jinja2 import Template

from models import User, IPO, Notification, GMPData
from schemas import NotificationCreate, NotificationType
from utils.logger import get_logger

logger = get_logger(__name__)

class NotificationService:
    """Handles all notification delivery channels"""
    
    def __init__(self):
        # Email configuration
        self.smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.email_user = os.getenv("EMAIL_USER")
        self.email_password = os.getenv("EMAIL_PASSWORD")
        
        # SMS configuration (Twilio)
        self.twilio_sid = os.getenv("TWILIO_SID")
        self.twilio_token = os.getenv("TWILIO_TOKEN")
        self.twilio_phone = os.getenv("TWILIO_PHONE")
        
        if self.twilio_sid and self.twilio_token:
            self.twilio_client = Client(self.twilio_sid, self.twilio_token)
        else:
            self.twilio_client = None
        
        # Push notification configuration
        self.push_service_url = os.getenv("PUSH_SERVICE_URL")
        self.push_api_key = os.getenv("PUSH_API_KEY")
        
        # Notification templates
        self.templates = self._load_templates()

    def _load_templates(self) -> Dict[str, Template]:
        """Load notification templates"""
        return {
            'new_ipo': Template("""
                <h2>New IPO Alert: {{ ipo_name }}</h2>
                <p>A new IPO has been added to our tracking system:</p>
                <ul>
                    <li><strong>Company:</strong> {{ company_name }}</li>
                    <li><strong>Price Band:</strong> ₹{{ price_min }} - ₹{{ price_max }}</li>
                    <li><strong>Issue Size:</strong> ₹{{ issue_size }} crores</li>
                    <li><strong>Open Date:</strong> {{ open_date }}</li>
                    <li><strong>Close Date:</strong> {{ close_date }}</li>
                    {% if current_gmp > 0 %}
                    <li><strong>Current GMP:</strong> ₹{{ current_gmp }} ({{ gmp_percentage }}%)</li>
                    {% endif %}
                </ul>
                <p>Stay tuned for GMP updates!</p>
            """),
            
            'gmp_spike': Template("""
                <h2>GMP Alert: {{ ipo_name }}</h2>
                <p>Significant GMP movement detected:</p>
                <ul>
                    <li><strong>Previous GMP:</strong> ₹{{ previous_gmp }}</li>
                    <li><strong>Current GMP:</strong> ₹{{ current_gmp }}</li>
                    <li><strong>Change:</strong> {{ percentage_change }}%</li>
                    <li><strong>Confidence Score:</strong> {{ confidence_score }}/1.0</li>
                </ul>
                {% if spike_type == 'increase' %}
                <p style="color: green;">📈 GMP has increased significantly!</p>
                {% else %}
                <p style="color: red;">📉 GMP has decreased significantly!</p>
                {% endif %}
            """),
            
            'listing_reminder': Template("""
                <h2>Listing Reminder: {{ ipo_name }}</h2>
                <p>{{ ipo_name }} is scheduled to list tomorrow ({{ listing_date }}).</p>
                <ul>
                    <li><strong>Current GMP:</strong> ₹{{ current_gmp }} ({{ gmp_percentage }}%)</li>
                    <li><strong>Expected Listing Gain:</strong> {{ expected_gain }}%</li>
                    <li><strong>Confidence Score:</strong> {{ confidence_score }}/1.0</li>
                </ul>
                <p>Good luck with your investment! 🚀</p>
            """),
            
            'profitable_ipo': Template("""
                <h2>Profitable IPO Alert: {{ ipo_name }}</h2>
                <p>This IPO meets your profitability criteria:</p>
                <ul>
                    <li><strong>Current GMP:</strong> ₹{{ current_gmp }}</li>
                    <li><strong>GMP Percentage:</strong> {{ gmp_percentage }}%</li>
                    <li><strong>Issue Price:</strong> ₹{{ price_min }} - ₹{{ price_max }}</li>
                    <li><strong>Confidence Score:</strong> {{ confidence_score }}/1.0</li>
                    <li><strong>Status:</strong> {{ status }}</li>
                </ul>
                {% if status == 'open' %}
                <p style="color: green;">✅ IPO is currently open for subscription!</p>
                {% else %}
                <p>📅 IPO opens on {{ open_date }}</p>
                {% endif %}
            """)
        }

    async def send_notification(self, notification: NotificationCreate, db: Session) -> bool:
        """Send notification through all enabled channels"""
        
        # Get user preferences
        user = db.query(User).filter(User.id == notification.user_id).first()
        if not user or not user.is_active:
            return False
        
        preferences = user.preferences or {}
        channels = preferences.get('notification_channels', {
            'email': True, 'sms': False, 'push': True
        })
        
        # Create notification record
        db_notification = Notification(
            user_id=notification.user_id,
            ipo_id=notification.ipo_id,
            type=notification.type,
            title=notification.title,
            message=notification.message
        )
        db.add(db_notification)
        db.commit()
        db.refresh(db_notification)
        
        success = False
        
        # Send through enabled channels
        if channels.get('email', False) and user.email:
            email_success = await self._send_email(user.email, notification, db_notification.id)
            if email_success:
                db_notification.email_sent = True
                success = True
        
        if channels.get('sms', False) and preferences.get('phone'):
            sms_success = await self._send_sms(preferences['phone'], notification)
            if sms_success:
                db_notification.sms_sent = True
                success = True
        
        if channels.get('push', False):
            push_success = await self._send_push(user.id, notification)
            if push_success:
                db_notification.push_sent = True
                success = True
        
        # Update notification status
        if success:
            db_notification.is_sent = True
            db_notification.sent_at = datetime.utcnow()
        
        db.commit()
        return success

    async def _send_email(self, email: str, notification: NotificationCreate, 
                         notification_id: int) -> bool:
        """Send email notification"""
        try:
            if not self.email_user or not self.email_password:
                logger.warning("Email credentials not configured")
                return False
            
            # Create message
            msg = MIMEMultipart('alternative')
            msg['Subject'] = notification.title
            msg['From'] = self.email_user
            msg['To'] = email
            
            # Create HTML content
            html_content = notification.message
            html_part = MIMEText(html_content, 'html')
            msg.attach(html_part)
            
            # Send email
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.email_user, self.email_password)
                server.send_message(msg)
            
            logger.info(f"Email sent successfully to {email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send email to {email}: {e}")
            return False

    async def _send_sms(self, phone: str, notification: NotificationCreate) -> bool:
        """Send SMS notification"""
        try:
            if not self.twilio_client:
                logger.warning("Twilio not configured")
                return False
            
            # Create SMS content (plain text, shorter version)
            sms_content = f"{notification.title}\n\n{self._extract_text_from_html(notification.message)[:140]}..."
            
            message = self.twilio_client.messages.create(
                body=sms_content,
                from_=self.twilio_phone,
                to=phone
            )
            
            logger.info(f"SMS sent successfully to {phone}: {message.sid}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send SMS to {phone}: {e}")
            return False

    async def _send_push(self, user_id: int, notification: NotificationCreate) -> bool:
        """Send push notification"""
        try:
            if not self.push_service_url or not self.push_api_key:
                logger.warning("Push notification service not configured")
                return False
            
            payload = {
                'user_id': user_id,
                'title': notification.title,
                'body': self._extract_text_from_html(notification.message)[:200],
                'data': {
                    'type': notification.type,
                    'ipo_id': notification.ipo_id
                }
            }
            
            headers = {
                'Authorization': f'Bearer {self.push_api_key}',
                'Content-Type': 'application/json'
            }
            
            response = requests.post(
                f"{self.push_service_url}/send",
                json=payload,
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                logger.info(f"Push notification sent successfully to user {user_id}")
                return True
            else:
                logger.error(f"Push notification failed: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"Failed to send push notification to user {user_id}: {e}")
            return False

    def _extract_text_from_html(self, html: str) -> str:
        """Extract plain text from HTML"""
        from bs4 import BeautifulSoup
        soup = BeautifulSoup(html, 'html.parser')
        return soup.get_text().strip()

    async def notify_new_ipo(self, ipo: IPO, db: Session):
        """Send notifications for new IPO"""
        
        # Get all active users
        users = db.query(User).filter(User.is_active == True).all()
        
        for user in users:
            try:
                # Check user preferences
                preferences = user.preferences or {}
                
                # Filter by industry preference
                preferred_industries = preferences.get('preferred_industries', [])
                if preferred_industries and ipo.industry not in preferred_industries:
                    continue
                
                # Create notification content
                template_data = {
                    'ipo_name': ipo.name,
                    'company_name': ipo.company_name,
                    'price_min': ipo.issue_price_min,
                    'price_max': ipo.issue_price_max,
                    'issue_size': ipo.issue_size or 0,
                    'open_date': ipo.open_date.strftime('%d %b %Y') if ipo.open_date else 'TBA',
                    'close_date': ipo.close_date.strftime('%d %b %Y') if ipo.close_date else 'TBA',
                    'current_gmp': ipo.current_gmp,
                    'gmp_percentage': round(ipo.gmp_percentage, 2)
                }
                
                html_content = self.templates['new_ipo'].render(**template_data)
                
                notification = NotificationCreate(
                    user_id=user.id,
                    ipo_id=ipo.id,
                    type=NotificationType.new_ipo,
                    title=f"New IPO: {ipo.name}",
                    message=html_content
                )
                
                await self.send_notification(notification, db)
                
            except Exception as e:
                logger.error(f"Error sending new IPO notification to user {user.id}: {e}")

    async def notify_gmp_spike(self, spike_data: Dict, db: Session):
        """Send notifications for GMP spikes"""
        
        ipo = db.query(IPO).filter(IPO.id == spike_data['ipo_id']).first()
        if not ipo:
            return
        
        # Get users interested in this IPO or industry
        users = db.query(User).filter(User.is_active == True).all()
        
        for user in users:
            try:
                preferences = user.preferences or {}
                
                # Check if user wants GMP spike notifications
                spike_threshold = preferences.get('gmp_spike_threshold', 8.0)
                if abs(spike_data['percentage_change']) < spike_threshold:
                    continue
                
                # Filter by industry preference
                preferred_industries = preferences.get('preferred_industries', [])
                if preferred_industries and ipo.industry not in preferred_industries:
                    continue
                
                template_data = {
                    'ipo_name': ipo.name,
                    'previous_gmp': spike_data['previous_gmp'],
                    'current_gmp': spike_data['current_gmp'],
                    'percentage_change': round(spike_data['percentage_change'], 2),
                    'confidence_score': round(spike_data['confidence_score'], 2),
                    'spike_type': spike_data['spike_type']
                }
                
                html_content = self.templates['gmp_spike'].render(**template_data)
                
                notification = NotificationCreate(
                    user_id=user.id,
                    ipo_id=ipo.id,
                    type=NotificationType.gmp_spike,
                    title=f"GMP Alert: {ipo.name} ({spike_data['percentage_change']:+.1f}%)",
                    message=html_content
                )
                
                await self.send_notification(notification, db)
                
            except Exception as e:
                logger.error(f"Error sending GMP spike notification to user {user.id}: {e}")

    async def notify_listing_reminder(self, ipo: IPO, db: Session):
        """Send listing reminder notifications"""
        
        users = db.query(User).filter(User.is_active == True).all()
        
        for user in users:
            try:
                preferences = user.preferences or {}
                
                # Filter by industry preference
                preferred_industries = preferences.get('preferred_industries', [])
                if preferred_industries and ipo.industry not in preferred_industries:
                    continue
                
                # Calculate expected gain
                avg_price = (ipo.issue_price_min + ipo.issue_price_max) / 2
                expected_gain = (ipo.current_gmp / avg_price) * 100 if avg_price > 0 else 0
                
                template_data = {
                    'ipo_name': ipo.name,
                    'listing_date': ipo.listing_date.strftime('%d %b %Y') if ipo.listing_date else 'Tomorrow',
                    'current_gmp': ipo.current_gmp,
                    'gmp_percentage': round(ipo.gmp_percentage, 2),
                    'expected_gain': round(expected_gain, 2),
                    'confidence_score': round(ipo.confidence_score, 2)
                }
                
                html_content = self.templates['listing_reminder'].render(**template_data)
                
                notification = NotificationCreate(
                    user_id=user.id,
                    ipo_id=ipo.id,
                    type=NotificationType.listing_reminder,
                    title=f"Listing Tomorrow: {ipo.name}",
                    message=html_content
                )
                
                await self.send_notification(notification, db)
                
            except Exception as e:
                logger.error(f"Error sending listing reminder to user {user.id}: {e}")

    async def notify_profitable_ipo(self, ipo: IPO, db: Session):
        """Send notifications for profitable IPOs"""
        
        users = db.query(User).filter(User.is_active == True).all()
        
        for user in users:
            try:
                preferences = user.preferences or {}
                
                # Check profitability criteria
                min_profit_pct = preferences.get('min_profit_percentage', 10.0)
                min_absolute_profit = preferences.get('min_absolute_profit', 20.0)
                
                avg_price = (ipo.issue_price_min + ipo.issue_price_max) / 2
                profit_percentage = (ipo.current_gmp / avg_price) * 100 if avg_price > 0 else 0
                
                if profit_percentage < min_profit_pct and ipo.current_gmp < min_absolute_profit:
                    continue
                
                # Filter by industry preference
                preferred_industries = preferences.get('preferred_industries', [])
                if preferred_industries and ipo.industry not in preferred_industries:
                    continue
                
                # Check confidence score
                if ipo.confidence_score < 0.6:  # Skip low confidence IPOs
                    continue
                
                template_data = {
                    'ipo_name': ipo.name,
                    'current_gmp': ipo.current_gmp,
                    'gmp_percentage': round(ipo.gmp_percentage, 2),
                    'price_min': ipo.issue_price_min,
                    'price_max': ipo.issue_price_max,
                    'confidence_score': round(ipo.confidence_score, 2),
                    'status': ipo.status,
                    'open_date': ipo.open_date.strftime('%d %b %Y') if ipo.open_date else 'TBA'
                }
                
                html_content = self.templates['profitable_ipo'].render(**template_data)
                
                notification = NotificationCreate(
                    user_id=user.id,
                    ipo_id=ipo.id,
                    type=NotificationType.profitable_ipo,
                    title=f"Profitable IPO: {ipo.name} ({profit_percentage:.1f}%)",
                    message=html_content
                )
                
                await self.send_notification(notification, db)
                
            except Exception as e:
                logger.error(f"Error sending profitable IPO notification to user {user.id}: {e}")

    async def check_and_send_daily_notifications(self, db: Session):
        """Check for listing reminders and send daily notifications"""
        
        tomorrow = datetime.utcnow().date() + timedelta(days=1)
        
        # Find IPOs listing tomorrow
        listing_ipos = db.query(IPO).filter(
            IPO.listing_date >= tomorrow,
            IPO.listing_date < tomorrow + timedelta(days=1),
            IPO.status == 'closed'
        ).all()
        
        for ipo in listing_ipos:
            await self.notify_listing_reminder(ipo, db)
        
        logger.info(f"Sent listing reminders for {len(listing_ipos)} IPOs")