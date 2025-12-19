import asyncio
import time
from datetime import datetime, timedelta
from typing import Callable, Dict, Any
from utils.logger import get_logger

logger = get_logger(__name__)

class SimpleScheduler:
    """Simple task scheduler without external dependencies"""
    
    def __init__(self):
        self.tasks = []
        self.running = False
    
    def every(self, interval_seconds: int):
        """Schedule a task to run every N seconds"""
        return TaskBuilder(self, interval_seconds)
    
    def add_task(self, func: Callable, interval: int, *args, **kwargs):
        """Add a task to the scheduler"""
        task = {
            'func': func,
            'interval': interval,
            'next_run': time.time() + interval,
            'args': args,
            'kwargs': kwargs
        }
        self.tasks.append(task)
        logger.info(f"Scheduled task {func.__name__} to run every {interval} seconds")
    
    async def run_pending(self):
        """Run any pending tasks"""
        current_time = time.time()
        
        for task in self.tasks:
            if current_time >= task['next_run']:
                try:
                    # Run the task
                    if asyncio.iscoroutinefunction(task['func']):
                        await task['func'](*task['args'], **task['kwargs'])
                    else:
                        task['func'](*task['args'], **task['kwargs'])
                    
                    # Schedule next run
                    task['next_run'] = current_time + task['interval']
                    logger.info(f"Executed task {task['func'].__name__}")
                    
                except Exception as e:
                    logger.error(f"Error executing task {task['func'].__name__}: {e}")
    
    async def start(self):
        """Start the scheduler"""
        self.running = True
        logger.info("Scheduler started")
        
        while self.running:
            await self.run_pending()
            await asyncio.sleep(1)  # Check every second
    
    def stop(self):
        """Stop the scheduler"""
        self.running = False
        logger.info("Scheduler stopped")

class TaskBuilder:
    """Builder for scheduling tasks"""
    
    def __init__(self, scheduler: SimpleScheduler, interval: int):
        self.scheduler = scheduler
        self.interval = interval
    
    def do(self, func: Callable, *args, **kwargs):
        """Schedule the function to run"""
        self.scheduler.add_task(func, self.interval, *args, **kwargs)

class IPOScheduler:
    """IPO-specific scheduler tasks"""
    
    def __init__(self):
        self.scheduler = SimpleScheduler()
        self.logger = logger
    
    def setup_tasks(self):
        """Setup all IPO-related scheduled tasks"""
        
        # Fetch IPO data every 2 hours (7200 seconds)
        self.scheduler.every(7200).do(self.fetch_ipo_data)
        
        # Update GMP data every 30 minutes (1800 seconds)
        self.scheduler.every(1800).do(self.update_gmp_data)
        
        # Check for profitable IPOs every hour (3600 seconds)
        self.scheduler.every(3600).do(self.check_profitable_ipos)
        
        # Send daily notifications at specific time (86400 seconds = 24 hours)
        self.scheduler.every(86400).do(self.send_daily_notifications)
    
    async def fetch_ipo_data(self):
        """Fetch latest IPO data"""
        try:
            self.logger.info("Fetching IPO data...")
            # Mock implementation - replace with actual data fetching
            await asyncio.sleep(1)
            self.logger.info("IPO data fetched successfully")
        except Exception as e:
            self.logger.error(f"Error fetching IPO data: {e}")
    
    async def update_gmp_data(self):
        """Update GMP data"""
        try:
            self.logger.info("Updating GMP data...")
            # Mock implementation - replace with actual GMP updates
            await asyncio.sleep(1)
            self.logger.info("GMP data updated successfully")
        except Exception as e:
            self.logger.error(f"Error updating GMP data: {e}")
    
    async def check_profitable_ipos(self):
        """Check for profitable IPOs"""
        try:
            self.logger.info("Checking for profitable IPOs...")
            # Mock implementation - replace with actual profitability check
            await asyncio.sleep(1)
            self.logger.info("Profitable IPO check completed")
        except Exception as e:
            self.logger.error(f"Error checking profitable IPOs: {e}")
    
    async def send_daily_notifications(self):
        """Send daily notifications"""
        try:
            self.logger.info("Sending daily notifications...")
            # Mock implementation - replace with actual notification sending
            await asyncio.sleep(1)
            self.logger.info("Daily notifications sent successfully")
        except Exception as e:
            self.logger.error(f"Error sending daily notifications: {e}")
    
    async def start(self):
        """Start the IPO scheduler"""
        self.setup_tasks()
        await self.scheduler.start()
    
    def stop(self):
        """Stop the IPO scheduler"""
        self.scheduler.stop()

# Create global scheduler instance
ipo_scheduler = IPOScheduler()