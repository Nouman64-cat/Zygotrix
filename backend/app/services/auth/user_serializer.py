"""
User Serializer.

Handles serialization and deserialization of user documents.
"""
from datetime import datetime, timezone
from typing import Dict, Any, Optional, Mapping, List
import logging

logger = logging.getLogger(__name__)


class UserSerializer:
    """
    Service for user document serialization.

    Converts between MongoDB documents and application-level user dictionaries,
    handling type conversions, datetime formatting, and field transformations.
    """

    @staticmethod
    def _normalize_email(email: str) -> str:
        """
        Normalize email address (lowercase and trim).

        Args:
            email: Email address to normalize

        Returns:
            Normalized email address
        """
        return email.strip().lower()

    @staticmethod
    def _clean_full_name(full_name: Optional[str]) -> Optional[str]:
        """
        Clean and normalize full name.

        Args:
            full_name: Full name to clean

        Returns:
            Cleaned full name or None
        """
        if not full_name:
            return None
        cleaned = full_name.strip()
        return cleaned if cleaned else None

    @staticmethod
    def _serialize_datetime(dt: Any) -> Optional[str]:
        """
        Serialize datetime to ISO format string.

        Args:
            dt: Datetime object to serialize

        Returns:
            ISO format string with 'Z' suffix, or None
        """
        if isinstance(dt, datetime):
            # If datetime is naive (no timezone), assume it's UTC
            if dt.tzinfo is None:
                utc_dt = dt.replace(tzinfo=timezone.utc)
            else:
                utc_dt = dt.astimezone(timezone.utc)

            # Format: "2024-01-15T10:30:45.123Z"
            return utc_dt.strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"

        return None

    @staticmethod
    def _serialize_login_history(history: Any) -> Optional[List[Dict[str, Any]]]:
        """
        Serialize login history entries.

        Args:
            history: Login history list from database

        Returns:
            Serialized login history (most recent first) or None
        """
        if not history or not isinstance(history, list):
            return None

        serialized = []
        for entry in history:
            if isinstance(entry, dict):
                serialized.append({
                    "timestamp": UserSerializer._serialize_datetime(entry.get("timestamp")) or "",
                    "ip_address": entry.get("ip_address", "Unknown"),
                    "location": entry.get("location", "Unknown"),
                    "browser": entry.get("browser", "Unknown"),
                })

        # Return in reverse order (most recent first)
        return list(reversed(serialized)) if serialized else None

    def serialize_user(self, document: Mapping[str, Any]) -> Dict[str, Any]:
        """
        Serialize a MongoDB user document to application format.

        Args:
            document: User document from MongoDB

        Returns:
            Serialized user dictionary
        """
        # Handle created_at
        created_at = document.get("created_at")
        if isinstance(created_at, datetime):
            created_iso = created_at.astimezone(timezone.utc).isoformat()
        else:
            created_iso = datetime.now(timezone.utc).isoformat()

        # Handle deactivated_at
        deactivated_at = document.get("deactivated_at")
        if isinstance(deactivated_at, datetime):
            deactivated_iso = deactivated_at.astimezone(timezone.utc).isoformat()
        else:
            deactivated_iso = None

        user_dict = {
            "id": str(document.get("_id")),
            "email": str(document.get("email", "")),
            "full_name": self._clean_full_name(document.get("full_name")),

            # Profile information
            "profile_picture_url": document.get("profile_picture_url"),
            "profile_picture_thumbnail_url": document.get("profile_picture_thumbnail_url"),
            "phone": document.get("phone"),
            "organization": document.get("organization"),
            "department": document.get("department"),
            "title": document.get("title"),
            "bio": document.get("bio"),
            "location": document.get("location"),
            "timezone": document.get("timezone"),

            # Onboarding and preferences
            "research_interests": document.get("research_interests"),
            "experience_level": document.get("experience_level"),
            "use_case": document.get("use_case"),
            "organism_focus": document.get("organism_focus"),
            "onboarding_completed": document.get("onboarding_completed", False),

            # University-specific fields
            "learning_goals": document.get("learning_goals"),
            "learning_style": document.get("learning_style"),
            "topics_of_interest": document.get("topics_of_interest"),
            "time_commitment": document.get("time_commitment"),
            "institution": document.get("institution"),
            "role": document.get("role"),
            "field_of_study": document.get("field_of_study"),
            "university_onboarding_completed": document.get("university_onboarding_completed", False),

            "preferences": document.get("preferences"),
            "created_at": created_iso,

            # Admin fields
            "user_role": document.get("user_role", "user"),
            "is_active": document.get("is_active", True),
            "deactivated_at": deactivated_iso,
            "deactivated_by": document.get("deactivated_by"),

            # Activity tracking
            "last_accessed_at": self._serialize_datetime(document.get("last_accessed_at")),
            "last_ip_address": document.get("last_ip_address"),
            "last_location": document.get("last_location"),
            "last_browser": document.get("last_browser"),
            "login_history": self._serialize_login_history(document.get("login_history")),
            
            # Subscription fields
            "subscription_status": document.get("subscription_status", "free"),
            "deep_research_usage": document.get("deep_research_usage"),
            "web_search_usage": document.get("web_search_usage"),
            "scholar_mode_usage": document.get("scholar_mode_usage"),
        }

        logger.debug(f"Serialized user: {user_dict.get('email')}")
        return user_dict

    def deserialize_user_updates(self, updates: Dict[str, Any]) -> Dict[str, Any]:
        """
        Prepare user updates for MongoDB storage.

        Args:
            updates: Dictionary of fields to update

        Returns:
            Cleaned and prepared updates
        """
        prepared = {}

        # Clean full_name if present
        if "full_name" in updates:
            prepared["full_name"] = self._clean_full_name(updates["full_name"])

        # Normalize email if present
        if "email" in updates:
            prepared["email"] = self._normalize_email(updates["email"])

        # Copy other fields
        for key, value in updates.items():
            if key not in prepared and value is not None:
                prepared[key] = value

        # Always update timestamp
        prepared["updated_at"] = datetime.now(timezone.utc)

        logger.debug(f"Prepared {len(prepared)} fields for update")
        return prepared


# Singleton instance
_user_serializer: UserSerializer = None


def get_user_serializer() -> UserSerializer:
    """
    Get singleton UserSerializer instance.

    Returns:
        UserSerializer instance
    """
    global _user_serializer
    if _user_serializer is None:
        _user_serializer = UserSerializer()
    return _user_serializer
