from __future__ import annotations

import logging
from pathlib import Path
from typing import TYPE_CHECKING
import resend
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import jinja2
from fastapi import Depends

from app.config import get_settings

if TYPE_CHECKING:
    from app.config import Settings

try:
    template_dir = Path(__file__).parent.parent / "templates" / "emails"
    jinja_env = jinja2.Environment(
        loader=jinja2.FileSystemLoader(template_dir), autoescape=True
    )
    jinja_env.get_template("enrollment.html")
    jinja_env.get_template("completion.html")
    jinja_env.get_template("signup_otp.html")
    jinja_env.get_template("new_user_registration.html")
except jinja2.TemplateNotFound as e:
    logging.error(f"Could not find email templates. Looked in: {template_dir}")
    raise


logger = logging.getLogger(__name__)


class EmailService:

    def __init__(self, settings: Settings = Depends(get_settings)):
        self.settings = settings
        self.university_url = getattr(
            settings, "university_url", "https://zygotrix.university.courtcierge.online"
        )
        # Ensure we always have the frontend URL for admin links
        self.frontend_url = getattr(
            settings, 'frontend_url', getattr(settings, 'FRONTEND_URL', 'https://zygotrix.com')
        )

        if not settings.aws_ses_username or not settings.aws_ses_password:
            logger.warning(
                 "AWS_SES_USERNAME or AWS_SES_PASSWORD not set. Email service is disabled.")
            self.enabled = False
        else:
            self.smtp_host = f"email-smtp.{settings.aws_ses_region}.amazonaws.com"
            self.smtp_port = settings.aws_smtp_port
            self.enabled = True

    def _send_email(
        self, to: str, subject: str, html_body: str, text_body: str
    ) -> bool:

        if not self.enabled:
            logger.warning(
                f"Email service disabled. Skipping email to {to} (Subject: {subject})"
            )
            return False
            
        # Try AWS SDK (Boto3) first - Bypasses SMTP port blocking (Uses HTTPS/443)
        # Boto3 can auto-discover credentials from AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY env vars
        import os
        aws_access_key = os.getenv("AWS_ACCESS_KEY_ID")
        aws_secret_key = os.getenv("AWS_SECRET_ACCESS_KEY")
        
        if aws_access_key and aws_secret_key:
            try:
                import boto3
                from botocore.exceptions import ClientError
                
                client = boto3.client(
                    'ses',
                    region_name=self.settings.aws_ses_region,
                    aws_access_key_id=aws_access_key,
                    aws_secret_access_key=aws_secret_key
                )
                
                response = client.send_email(
                    Source=self.settings.aws_ses_from_email,
                    Destination={
                        'ToAddresses': [to],
                    },
                    Message={
                        'Subject': {
                            'Data': subject,
                            'Charset': 'UTF-8'
                        },
                        'Body': {
                            'Text': {
                                'Data': text_body,
                                'Charset': 'UTF-8'
                            },
                            'Html': {
                                'Data': html_body,
                                'Charset': 'UTF-8'
                            }
                        }
                    }
                )
                logger.info(f"Email '{subject}' sent successfully to {to} via AWS SES API (MessageId: {response.get('MessageId')})")
                return True
                
            except ImportError:
                logger.warning("boto3 not installed, falling back to SMTP")
            except Exception as e:
                logger.error(f"AWS SES API failed: {e}. Falling back to SMTP.", exc_info=True)
                # Fall through to SMTP

        try:
            # Create message
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = self.settings.aws_ses_from_email
            msg['To'] = to

            # Attach text and HTML parts
            text_part = MIMEText(text_body, 'plain', 'utf-8')
            html_part = MIMEText(html_body, 'html', 'utf-8')
            msg.attach(text_part)
            msg.attach(html_part)

            # Send email using appropriate method based on port
            import ssl
            context = ssl.create_default_context()
            
            if self.smtp_port in (587, 2587):
                # Use STARTTLS for port 587/2587
                with smtplib.SMTP(self.smtp_host, self.smtp_port, timeout=30) as server:
                    server.starttls(context=context)
                    server.login(self.settings.aws_ses_username, self.settings.aws_ses_password)
                    server.send_message(msg)
            else:
                # Use SMTP_SSL for port 465 (SSL from start)
                with smtplib.SMTP_SSL(self.smtp_host, self.smtp_port, context=context, timeout=30) as server:
                    server.login(self.settings.aws_ses_username, self.settings.aws_ses_password)
                    server.send_message(msg)

            logger.info(f"Email '{subject}' sent successfully to {to} via SMTP")
            return True
        except smtplib.SMTPException as e:
            logger.error(f"Failed to send email to {to} (SMTP): {e}", exc_info=True)
            return False
        except Exception as e:
            logger.error(f"Failed to send email to {to} (Unexpected): {e}", exc_info=True)
            return False

    def _render_template(self, template_name: str, context: dict) -> str:

        try:
            template = jinja_env.get_template(template_name)
            full_context = {"university_url": self.university_url, **context}
            return template.render(full_context)
        except Exception as e:
            logger.error(
                f"Failed to render email template {template_name}: {e}", exc_info=True
            )
            return f"Error rendering template {template_name}. Please contact support."

    def send_enrollment_email(
        self, user_email: str, user_name: str, course_title: str, course_slug: str
    ) -> bool:

        subject = f"🎉 Welcome to Your New Course: {course_title}!"

        context = {
            "user_name": user_name,
            "course_title": course_title,
            "course_slug": course_slug,
        }

        html_content = self._render_template("enrollment.html", context)

        text_content = (
            f"Hi {user_name},\n\n"
            f"Congratulations! You've successfully enrolled in {course_title}.\n"
            f"Start learning now: {self.university_url}/university/courses/{course_slug}\n\n"
            "Happy Learning!\nThe Zygotrix University Team"
        )

        return self._send_email(user_email, subject, html_content, text_content)

    def send_course_completion_email(
        self, user_email: str, user_name: str, course_title: str, course_slug: str
    ) -> bool:

        subject = f"🏆 Congratulations! You completed {course_title}"

        context = {
            "user_name": user_name,
            "course_title": course_title,
            "course_slug": course_slug,
        }

        html_content = self._render_template("completion.html", context)

        text_content = (
            f"Hi {user_name},\n\n"
            f"Congratulations on completing {course_title}!\n\n"
            "Your certificate is ready.\n\n"
            f"Download: {self.university_url}/university/analytics\n"
            f"Review course: {self.university_url}/university/courses/{course_slug}\n\n"
            "Keep learning!\nThe Zygotrix University Team"
        )

        return self._send_email(user_email, subject, html_content, text_content)

    def send_signup_otp_email(
        self, user_email: str, user_name: str, otp_code: str, minutes: int
    ) -> bool:
        """Send signup OTP email."""
        subject = "Your Zygotrix verification code"
        greeting = user_name or "there"

        context = {
            "name": greeting,
            "otp_code": otp_code,
            "minutes": minutes
        }

        html_content = self._render_template("signup_otp.html", context)

        text_content = (
            f"Hi {greeting},\n\n"
            f"Your Zygotrix verification code is {otp_code}.\n"
            f"This code expires in {minutes} minutes.\n\n"
            "If you didn't request this email, you can ignore it."
        )

        return self._send_email(user_email, subject, html_content, text_content)

    def send_new_user_registration_email(
        self, 
        super_admin_email: str, 
        user_email: str, 
        full_name: str, 
        user_role: str,
        timestamp: str,
        year: int,
        ip_address: str = "Unknown",
        location: str = "Unknown",
        user_phone: str = "Not provided"
    ) -> bool:
        """Send new user registration notification to super admin."""
        subject = f"🎉 New User Registration: {user_email}"
        name = full_name or "Not provided"

        context = {
            "user_name": name,
            "user_email": user_email,
            "user_phone": user_phone,
            "user_role": user_role,
            "timestamp": timestamp,
            "year": year,
            "admin_url": self.frontend_url,
            "ip_address": ip_address or "Unknown",
            "location": location or "Unknown"
        }

        html_content = self._render_template("new_user_registration.html", context)

        text_content = (
            f"New User Registration - Zygotrix\n\n"
            f"A new user has registered on Zygotrix:\n\n"
            f"Name: {name}\n"
            f"Email: {user_email}\n"
            f"Phone: {user_phone}\n"
            f"Role: {user_role}\n"
            f"Registered: {timestamp}\n"
            f"IP Address: {ip_address}\n"
            f"Location: {location}\n\n"
            f"View in Admin Panel: {self.frontend_url}/studio/admin/users\n\n"
            f"This is an automated notification from Zygotrix."
        )

        return self._send_email(super_admin_email, subject, html_content, text_content)

    def send_prompt_change_notification(
        self,
        admin_email: str,
        admin_name: str,
        admin_user_email: str,
        prompt_type: str,
        action: str,
        changes: list,
        timestamp: str,
        ip_address: str = None,
        admin_url: str = None
    ) -> bool:

        subject = f"System Prompt Changed: {prompt_type}"

        # Provide default admin URL if not specified
        if admin_url is None:
            admin_url = self.frontend_url

        context = {
            "admin_name": admin_name,
            "admin_email": admin_user_email,
            "prompt_type": prompt_type,
            "action": action,
            "changes": changes,
            "timestamp": timestamp,
            "ip_address": ip_address,
            "admin_url": admin_url,
        }

        html_content = self._render_template("prompt_change_notification.html", context)

        # Build text content
        changes_text = ""
        for change in changes:
            changes_text += f"\nField: {change['field_name']}\n"
            changes_text += f"  Before: {change.get('old_value', '(none)')}\n"
            changes_text += f"  After: {change.get('new_value', '(none)')}\n"

        text_content = (
            f"Hi Admin,\n\n"
            f"A system prompt has been modified.\n\n"
            f"Changed By: {admin_name} ({admin_user_email})\n"
            f"Prompt Type: {prompt_type}\n"
            f"Action: {action}\n"
            f"Timestamp: {timestamp}\n"
            f"{f'IP Address: {ip_address}' if ip_address else ''}\n\n"
            f"Changes:\n{changes_text}\n\n"
            "This is an automated notification to keep all administrators informed about system configuration changes.\n\n"
            "Zygotrix Admin Team"
        )

        return self._send_email(admin_email, subject, html_content, text_content)
