"""
Subscription Service.

Handles user subscription status and usage limits for PRO features.
"""
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Optional, Tuple
from bson import ObjectId
import logging

from ..common import get_users_collection
from app.schema.auth import SubscriptionStatus

logger = logging.getLogger(__name__)

# Deep research limits (MONTHLY)
DEEP_RESEARCH_MONTHLY_LIMIT_PRO = 200  # Pro users get 200 per month
DEEP_RESEARCH_MONTHLY_LIMIT_FREE = 0  # Free users can't use it

# Scholar mode limits (MONTHLY)
SCHOLAR_MODE_MONTHLY_LIMIT_PRO = 50  # Pro users get 50 per month
SCHOLAR_MODE_MONTHLY_LIMIT_FREE = 0  # Free users can't use it


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
            logger.info(f"Checking deep research access for user {user_id}: subscription={subscription_status}")
            
            # Free users cannot access deep research
            if subscription_status == SubscriptionStatus.FREE.value:
                return False, "Deep Research is a PRO feature. Upgrade to PRO to access comprehensive research capabilities.", None

            # Pro users - check usage limits (MONTHLY)
            usage = user.get("deep_research_usage") or {}  # Handle None explicitly
            usage_count = usage.get("count", 0) if isinstance(usage, dict) else 0
            last_reset = usage.get("last_reset") if isinstance(usage, dict) else None
            
            logger.info(f"Deep research usage for user {user_id}: count={usage_count}, last_reset={last_reset}")
            
            # Check if we need to reset the counter (new month)
            now = datetime.now(timezone.utc)
            if last_reset:
                if isinstance(last_reset, str):
                    last_reset = datetime.fromisoformat(last_reset.replace('Z', '+00:00'))
                elif isinstance(last_reset, datetime):
                    # Ensure datetime is timezone-aware
                    if last_reset.tzinfo is None:
                        last_reset = last_reset.replace(tzinfo=timezone.utc)
                
                # Check if it's a new month
                if now.year > last_reset.year or (now.year == last_reset.year and now.month > last_reset.month):
                    logger.info(f"Resetting deep research counter for user {user_id} (new month)")
                    usage_count = 0
                    self._reset_deep_research_counter(user_id)
            
            remaining = DEEP_RESEARCH_MONTHLY_LIMIT_PRO - usage_count
            logger.info(f"Remaining deep research uses for user {user_id}: {remaining}")
            
            if remaining <= 0:
                logger.warning(f"User {user_id} has exhausted deep research limit: {usage_count}/{DEEP_RESEARCH_MONTHLY_LIMIT_PRO}")
                return False, f"You've used all {DEEP_RESEARCH_MONTHLY_LIMIT_PRO} deep research queries this month. Counter resets on the 1st of next month.", 0

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

            usage = user.get("deep_research_usage") or {}  # Handle None explicitly
            usage_count = usage.get("count", 0) if isinstance(usage, dict) else 0
            last_reset = usage.get("last_reset") if isinstance(usage, dict) else None
            
            now = datetime.now(timezone.utc)
            
            # Check if we need to reset (new month)
            if last_reset:
                if isinstance(last_reset, str):
                    last_reset = datetime.fromisoformat(last_reset.replace('Z', '+00:00'))
                elif isinstance(last_reset, datetime):
                    # Ensure datetime is timezone-aware
                    if last_reset.tzinfo is None:
                        last_reset = last_reset.replace(tzinfo=timezone.utc)
                
                if now.year > last_reset.year or (now.year == last_reset.year and now.month > last_reset.month):
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
            
            # Clear user cache
            from .user_service import get_user_service
            get_user_service()._clear_user_cache(user_id)
            
            logger.info(f"Recorded deep research usage for user {user_id}: {new_usage['count']}/{DEEP_RESEARCH_MONTHLY_LIMIT_PRO}")
            return True

        except Exception as e:
            logger.error(f"Error recording deep research usage: {e}")
            return False

    def _reset_deep_research_counter(self, user_id: str) -> None:
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
            logger.error(f"Error resetting deep research counter: {e}")

    # ==================== Scholar Mode Usage ====================

    def check_scholar_mode_access(self, user_id: str) -> Tuple[bool, str, Optional[int]]:
        """
        Check if a user can use scholar mode.
        
        Args:
            user_id: User's ID
            
        Returns:
            Tuple of (can_access, reason, remaining_uses)
            - can_access: Whether the user can use scholar mode
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
            logger.info(f"Checking scholar mode access for user {user_id}: subscription={subscription_status}")
            
            # Free users cannot access scholar mode
            if subscription_status == SubscriptionStatus.FREE.value:
                return False, "Scholar Mode is a PRO feature. Upgrade to PRO to access comprehensive research combining deep research, web search, and AI synthesis.", None

            # Pro users - check usage limits (monthly)
            usage = user.get("scholar_mode_usage") or {}
            usage_count = usage.get("count", 0) if isinstance(usage, dict) else 0
            last_reset = usage.get("last_reset") if isinstance(usage, dict) else None
            
            logger.info(f"Scholar mode usage for user {user_id}: count={usage_count}, last_reset={last_reset}")
            
            # Check if we need to reset (new month)
            now = datetime.now(timezone.utc)
            if last_reset:
                if isinstance(last_reset, str):
                    last_reset = datetime.fromisoformat(last_reset.replace('Z', '+00:00'))
                elif isinstance(last_reset, datetime):
                    if last_reset.tzinfo is None:
                        last_reset = last_reset.replace(tzinfo=timezone.utc)
                
                # Check if it's a new month
                if now.year > last_reset.year or (now.year == last_reset.year and now.month > last_reset.month):
                    logger.info(f"Resetting scholar mode counter for user {user_id} (new month)")
                    usage_count = 0
                    self._reset_scholar_mode_counter(user_id)
            
            remaining = SCHOLAR_MODE_MONTHLY_LIMIT_PRO - usage_count
            logger.info(f"Remaining scholar mode uses for user {user_id}: {remaining}")
            
            if remaining <= 0:
                logger.warning(f"User {user_id} has exhausted scholar mode limit: {usage_count}/{SCHOLAR_MODE_MONTHLY_LIMIT_PRO}")
                return False, f"You've used all {SCHOLAR_MODE_MONTHLY_LIMIT_PRO} scholar mode queries this month. Counter resets on the 1st of next month.", 0

            return True, "Access granted", remaining

        except Exception as e:
            logger.error(f"Error checking scholar mode access: {e}")
            return False, f"Error checking access: {str(e)}", None

    def record_scholar_mode_usage(self, user_id: str) -> bool:
        """
        Record a scholar mode usage for a user.
        
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

            usage = user.get("scholar_mode_usage") or {}
            usage_count = usage.get("count", 0) if isinstance(usage, dict) else 0
            last_reset = usage.get("last_reset") if isinstance(usage, dict) else None
            
            now = datetime.now(timezone.utc)
            
            # Check if we need to reset (new month)
            if last_reset:
                if isinstance(last_reset, str):
                    last_reset = datetime.fromisoformat(last_reset.replace('Z', '+00:00'))
                elif isinstance(last_reset, datetime):
                    if last_reset.tzinfo is None:
                        last_reset = last_reset.replace(tzinfo=timezone.utc)
                
                if now.year > last_reset.year or (now.year == last_reset.year and now.month > last_reset.month):
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
                {"$set": {"scholar_mode_usage": new_usage}}
            )
            
            # Clear user cache
            from .user_service import get_user_service
            get_user_service()._clear_user_cache(user_id)
            
            logger.info(f"Recorded scholar mode usage for user {user_id}: {new_usage['count']}/{SCHOLAR_MODE_MONTHLY_LIMIT_PRO}")
            return True

        except Exception as e:
            logger.error(f"Error recording scholar mode usage: {e}")
            return False

    def _reset_scholar_mode_counter(self, user_id: str) -> None:
        """Reset the scholar mode usage counter for a user."""
        collection = get_users_collection()
        if collection is None:
            return

        try:
            collection.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": {"scholar_mode_usage": {
                    "count": 0,
                    "last_reset": datetime.now(timezone.utc)
                }}}
            )
            logger.info(f"Reset scholar mode usage counter for user {user_id}")
        except Exception as e:
            logger.error(f"Error resetting scholar mode counter: {e}")

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
