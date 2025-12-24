"""
Activity Tracking Service.

Handles user activity tracking including IP addresses, browser detection,
geolocation, and login history management.
"""
from datetime import datetime, timezone
from typing import Optional, Dict, Any
import httpx
import logging

logger = logging.getLogger(__name__)


class ActivityTrackingService:
    """
    Service for tracking user activity and login information.

    Provides functionality for:
    - Browser/user agent parsing
    - IP-based geolocation
    - Login history management
    """

    @staticmethod
    def parse_user_agent(user_agent: Optional[str]) -> str:
        """
        Parse user agent string to identify browser.

        Args:
            user_agent: User-Agent header string

        Returns:
            Browser name (e.g., "Google Chrome", "Mozilla Firefox")
        """
        if not user_agent:
            return "Unknown"

        ua_lower = user_agent.lower()

        # Check for common browsers (order matters!)
        if "edge" in ua_lower or "edg/" in ua_lower:
            return "Microsoft Edge"
        elif "chrome" in ua_lower and "chromium" not in ua_lower:
            return "Google Chrome"
        elif "firefox" in ua_lower:
            return "Mozilla Firefox"
        elif "safari" in ua_lower and "chrome" not in ua_lower:
            return "Apple Safari"
        elif "opera" in ua_lower or "opr/" in ua_lower:
            return "Opera"
        elif "msie" in ua_lower or "trident" in ua_lower:
            return "Internet Explorer"
        else:
            return "Unknown Browser"

    @staticmethod
    def get_location_from_ip(ip_address: Optional[str]) -> Optional[str]:
        """
        Get location from IP address using free geolocation API.

        Args:
            ip_address: IP address to look up

        Returns:
            Location string (e.g., "New York, United States") or None

        Note:
            Uses ip-api.com free tier (45 requests/minute limit)
            Returns "Local" for localhost addresses
        """
        # Handle local addresses
        if not ip_address or ip_address in ["127.0.0.1", "localhost", "::1", "Unknown"]:
            return "Local"

        try:
            # Query ip-api.com (free tier)
            response = httpx.get(
                f"http://ip-api.com/json/{ip_address}",
                params={"fields": "status,country,city"},
                timeout=5.0
            )

            if response.status_code == 200:
                data = response.json()

                if data.get("status") == "success":
                    city = data.get("city", "")
                    country = data.get("country", "")

                    # Build location string
                    if city and country:
                        location = f"{city}, {country}"
                    elif country:
                        location = country
                    elif city:
                        location = city
                    else:
                        location = None

                    logger.debug(f"IP {ip_address} resolved to: {location}")
                    return location

        except httpx.TimeoutException:
            logger.warning(f"Timeout getting location for IP {ip_address}")
        except httpx.RequestError as e:
            logger.warning(f"Error getting location for IP {ip_address}: {e}")
        except Exception as e:
            logger.error(f"Unexpected error in geolocation: {e}")

        return None

    def create_login_entry(
        self,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        location: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Create a login history entry.

        Args:
            ip_address: User's IP address
            user_agent: User's browser user agent
            location: User's location (if not provided, will be looked up)

        Returns:
            Dictionary containing login entry data
        """
        browser = self.parse_user_agent(user_agent) if user_agent else "Unknown"

        # Look up location if not provided
        if location is None and ip_address:
            location = self.get_location_from_ip(ip_address)

        entry = {
            "timestamp": datetime.now(timezone.utc),
            "ip_address": ip_address or "Unknown",
            "location": location or "Unknown",
            "browser": browser,
        }

        logger.debug(
            f"Created login entry: {browser} from {entry['location']} ({entry['ip_address']})"
        )

        return entry

    def create_activity_update(
        self,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Create activity update for user document.

        Args:
            ip_address: User's IP address
            user_agent: User's browser user agent

        Returns:
            Dictionary with activity fields for MongoDB update
        """
        now = datetime.now(timezone.utc)
        browser = self.parse_user_agent(user_agent) if user_agent else "Unknown"
        location = self.get_location_from_ip(ip_address) if ip_address else None

        update = {
            "last_accessed_at": now,
            "last_ip_address": ip_address,
            "last_location": location,
            "last_browser": browser,
        }

        logger.debug(f"Created activity update for {ip_address}")
        return update

    def build_login_history_push(
        self,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        location: Optional[str] = None,
        max_entries: int = 10
    ) -> Dict[str, Any]:
        """
        Build MongoDB push operation for login history.

        Args:
            ip_address: User's IP address
            user_agent: User's browser user agent
            location: User's location (optional)
            max_entries: Maximum number of history entries to keep

        Returns:
            MongoDB $push operation with $slice
        """
        login_entry = self.create_login_entry(ip_address, user_agent, location)

        push_operation = {
            "login_history": {
                "$each": [login_entry],
                "$slice": -max_entries  # Keep only last N entries
            }
        }

        logger.debug(f"Created login history push (max: {max_entries})")
        return push_operation


# Singleton instance
_activity_tracking_service: ActivityTrackingService = None


def get_activity_tracking_service() -> ActivityTrackingService:
    """
    Get singleton ActivityTrackingService instance.

    Returns:
        ActivityTrackingService instance
    """
    global _activity_tracking_service
    if _activity_tracking_service is None:
        _activity_tracking_service = ActivityTrackingService()
    return _activity_tracking_service
