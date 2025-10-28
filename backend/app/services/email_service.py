"""Email service for sending transactional emails."""

from __future__ import annotations

import logging
from typing import Optional

logger = logging.getLogger(__name__)


def send_enrollment_email(
    user_email: str,
    user_name: str,
    course_title: str,
    course_slug: str,
) -> bool:
    """
    Send enrollment confirmation email to user.

    Args:
        user_email: User's email address
        user_name: User's name
        course_title: Title of the enrolled course
        course_slug: Slug of the enrolled course

    Returns:
        bool: True if email sent successfully, False otherwise
    """
    try:
        from app.config import get_settings

        settings = get_settings()

        logger.info(f"🔧 Starting email send process for {user_email}")

        # Check if Resend API key is configured
        if not settings.resend_api_key or settings.resend_api_key == "":
            logger.warning("Resend API key not configured, skipping email send")
            return False

        logger.info(f"✓ Resend API key is configured")

        try:
            import resend

            logger.info(f"✓ Resend package imported successfully")
        except ImportError:
            logger.error("resend package not installed, cannot send email")
            return False

        resend.api_key = settings.resend_api_key
        logger.info(f"✓ Resend API key set")

        # Create email content
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }}
                .header {{
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 30px;
                    border-radius: 10px 10px 0 0;
                    text-align: center;
                }}
                .content {{
                    background: #f9fafb;
                    padding: 30px;
                    border-radius: 0 0 10px 10px;
                }}
                .course-info {{
                    background: white;
                    padding: 20px;
                    border-radius: 8px;
                    margin: 20px 0;
                    border-left: 4px solid #667eea;
                }}
                .button {{
                    display: inline-block;
                    background: #667eea;
                    color: white;
                    padding: 12px 24px;
                    text-decoration: none;
                    border-radius: 6px;
                    margin: 20px 0;
                }}
                .footer {{
                    text-align: center;
                    margin-top: 30px;
                    color: #6b7280;
                    font-size: 14px;
                }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🎉 Welcome to Your New Course!</h1>
            </div>
            <div class="content">
                <p>Hi {user_name},</p>
                <p>Congratulations! You've successfully enrolled in:</p>
                
                <div class="course-info">
                    <h2 style="margin-top: 0; color: #667eea;">{course_title}</h2>
                    <p>You now have full access to all course materials, modules, and assessments.</p>
                </div>
                
                <p>Ready to start learning? Click the button below to access your course workspace:</p>
                
                <a href="http://localhost:5173/university/courses/{course_slug}" class="button">
                    Start Learning
                </a>
                
                <p><strong>What's next?</strong></p>
                <ul>
                    <li>Explore the course modules and lessons</li>
                    <li>Track your progress on your dashboard</li>
                    <li>Complete assessments to test your knowledge</li>
                    <li>Earn your certificate upon completion</li>
                </ul>
                
                <p>If you have any questions, feel free to reach out to our support team.</p>
                
                <p>Happy learning!</p>
                <p><strong>The Zygotrix University Team</strong></p>
                
                <div class="footer">
                    <p>This email was sent because you enrolled in a course on Zygotrix University.</p>
                </div>
            </div>
        </body>
        </html>
        """

        # Send email using Resend
        params = {
            "from": settings.resend_from_email,
            "to": [user_email],
            "subject": f"🎓 You're enrolled in {course_title}!",
            "html": html_content,
        }

        logger.info(
            f"📧 Sending email with params: from={settings.resend_from_email}, to={user_email}"
        )

        response = resend.Emails.send(params)
        logger.info(
            f"✅ Enrollment email sent successfully to {user_email} for course {course_slug}"
        )
        logger.info(f"Resend response: {response}")

        return True

    except Exception as e:
        logger.error(f"❌ Failed to send enrollment email: {str(e)}")
        logger.exception(e)
        return False


def send_course_completion_email(
    user_email: str,
    user_name: str,
    course_title: str,
    course_slug: str,
) -> bool:
    """
    Send course completion email to user.

    Args:
        user_email: User's email address
        user_name: User's name
        course_title: Title of the completed course
        course_slug: Slug of the completed course

    Returns:
        bool: True if email sent successfully, False otherwise
    """
    try:
        from app.config import get_settings

        settings = get_settings()

        if not settings.resend_api_key or settings.resend_api_key == "":
            logger.warning("Resend API key not configured, skipping email send")
            return False

        try:
            import resend
        except ImportError:
            logger.error("resend package not installed, cannot send email")
            return False

        resend.api_key = settings.resend_api_key

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }}
                .header {{
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                    color: white;
                    padding: 30px;
                    border-radius: 10px 10px 0 0;
                    text-align: center;
                }}
                .content {{
                    background: #f9fafb;
                    padding: 30px;
                    border-radius: 0 0 10px 10px;
                }}
                .certificate {{
                    background: white;
                    padding: 30px;
                    border-radius: 8px;
                    margin: 20px 0;
                    border: 2px solid #10b981;
                    text-align: center;
                }}
                .button {{
                    display: inline-block;
                    background: #10b981;
                    color: white;
                    padding: 12px 24px;
                    text-decoration: none;
                    border-radius: 6px;
                    margin: 10px 5px;
                }}
                .footer {{
                    text-align: center;
                    margin-top: 30px;
                    color: #6b7280;
                    font-size: 14px;
                }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🏆 Congratulations!</h1>
            </div>
            <div class="content">
                <p>Hi {user_name},</p>
                <p>Amazing work! You've successfully completed:</p>
                
                <div class="certificate">
                    <h2 style="margin-top: 0; color: #10b981;">{course_title}</h2>
                    <p>🎖️ Your certificate is ready!</p>
                </div>
                
                <p>You've shown dedication and commitment to your learning journey. Your certificate of completion is now available.</p>
                
                <div style="text-align: center;">
                    <a href="http://localhost:5173/university/analytics" class="button">
                        Download Certificate
                    </a>
                    <a href="http://localhost:5173/university/courses/{course_slug}" class="button" style="background: #6b7280;">
                        Review Course
                    </a>
                </div>
                
                <p><strong>What's next?</strong></p>
                <ul>
                    <li>Explore more courses to expand your knowledge</li>
                    <li>Share your achievement with your network</li>
                    <li>Apply what you've learned in real projects</li>
                </ul>
                
                <p>Keep up the excellent work!</p>
                <p><strong>The Zygotrix University Team</strong></p>
                
                <div class="footer">
                    <p>This email was sent to celebrate your course completion on Zygotrix University.</p>
                </div>
            </div>
        </body>
        </html>
        """

        params = {
            "from": settings.resend_from_email,
            "to": [user_email],
            "subject": f"🎉 Congratulations! You completed {course_title}",
            "html": html_content,
        }

        response = resend.Emails.send(params)
        logger.info(
            f"Completion email sent successfully to {user_email} for course {course_slug}"
        )

        return True

    except Exception as e:
        logger.error(f"Failed to send completion email: {str(e)}")
        return False
