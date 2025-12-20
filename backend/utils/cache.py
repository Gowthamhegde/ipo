import time
from typing import Any, Optional, Dict
import json
import hashlib

class SimpleCache:
    """Simple in-memory cache implementation"""
    
    def __init__(self):
        self._cache: Dict[str, Dict[str, Any]] = {}
        self._default_ttl = 3600  # 1 hour
    
    def _is_expired(self, item: Dict[str, Any]) -> bool:
        """Check if cache item is expired"""
        return time.time() > item['expires_at']
    
    def _cleanup_expired(self):
        """Remove expired items from cache"""
        current_time = time.time()
        expired_keys = [
            key for key, item in self._cache.items()
            if current_time > item['expires_at']
        ]
        for key in expired_keys:
            del self._cache[key]
    
    def get(self, key: str) -> Optional[Any]:
        """Get item from cache"""
        self._cleanup_expired()
        
        if key in self._cache:
            item = self._cache[key]
            if not self._is_expired(item):
                return item['value']
            else:
                del self._cache[key]
        
        return None
    
    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        """Set item in cache"""
        if ttl is None:
            ttl = self._default_ttl
        
        expires_at = time.time() + ttl
        self._cache[key] = {
            'value': value,
            'expires_at': expires_at
        }
        return True
    
    def delete(self, key: str) -> bool:
        """Delete item from cache"""
        if key in self._cache:
            del self._cache[key]
            return True
        return False
    
    def clear(self) -> bool:
        """Clear all cache"""
        self._cache.clear()
        return True
    
    def exists(self, key: str) -> bool:
        """Check if key exists in cache"""
        return self.get(key) is not None

class CacheManager:
    """Cache manager with different cache strategies"""
    
    def __init__(self):
        self.cache = SimpleCache()
        self.is_connected = False
        self.redis_client = None
    
    def get(self, key: str) -> Optional[Any]:
        """Get item from cache"""
        return self.cache.get(key)

    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        """Set item in cache"""
        return self.cache.set(key, value, ttl)

    def delete(self, key: str) -> bool:
        """Delete item from cache"""
        return self.cache.delete(key)

    def cache_key(self, prefix: str, *args, **kwargs) -> str:
        """Generate cache key from arguments"""
        key_data = f"{prefix}:{':'.join(map(str, args))}"
        if kwargs:
            key_data += f":{json.dumps(kwargs, sort_keys=True)}"
        
        # Hash long keys
        if len(key_data) > 100:
            key_data = hashlib.md5(key_data.encode()).hexdigest()
        
        return key_data
    
    def get_or_set(self, key: str, func, ttl: Optional[int] = None) -> Any:
        """Get from cache or set using function"""
        value = self.cache.get(key)
        if value is not None:
            return value
        
        # Execute function and cache result
        value = func()
        self.cache.set(key, value, ttl)
        return value
    
    def invalidate_pattern(self, pattern: str):
        """Invalidate cache keys matching pattern"""
        keys_to_delete = [
            key for key in self.cache._cache.keys()
            if pattern in key
        ]
        for key in keys_to_delete:
            self.cache.delete(key)

    async def health_check(self) -> bool:
        """Check cache health"""
        try:
            self.set('health_check', 'ok', ttl=10)
            val = self.get('health_check')
            return val == 'ok'
        except Exception:
            return False

    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        return {
            "size": len(self.cache._cache),
            "backend": "SimpleCache (Memory)"
        }

# Create global cache manager instance
cache_manager = CacheManager()