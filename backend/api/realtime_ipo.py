"""
Real-time IPO API endpoints
Provides REST API for controlling and monitoring real-time IPO data fetching
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import List, Dict, Optional
from datetime import datetime
import asyncio

from services.real_time_ipo_service import real_time_ipo_service
from tasks.ipo_scheduler import ipo_scheduler
from utils.logger import get_logger
from schemas import IPOResponse

logger = get_logger(__name__)
router = APIRouter(prefix="/api/realtime-ipo", tags=["Real-time IPO"])

@router.post("/start")
async def start_realtime_service():
    """Start the real-time IPO data fetching service"""
    try:
        if real_time_ipo_service.is_running:
            return {
                "status": "already_running",
                "message": "Real-time IPO service is already running",
                "service_status": real_time_ipo_service.get_status()
            }
        
        await real_time_ipo_service.start_service()
        ipo_scheduler.start_scheduler()
        
        return {
            "status": "started",
            "message": "Real-time IPO service started successfully",
            "service_status": real_time_ipo_service.get_status(),
            "scheduler_status": ipo_scheduler.get_scheduler_status()
        }
        
    except Exception as e:
        logger.error(f"Error starting real-time service: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/stop")
async def stop_realtime_service():
    """Stop the real-time IPO data fetching service"""
    try:
        await real_time_ipo_service.stop_service()
        ipo_scheduler.stop_scheduler()
        
        return {
            "status": "stopped",
            "message": "Real-time IPO service stopped successfully"
        }
        
    except Exception as e:
        logger.error(f"Error stopping real-time service: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/status")
async def get_service_status():
    """Get the status of real-time IPO service"""
    try:
        service_status = real_time_ipo_service.get_status()
        scheduler_status = ipo_scheduler.get_scheduler_status()
        
        return {
            "service": service_status,
            "scheduler": scheduler_status,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting service status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/fetch-now")
async def fetch_ipo_data_now(background_tasks: BackgroundTasks):
    """Manually trigger IPO data fetching"""
    try:
        # Run fetch in background
        background_tasks.add_task(real_time_ipo_service.fetch_all_ipo_data)
        
        return {
            "status": "triggered",
            "message": "IPO data fetch triggered successfully",
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error triggering IPO data fetch: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/latest-data")
async def get_latest_ipo_data():
    """Get the latest fetched IPO data"""
    try:
        # Try to get from cache first
        from utils.cache import cache_manager
        cached_data = cache_manager.get('latest_ipo_data')
        
        if cached_data:
            return {
                "status": "success",
                "data": cached_data,
                "source": "cache",
                "timestamp": datetime.now().isoformat()
            }
        
        # If no cached data, fetch fresh data
        ipos = await real_time_ipo_service.fetch_all_ipo_data()
        
        return {
            "status": "success",
            "data": ipos,
            "source": "fresh_fetch",
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting latest IPO data: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/sources")
async def get_data_sources():
    """Get information about IPO data sources"""
    try:
        return {
            "sources": real_time_ipo_service.sources,
            "active_sources": list(real_time_ipo_service.sources.keys()),
            "total_sources": len(real_time_ipo_service.sources)
        }
        
    except Exception as e:
        logger.error(f"Error getting data sources: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/force-task/{task_type}")
async def force_run_task(task_type: str):
    """Force run a specific scheduled task"""
    try:
        valid_tasks = ['daily_fetch', 'periodic_fetch', 'weekly_cleanup', 'market_update']
        
        if task_type not in valid_tasks:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid task type. Valid types: {valid_tasks}"
            )
        
        ipo_scheduler.force_run_task(task_type)
        
        return {
            "status": "triggered",
            "message": f"Task '{task_type}' triggered successfully",
            "task_type": task_type,
            "timestamp": datetime.now().isoformat()
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error forcing task run: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/tasks")
async def get_task_status(task_id: Optional[str] = None):
    """Get status of scheduled tasks"""
    try:
        if task_id:
            task_status = ipo_scheduler.get_task_status(task_id)
            if not task_status:
                raise HTTPException(status_code=404, detail="Task not found")
            return task_status
        
        return {
            "tasks": ipo_scheduler.get_task_status(),
            "scheduler": ipo_scheduler.get_scheduler_status()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting task status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health")
async def health_check():
    """Health check endpoint for real-time IPO service"""
    try:
        service_status = real_time_ipo_service.get_status()
        scheduler_status = ipo_scheduler.get_scheduler_status()
        
        is_healthy = (
            service_status.get('is_running', False) and
            scheduler_status.get('is_running', False)
        )
        
        return {
            "status": "healthy" if is_healthy else "unhealthy",
            "service_running": service_status.get('is_running', False),
            "scheduler_running": scheduler_status.get('is_running', False),
            "last_fetch": service_status.get('last_fetch'),
            "active_tasks": scheduler_status.get('active_tasks', 0),
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error in health check: {e}")
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

@router.get("/metrics")
async def get_service_metrics():
    """Get detailed metrics about the real-time IPO service"""
    try:
        service_status = real_time_ipo_service.get_status()
        scheduler_status = ipo_scheduler.get_scheduler_status()
        
        # Get cache statistics
        from utils.cache import cache_manager
        cache_stats = cache_manager.get_stats() if hasattr(cache_manager, 'get_stats') else {}
        
        return {
            "service_metrics": {
                "is_running": service_status.get('is_running', False),
                "last_fetch": service_status.get('last_fetch'),
                "sources_count": len(service_status.get('sources', [])),
                "uptime": "N/A"  # Calculate based on start time if available
            },
            "scheduler_metrics": {
                "is_running": scheduler_status.get('is_running', False),
                "active_tasks": scheduler_status.get('active_tasks', 0),
                "total_tasks": scheduler_status.get('total_tasks', 0),
                "scheduled_jobs": scheduler_status.get('scheduled_jobs', 0)
            },
            "cache_metrics": cache_stats,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting service metrics: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/configure")
async def configure_service(config: Dict):
    """Configure real-time IPO service settings"""
    try:
        # This endpoint can be used to update service configuration
        # For now, return the current configuration
        
        return {
            "status": "configured",
            "message": "Service configuration updated",
            "config": config,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error configuring service: {e}")
        raise HTTPException(status_code=500, detail=str(e))