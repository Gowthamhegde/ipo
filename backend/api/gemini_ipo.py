"""
Gemini IPO API endpoints
Provides REST API for Gemini AI-powered IPO data fetching
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import List, Dict, Optional
from datetime import datetime
import asyncio

from services.gemini_ipo_service import gemini_ipo_service
from utils.logger import get_logger

logger = get_logger(__name__)
router = APIRouter(prefix="/api/gemini-ipo", tags=["Gemini IPO"])

@router.post("/initialize")
async def initialize_gemini_service():
    """Initialize the Gemini IPO service"""
    try:
        success = await gemini_ipo_service.initialize()
        
        if success:
            return {
                "status": "initialized",
                "message": "Gemini IPO service initialized successfully",
                "service_status": gemini_ipo_service.get_status()
            }
        else:
            return {
                "status": "failed",
                "message": "Failed to initialize Gemini IPO service. Check API key.",
                "service_status": gemini_ipo_service.get_status()
            }
        
    except Exception as e:
        logger.error(f"Error initializing Gemini service: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/status")
async def get_gemini_service_status():
    """Get the status of Gemini IPO service"""
    try:
        status = gemini_ipo_service.get_status()
        
        return {
            "service": status,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting Gemini service status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/ipos")
async def get_current_ipos():
    """Get current IPO data from Gemini AI"""
    try:
        ipos = await gemini_ipo_service.fetch_current_ipos()
        
        return {
            "status": "success",
            "data": ipos,
            "count": len(ipos),
            "source": "gemini_ai",
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error fetching IPOs from Gemini: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/ipos/{ipo_name}/analysis")
async def get_ipo_analysis(ipo_name: str):
    """Get detailed analysis for a specific IPO"""
    try:
        analysis = await gemini_ipo_service.get_ipo_analysis(ipo_name)
        
        if analysis:
            return {
                "status": "success",
                "data": analysis,
                "source": "gemini_ai",
                "timestamp": datetime.now().isoformat()
            }
        else:
            return {
                "status": "not_found",
                "message": f"Analysis not available for {ipo_name}",
                "timestamp": datetime.now().isoformat()
            }
        
    except Exception as e:
        logger.error(f"Error getting IPO analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/market-sentiment")
async def get_market_sentiment():
    """Get current market sentiment and trends"""
    try:
        sentiment = await gemini_ipo_service.get_market_sentiment()
        
        if sentiment:
            return {
                "status": "success",
                "data": sentiment,
                "source": "gemini_ai",
                "timestamp": datetime.now().isoformat()
            }
        else:
            return {
                "status": "not_available",
                "message": "Market sentiment data not available",
                "timestamp": datetime.now().isoformat()
            }
        
    except Exception as e:
        logger.error(f"Error getting market sentiment: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/gmp-updates")
async def get_gmp_updates(ipo_names: Optional[List[str]] = None):
    """Get GMP updates for specific IPOs or all IPOs"""
    try:
        gmp_data = await gemini_ipo_service.get_gmp_updates(ipo_names)
        
        return {
            "status": "success",
            "data": gmp_data,
            "count": len(gmp_data),
            "source": "gemini_ai",
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting GMP updates: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/refresh-data")
async def refresh_gemini_data(background_tasks: BackgroundTasks):
    """Manually refresh IPO data from Gemini AI"""
    try:
        # Clear cache and fetch fresh data
        from utils.cache import cache_manager
        
        # Clear Gemini-related cache
        cache_keys_to_clear = [
            'gemini_current_ipos',
            'gemini_market_sentiment'
        ]
        
        for key in cache_keys_to_clear:
            cache_manager.delete(key)
        
        # Trigger fresh data fetch in background
        background_tasks.add_task(gemini_ipo_service.fetch_current_ipos)
        
        return {
            "status": "triggered",
            "message": "Data refresh triggered successfully",
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error refreshing Gemini data: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health")
async def health_check():
    """Health check endpoint for Gemini IPO service"""
    try:
        status = gemini_ipo_service.get_status()
        
        is_healthy = (
            status.get('is_initialized', False) and
            status.get('has_api_key', False)
        )
        
        return {
            "status": "healthy" if is_healthy else "unhealthy",
            "service_initialized": status.get('is_initialized', False),
            "api_key_configured": status.get('has_api_key', False),
            "last_fetch": status.get('last_fetch'),
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error in Gemini health check: {e}")
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

@router.get("/test-connection")
async def test_gemini_connection():
    """Test connection to Gemini AI API"""
    try:
        if not gemini_ipo_service.is_initialized:
            success = await gemini_ipo_service.initialize()
            if not success:
                return {
                    "status": "failed",
                    "message": "Failed to initialize Gemini service",
                    "timestamp": datetime.now().isoformat()
                }
        
        # Test with a simple prompt
        test_response = await gemini_ipo_service.call_gemini_api("Hello, please respond with 'Connection successful'")
        
        return {
            "status": "success",
            "message": "Connection to Gemini AI successful",
            "response": test_response[:100] + "..." if len(test_response) > 100 else test_response,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error testing Gemini connection: {e}")
        return {
            "status": "failed",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

@router.post("/start-daily-updates")
async def start_daily_updates():
    """Start daily automatic updates at 9 AM IST"""
    try:
        gemini_ipo_service.start_daily_updates()
        
        return {
            "status": "started",
            "message": "Daily automatic updates started (9 AM IST)",
            "service_status": gemini_ipo_service.get_status()
        }
        
    except Exception as e:
        logger.error(f"Error starting daily updates: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/stop-daily-updates")
async def stop_daily_updates():
    """Stop daily automatic updates"""
    try:
        gemini_ipo_service.stop_daily_updates()
        
        return {
            "status": "stopped",
            "message": "Daily automatic updates stopped",
            "service_status": gemini_ipo_service.get_status()
        }
        
    except Exception as e:
        logger.error(f"Error stopping daily updates: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/force-update")
async def force_immediate_update():
    """Force immediate update from web sources"""
    try:
        ipos = await gemini_ipo_service.force_update()
        
        return {
            "status": "completed",
            "message": "Immediate update completed",
            "data": ipos,
            "count": len(ipos),
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error in force update: {e}")
        raise HTTPException(status_code=500, detail=str(e))