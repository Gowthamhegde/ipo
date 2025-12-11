import time
import asyncio
from typing import Dict, Optional
from collections import defaultdict, deque
from config import settings
from utils.cache import cache_manager

class RateLimiter:
    """Advanced rate limiter with multiple strategies"""
    
    def __init__(self):
        self.requests = defaultdict(deque)
        self.blocked_ips = {}
        
    async def is_allowed(
        self, 
        identifier: str, 
        limit: int = None, 
        window: int = 60,
        burst_limit: int = None
    ) -> bool:
        """
        Check if request is allowed based on rate limiting rules
        
        Args:
            identifier: IP address or user ID
            limit: Requests per window (default from settings)
            window: Time window in seconds
            burst_limit: Maximum burst requests
        """
        if limit is None:
            limit = settings.RATE_LIMIT_PER_MINUTE
        
        if burst_limit is None:
            burst_limit = settings.RATE_LIMIT_BURST
        
        current_time = time.time()
        
        # Check if IP is temporarily blocked
        if identifier in self.blocked_ips:
            if current_time < self.blocked_ips[identifier]:
                return False
            else:
                # Unblock IP
                del self.blocked_ips[identifier]
        
        # Use Redis for distributed rate limiting if available
        if cache_manager.is_connected:
            return await self._redis_rate_limit(identifier, limit, window, burst_limit)
        else:
            return self._memory_rate_limit(identifier, limit, window, burst_limit, current_time)
    
    async def _redis_rate_limit(
        self, 
        identifier: str, 
        limit: int, 
        window: int, 
        burst_limit: int
    ) -> bool:
        """Redis-based distributed rate limiting"""
        try:
            # Sliding window rate limiting using Redis
            key = f"rate_limit:{identifier}"
            current_time = time.time()
            
            # Remove old entries
            await cache_manager.redis_client.zremrangebyscore(
                key, 0, current_time - window
            )
            
            # Count current requests
            current_count = await cache_manager.redis_client.zcard(key)
            
            # Check burst limit
            if current_count >= burst_limit:
                # Block IP for 5 minutes
                self.blocked_ips[identifier] = current_time + 300
                return False
            
            # Check regular limit
            if current_count >= limit:
                return False
            
            # Add current request
            await cache_manager.redis_client.zadd(
                key, {str(current_time): current_time}
            )
            
            # Set expiration
            await cache_manager.redis_client.expire(key, window)
            
            return True
            
        except Exception as e:
            print(f"Redis rate limiting error: {e}")
            # Fall back to memory-based rate limiting
            return self._memory_rate_limit(identifier, limit, window, burst_limit, time.time())
    
    def _memory_rate_limit(
        self, 
        identifier: str, 
        limit: int, 
        window: int, 
        burst_limit: int, 
        current_time: float
    ) -> bool:
        """Memory-based rate limiting"""
        request_times = self.requests[identifier]
        
        # Remove old requests outside the window
        while request_times and request_times[0] <= current_time - window:
            request_times.popleft()
        
        # Check burst limit
        if len(request_times) >= burst_limit:
            # Block IP for 5 minutes
            self.blocked_ips[identifier] = current_time + 300
            return False
        
        # Check regular limit
        if len(request_times) >= limit:
            return False
        
        # Add current request
        request_times.append(current_time)
        
        return True
    
    async def get_remaining_requests(self, identifier: str, limit: int = None, window: int = 60) -> int:
        """Get remaining requests for identifier"""
        if limit is None:
            limit = settings.RATE_LIMIT_PER_MINUTE
        
        if cache_manager.is_connected:
            try:
                key = f"rate_limit:{identifier}"
                current_time = time.time()
                
                # Remove old entries
                await cache_manager.redis_client.zremrangebyscore(
                    key, 0, current_time - window
                )
                
                # Count current requests
                current_count = await cache_manager.redis_client.zcard(key)
                return max(0, limit - current_count)
                
            except Exception:
                pass
        
        # Fall back to memory-based counting
        request_times = self.requests[identifier]
        current_time = time.time()
        
        # Remove old requests
        while request_times and request_times[0] <= current_time - window:
            request_times.popleft()
        
        return max(0, limit - len(request_times))
    
    async def reset_limit(self, identifier: str):
        """Reset rate limit for identifier"""
        if cache_manager.is_connected:
            try:
                key = f"rate_limit:{identifier}"
                await cache_manager.redis_client.delete(key)
            except Exception:
                pass
        
        # Clear from memory
        if identifier in self.requests:
            del self.requests[identifier]
        
        if identifier in self.blocked_ips:
            del self.blocked_ips[identifier]
    
    def block_ip(self, identifier: str, duration: int = 300):
        """Manually block an IP for specified duration (seconds)"""
        self.blocked_ips[identifier] = time.time() + duration
    
    def unblock_ip(self, identifier: str):
        """Manually unblock an IP"""
        if identifier in self.blocked_ips:
            del self.blocked_ips[identifier]
    
    def is_blocked(self, identifier: str) -> bool:
        """Check if IP is currently blocked"""
        if identifier in self.blocked_ips:
            if time.time() < self.blocked_ips[identifier]:
                return True
            else:
                del self.blocked_ips[identifier]
        return False
    
    async def get_stats(self) -> Dict:
        """Get rate limiting statistics"""
        stats = {
            "active_limits": len(self.requests),
            "blocked_ips": len(self.blocked_ips),
            "total_blocked_time": sum(
                max(0, block_time - time.time()) 
                for block_time in self.blocked_ips.values()
            )
        }
        
        if cache_manager.is_connected:
            try:
                # Get Redis-based stats
                keys = []
                async for key in cache_manager.redis_client.scan_iter(match="rate_limit:*"):
                    keys.append(key)
                stats["redis_rate_limit_keys"] = len(keys)
            except Exception:
                pass
        
        return stats

