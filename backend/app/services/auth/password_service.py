"""
Password Service.

Handles all password-related operations including hashing and verification.
"""
from passlib.context import CryptContext
import logging

logger = logging.getLogger(__name__)


class PasswordService:
    """
    Service for password hashing and verification.

    Uses bcrypt for secure password hashing with proper handling
    of bcrypt's 72-byte limitation.
    """

    def __init__(self):
        """Initialize password service with bcrypt context."""
        self._context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        self._max_password_bytes = 72  # bcrypt's byte limit

    def hash_password(self, password: str) -> str:
        """
        Hash a password using bcrypt.

        Args:
            password: Plain text password

        Returns:
            Hashed password string

        Note:
            Automatically truncates password to bcrypt's 72-byte limit
        """
        try:
            truncated = self._truncate_password(password)
            hashed = self._context.hash(truncated)
            logger.debug("Password hashed successfully")
            return hashed
        except Exception as e:
            logger.error(f"Error hashing password: {e}")
            raise

    def verify_password(self, password: str, password_hash: str) -> bool:
        """
        Verify a password against a hash.

        Args:
            password: Plain text password to verify
            password_hash: Hashed password to compare against

        Returns:
            True if password matches hash, False otherwise
        """
        try:
            truncated = self._truncate_password(password)
            is_valid = self._context.verify(truncated, password_hash)
            logger.debug(f"Password verification: {'success' if is_valid else 'failed'}")
            return is_valid
        except ValueError as e:
            logger.warning(f"Password verification error: {e}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error during password verification: {e}")
            return False

    def _truncate_password(self, password: str) -> str:
        """
        Truncate password to bcrypt's 72-byte limit.

        Args:
            password: Password to truncate

        Returns:
            Truncated password

        Note:
            bcrypt has a 72-byte limit. Passwords longer than this
            are truncated to ensure consistent hashing.
        """
        password_bytes = password.encode("utf-8")

        if len(password_bytes) > self._max_password_bytes:
            truncated_bytes = password_bytes[:self._max_password_bytes]
            return truncated_bytes.decode("utf-8", errors="ignore")

        return password

    def needs_rehash(self, password_hash: str) -> bool:
        """
        Check if a password hash needs to be rehashed.

        Args:
            password_hash: Password hash to check

        Returns:
            True if hash needs updating (e.g., using deprecated algorithm)
        """
        try:
            return self._context.needs_update(password_hash)
        except Exception as e:
            logger.warning(f"Error checking if hash needs update: {e}")
            return False


# Singleton instance
_password_service: PasswordService = None


def get_password_service() -> PasswordService:
    """
    Get singleton PasswordService instance.

    Returns:
        PasswordService instance
    """
    global _password_service
    if _password_service is None:
        _password_service = PasswordService()
    return _password_service
