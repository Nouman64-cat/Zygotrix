from __future__ import annotations

import logging
from pathlib import Path
from typing import TYPE_CHECKING
import resend
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

        if not settings.resend_api_key:
            logger.warning("RESEND_API_KEY not set. Email service is disabled.")
            self.client = None
        else:
            self.client = resend.Client(api_key=settings.resend_api_key)

    def _send_email(
        self, to: str, subject: str, html_body: str, text_body: str
    ) -> bool:

        if not self.client:
            logger.warning(
                f"Email service disabled. Skipping email to {to} (Subject: {subject})"
            )
            return False

        params = {
            "from": self.settings.resend_from_email,
            "to": [to],
            "subject": subject,
            "html": html_body,
            "text": text_body,
        }

        try:
            self.client.emails.send(params)
            logger.info(f"Email '{subject}' sent successfully to {to}.")
            return True
        except Exception as e:
            logger.error(f"Failed to send email to {to}: {e}", exc_info=True)
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
