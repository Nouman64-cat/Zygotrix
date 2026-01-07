"""
Signup Service.

Handles user signup workflow including OTP generation, verification,
email sending, and account creation.
"""
from datetime import datetime, timezone
from typing import Dict, Any, Optional
import logging

from app.config import get_settings
from app.core.exceptions.database import DatabaseError
from app.core.exceptions.auth import (
    InvalidCredentialsError,
    OTPExpiredError,
    MaxAttemptsExceededError
)
from .otp_service import get_otp_service
from .user_service import get_user_service
from .password_service import get_password_service

logger = logging.getLogger(__name__)


class SignupService:
    """
    Service for user signup workflow.

    Handles:
    - Signup OTP request and email sending
    - OTP verification and account creation
    - Resending OTP codes
    - Development mode bypass
    """

    def __init__(
        self,
        otp_service=None,
        user_service=None,
        password_service=None,
        email_service=None
    ):
        """
        Initialize signup service.

        Args:
            otp_service: OTPService instance (optional)
            user_service: UserService instance (optional)
            password_service: PasswordService instance (optional)
            email_service: EmailService instance (optional)
        """
        self._settings = get_settings()
        self._otp_service = otp_service or get_otp_service()
        self._user_service = user_service or get_user_service()
        self._password_service = password_service or get_password_service()
        
        # Instantiate EmailService if not provided
        if email_service:
            self._email_service = email_service
        else:
            from app.services.email_service import EmailService
            self._email_service = EmailService(self._settings)

    def _get_location_from_ip(self, ip_address: str) -> str:
        """
        Get location from IP address using ip-api.com (free, no API key required).
        Returns a formatted location string or 'Unknown' on failure.
        """
        if not ip_address or ip_address in ("127.0.0.1", "localhost", "::1"):
            return "Local Development"
        
        try:
            import urllib.request
            import json
            
            # ip-api.com provides free geolocation (no API key needed, 45 requests/minute limit)
            url = f"http://ip-api.com/json/{ip_address}?fields=status,country,regionName,city"
            
            with urllib.request.urlopen(url, timeout=5) as response:
                data = json.loads(response.read().decode())
                
            if data.get("status") == "success":
                city = data.get("city", "")
                region = data.get("regionName", "")
                country = data.get("country", "")
                
                # Build location string
                parts = [p for p in [city, region, country] if p]
                return ", ".join(parts) if parts else "Unknown"
            else:
                return "Unknown"
                
        except Exception as e:
            logger.debug(f"Could not get location for IP {ip_address}: {e}")
            return "Unknown"

    def _notify_super_admin(self, user: Dict[str, Any], ip_address: Optional[str] = None) -> None:
        """
        Send notification to super admin about new user registration.
        Checks settings before sending.
        
        Args:
            user: User data dictionary
            ip_address: IP address of the user (optional)
        """
        try:
            # Check if feature is enabled
            from app.services.chatbot_settings import get_chatbot_settings
            try:
                chatbot_settings = get_chatbot_settings()
                if not chatbot_settings.new_user_registration_email_enabled:
                    logger.info("New user registration email skipped: feature disabled in settings")
                    return
            except Exception as e:
                logger.warning(f"Could not check chatbot settings, attempting to send email: {e}")

            # Check if super admin email is configured
            if not self._settings.super_admin_email:
                logger.info("New user registration email skipped: SUPER_ADMIN_EMAIL not configured")
                return

            # Get location from IP
            location = self._get_location_from_ip(ip_address) if ip_address else "Unknown"

            # Send email via EmailService
            from datetime import datetime, timezone
            timestamp = datetime.now(timezone.utc).strftime("%B %d, %Y at %I:%M %p UTC")
            year = datetime.now(timezone.utc).year
            
            self._email_service.send_new_user_registration_email(
                super_admin_email=self._settings.super_admin_email,
                user_email=user["email"],
                full_name=user.get("full_name"),
                user_role=user.get("user_role", "user"),
                timestamp=timestamp,
                year=year,
                ip_address=ip_address or "Unknown",
                location=location
            )
            
        except Exception as e:
            logger.warning(f"Failed to send new user registration email: {e}")

    def _send_signup_otp_email(
        self,
        recipient: str,
        otp_code: str,
        full_name: Optional[str]
    ) -> None:
        """
        Send signup OTP email to user.

        Args:
            recipient: Email address
            otp_code: OTP code to send
            full_name: User's full name

        Raises:
            DatabaseError: If email service is not configured or sending fails
        """
        try:
            minutes = self._settings.signup_otp_ttl_minutes
            success = self._email_service.send_signup_otp_email(
                user_email=recipient,
                user_name=full_name,
                otp_code=otp_code,
                minutes=minutes
            )
            
            if not success:
               logger.error("EmailService returned False for OTP email")
               raise DatabaseError("Failed to send OTP email: Email service failed")
               
        except Exception as e:
            logger.error(f"Error sending OTP email: {e}", exc_info=True)
            raise DatabaseError(f"Failed to send OTP email: {str(e)}")

    def request_signup_otp(
        self,
        email: str,
        password: str,
        full_name: Optional[str],
        ip_address: Optional[str] = None
    ) -> datetime:
        """
        Request a signup OTP.

        In development mode, creates account immediately without OTP.
        In production, creates pending signup and sends OTP email.

        Args:
            email: User's email address
            password: User's plain text password
            full_name: User's full name (optional)
            ip_address: User's IP address (optional)

        Returns:
            OTP expiration datetime

        Raises:
            DatabaseError: If email is already registered or operation fails
        """
        # Check if user already exists
        existing_user = self._user_service.get_user_by_email(email)
        if existing_user:
            logger.warning(f"Signup attempt for existing email: {email}")
            raise DatabaseError(
                "Email is already registered.",
                details={"email": email}
            )

        # Development mode: create account immediately
        if self._settings.is_development:
            logger.info(f"Development mode: creating account immediately for {email}")
            user = self._user_service.create_user(
                email=email,
                password=password,
                full_name=full_name
            )
            
            # Send email notification to super admin
            self._notify_super_admin(user, ip_address=ip_address)
            
            return datetime.now(timezone.utc)

        # Production mode: create pending signup with OTP
        otp_code = self._otp_service.generate_otp()
        otp_data = self._otp_service.create_otp_document(otp_code)

        expires_at = self._user_service.create_pending_signup(
            email=email,
            password=password,
            full_name=full_name,
            otp_data=otp_data
        )

        # Send OTP email
        self._send_signup_otp_email(email, otp_code, full_name)

        logger.info(f"Created pending signup for {email}, OTP sent")
        return expires_at

    def verify_signup_otp(
        self,
        email: str,
        otp: str,
        ip_address: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Verify signup OTP and create user account.

        Args:
            email: User's email address
            otp: OTP code to verify
            ip_address: User's IP address (optional)

        Returns:
            Serialized user dictionary

        Raises:
            InvalidCredentialsError: If no pending signup found or OTP invalid
            OTPExpiredError: If OTP has expired
            MaxAttemptsExceededError: If too many attempts
        """
        # Development mode: return existing user
        if self._settings.is_development:
            existing_user = self._user_service.get_user_by_email(email)
            if existing_user:
                logger.info(f"Development mode: returning existing user {email}")
                return existing_user

        # Get pending signup
        pending = self._user_service.get_pending_signup(email)
        if not pending:
            logger.warning(f"No pending signup found for {email}")
            raise InvalidCredentialsError("No pending signup found for this email.")

        # Verify OTP
        self._otp_service.verify_otp(otp, pending)

        # Create user account
        password_hash = pending.get("password_hash", "")
        full_name = pending.get("full_name")

        user = self._user_service.create_user(
            email=email,
            password=password_hash,
            full_name=full_name,
            password_is_hashed=True  # Password is already hashed in pending signup
        )

        # Delete pending signup
        self._user_service.delete_pending_signup(email)

        # Send WhatsApp notification (non-blocking)
        try:
            from app.services.notifications import send_new_user_whatsapp_notification
            send_new_user_whatsapp_notification(
                email=email,
                full_name=full_name
            )
        except Exception as e:
            logger.warning(f"Failed to send WhatsApp notification: {e}")

        # Send email notification to super admin
        self._notify_super_admin(user, ip_address=ip_address)

        logger.info(f"User account created successfully: {email}")
        return user

    def resend_signup_otp(self, email: str) -> datetime:
        """
        Resend signup OTP to user.

        Args:
            email: User's email address

        Returns:
            New OTP expiration datetime

        Raises:
            InvalidCredentialsError: If no pending signup found
            DatabaseError: If operation fails
        """
        # Development mode: return immediate timestamp
        if self._settings.is_development:
            logger.info(f"Development mode: skipping OTP resend for {email}")
            return datetime.now(timezone.utc)

        # Get pending signup
        pending = self._user_service.get_pending_signup(email)
        if not pending:
            logger.warning(f"No pending signup found for {email}")
            raise InvalidCredentialsError("No pending signup found for this email.")

        # Generate new OTP
        otp_code = self._otp_service.generate_otp()
        otp_data = self._otp_service.create_otp_document(otp_code)

        # Update pending signup with new OTP (only OTP fields)
        expires_at = self._user_service.create_pending_signup(
            email=email,
            password="",  # Ignored when update_otp_only=True
            full_name=pending.get("full_name"),
            otp_data=otp_data,
            update_otp_only=True
        )

        # Send new OTP email
        self._send_signup_otp_email(email, otp_code, pending.get("full_name"))

        logger.info(f"Resent OTP to {email}")
        return expires_at


# Singleton instance
_signup_service: SignupService = None


def get_signup_service() -> SignupService:
    """
    Get singleton SignupService instance.

    Returns:
        SignupService instance
    """
    global _signup_service
    if _signup_service is None:
        _signup_service = SignupService()
    return _signup_service