class APIKeyRateLimiter:
    """Rate limiter specifically for API keys with different tiers"""
    
    TIER_LIMITS = {
        "free": {"requests_per_hour": 100, "requests_per_day": 1000},
        "premium": {"requests_per_hour": 1000, "requests_per_day": 10000},
        "enterprise": {"requests_per_hour": 10000, "requests_per_day": 100000}
    }
    
    def __init__(self):
        self.rate_limiter = RateLimiter()
    
    async def is_allowed(self, api_key: str, tier: str = "free") -> bool:
        """Check if API key request is allowed"""
        if tier not in self.TIER_LIMITS:
            tier = "free"
        
        limits = self.TIER_LIMITS[tier]
        
        # Check hourly limit
        hourly_allowed = await self.rate_limiter.is_allowed(
            f"api_key_hour:{api_key}",
            limit=limits["requests_per_hour"],
            window=3600  # 1 hour
        )
        
        if not hourly_allowed:
            return False
        
        # Check daily limit
        daily_allowed = await self.rate_limiter.is_allowed(
            f"api_key_day:{api_key}",
            limit=limits["requests_per_day"],
            window=86400  # 24 hours
        )
        
        return daily_allowed
    
    async def get_usage_stats(self, api_key: str, tier: str = "free") -> Dict:
        """Get API key usage statistics"""
        if tier not in self.TIER_LIMITS:
            tier = "free"
        
        limits = self.TIER_LIMITS[tier]
        
        hourly_remaining = await self.rate_limiter.get_remaining_requests(
            f"api_key_hour:{api_key}",
            limit=limits["requests_per_hour"],
            window=3600
        )
        
        daily_remaining = await self.rate_limiter.get_remaining_requests(
            f"api_key_day:{api_key}",
            limit=limits["requests_per_day"],
            window=86400
        )
        
        return {
            "tier": tier,
            "hourly_limit": limits["requests_per_hour"],
            "hourly_remaining": hourly_remaining,
            "hourly_used": limits["requests_per_hour"] - hourly_remaining,
            "daily_limit": limits["requests_per_day"],
            "daily_remaining": daily_remaining,
            "daily_used": limits["requests_per_day"] - daily_remaining
        }

# Global rate limiter instances
rate_limiter = RateLimiter()
api_key_rate_limiter = APIKeyRateLimiter()