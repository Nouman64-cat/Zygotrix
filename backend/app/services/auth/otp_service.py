"""
OTP (One-Time Password) Service.

Handles OTP generation, verification, and management for email verification.
"""
import secrets
import string
from datetime import datetime, timedelta, timezone
from typing import Dict, Any
import logging

from app.config import get_settings
from app.core.exceptions.business import OTPExpiredError, MaxAttemptsExceededError
from app.core.exceptions.auth import InvalidCredentialsError
from .password_service import get_password_service

logger = logging.getLogger(__name__)


class OTPService:
    """
    Service for OTP generation and verification.

    Handles the complete OTP lifecycle including generation,
    hashing, verification, and expiration management.
    """

    def __init__(self, password_service=None):
        """
        Initialize OTP service.

        Args:
            password_service: PasswordService instance (optional)
        """
        self._password_service = password_service or get_password_service()
        self._settings = get_settings()

    def generate_otp(self) -> str:
        """
        Generate a random numeric OTP code.

        Returns:
            OTP code as string

        Note:
            Length is fixed at 6 digits
        """
        otp_length = 6
        otp = "".join(secrets.choice(string.digits) for _ in range(otp_length))
        logger.debug(f"Generated OTP code of length {otp_length}")
        return otp

    def create_otp_document(self, otp_code: str) -> Dict[str, Any]:
        """
        Create an OTP document for database storage.

        Args:
            otp_code: Plain text OTP code

        Returns:
            Dictionary containing hashed OTP data with expiration
        """
        now = datetime.now(timezone.utc)
        otp_ttl = getattr(self._settings, 'signup_otp_ttl_minutes', 10)
        expires_at = now + timedelta(minutes=otp_ttl)

        otp_document = {
            "otp_hash": self._password_service.hash_password(otp_code),
            "otp_expires_at": expires_at,
            "otp_attempts": 0,
            "created_at": now,
            "updated_at": now,
        }

        logger.debug(f"Created OTP document (expires in {otp_ttl} minutes)")
        return otp_document

    def verify_otp(self, otp_code: str, stored_otp: Dict[str, Any]) -> None:
        """
        Verify an OTP code against stored data.

        Args:
            otp_code: Plain text OTP code to verify
            stored_otp: Stored OTP data from database

        Raises:
            OTPExpiredError: If OTP has expired
            MaxAttemptsExceededError: If maximum attempts reached
            InvalidCredentialsError: If OTP is invalid
        """
        # Check expiration
        expires_at = stored_otp.get("otp_expires_at")
        if expires_at:
            # Ensure timezone awareness
            if expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=timezone.utc)

            if expires_at < datetime.now(timezone.utc):
                logger.warning("OTP verification failed: expired")
                raise OTPExpiredError("OTP has expired. Please request a new code.")

        # Check attempts
        max_attempts = 5  # Maximum OTP verification attempts
        attempts = stored_otp.get("otp_attempts", 0)

        if attempts >= max_attempts:
            logger.warning(f"OTP verification failed: max attempts ({max_attempts}) exceeded")
            raise MaxAttemptsExceededError(
                f"Too many invalid attempts. Please restart signup."
            )

        # Verify OTP hash
        otp_hash = stored_otp.get("otp_hash", "")
        if not self._password_service.verify_password(otp_code, otp_hash):
            logger.warning(f"OTP verification failed: invalid code (attempt {attempts + 1})")
            raise InvalidCredentialsError("Invalid OTP code. Please try again.")

        logger.info("OTP verification successful")

    def is_expired(self, stored_otp: Dict[str, Any]) -> bool:
        """
        Check if an OTP has expired.

        Args:
            stored_otp: Stored OTP data from database

        Returns:
            True if expired, False otherwise
        """
        expires_at = stored_otp.get("otp_expires_at")
        if not expires_at:
            return True

        # Ensure timezone awareness
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)

        return expires_at < datetime.now(timezone.utc)

    def increment_attempts(self, stored_otp: Dict[str, Any]) -> Dict[str, Any]:
        """
        Increment the attempt counter for an OTP.

        Args:
            stored_otp: Stored OTP data

        Returns:
            Update operations for MongoDB
        """
        return {
            "$inc": {"otp_attempts": 1},
            "$set": {"updated_at": datetime.now(timezone.utc)}
        }

    def get_remaining_time(self, stored_otp: Dict[str, Any]) -> int:
        """
        Get remaining time until OTP expires.

        Args:
            stored_otp: Stored OTP data

        Returns:
            Remaining seconds, or 0 if expired
        """
        expires_at = stored_otp.get("otp_expires_at")
        if not expires_at:
            return 0

        # Ensure timezone awareness
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)

        now = datetime.now(timezone.utc)
        if expires_at < now:
            return 0

        delta = expires_at - now
        return int(delta.total_seconds())


# Singleton instance
_otp_service: OTPService = None


def get_otp_service() -> OTPService:
    """
    Get singleton OTPService instance.

    Returns:
        OTPService instance
    """
    global _otp_service
    if _otp_service is None:
        _otp_service = OTPService()
    return _otp_service
