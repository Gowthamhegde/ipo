#!/usr/bin/env python3
"""
Startup script for Real-time IPO Data Fetcher
Initializes and starts the automatic IPO data fetching service
"""

import asyncio
import sys
import os
import logging
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_path))

from services.real_time_ipo_service import real_time_ipo_service
from tasks.ipo_scheduler import ipo_scheduler
from utils.logger import get_logger

logger = get_logger(__name__)

async def main():
    """Main startup function"""
    try:
        logger.info("🚀 Starting Real-time IPO Data Fetcher...")
        
        # Start the real-time IPO service
        await real_time_ipo_service.start_service()
        
        # Start the scheduler
        ipo_scheduler.start_scheduler()
        
        logger.info("✅ Real-time IPO Data Fetcher started successfully!")
        logger.info("📊 Service Status:")
        logger.info(f"   - Service Running: {real_time_ipo_service.is_running}")
        logger.info(f"   - Scheduler Running: {ipo_scheduler.is_running}")
        logger.info(f"   - Data Sources: {len(real_time_ipo_service.sources)}")
        
        # Initial data fetch
        logger.info("🔄 Performing initial data fetch...")
        ipos = await real_time_ipo_service.fetch_all_ipo_data()
        logger.info(f"📈 Initial fetch completed: {len(ipos)} IPOs found")
        
        # Keep the service running
        logger.info("🔄 Service is now running. Press Ctrl+C to stop.")
        
        try:
            while True:
                await asyncio.sleep(60)  # Check every minute
                
                # Log status every 10 minutes
                if asyncio.get_event_loop().time() % 600 < 60:
                    status = real_time_ipo_service.get_status()
                    scheduler_status = ipo_scheduler.get_scheduler_status()
                    logger.info(f"📊 Status Check - Service: {status['is_running']}, "
                              f"Scheduler: {scheduler_status['is_running']}, "
                              f"Active Tasks: {scheduler_status['active_tasks']}")
                
        except KeyboardInterrupt:
            logger.info("🛑 Shutdown signal received...")
            
    except Exception as e:
        logger.error(f"❌ Error starting Real-time IPO service: {e}")
        sys.exit(1)
    
    finally:
        # Cleanup
        logger.info("🧹 Cleaning up...")
        await real_time_ipo_service.stop_service()
        ipo_scheduler.stop_scheduler()
        logger.info("✅ Cleanup completed. Goodbye!")

def run_service():
    """Run the service with proper error handling"""
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("👋 Service stopped by user")
    except Exception as e:
        logger.error(f"💥 Fatal error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    # Setup logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.StreamHandler(sys.stdout),
            logging.FileHandler('realtime_ipo.log')
        ]
    )
    
    print("=" * 60)
    print("🎯 IPO GMP Analyzer - Real-time Data Fetcher")
    print("=" * 60)
    print()
    
    run_service()