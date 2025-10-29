"""Redis client for caching."""

from __future__ import annotations

import json
import logging
from typing import Any, Optional

import redis
from app.config import get_settings

logger = logging.getLogger(__name__)

_redis_client: Optional[redis.Redis] = None


def get_redis_client() -> Optional[redis.Redis]:
    """Get Redis client instance."""
    global _redis_client

    if _redis_client is not None:
        return _redis_client

    settings = get_settings()

    try:
        _redis_client = redis.from_url(
            settings.redis_url,
            decode_responses=True,
            socket_connect_timeout=5,
            socket_timeout=5,
        )
        # Test connection
        _redis_client.ping()
        logger.info(f"✅ Redis connection established: {settings.redis_url}")
        return _redis_client
    except (redis.ConnectionError, redis.TimeoutError) as e:
        logger.warning(f"⚠️ Redis connection failed: {e}. Caching disabled.")
        _redis_client = None
        return None
    except Exception as e:
        logger.error(f"❌ Unexpected Redis error: {e}")
        _redis_client = None
        return None


def set_cache(key: str, value: Any, ttl_seconds: Optional[int] = None) -> bool:
    """Set a value in Redis cache with optional TTL."""
    client = get_redis_client()
    if client is None:
        return False

    settings = get_settings()
    ttl = ttl_seconds or settings.redis_cache_ttl_seconds

    try:
        serialized = json.dumps(value)
        client.setex(key, ttl, serialized)
        logger.debug(f"✅ Cache set: {key} (TTL: {ttl}s)")
        return True
    except Exception as e:
        logger.error(f"❌ Failed to set cache for {key}: {e}")
        return False


def get_cache(key: str) -> Optional[Any]:
    """Get a value from Redis cache."""
    client = get_redis_client()
    if client is None:
        return None

    try:
        cached = client.get(key)
        if cached:
            logger.debug(f"✅ Cache hit: {key}")
            return json.loads(cached)
        logger.debug(f"⚠️ Cache miss: {key}")
        return None
    except Exception as e:
        logger.error(f"❌ Failed to get cache for {key}: {e}")
        return None


def delete_cache(key: str) -> bool:
    """Delete a value from Redis cache."""
    client = get_redis_client()
    if client is None:
        return False

    try:
        client.delete(key)
        logger.debug(f"✅ Cache deleted: {key}")
        return True
    except Exception as e:
        logger.error(f"❌ Failed to delete cache for {key}: {e}")
        return False


def clear_cache_pattern(pattern: str) -> int:
    """Clear all cache keys matching a pattern."""
    client = get_redis_client()
    if client is None:
        return 0

    try:
        keys = list(client.scan_iter(match=pattern))
        if keys:
            deleted = client.delete(*keys)
            logger.info(f"✅ Cleared {deleted} cache keys matching: {pattern}")
            return deleted
        return 0
    except Exception as e:
        logger.error(f"❌ Failed to clear cache pattern {pattern}: {e}")
        return 0
