import asyncio
import time
from datetime import datetime
from typing import Callable, Dict, Any, List, Optional
from utils.logger import get_logger

logger = get_logger(__name__)

class IPOScheduler:
    """IPO-specific scheduler tasks using asyncio"""
    
    def __init__(self):
        self.tasks = {}
        self.is_running = False
        self._scheduler_task = None
        self.logger = logger
        self.task_history = []
    
    def setup_tasks(self):
        """Setup all IPO-related scheduled tasks"""
        self.tasks = {
            'periodic_fetch': {
                'func': self.fetch_ipo_data,
                'interval': 7200,  # 2 hours
                'next_run': time.time() + 7200,
                'last_run': None,
                'status': 'pending'
            },
            'market_update': {
                'func': self.update_gmp_data,
                'interval': 1800,  # 30 minutes
                'next_run': time.time() + 1800,
                'last_run': None,
                'status': 'pending'
            },
            'daily_fetch': {
                'func': self.check_profitable_ipos,
                'interval': 3600,  # 1 hour
                'next_run': time.time() + 3600,
                'last_run': None,
                'status': 'pending'
            },
            'weekly_cleanup': {
                'func': self.send_daily_notifications,
                'interval': 86400,  # 24 hours
                'next_run': time.time() + 86400,
                'last_run': None,
                'status': 'pending'
            }
        }
    
    async def _run_scheduler_loop(self):
        """Main scheduler loop"""
        self.logger.info("Scheduler loop started")
        while self.is_running:
            current_time = time.time()
            
            for task_id, task in self.tasks.items():
                if current_time >= task['next_run']:
                    try:
                        self.logger.info(f"Executing task: {task_id}")
                        task['status'] = 'running'
                        
                        # Execute the task
                        await task['func']()
                        
                        # Update task state
                        task['last_run'] = datetime.now().isoformat()
                        task['next_run'] = current_time + task['interval']
                        task['status'] = 'completed'
                        
                        self.task_history.append({
                            'task_id': task_id,
                            'status': 'success',
                            'timestamp': datetime.now().isoformat()
                        })
                        
                    except Exception as e:
                        self.logger.error(f"Error executing task {task_id}: {e}")
                        task['status'] = 'failed'
                        task['next_run'] = current_time + 60  # Retry in 1 minute
                        
                        self.task_history.append({
                            'task_id': task_id,
                            'status': 'failed',
                            'error': str(e),
                            'timestamp': datetime.now().isoformat()
                        })
            
            await asyncio.sleep(1)  # Check every second
    
    def start_scheduler(self):
        """Start the scheduler"""
        if self.is_running:
            return
        
        self.setup_tasks()
        self.is_running = True
        self._scheduler_task = asyncio.create_task(self._run_scheduler_loop())
        self.logger.info("Scheduler started")
    
    def stop_scheduler(self):
        """Stop the scheduler"""
        self.is_running = False
        if self._scheduler_task:
            self._scheduler_task.cancel()
        self.logger.info("Scheduler stopped")
        
    def get_scheduler_status(self) -> Dict:
        """Get overall scheduler status"""
        return {
            'is_running': self.is_running,
            'active_tasks': len(self.tasks),
            'total_tasks': len(self.tasks),
            'scheduled_jobs': len(self.tasks)
        }

    def get_task_status(self, task_id: Optional[str] = None) -> Any:
        """Get status of specific task or all tasks"""
        if task_id:
            return self.tasks.get(task_id)
        return self.tasks

    def force_run_task(self, task_id: str):
        """Force run a specific task immediately"""
        if task_id not in self.tasks:
            raise ValueError(f"Task {task_id} not found")
        
        # Schedule it to run immediately
        self.tasks[task_id]['next_run'] = time.time()
    
    async def fetch_ipo_data(self):
        """Fetch latest IPO data"""
        try:
            self.logger.info("Fetching IPO data via RealTimeIPOService...")
            from services.real_time_ipo_service import real_time_ipo_service
            await real_time_ipo_service.fetch_all_ipo_data()
            self.logger.info("IPO data fetch completed")
        except Exception as e:
            self.logger.error(f"Error fetching IPO data: {e}")
    
    async def update_gmp_data(self):
        """Update GMP data"""
        try:
            # Re-use fetch logic for now as it updates both IPO and GMP
            await self.fetch_ipo_data()
        except Exception as e:
            self.logger.error(f"Error updating GMP data: {e}")
    
    async def check_profitable_ipos(self):
        """Check for profitable IPOs"""
        # Placeholder for profitability notification logic
        pass
    
    async def send_daily_notifications(self):
        """Send daily notifications"""
        # Placeholder for daily summary logic
        pass

# Create global scheduler instance
ipo_scheduler = IPOScheduler()