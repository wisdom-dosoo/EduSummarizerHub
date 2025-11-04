import time
from typing import Dict, Any
import hashlib

class SimpleCache:
    def __init__(self, ttl_seconds: int = 3600):
        self.cache: Dict[str, Dict[str, Any]] = {}
        self.ttl = ttl_seconds

    def _get_key(self, func_name: str, args: tuple, kwargs: dict) -> str:
        """Generate a unique key for the function call"""
        key_data = f"{func_name}:{args}:{kwargs}"
        return hashlib.md5(key_data.encode()).hexdigest()

    def get(self, key: str) -> Any:
        """Get cached value if not expired"""
        if key in self.cache:
            entry = self.cache[key]
            if time.time() - entry['timestamp'] < self.ttl:
                return entry['value']
            else:
                del self.cache[key]
        return None

    def set(self, key: str, value: Any):
        """Set cached value with timestamp"""
        self.cache[key] = {
            'value': value,
            'timestamp': time.time()
        }

    def cached(self, func):
        """Decorator for caching function results"""
        def wrapper(*args, **kwargs):
            key = self._get_key(func.__name__, args, kwargs)
            cached_result = self.get(key)
            if cached_result is not None:
                return cached_result
            result = func(*args, **kwargs)
            self.set(key, result)
            return result
        return wrapper

# Global cache instance
cache = SimpleCache(ttl_seconds=3600)  # 1 hour TTL
