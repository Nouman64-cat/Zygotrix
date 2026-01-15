"""
Subscription Service.

Handles user subscription status and deep research usage limits.
"""
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Optional, Tuple
from bson import ObjectId
import logging

from ..common import get_users_collection
from app.schema.auth import SubscriptionStatus

logger = logging.getLogger(__name__)

# Deep research limits
DEEP_RESEARCH_DAILY_LIMIT_PRO = 3  # Pro users get 3 per 24 hours
DEEP_RESEARCH_DAILY_LIMIT_FREE = 0  # Free users can't use it


class SubscriptionService:
    """
    Service for subscription management and usage tracking.
    """

    def check_deep_research_access(self, user_id: str) -> Tuple[bool, str, Optional[int]]:
        """
        Check if a user can use deep research.
        
        Args:
            user_id: User's ID
            
        Returns:
            Tuple of (can_access, reason, remaining_uses)
            - can_access: Whether the user can use deep research
            - reason: Human-readable reason if access denied
            - remaining_uses: Number of uses remaining (None for free users)
        """
        collection = get_users_collection()
        if collection is None:
            return False, "Database unavailable", None

        try:
            user = collection.find_one({"_id": ObjectId(user_id)})
            if not user:
                return False, "User not found", None

            subscription_status = user.get("subscription_status", "free")
            
            # Free users cannot access deep research
            if subscription_status == SubscriptionStatus.FREE.value:
                return False, "Deep Research is a PRO feature. Upgrade to PRO to access comprehensive research capabilities.", None

            # Pro users - check usage limits
            usage = user.get("deep_research_usage", {})
            usage_count = usage.get("count", 0)
            last_reset = usage.get("last_reset")
            
            # Check if we need to reset the counter (24 hours passed)
            now = datetime.now(timezone.utc)
            if last_reset:
                if isinstance(last_reset, str):
                    last_reset = datetime.fromisoformat(last_reset.replace('Z', '+00:00'))
                
                time_since_reset = now - last_reset
                if time_since_reset >= timedelta(hours=24):
                    # Reset the counter
                    usage_count = 0
                    self._reset_usage_counter(user_id)
            
            remaining = DEEP_RESEARCH_DAILY_LIMIT_PRO - usage_count
            
            if remaining <= 0:
                return False, f"You've used all {DEEP_RESEARCH_DAILY_LIMIT_PRO} deep research queries for today. Counter resets in 24 hours from your first query.", 0

            return True, "Access granted", remaining

        except Exception as e:
            logger.error(f"Error checking deep research access: {e}")
            return False, f"Error checking access: {str(e)}", None

    def record_deep_research_usage(self, user_id: str) -> bool:
        """
        Record a deep research usage for a user.
        
        Args:
            user_id: User's ID
            
        Returns:
            True if recorded successfully, False otherwise
        """
        collection = get_users_collection()
        if collection is None:
            return False

        try:
            user = collection.find_one({"_id": ObjectId(user_id)})
            if not user:
                return False

            usage = user.get("deep_research_usage", {})
            usage_count = usage.get("count", 0)
            last_reset = usage.get("last_reset")
            
            now = datetime.now(timezone.utc)
            
            # Check if we need to reset (24 hours passed)
            if last_reset:
                if isinstance(last_reset, str):
                    last_reset = datetime.fromisoformat(last_reset.replace('Z', '+00:00'))
                
                if (now - last_reset) >= timedelta(hours=24):
                    usage_count = 0
                    last_reset = now
            else:
                last_reset = now
            
            # Increment usage
            new_usage = {
                "count": usage_count + 1,
                "last_reset": last_reset
            }
            
            collection.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": {"deep_research_usage": new_usage}}
            )
            
            logger.info(f"Recorded deep research usage for user {user_id}: {new_usage['count']}/{DEEP_RESEARCH_DAILY_LIMIT_PRO}")
            return True

        except Exception as e:
            logger.error(f"Error recording deep research usage: {e}")
            return False

    def _reset_usage_counter(self, user_id: str) -> None:
        """Reset the deep research usage counter for a user."""
        collection = get_users_collection()
        if collection is None:
            return

        try:
            collection.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": {"deep_research_usage": {
                    "count": 0,
                    "last_reset": datetime.now(timezone.utc)
                }}}
            )
            logger.info(f"Reset deep research usage counter for user {user_id}")
        except Exception as e:
            logger.error(f"Error resetting usage counter: {e}")

    def update_subscription_status(self, user_id: str, new_status: str) -> Tuple[bool, str]:
        """
        Update a user's subscription status.
        
        Args:
            user_id: User's ID
            new_status: New subscription status ("free" or "pro")
            
        Returns:
            Tuple of (success, error_message)
        """
        collection = get_users_collection()
        if collection is None:
            logger.error("Database collection not available")
            return False, "Database unavailable"

        try:
            # Validate status
            if new_status not in [SubscriptionStatus.FREE.value, SubscriptionStatus.PRO.value]:
                logger.warning(f"Invalid subscription status: {new_status}")
                return False, f"Invalid subscription status: {new_status}"

            logger.info(f"Attempting to update subscription for user {user_id} to {new_status}")
            
            result = collection.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": {"subscription_status": new_status}}
            )
            
            logger.info(f"Update result: matched={result.matched_count}, modified={result.modified_count}")
            
            if result.matched_count > 0:
                logger.info(f"Updated subscription status for user {user_id} to {new_status}")
                
                # Clear the user cache so fresh data is returned on next request
                from .user_service import get_user_service
                user_service = get_user_service()
                user_service._clear_user_cache(user_id)
                logger.debug(f"Cleared user cache for {user_id} after subscription update")
                
                return True, ""
            
            logger.warning(f"No user found with ID {user_id}")
            return False, f"User not found: {user_id}"

        except Exception as e:
            logger.error(f"Error updating subscription status: {e}", exc_info=True)
            return False, str(e)

    def get_subscription_status(self, user_id: str) -> Optional[str]:
        """
        Get a user's subscription status.
        
        Args:
            user_id: User's ID
            
        Returns:
            Subscription status string or None if not found
        """
        collection = get_users_collection()
        if collection is None:
            return None

        try:
            user = collection.find_one({"_id": ObjectId(user_id)})
            if user:
                return user.get("subscription_status", SubscriptionStatus.FREE.value)
            return None
        except Exception as e:
            logger.error(f"Error getting subscription status: {e}")
            return None


# Singleton instance
_subscription_service: SubscriptionService = None


def get_subscription_service() -> SubscriptionService:
    """
    Get singleton SubscriptionService instance.

    Returns:
        SubscriptionService instance
    """
    global _subscription_service
    if _subscription_service is None:
        _subscription_service = SubscriptionService()
    return _subscription_service
