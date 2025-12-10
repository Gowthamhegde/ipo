import schedule
import time
import threading
from datetime import datetime
import asyncio
import logging
from sqlalchemy.orm import Session

from database import SessionLocal
from services.data_fetcher import DataFetcher
from services.gmp_validator import GMPValidator
from services.notification_service import NotificationService
from services.ml_predictor import MLPredictor
from models import IPO
from utils.logger import get_logger

logger = get_logger(__name__)

class TaskScheduler:
    """Background task scheduler for IPO data updates and notifications"""
    
    def __init__(self):
        self.data_fetcher = DataFetcher()
        self.gmp_validator = GMPValidator()
        self.notification_service = NotificationService()
        self.ml_predictor = MLPredictor()
        self.running = False
    
    def start(self):
        """Start the scheduler"""
        if self.running:
            return
        
        self.running = True
        
        # Schedule tasks
        schedule.every(2).hours.do(self.update_ipo_data)
        schedule.every(30).minutes.do(self.validate_gmp_data)
        schedule.every(1).hours.do(self.check_gmp_spikes)
        schedule.every().day.at("09:00").do(self.send_daily_notifications)
        schedule.every().day.at("18:00").do(self.check_profitable_ipos)
        schedule.every().week.do(self.retrain_ml_model)
        
        # Start scheduler thread
        scheduler_thread = threading.Thread(target=self._run_scheduler, daemon=True)
        scheduler_thread.start()
        
        logger.info("Task scheduler started")
    
    def stop(self):
        """Stop the scheduler"""
        self.running = False
        schedule.clear()
        logger.info("Task scheduler stopped")
    
    def _run_scheduler(self):
        """Run the scheduler loop"""
        while self.running:
            try:
                schedule.run_pending()
                time.sleep(60)  # Check every minute
            except Exception as e:
                logger.error(f"Scheduler error: {e}")
                time.sleep(60)
    
    def update_ipo_data(self):
        """Update IPO data from all sources"""
        logger.info("Starting IPO data update...")
        
        try:
            db = SessionLocal()
            
            # Run async data fetching in sync context
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            
            results = loop.run_until_complete(
                self.data_fetcher.fetch_all_sources(db)
            )
            
            total_ipos = sum(len(data) for data in results.values())
            logger.info(f"Updated data for {total_ipos} IPOs from {len(results)} sources")
            
            db.close()
            loop.close()
            
        except Exception as e:
            logger.error(f"Error updating IPO data: {e}")
    
    def validate_gmp_data(self):
        """Validate GMP data for all active IPOs"""
        logger.info("Starting GMP validation...")
        
        try:
            db = SessionLocal()
            
            results = self.gmp_validator.validate_all_active_ipos(db)
            logger.info(f"Validated GMP for {len(results)} IPOs")
            
            db.close()
            
        except Exception as e:
            logger.error(f"Error validating GMP data: {e}")
    
    def check_gmp_spikes(self):
        """Check for GMP spikes and send notifications"""
        logger.info("Checking for GMP spikes...")
        
        try:
            db = SessionLocal()
            
            # Get all active IPOs
            active_ipos = db.query(IPO).filter(
                IPO.status.in_(['upcoming', 'open'])
            ).all()
            
            spike_count = 0
            
            for ipo in active_ipos:
                spike_data = self.gmp_validator.detect_gmp_spike(ipo.id, db)
                
                if spike_data:
                    # Send spike notification
                    loop = asyncio.new_event_loop()
                    asyncio.set_event_loop(loop)
                    
                    loop.run_until_complete(
                        self.notification_service.notify_gmp_spike(spike_data, db)
                    )
                    
                    spike_count += 1
                    loop.close()
            
            logger.info(f"Detected and notified {spike_count} GMP spikes")
            db.close()
            
        except Exception as e:
            logger.error(f"Error checking GMP spikes: {e}")
    
    def send_daily_notifications(self):
        """Send daily notifications (listing reminders, etc.)"""
        logger.info("Sending daily notifications...")
        
        try:
            db = SessionLocal()
            
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            
            loop.run_until_complete(
                self.notification_service.check_and_send_daily_notifications(db)
            )
            
            loop.close()
            db.close()
            
        except Exception as e:
            logger.error(f"Error sending daily notifications: {e}")
    
    def check_profitable_ipos(self):
        """Check for profitable IPOs and send notifications"""
        logger.info("Checking for profitable IPOs...")
        
        try:
            db = SessionLocal()
            
            # Get IPOs that became profitable
            profitable_ipos = db.query(IPO).filter(
                IPO.is_profitable == True,
                IPO.confidence_score >= 0.6,
                IPO.status.in_(['upcoming', 'open'])
            ).all()
            
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            
            for ipo in profitable_ipos:
                # Check if we already sent notification recently
                recent_notification = db.query(Notification).filter(
                    Notification.ipo_id == ipo.id,
                    Notification.type == 'profitable_ipo',
                    Notification.created_at >= datetime.utcnow() - timedelta(days=1)
                ).first()
                
                if not recent_notification:
                    loop.run_until_complete(
                        self.notification_service.notify_profitable_ipo(ipo, db)
                    )
            
            logger.info(f"Checked {len(profitable_ipos)} profitable IPOs")
            
            loop.close()
            db.close()
            
        except Exception as e:
            logger.error(f"Error checking profitable IPOs: {e}")
    
    def retrain_ml_model(self):
        """Retrain ML model with latest data"""
        logger.info("Retraining ML model...")
        
        try:
            db = SessionLocal()
            
            result = self.ml_predictor.retrain_model(db)
            
            if "success" in result:
                logger.info(f"ML model retrained successfully: {result}")
            else:
                logger.warning(f"ML model retraining failed: {result}")
            
            db.close()
            
        except Exception as e:
            logger.error(f"Error retraining ML model: {e}")

# Global scheduler instance
scheduler = TaskScheduler()

def start_scheduler():
    """Start the background scheduler"""
    scheduler.start()

def stop_scheduler():
    """Stop the background scheduler"""
    scheduler.stop()