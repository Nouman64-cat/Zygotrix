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
        password_service=None
    ):
        """
        Initialize signup service.

        Args:
            otp_service: OTPService instance (optional)
            user_service: UserService instance (optional)
            password_service: PasswordService instance (optional)
        """
        self._otp_service = otp_service or get_otp_service()
        self._user_service = user_service or get_user_service()
        self._password_service = password_service or get_password_service()
        self._settings = get_settings()

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
        if not self._settings.aws_ses_username or not self._settings.aws_ses_password:
            raise DatabaseError(
                "Email service is not configured. Please set AWS_SES_USERNAME and AWS_SES_PASSWORD."
            )

        import smtplib
        import ssl
        from email.mime.text import MIMEText
        from email.mime.multipart import MIMEMultipart

        smtp_host = f"email-smtp.{self._settings.aws_ses_region}.amazonaws.com"
        smtp_port = self._settings.aws_smtp_port

        subject = "Your Zygotrix verification code"
        greeting = full_name or "there"
        minutes = self._settings.signup_otp_ttl_minutes

        html_content = f"""
        <table role='presentation' style='width:100%;background-color:#0f172a;padding:24px;font-family:Segoe UI,Roboto,"Helvetica Neue",Arial,sans-serif;'>
          <tr>
            <td align='center'>
              <table role='presentation' style='max-width:520px;width:100%;background-color:#ffffff;border-radius:16px;padding:32px;text-align:left;'>
                <tr>
                  <td>
                    <p style='color:#0f172a;font-size:13px;margin:0 0 12px;text-transform:uppercase;letter-spacing:0.28em;'>Email Verification</p>
                    <h1 style='color:#0f172a;font-size:26px;margin:0 0 18px;'>Hi {greeting},</h1>
                    <p style='color:#1f2937;font-size:15px;line-height:1.6;margin:0 0 20px;'>Use the one-time code below to finish setting up your Zygotrix portal account.</p>
                    <div style='display:inline-block;padding:14px 24px;background-color:#0f172a;color:#f8fafc;border-radius:12px;font-size:28px;letter-spacing:0.35em;font-weight:700;'>
                      {otp_code}
                    </div>
                    <p style='color:#475569;font-size:14px;line-height:1.6;margin:24px 0 12px;'>This code expires in {minutes} minutes. Enter it on the verification screen to continue.</p>
                    <p style='color:#94a3b8;font-size:13px;line-height:1.6;margin:0;'>Didn't request this? You can safely ignore this email and your account will remain unchanged.</p>
                  </td>
                </tr>
              </table>
              <p style='color:#94a3b8;font-size:12px;margin:18px 0 0;'>Zygotrix - Advanced Genetics Intelligence</p>
            </td>
          </tr>
        </table>
        """

        text_content = (
            f"Hi {greeting},\n\n"
            f"Your Zygotrix verification code is {otp_code}.\n"
            f"This code expires in {minutes} minutes.\n\n"
            "If you didn't request this email, you can ignore it."
        )

        try:
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = self._settings.aws_ses_from_email
            msg['To'] = recipient

            text_part = MIMEText(text_content, 'plain', 'utf-8')
            html_part = MIMEText(html_content, 'html', 'utf-8')
            msg.attach(text_part)
            msg.attach(html_part)

            context = ssl.create_default_context()

            if smtp_port in (587, 2587):
                # Use STARTTLS for port 587/2587
                with smtplib.SMTP(smtp_host, smtp_port, timeout=30) as server:
                    server.starttls(context=context)
                    server.login(self._settings.aws_ses_username, self._settings.aws_ses_password)
                    server.send_message(msg)
            else:
                # Use SMTP_SSL for port 465
                with smtplib.SMTP_SSL(smtp_host, smtp_port, context=context, timeout=30) as server:
                    server.login(self._settings.aws_ses_username, self._settings.aws_ses_password)
                    server.send_message(msg)

            logger.info(f"Sent signup OTP email to {recipient}")

        except smtplib.SMTPException as e:
            logger.error(f"SMTP error sending OTP email: {e}", exc_info=True)
            raise DatabaseError(f"Failed to send OTP email: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error sending OTP email: {e}", exc_info=True)
            raise DatabaseError(f"Failed to send OTP email: {str(e)}")

    def request_signup_otp(
        self,
        email: str,
        password: str,
        full_name: Optional[str]
    ) -> datetime:
        """
        Request a signup OTP.

        In development mode, creates account immediately without OTP.
        In production, creates pending signup and sends OTP email.

        Args:
            email: User's email address
            password: User's plain text password
            full_name: User's full name (optional)

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
            self._user_service.create_user(
                email=email,
                password=password,
                full_name=full_name
            )
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
        otp: str
    ) -> Dict[str, Any]:
        """
        Verify signup OTP and create user account.

        Args:
            email: User's email address
            otp: OTP code to verify

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
