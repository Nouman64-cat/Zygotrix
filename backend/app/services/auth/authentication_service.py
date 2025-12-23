"""
Authentication Service.

Core authentication service handling login, token generation, and user authentication.
"""
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Optional
import jwt
import logging

from app.config import get_settings
from app.core.exceptions.auth import AuthenticationError, InvalidCredentialsError, TokenExpiredError
from .password_service import get_password_service
from .user_service import get_user_service
from .activity_tracking_service import get_activity_tracking_service
from .user_serializer import get_user_serializer

logger = logging.getLogger(__name__)


class AuthenticationService:
    """
    Service for authentication operations.

    Handles:
    - User authentication (login)
    - JWT token creation and validation
    - Activity tracking on login
    - Auth response building
    """

    def __init__(
        self,
        password_service=None,
        user_service=None,
        activity_service=None,
        serializer=None
    ):
        """
        Initialize authentication service.

        Args:
            password_service: PasswordService instance (optional)
            user_service: UserService instance (optional)
            activity_service: ActivityTrackingService instance (optional)
            serializer: UserSerializer instance (optional)
        """
        self._password_service = password_service or get_password_service()
        self._user_service = user_service or get_user_service()
        self._activity_service = activity_service or get_activity_tracking_service()
        self._serializer = serializer or get_user_serializer()
        self._settings = get_settings()

    def authenticate_user(
        self,
        email: str,
        password: str
    ) -> Dict[str, Any]:
        """
        Authenticate a user with email and password.

        Args:
            email: User's email address
            password: User's plain text password

        Returns:
            Serialized user dictionary

        Raises:
            InvalidCredentialsError: If email or password is invalid
            AuthenticationError: If user account is inactive
        """
        # Get user by email
        user = self._user_service.get_user_by_email(email)

        if not user:
            logger.warning(f"Login attempt for non-existent email: {email}")
            raise InvalidCredentialsError("Invalid email or password.")

        # Verify password
        password_hash = user.get("password_hash", "")
        if not self._password_service.verify_password(password, password_hash):
            logger.warning(f"Failed login attempt for {email}: invalid password")
            raise InvalidCredentialsError("Invalid email or password.")

        # Check if user is active
        if not user.get("is_active", True):
            logger.warning(f"Login attempt for deactivated account: {email}")
            raise AuthenticationError(
                "Your account has been deactivated. Please contact support."
            )

        logger.info(f"User authenticated successfully: {email}")
        return user

    def authenticate_and_track(
        self,
        email: str,
        password: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Authenticate user and update activity tracking.

        Args:
            email: User's email address
            password: User's plain text password
            ip_address: User's IP address
            user_agent: User's browser user agent

        Returns:
            Complete auth response with token and user data

        Raises:
            InvalidCredentialsError: If credentials are invalid
            AuthenticationError: If user account is inactive
        """
        # Authenticate user
        user = self.authenticate_user(email, password)
        user_id = user["id"]

        # Update activity tracking
        try:
            self._user_service.update_user_activity(
                user_id=user_id,
                ip_address=ip_address,
                user_agent=user_agent
            )
            logger.debug(f"Updated activity for user {user_id}")
        except Exception as e:
            # Don't fail authentication if activity tracking fails
            logger.warning(f"Failed to update activity for {user_id}: {e}")

        # Build and return auth response
        return self.build_auth_response(user)

    def create_access_token(
        self,
        user_id: str,
        extra_claims: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Create a JWT access token for a user.

        Args:
            user_id: User's ID
            extra_claims: Optional additional claims to include in token

        Returns:
            JWT token string
        """
        now = datetime.now(timezone.utc)
        token_ttl = getattr(self._settings.auth, 'token_ttl_minutes', 60)
        expires_at = now + timedelta(minutes=token_ttl)

        payload = {
            "sub": user_id,
            "iat": int(now.timestamp()),
            "exp": int(expires_at.timestamp()),
        }

        # Add extra claims if provided
        if extra_claims:
            payload.update(extra_claims)

        # Get JWT settings
        secret_key = getattr(self._settings.auth, 'secret_key', self._settings.auth_secret_key)
        algorithm = getattr(self._settings.auth, 'algorithm', self._settings.auth_jwt_algorithm)

        token = jwt.encode(payload, secret_key, algorithm=algorithm)
        logger.debug(f"Created access token for user {user_id} (expires in {token_ttl}m)")

        return token

    def decode_access_token(self, token: str) -> Dict[str, Any]:
        """
        Decode and validate a JWT access token.

        Args:
            token: JWT token string

        Returns:
            Token payload dictionary

        Raises:
            TokenExpiredError: If token has expired
            AuthenticationError: If token is invalid
        """
        try:
            secret_key = getattr(self._settings.auth, 'secret_key', self._settings.auth_secret_key)
            algorithm = getattr(self._settings.auth, 'algorithm', self._settings.auth_jwt_algorithm)

            payload = jwt.decode(token, secret_key, algorithms=[algorithm])
            logger.debug(f"Successfully decoded token for user {payload.get('sub')}")

            return payload

        except jwt.ExpiredSignatureError:
            logger.warning("Token validation failed: expired")
            raise TokenExpiredError("Authentication token has expired.")

        except jwt.PyJWTError as e:
            logger.warning(f"Token validation failed: {e}")
            raise AuthenticationError("Invalid authentication token.")

    def resolve_user_from_token(self, token: str) -> Dict[str, Any]:
        """
        Resolve user from JWT token.

        Args:
            token: JWT token string

        Returns:
            Serialized user dictionary

        Raises:
            TokenExpiredError: If token has expired
            AuthenticationError: If token is invalid or user not found
        """
        # Decode token
        payload = self.decode_access_token(token)

        # Extract user ID
        user_id = payload.get("sub")
        if not user_id or not isinstance(user_id, str):
            logger.error(f"Invalid user ID in token: {user_id}")
            raise AuthenticationError("Invalid authentication token.")

        # Get user
        user = self._user_service.get_user_by_id(user_id)
        if not user:
            logger.error(f"User not found for ID from token: {user_id}")
            raise AuthenticationError("User not found.")

        logger.debug(f"Resolved user from token: {user.get('email')}")
        return user

    def build_auth_response(self, user: Dict[str, Any]) -> Dict[str, Any]:
        """
        Build authentication response with token and user data.

        Args:
            user: User dictionary

        Returns:
            Auth response with access_token, token_type, and user
        """
        access_token = self.create_access_token(user["id"])

        response = {
            "access_token": access_token,
            "token_type": "bearer",
            "user": user,
        }

        logger.debug(f"Built auth response for user {user.get('email')}")
        return response


# Singleton instance
_authentication_service: AuthenticationService = None


def get_authentication_service() -> AuthenticationService:
    """
    Get singleton AuthenticationService instance.

    Returns:
        AuthenticationService instance
    """
    global _authentication_service
    if _authentication_service is None:
        _authentication_service = AuthenticationService()
    return _authentication_service
