"""
Password Reset Service.

Handles password reset workflow including OTP generation, verification,
email sending, and password updates with session invalidation.
"""
from datetime import datetime, timezone, timedelta
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


class PasswordResetService:
    """
    Service for password reset workflow.

    Handles:
    - Password reset OTP request and email sending
    - OTP verification and password update
    - Resending OTP codes
    - Session invalidation via password_changed_at timestamp
    - Email enumeration protection
    """

    def __init__(
        self,
        otp_service=None,
        user_service=None,
        password_service=None
    ):
        """
        Initialize password reset service.

        Args:
            otp_service: OTPService instance (optional)
            user_service: UserService instance (optional)
            password_service: PasswordService instance (optional)
        """
        self._otp_service = otp_service or get_otp_service()
        self._user_service = user_service or get_user_service()
        self._password_service = password_service or get_password_service()
        self._settings = get_settings()

    def _send_password_reset_email(
        self,
        recipient: str,
        otp_code: str,
        full_name: Optional[str]
    ) -> None:
        """
        Send password reset OTP email to user.

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

        subject = "Reset your Zygotrix password"
        greeting = full_name or "there"
        minutes = self._settings.password_reset_otp_ttl_minutes

        html_content = f"""
        <table role='presentation' style='width:100%;background-color:#0f172a;padding:24px;font-family:Segoe UI,Roboto,"Helvetica Neue",Arial,sans-serif;'>
          <tr>
            <td align='center'>
              <table role='presentation' style='max-width:520px;width:100%;background-color:#ffffff;border-radius:16px;padding:32px;text-align:left;'>
                <tr>
                  <td>
                    <p style='color:#0f172a;font-size:13px;margin:0 0 12px;text-transform:uppercase;letter-spacing:0.28em;'>Password Reset</p>
                    <h1 style='color:#0f172a;font-size:26px;margin:0 0 18px;'>Hi {greeting},</h1>
                    <p style='color:#1f2937;font-size:15px;line-height:1.6;margin:0 0 20px;'>We received a request to reset your Zygotrix account password. Use the one-time code below to continue.</p>
                    <div style='display:inline-block;padding:14px 24px;background-color:#0f172a;color:#f8fafc;border-radius:12px;font-size:28px;letter-spacing:0.35em;font-weight:700;'>
                      {otp_code}
                    </div>
                    <p style='color:#475569;font-size:14px;line-height:1.6;margin:24px 0 12px;'>This code expires in {minutes} minutes. Enter it on the password reset screen to create a new password.</p>
                    <p style='color:#dc2626;font-size:14px;line-height:1.6;margin:12px 0;font-weight:600;'>⚠️ Security Notice:</p>
                    <p style='color:#475569;font-size:13px;line-height:1.6;margin:0 0 12px;'>If you didn't request this password reset, please ignore this email or contact support if you're concerned about your account security. Your password will remain unchanged.</p>
                    <p style='color:#94a3b8;font-size:13px;line-height:1.6;margin:0;'>After resetting your password, you'll be logged out of all devices for security.</p>
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
            f"We received a request to reset your Zygotrix account password.\n\n"
            f"Your password reset code is: {otp_code}\n"
            f"This code expires in {minutes} minutes.\n\n"
            "If you didn't request this password reset, you can safely ignore this email.\n\n"
            "After resetting your password, you'll be logged out of all devices for security."
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

            logger.info(f"Sent password reset OTP email to {recipient}")

        except smtplib.SMTPException as e:
            logger.error(f"SMTP error sending password reset email: {e}", exc_info=True)
            raise DatabaseError(f"Failed to send password reset email: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error sending password reset email: {e}", exc_info=True)
            raise DatabaseError(f"Failed to send password reset email: {str(e)}")

    def _get_password_reset_document(self, email: str) -> Optional[Dict[str, Any]]:
        """
        Get password reset document from database.

        Args:
            email: User's email address

        Returns:
            Password reset document or None if not found
        """
        from app.services.common import get_password_resets_collection

        collection = get_password_resets_collection()
        normalized_email = email.lower().strip()

        return collection.find_one({"email": normalized_email})

    def _create_or_update_reset(
        self,
        email: str,
        otp_data: Dict[str, Any]
    ) -> datetime:
        """
        Create or update password reset document.

        Args:
            email: User's email address
            otp_data: OTP data from OTPService

        Returns:
            OTP expiration datetime
        """
        from app.services.common import get_password_resets_collection

        collection = get_password_resets_collection()
        normalized_email = email.lower().strip()

        now = datetime.now(timezone.utc)
        ttl_minutes = self._settings.password_reset_otp_ttl_minutes
        expires_at = now + timedelta(minutes=ttl_minutes)

        document = {
            "email": normalized_email,
            "otp_hash": otp_data["otp_hash"],
            "otp_expires_at": expires_at,
            "otp_attempts": 0,
            "created_at": now,
            "updated_at": now
        }

        # Upsert the document
        collection.update_one(
            {"email": normalized_email},
            {"$set": document},
            upsert=True
        )

        logger.info(f"Created/updated password reset for {normalized_email}")
        return expires_at

    def _delete_password_reset(self, email: str) -> None:
        """
        Delete password reset document.

        Args:
            email: User's email address
        """
        from app.services.common import get_password_resets_collection

        collection = get_password_resets_collection()
        normalized_email = email.lower().strip()

        collection.delete_one({"email": normalized_email})
        logger.info(f"Deleted password reset for {normalized_email}")

    def request_password_reset(self, email: str) -> datetime:
        """
        Request a password reset OTP.

        IMPORTANT: For security (email enumeration protection), this always
        returns success even if the email doesn't exist.

        Args:
            email: User's email address

        Returns:
            OTP expiration datetime
        """
        from datetime import timedelta

        normalized_email = email.lower().strip()

        # Check if user exists
        existing_user = self._user_service.get_user_by_email(normalized_email)

        # Email enumeration protection: Always behave as if successful
        if not existing_user:
            logger.info(f"Password reset requested for non-existent email: {normalized_email} (silently ignored)")
            # Return a fake expiry time
            now = datetime.now(timezone.utc)
            ttl_minutes = self._settings.password_reset_otp_ttl_minutes
            return now + timedelta(minutes=ttl_minutes)

        # Development mode: Skip OTP (for testing)
        if self._settings.is_development:
            logger.info(f"Development mode: skipping OTP for password reset {normalized_email}")
            now = datetime.now(timezone.utc)
            ttl_minutes = self._settings.password_reset_otp_ttl_minutes
            return now + timedelta(minutes=ttl_minutes)

        # Generate OTP and create reset document
        otp_code = self._otp_service.generate_otp()
        otp_data = self._otp_service.create_otp_document(otp_code)
        expires_at = self._create_or_update_reset(normalized_email, otp_data)

        # Send OTP email
        full_name = existing_user.get("full_name")
        self._send_password_reset_email(normalized_email, otp_code, full_name)

        logger.info(f"Password reset OTP sent to {normalized_email}")
        return expires_at

    def verify_and_reset_password(
        self,
        email: str,
        otp: str,
        new_password: str
    ) -> Dict[str, Any]:
        """
        Verify OTP and reset user password.

        Args:
            email: User's email address
            otp: OTP code to verify
            new_password: New password (plain text, will be hashed)

        Returns:
            Success message dictionary

        Raises:
            InvalidCredentialsError: If user not found or no reset request
            OTPExpiredError: If OTP has expired
            MaxAttemptsExceededError: If too many attempts
        """
        normalized_email = email.lower().strip()

        # Get user
        user = self._user_service.get_user_by_email(normalized_email)
        if not user:
            logger.warning(f"Password reset attempt for non-existent email: {normalized_email}")
            raise InvalidCredentialsError("Invalid email or verification code.")

        # Development mode: Allow reset without OTP
        if self._settings.is_development:
            logger.info(f"Development mode: skipping OTP verification for {normalized_email}")
        else:
            # Get password reset document
            reset_doc = self._get_password_reset_document(normalized_email)
            if not reset_doc:
                logger.warning(f"No password reset request found for {normalized_email}")
                raise InvalidCredentialsError("No password reset request found. Please request a new code.")

            # Verify OTP
            self._otp_service.verify_otp(otp, reset_doc)

        # Hash new password
        password_hash = self._password_service.hash_password(new_password)

        # Update user password and set password_changed_at to invalidate sessions
        user_id = str(user["_id"])
        now = datetime.now(timezone.utc)

        from app.services.common import get_users_collection
        users_collection = get_users_collection()

        users_collection.update_one(
            {"_id": user["_id"]},
            {
                "$set": {
                    "password_hash": password_hash,
                    "password_changed_at": now.isoformat(),
                    "updated_at": now
                }
            }
        )

        # Delete password reset document
        if not self._settings.is_development:
            self._delete_password_reset(normalized_email)

        logger.info(f"Password reset successfully for {normalized_email}")
        return {"message": "Password reset successfully. Please log in with your new password."}

    def verify_otp_only(self, email: str, otp: str) -> Dict[str, Any]:
        """
        Verify password reset OTP without resetting password.

        This allows the frontend to verify the OTP in a separate step
        before collecting the new password.

        Args:
            email: User's email address
            otp: OTP code to verify

        Returns:
            Success message dictionary

        Raises:
            InvalidCredentialsError: If user not found or no reset request
            OTPExpiredError: If OTP has expired
            MaxAttemptsExceededError: If too many attempts
        """
        normalized_email = email.lower().strip()

        # Get user (for email enumeration protection)
        user = self._user_service.get_user_by_email(normalized_email)
        if not user:
            logger.warning(f"OTP verification attempt for non-existent email: {normalized_email}")
            raise InvalidCredentialsError("Invalid email or verification code.")

        # Development mode: Skip OTP verification
        if self._settings.is_development:
            logger.info(f"Development mode: skipping OTP verification for {normalized_email}")
            return {"message": "OTP verified successfully. You may now reset your password."}

        # Get password reset document
        reset_doc = self._get_password_reset_document(normalized_email)
        if not reset_doc:
            logger.warning(f"No password reset request found for {normalized_email}")
            raise InvalidCredentialsError("No password reset request found. Please request a new code.")

        # Verify OTP
        try:
            self._otp_service.verify_otp(otp, reset_doc)
        except Exception as e:
            # Increment attempts on failure
            from app.services.common import get_password_resets_collection
            collection = get_password_resets_collection()
            collection.update_one(
                {"email": normalized_email},
                self._otp_service.increment_attempts(reset_doc)
            )
            raise

        logger.info(f"OTP verified successfully for {normalized_email}")
        return {"message": "OTP verified successfully. You may now reset your password."}

    def resend_reset_otp(self, email: str) -> datetime:
        """
        Resend password reset OTP to user.

        Args:
            email: User's email address

        Returns:
            New OTP expiration datetime

        Raises:
            InvalidCredentialsError: If no reset request found
        """
        from datetime import timedelta

        normalized_email = email.lower().strip()

        # Check if user exists
        existing_user = self._user_service.get_user_by_email(normalized_email)

        # Email enumeration protection
        if not existing_user:
            logger.info(f"Resend OTP requested for non-existent email: {normalized_email} (silently ignored)")
            now = datetime.now(timezone.utc)
            ttl_minutes = self._settings.password_reset_otp_ttl_minutes
            return now + timedelta(minutes=ttl_minutes)

        # Development mode: Skip OTP
        if self._settings.is_development:
            logger.info(f"Development mode: skipping OTP resend for {normalized_email}")
            now = datetime.now(timezone.utc)
            ttl_minutes = self._settings.password_reset_otp_ttl_minutes
            return now + timedelta(minutes=ttl_minutes)

        # Check if reset request exists
        reset_doc = self._get_password_reset_document(normalized_email)
        if not reset_doc:
            logger.warning(f"No password reset request found for resend: {normalized_email}")
            # Still return success for email enumeration protection
            now = datetime.now(timezone.utc)
            ttl_minutes = self._settings.password_reset_otp_ttl_minutes
            return now + timedelta(minutes=ttl_minutes)

        # Generate new OTP
        otp_code = self._otp_service.generate_otp()
        otp_data = self._otp_service.create_otp_document(otp_code)
        expires_at = self._create_or_update_reset(normalized_email, otp_data)

        # Send new OTP email
        full_name = existing_user.get("full_name")
        self._send_password_reset_email(normalized_email, otp_code, full_name)

        logger.info(f"Resent password reset OTP to {normalized_email}")
        return expires_at


# Singleton instance
_password_reset_service: PasswordResetService = None


def get_password_reset_service() -> PasswordResetService:
    """
    Get singleton PasswordResetService instance.

    Returns:
        PasswordResetService instance
    """
    global _password_reset_service
    if _password_reset_service is None:
        _password_reset_service = PasswordResetService()
    return _password_reset_service
