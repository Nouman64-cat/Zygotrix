"""
Rate Limiting Service for user token quota management.

Extracted from chatbot.py as part of Phase 2.4 refactoring.
Handles token quota management, cooldown timing, and MongoDB persistence.
"""

import time
import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Tuple

logger = logging.getLogger(__name__)


class RateLimitingService:
    """
    Rate limiter to prevent excessive token usage per user.
    
    Logic:
    - Users can use tokens freely until they hit the limit (25,000)
    - When limit is reached, 5-hour cooldown starts
    - After cooldown expires, user gets a fresh 25,000 tokens
    - Data is persisted to MongoDB to survive server restarts
    """
    
    def __init__(self, max_tokens: int = 25000, cooldown_seconds: int = 18000):
        """
        Args:
            max_tokens: Maximum tokens before cooldown (default 25,000)
            cooldown_seconds: Cooldown duration when limit reached (default 5 hours)
        """
        self.max_tokens = max_tokens
        self.cooldown_seconds = cooldown_seconds
        self._collection = None
    
    def _get_collection(self):
        """Get MongoDB collection for rate limit data."""
        if self._collection is None:
            try:
                from ..common import get_database
                db = get_database()
                if db is not None:
                    self._collection = db["rate_limits"]
            except Exception as e:
                logger.warning(f"MongoDB not available for rate limiting: {e}")
        return self._collection
    
    def _get_user_data(self, user_id: str) -> Optional[Dict]:
        """Get user data from MongoDB or return None."""
        collection = self._get_collection()
        if collection is None:
            return None
        try:
            return collection.find_one({"user_id": user_id})
        except Exception as e:
            logger.error(f"Error getting rate limit data: {e}")
            return None
    
    def _save_user_data(self, user_id: str, data: Dict):
        """Save user data to MongoDB."""
        collection = self._get_collection()
        if collection is None:
            return
        try:
            collection.update_one(
                {"user_id": user_id},
                {"$set": data},
                upsert=True
            )
        except Exception as e:
            logger.error(f"Error saving rate limit data: {e}")
    
    def get_usage(self, user_id: str) -> Dict:
        """Get current usage for a user."""
        user_data = self._get_user_data(user_id)
        current_time = time.time()
        
        if user_data is None:
            # No data - user has full quota
            return {
                "tokens_used": 0,
                "tokens_remaining": self.max_tokens,
                "reset_time": None,
                "is_limited": False,
                "cooldown_active": False
            }
        
        # Check if user is in cooldown
        if user_data.get("cooldown_start"):
            cooldown_start = user_data["cooldown_start"]
            elapsed = current_time - cooldown_start
            
            if elapsed < self.cooldown_seconds:
                # Still in cooldown
                reset_time = cooldown_start + self.cooldown_seconds
                return {
                    "tokens_used": user_data.get("tokens_used", 0),
                    "tokens_remaining": 0,
                    "reset_time": datetime.fromtimestamp(reset_time, tz=timezone.utc).isoformat(),
                    "is_limited": True,
                    "cooldown_active": True
                }
            else:
                # Cooldown expired - reset user
                self._save_user_data(user_id, {
                    "user_id": user_id,
                    "tokens_used": 0,
                    "cooldown_start": None
                })
                return {
                    "tokens_used": 0,
                    "tokens_remaining": self.max_tokens,
                    "reset_time": None,
                    "is_limited": False,
                    "cooldown_active": False
                }
        
        # No cooldown - just return usage
        tokens_used = user_data.get("tokens_used", 0)
        tokens_remaining = max(0, self.max_tokens - tokens_used)
        
        return {
            "tokens_used": tokens_used,
            "tokens_remaining": tokens_remaining,
            "reset_time": None,
            "is_limited": tokens_remaining <= 0,
            "cooldown_active": False
        }
    
    def check_limit(self, user_id: str, is_admin: bool = False) -> Tuple[bool, Dict]:
        """
        Check if user is within rate limit.

        Args:
            user_id: User ID to check
            is_admin: Whether the user is an admin or super admin

        Returns:
            Tuple of (allowed, usage_dict)
        """
        # Check if admins have unlimited tokens enabled
        if is_admin:
            try:
                from ..chatbot_settings import get_chatbot_settings
                settings = get_chatbot_settings()
                if settings.admin_unlimited_tokens:
                    # Admin with unlimited tokens - always allow
                    return (True, {
                        "tokens_used": 0,
                        "tokens_remaining": 999999,  # Effectively unlimited
                        "reset_time": None,
                        "is_limited": False,
                        "cooldown_active": False,
                        "admin_unlimited": True
                    })
            except Exception as e:
                logger.error(f"Error checking admin unlimited tokens setting: {e}")

        usage = self.get_usage(user_id)
        return (not usage["is_limited"], usage)
    
    def record_usage(self, user_id: str, tokens: int):
        """Record token usage for a user."""
        user_data = self._get_user_data(user_id) or {"user_id": user_id, "tokens_used": 0}
        
        # Skip if in cooldown
        if user_data.get("cooldown_start"):
            return
        
        new_total = user_data.get("tokens_used", 0) + tokens
        
        # Check if limit reached
        if new_total >= self.max_tokens:
            # Start cooldown
            self._save_user_data(user_id, {
                "user_id": user_id,
                "tokens_used": new_total,
                "cooldown_start": time.time()
            })
            logger.info(f"User {user_id[:8]}... reached limit ({new_total}/{self.max_tokens}). Cooldown started.")
        else:
            # Just update usage
            self._save_user_data(user_id, {
                "user_id": user_id,
                "tokens_used": new_total,
                "cooldown_start": None
            })
            logger.info(f"User {user_id[:8]}... used {tokens} tokens, total: {new_total}/{self.max_tokens}")
    
    def get_reset_time_remaining(self, user_id: str) -> Optional[int]:
        """Get seconds until cooldown ends for a user."""
        user_data = self._get_user_data(user_id)
        if user_data is None or not user_data.get("cooldown_start"):
            return None
        
        current_time = time.time()
        elapsed = current_time - user_data["cooldown_start"]
        
        if elapsed >= self.cooldown_seconds:
            return 0
        
        return int(self.cooldown_seconds - elapsed)


# Global singleton instance
_rate_limiter: Optional[RateLimitingService] = None


def get_rate_limiter() -> RateLimitingService:
    """Get or create the global RateLimitingService instance."""
    global _rate_limiter
    if _rate_limiter is None:
        _rate_limiter = RateLimitingService(
            max_tokens=25000,        # 25,000 tokens before cooldown
            cooldown_seconds=18000   # 5 hours cooldown when limit reached
        )
    return _rate_limiter