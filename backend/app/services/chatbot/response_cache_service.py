"""
Response Cache Service for LLM responses.

Extracted from chatbot.py as part of Phase 2.4 refactoring.
Provides in-memory TTL caching with LRU eviction for LLM responses.
"""

import hashlib
import time
import logging
from typing import Optional
from collections import OrderedDict

logger = logging.getLogger(__name__)


class ResponseCacheService:
    """
    Simple in-memory TTL cache for LLM responses.
    
    Features:
    - TTL-based expiration (default 1 hour)
    - LRU eviction when max size reached
    - Hash-based cache keys for consistent lookups
    """
    
    def __init__(self, max_size: int = 1000, ttl_seconds: int = 3600):
        self.max_size = max_size
        self.ttl_seconds = ttl_seconds
        self.cache: OrderedDict[str, dict] = OrderedDict()
        self.hits = 0
        self.misses = 0
    
    def _generate_key(self, message: str, context: str = "", page_name: str = "") -> str:
        """Generate a unique cache key from the inputs."""
        normalized_msg = message.lower().strip()
        key_data = f"{normalized_msg}|{page_name}"
        return hashlib.md5(key_data.encode()).hexdigest()
    
    def get(self, message: str, context: str = "", page_name: str = "") -> Optional[str]:
        """Get a cached response if it exists and hasn't expired."""
        key = self._generate_key(message, context, page_name)
        
        if key in self.cache:
            entry = self.cache[key]
            
            # Check if expired
            if time.time() - entry["timestamp"] < self.ttl_seconds:
                self.hits += 1
                # Move to end (most recently used)
                self.cache.move_to_end(key)
                logger.info(f"Cache HIT for message: '{message[:50]}...' (hits: {self.hits})")
                return entry["response"]
            else:
                # Expired, remove it
                del self.cache[key]
        
        self.misses += 1
        return None
    
    def set(self, message: str, response: str, context: str = "", page_name: str = ""):
        """Store a response in the cache."""
        key = self._generate_key(message, context, page_name)
        
        # Evict oldest entries if cache is full
        while len(self.cache) >= self.max_size:
            self.cache.popitem(last=False)
        
        self.cache[key] = {
            "response": response,
            "timestamp": time.time(),
            "message": message[:100]  # Store first 100 chars for debugging
        }
        logger.info(f"Cached response for: '{message[:50]}...' (cache size: {len(self.cache)})")
    
    def clear(self):
        """Clear all cached entries."""
        self.cache.clear()
        self.hits = 0
        self.misses = 0
    
    def get_stats(self) -> dict:
        """Get cache statistics."""
        total = self.hits + self.misses
        hit_rate = (self.hits / total * 100) if total > 0 else 0
        return {
            "size": len(self.cache),
            "max_size": self.max_size,
            "hits": self.hits,
            "misses": self.misses,
            "hit_rate": f"{hit_rate:.1f}%",
            "ttl_seconds": self.ttl_seconds
        }


# Global singleton instance
_response_cache: Optional[ResponseCacheService] = None


def get_response_cache() -> ResponseCacheService:
    """Get or create the global ResponseCacheService instance."""
    global _response_cache
    if _response_cache is None:
        _response_cache = ResponseCacheService(
            max_size=1000,      # Max 1000 cached responses
            ttl_seconds=3600    # Cache for 1 hour
        )
    return _response_cache