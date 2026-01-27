"""
User Service.

Handles all user CRUD operations, profile management, and user queries.
"""
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Optional, Tuple, List
from bson import ObjectId
from pymongo.errors import DuplicateKeyError, PyMongoError
import logging

from app.services.common import get_users_collection, get_pending_signups_collection
from app.core.exceptions.database import DatabaseError, RecordNotFoundError
from app.core.exceptions.auth import InvalidCredentialsError
from app.schema.zygotrix_ai import ChatPreferences
from app.schema.auth import UserPreferencesUpdate
from .password_service import get_password_service
from .user_serializer import get_user_serializer
from .activity_tracking_service import get_activity_tracking_service

logger = logging.getLogger(__name__)


class UserService:
    """
    Service for user management and CRUD operations.

    Handles:
    - User creation and registration
    - User queries and retrieval
    - Profile updates
    - Activity tracking
    - User caching
    """

    def __init__(
        self,
        password_service=None,
        serializer=None,
        activity_service=None
    ):
        """
        Initialize user service.

        Args:
            password_service: PasswordService instance (optional)
            serializer: UserSerializer instance (optional)
            activity_service: ActivityTrackingService instance (optional)
        """
        self._password_service = password_service or get_password_service()
        self._serializer = serializer or get_user_serializer()
        self._activity_service = activity_service or get_activity_tracking_service()
        self._user_cache: Dict[str, Tuple[Dict[str, Any], datetime]] = {}

    def _normalize_email(self, email: str) -> str:
        """Normalize email address."""
        return email.strip().lower()

    def _clear_user_cache(self, user_id: Optional[str] = None) -> None:
        """
        Clear user cache.

        Args:
            user_id: Specific user ID to clear, or None to clear all
        """
        if user_id:
            self._user_cache.pop(user_id, None)
            logger.debug(f"Cleared cache for user {user_id}")
        else:
            self._user_cache.clear()
            logger.debug("Cleared all user cache")

    # ==================== User Creation ====================

    def create_user(
        self,
        email: str,
        password: str,
        full_name: Optional[str] = None,
        phone: Optional[str] = None,
        user_role: str = "user",
        password_is_hashed: bool = False
    ) -> Dict[str, Any]:
        """
        Create a new user account.

        Args:
            email: User's email address
            password: Plain text password or hashed password (if password_is_hashed=True)
            full_name: User's full name (optional)
            phone: User's phone number (optional)
            user_role: User role (default: "user")
            password_is_hashed: If True, password is already hashed (default: False)

        Returns:
            Serialized user dictionary

        Raises:
            DatabaseError: If email is already registered
        """
        collection = get_users_collection(required=True)

        normalized_email = self._normalize_email(email)
        password_hash = password if password_is_hashed else self._password_service.hash_password(password)

        # Check if this email is the super admin email
        from app.config import get_settings
        settings = get_settings()
        is_super_admin = (
            normalized_email == self._normalize_email(settings.super_admin_email)
            if settings.super_admin_email
            else False
        )

        # Override role if super admin
        final_role = "super_admin" if is_super_admin else user_role

        document = {
            "email": normalized_email,
            "password_hash": password_hash,
            "full_name": self._serializer._clean_full_name(full_name),
            "phone": phone,
            "created_at": datetime.now(timezone.utc),
            "user_role": final_role,
            "is_active": True,
        }

        try:
            result = collection.insert_one(document)
            document["_id"] = result.inserted_id

            logger.info(f"Created user: {normalized_email}")
            return self._serializer.serialize_user(document)

        except DuplicateKeyError:
            logger.warning(f"Duplicate email registration attempt: {normalized_email}")
            raise DatabaseError(
                "Email is already registered.",
                details={"email": normalized_email}
            )
        except PyMongoError as e:
            logger.error(f"Error creating user: {e}")
            raise DatabaseError(f"Failed to create user: {str(e)}")

    # ==================== User Retrieval ====================

    def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """
        Get user by email address.

        Args:
            email: Email address to search for

        Returns:
            User document if found, None otherwise
        """
        collection = get_users_collection()
        if collection is None:
            return None

        normalized_email = self._normalize_email(email)
        document = collection.find_one({"email": normalized_email})

        if document:
            logger.debug(f"Found user by email: {normalized_email}")
            return document

        logger.debug(f"User not found by email: {normalized_email}")
        return None

    def get_user_by_id(self, user_id: str, use_cache: bool = True) -> Dict[str, Any]:
        """
        Get user by ID with optional caching.

        Args:
            user_id: User's ID
            use_cache: Whether to use cache (default: True)

        Returns:
            Serialized user dictionary

        Raises:
            InvalidCredentialsError: If user ID is invalid or user not found
        """
        # Check cache
        if use_cache and user_id in self._user_cache:
            cached_user, cache_time = self._user_cache[user_id]
            cache_age = datetime.now(timezone.utc) - cache_time

            if cache_age < timedelta(minutes=5):
                logger.debug(f"Returning cached user {user_id}")
                return cached_user

        # Get from database
        collection = get_users_collection(required=True)

        try:
            object_id = ObjectId(user_id)
        except Exception as e:
            logger.error(f"Invalid user ID format: {user_id}")
            raise InvalidCredentialsError("Invalid authentication token.")

        document = collection.find_one({"_id": object_id})

        if not document:
            logger.error(f"User not found: {user_id}")
            raise InvalidCredentialsError("User not found.")

        # Serialize and cache
        user = self._serializer.serialize_user(document)
        
        # Inject Web Search today's usage (calculated on read)
        try:
            from app.services.common import get_database
            db = get_database()
            today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
            
            usage_today = db.web_search_usage.count_documents({
                "user_id": user_id,
                "timestamp": {"$gte": today_start},
                "is_cached": False
            })
            
            user["web_search_usage"] = {
                "count": usage_today,
                "last_reset": today_start.isoformat(),
                "daily_limit": 5
            }
        except Exception as e:
            logger.warning(f"Failed to inject web search usage: {e}")

        # Inject Scholar Mode this month's usage (calculated on read)
        try:
            now = datetime.now(timezone.utc)
            month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            
            # Get scholar mode usage from user document
            scholar_usage = document.get("scholar_mode_usage") or {}
            scholar_count = scholar_usage.get("count", 0) if isinstance(scholar_usage, dict) else 0
            scholar_last_reset = scholar_usage.get("last_reset") if isinstance(scholar_usage, dict) else None
            
            # Check if we need to reset (new month)
            if scholar_last_reset:
                if isinstance(scholar_last_reset, str):
                    scholar_last_reset = datetime.fromisoformat(scholar_last_reset.replace('Z', '+00:00'))
                elif isinstance(scholar_last_reset, datetime):
                    if scholar_last_reset.tzinfo is None:
                        scholar_last_reset = scholar_last_reset.replace(tzinfo=timezone.utc)
                
                # If it's a new month, reset the count
                if now.year > scholar_last_reset.year or (now.year == scholar_last_reset.year and now.month > scholar_last_reset.month):
                    scholar_count = 0
            
            user["scholar_mode_usage"] = {
                "count": scholar_count,
                "last_reset": month_start.isoformat(),
                "monthly_limit": 10
            }
        except Exception as e:
            logger.warning(f"Failed to inject scholar mode usage: {e}")

        self._user_cache[user_id] = (user, datetime.now(timezone.utc))

        logger.debug(f"Retrieved and cached user {user_id}")
        return user

    def get_user_document_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Get raw user document by ID (without serialization).

        Args:
            user_id: User's ID

        Returns:
            User document if found, None otherwise
        """
        collection = get_users_collection()
        if collection is None:
            return None

        try:
            object_id = ObjectId(user_id)
            document = collection.find_one({"_id": object_id})
            return document
        except Exception as e:
            logger.error(f"Error getting user document {user_id}: {e}")
            return None

    # ==================== User Updates ====================

    def update_user_profile(
        self,
        user_id: str,
        updates: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Update user profile fields.

        Args:
            user_id: User's ID
            updates: Dictionary of fields to update

        Returns:
            Updated serialized user dictionary

        Raises:
            InvalidCredentialsError: If user not found
            DatabaseError: If update fails
        """
        collection = get_users_collection(required=True)

        try:
            object_id = ObjectId(user_id)
        except Exception:
            raise InvalidCredentialsError("Invalid user ID.")

        # Prepare updates
        update_doc = self._serializer.deserialize_user_updates(updates)

        try:
            result = collection.update_one(
                {"_id": object_id},
                {"$set": update_doc}
            )

            if result.matched_count == 0:
                raise RecordNotFoundError("User", user_id)

            # Clear cache and return updated user
            self._clear_user_cache(user_id)
            return self.get_user_by_id(user_id, use_cache=False)

        except PyMongoError as e:
            logger.error(f"Error updating user {user_id}: {e}")
            raise DatabaseError(f"Failed to update profile: {str(e)}")

    def update_user_activity(
        self,
        user_id: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> None:
        """
        Update user's activity tracking information.

        Args:
            user_id: User's ID
            ip_address: User's IP address
            user_agent: User's browser user agent
        """
        collection = get_users_collection(required=True)

        try:
            object_id = ObjectId(user_id)
        except Exception:
            logger.warning(f"Invalid user ID for activity update: {user_id}")
            return

        # Build activity update
        activity_update = self._activity_service.create_activity_update(
            ip_address, user_agent
        )

        # Build login history push
        login_push = self._activity_service.build_login_history_push(
            ip_address, user_agent, max_entries=10
        )

        try:
            collection.update_one(
                {"_id": object_id},
                {
                    "$set": activity_update,
                    "$push": login_push
                }
            )

            # Clear cache
            self._clear_user_cache(user_id)

            logger.debug(f"Updated activity for user {user_id}")

        except PyMongoError as e:
            logger.warning(f"Failed to update activity for {user_id}: {e}")
            # Don't raise - activity tracking is not critical

    # ==================== User Preferences ====================

    def get_user_preferences(self, user_id: str) -> ChatPreferences:
        """
        Get user's AI behavior preferences.

        Args:
            user_id: User's ID

        Returns:
            ChatPreferences object (default if not set)

        Raises:
            InvalidCredentialsError: If user not found
        """
        user = self.get_user_by_id(user_id)

        # Return preferences if they exist, otherwise return defaults
        if user.get("preferences"):
            return ChatPreferences(**user["preferences"])
        else:
            # Return default preferences
            return ChatPreferences()

    def update_user_preferences(
        self,
        user_id: str,
        preferences_update: UserPreferencesUpdate
    ) -> ChatPreferences:
        """
        Update user's AI behavior preferences.

        Args:
            user_id: User's ID
            preferences_update: Preference updates

        Returns:
            Updated ChatPreferences

        Raises:
            InvalidCredentialsError: If user not found
            DatabaseError: If update fails
        """
        collection = get_users_collection(required=True)

        try:
            object_id = ObjectId(user_id)
        except Exception:
            raise InvalidCredentialsError("Invalid user ID.")

        # Get current preferences or create new ones
        user = self.get_user_by_id(user_id)
        current_prefs = user.get("preferences") or {}

        # Merge with updates
        prefs_dict = {**current_prefs}
        for field, value in preferences_update.model_dump(exclude_none=True).items():
            if value is not None:
                prefs_dict[field] = value

        try:
            result = collection.update_one(
                {"_id": object_id},
                {"$set": {"preferences": prefs_dict}}
            )

            if result.matched_count == 0:
                raise RecordNotFoundError("User", user_id)

            # Clear cache
            self._clear_user_cache(user_id)

            logger.info(f"Updated preferences for user {user_id}")
            return ChatPreferences(**prefs_dict)

        except PyMongoError as e:
            logger.error(f"Error updating preferences for {user_id}: {e}")
            raise DatabaseError(f"Failed to update preferences: {str(e)}")

    def reset_user_preferences(self, user_id: str) -> ChatPreferences:
        """
        Reset user's AI behavior preferences to defaults.

        Args:
            user_id: User's ID

        Returns:
            Default ChatPreferences

        Raises:
            InvalidCredentialsError: If user not found
            DatabaseError: If update fails
        """
        collection = get_users_collection(required=True)

        try:
            object_id = ObjectId(user_id)
        except Exception:
            raise InvalidCredentialsError("Invalid user ID.")

        # Create default preferences
        default_prefs = ChatPreferences()

        try:
            result = collection.update_one(
                {"_id": object_id},
                {"$set": {"preferences": default_prefs.model_dump()}}
            )

            if result.matched_count == 0:
                raise RecordNotFoundError("User", user_id)

            # Clear cache
            self._clear_user_cache(user_id)

            logger.info(f"Reset preferences to defaults for user {user_id}")
            return default_prefs

        except PyMongoError as e:
            logger.error(f"Error resetting preferences for {user_id}: {e}")
            raise DatabaseError(f"Failed to reset preferences: {str(e)}")

    # ==================== User Queries ====================

    def find_users(
        self,
        filters: Optional[Dict[str, Any]] = None,
        page: int = 1,
        page_size: int = 20,
        sort_by: str = "created_at",
        sort_desc: bool = True
    ) -> Tuple[List[Dict[str, Any]], int]:
        """
        Find users with pagination and filters.

        Args:
            filters: Query filters (optional)
            page: Page number (1-indexed)
            page_size: Number of users per page
            sort_by: Field to sort by
            sort_desc: Sort descending if True

        Returns:
            Tuple of (list of serialized users, total count)
        """
        collection = get_users_collection(required=True)

        query = filters or {}

        # Get total count
        total = collection.count_documents(query)

        # Calculate pagination
        skip = (page - 1) * page_size

        # Get users
        cursor = collection.find(query).sort(
            sort_by, -1 if sort_desc else 1
        ).skip(skip).limit(page_size)

        users = [self._serializer.serialize_user(doc) for doc in cursor]

        logger.debug(f"Found {len(users)} users (page {page}, total {total})")
        return users, total

    # ==================== Pending Signups ====================

    def get_pending_signup(self, email: str) -> Optional[Dict[str, Any]]:
        """
        Get pending signup by email.

        Args:
            email: Email address

        Returns:
            Pending signup document if found, None otherwise
        """
        collection = get_pending_signups_collection()
        if collection is None:
            return None

        normalized_email = self._normalize_email(email)
        return collection.find_one({"email": normalized_email})

    def create_pending_signup(
        self,
        email: str,
        password: str,
        full_name: Optional[str],
        phone: Optional[str],
        otp_data: Dict[str, Any],
        update_otp_only: bool = False
    ) -> datetime:
        """
        Create or update a pending signup.

        Args:
            email: Email address
            password: Plain text password (ignored if update_otp_only=True)
            full_name: Full name
            phone: Phone number
            otp_data: OTP document from OTPService
            update_otp_only: If True, only update OTP fields (for resend)

        Returns:
            Expiration datetime

        Raises:
            DatabaseError: If operation fails
        """
        collection = get_pending_signups_collection(required=True)

        normalized_email = self._normalize_email(email)

        if update_otp_only:
            # Only update OTP fields, don't touch password/full_name
            pending_document = {**otp_data}
        else:
            # Create/update full pending signup
            password_hash = self._password_service.hash_password(password)
            pending_document = {
                "email": normalized_email,
                "password_hash": password_hash,
                "full_name": self._serializer._clean_full_name(full_name),
                "phone": phone,
                **otp_data
            }

        try:
            collection.update_one(
                {"email": normalized_email},
                {"$set": pending_document},
                upsert=True
            )

            expires_at = otp_data.get("otp_expires_at")
            logger.info(f"Created pending signup for {normalized_email}")

            return expires_at

        except PyMongoError as e:
            logger.error(f"Error creating pending signup: {e}")
            raise DatabaseError(f"Failed to start signup: {str(e)}")

    def delete_pending_signup(self, email: str) -> None:
        """
        Delete a pending signup.

        Args:
            email: Email address
        """
        collection = get_pending_signups_collection()
        if collection is None:
            return

        normalized_email = self._normalize_email(email)
        collection.delete_one({"email": normalized_email})
        logger.debug(f"Deleted pending signup for {normalized_email}")


# Singleton instance
_user_service: UserService = None


def get_user_service() -> UserService:
    """
    Get singleton UserService instance.

    Returns:
        UserService instance
    """
    global _user_service
    if _user_service is None:
        _user_service = UserService()
    return _user_service
