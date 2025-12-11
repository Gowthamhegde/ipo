import redis.asyncio as redis
import json
import asyncio
from typing import Any, Optional, Union
from datetime import timedelta
import pickle
import hashlib
from config import settings
from utils.logger import performance_logger
import time

class CacheManager:
    """Advanced Redis cache manager with performance monitoring"""
    
    def __init__(self):
        self.redis_client = None
        self.is_connected = False
        self.connection_pool = None
    
    async def initialize(self):
        """Initialize Redis connection with connection pooling"""
        try:
            self.connection_pool = redis.ConnectionPool.from_url(
                settings.REDIS_URL,
                max_connections=20,
                retry_on_timeout=True,
                decode_responses=False  # We'll handle encoding ourselves
            )
            
            self.redis_client = redis.Redis(connection_pool=self.connection_pool)
            
            # Test connection
            await self.redis_client.ping()
            self.is_connected = True
            
            print(f"✅ Redis connected successfully")
            return True
            
        except Exception as e:
            print(f"❌ Redis connection failed: {e}")
            self.is_connected = False
            return False
    
    async def close(self):
        """Close Redis connection"""
        if self.redis_client:
            await self.redis_client.close()
        if self.connection_pool:
            await self.connection_pool.disconnect()
    
    def _serialize_value(self, value: Any) -> bytes:
        """Serialize value for storage"""
        if isinstance(value, (str, int, float, bool)):
            return json.dumps(value).encode('utf-8')
        else:
            # Use pickle for complex objects
            return pickle.dumps(value)
    
    def _deserialize_value(self, value: bytes) -> Any:
        """Deserialize value from storage"""
        try:
            # Try JSON first
            return json.loads(value.decode('utf-8'))
        except (json.JSONDecodeError, UnicodeDecodeError):
            # Fall back to pickle
            return pickle.loads(value)
    
    def _generate_key(self, key: str, prefix: str = "ipo") -> str:
        """Generate cache key with prefix"""
        return f"{prefix}:{key}"
    
    async def get(self, key: str, prefix: str = "ipo") -> Optional[Any]:
        """Get value from cache with performance logging"""
        if not self.is_connected:
            return None
        
        start_time = time.time()
        cache_key = self._generate_key(key, prefix)
        
        try:
            value = await self.redis_client.get(cache_key)
            execution_time = time.time() - start_time
            
            if value:
                result = self._deserialize_value(value)
                performance_logger.log_cache_operation(
                    "get", cache_key, hit=True, execution_time=execution_time
                )
                return result
            else:
                performance_logger.log_cache_operation(
                    "get", cache_key, hit=False, execution_time=execution_time
                )
                return None
                
        except Exception as e:
            execution_time = time.time() - start_time
            performance_logger.log_cache_operation(
                "get", cache_key, hit=False, execution_time=execution_time
            )
            print(f"Cache get error for key {cache_key}: {e}")
            return None
    
    async def set(
        self, 
        key: str, 
        value: Any, 
        ttl: Optional[int] = None, 
        prefix: str = "ipo"
    ) -> bool:
        """Set value in cache with TTL"""
        if not self.is_connected:
            return False
        
        start_time = time.time()
        cache_key = self._generate_key(key, prefix)
        
        try:
            serialized_value = self._serialize_value(value)
            
            if ttl:
                await self.redis_client.setex(cache_key, ttl, serialized_value)
            else:
                await self.redis_client.set(cache_key, serialized_value)
            
            execution_time = time.time() - start_time
            performance_logger.log_cache_operation(
                "set", cache_key, execution_time=execution_time
            )
            return True
            
        except Exception as e:
            execution_time = time.time() - start_time
            performance_logger.log_cache_operation(
                "set", cache_key, execution_time=execution_time
            )
            print(f"Cache set error for key {cache_key}: {e}")
            return False
    
    async def delete(self, key: str, prefix: str = "ipo") -> bool:
        """Delete key from cache"""
        if not self.is_connected:
            return False
        
        cache_key = self._generate_key(key, prefix)
        
        try:
            result = await self.redis_client.delete(cache_key)
            performance_logger.log_cache_operation("delete", cache_key)
            return bool(result)
        except Exception as e:
            print(f"Cache delete error for key {cache_key}: {e}")
            return False
    
    async def health_check(self) -> bool:
        """Check cache health"""
        if not self.is_connected:
            return False
        
        try:
            await self.redis_client.ping()
            return True
        except Exception as e:
            print(f"Cache health check failed: {e}")
            return False

# Global cache instance
cache_manager = CacheManager()