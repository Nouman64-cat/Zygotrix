"""Email service for sending transactional emails."""

from __future__ import annotations

import logging
from typing import Optional
from textwrap import dedent
import resend


logger = logging.getLogger(__name__)
from app.config import get_settings
settings = get_settings()
university_url = getattr(settings, "university_url", "https://zygotrix.university.courtcierge.online")


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

            logger.info(f"✓ Resend package imported successfully")
        except ImportError:
            logger.error("resend package not installed, cannot send email")
            return False

        resend.api_key = settings.resend_api_key
        logger.info(f"✓ Resend API key set")

        # Create email content
        html_content = dedent(f"""
            <!DOCTYPE html>
            <html>
            <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                * {{
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }}
                body {{
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                    line-height: 1.6;
                    color: #1f2937;
                    background: #f3f4f6;
                    padding: 20px;
                }}
                .email-container {{
                    max-width: 600px;
                    margin: 0 auto;
                    background: white;
                    border-radius: 16px;
                    overflow: hidden;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                }}
                .header {{
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    padding: 40px 30px;
                    text-align: center;
                    position: relative;
                    overflow: hidden;
                }}
                .header::before {{
                    content: '';
                    position: absolute;
                    top: -50%;
                    left: -50%;
                    width: 200%;
                    height: 200%;
                    background: radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px);
                    background-size: 30px 30px;
                    animation: drift 20s linear infinite;
                }}
                @keyframes drift {{
                    0% {{ transform: translate(0, 0); }}
                    100% {{ transform: translate(30px, 30px); }}
                }}
                .header-emoji {{
                    font-size: 64px;
                    margin-bottom: 10px;
                    display: block;
                    animation: bounce 2s ease-in-out infinite;
                }}
                @keyframes bounce {{
                    0%, 100% {{ transform: translateY(0); }}
                    50% {{ transform: translateY(-10px); }}
                }}
                .header h1 {{
                    color: white;
                    font-size: 28px;
                    font-weight: 700;
                    margin: 0;
                    position: relative;
                    z-index: 1;
                }}
                .content {{
                    padding: 40px 30px;
                }}
                .greeting {{
                    font-size: 18px;
                    color: #1f2937;
                    margin-bottom: 20px;
                }}
                .message {{
                    font-size: 16px;
                    color: #4b5563;
                    margin-bottom: 25px;
                }}
                .course-card {{
                    background: linear-gradient(135deg, #f0f4ff 0%, #e8eeff 100%);
                    border: 2px solid #667eea;
                    border-radius: 12px;
                    padding: 25px;
                    margin: 25px 0;
                    text-align: center;
                    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
                }}
                .course-card h2 {{
                    color: #667eea;
                    font-size: 24px;
                    font-weight: 700;
                    margin-bottom: 10px;
                    line-height: 1.3;
                }}
                .course-badge {{
                    display: inline-block;
                    background: rgba(102, 126, 234, 0.2);
                    color: #667eea;
                    padding: 6px 14px;
                    border-radius: 20px;
                    font-size: 13px;
                    font-weight: 600;
                    margin-top: 8px;
                }}
                .cta-button {{
                    display: inline-block;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 16px 40px;
                    text-decoration: none;
                    border-radius: 8px;
                    font-weight: 600;
                    font-size: 16px;
                    margin: 25px 0;
                    box-shadow: 0 4px 14px rgba(102, 126, 234, 0.4);
                    transition: all 0.3s ease;
                }}
                .cta-button:hover {{
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
                }}
                .features {{
                    background: #f9fafb;
                    border-radius: 12px;
                    padding: 25px;
                    margin: 25px 0;
                }}
                .features h3 {{
                    color: #1f2937;
                    font-size: 18px;
                    margin-bottom: 15px;
                    font-weight: 600;
                }}
                .feature-list {{
                    list-style: none;
                    padding: 0;
                }}
                .feature-list li {{
                    padding: 10px 0;
                    color: #4b5563;
                    font-size: 15px;
                    position: relative;
                    padding-left: 30px;
                }}
                .feature-list li::before {{
                    content: '✓';
                    position: absolute;
                    left: 0;
                    color: #10b981;
                    font-weight: bold;
                    font-size: 18px;
                    background: #d1fae5;
                    width: 22px;
                    height: 22px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    line-height: 22px;
                }}
                .stats {{
                    display: flex;
                    justify-content: space-around;
                    margin: 30px 0;
                    padding: 20px;
                    background: #f9fafb;
                    border-radius: 12px;
                }}
                .stat-item {{
                    text-align: center;
                }}
                .stat-value {{
                    font-size: 32px;
                    font-weight: 700;
                    color: #667eea;
                    display: block;
                }}
                .stat-label {{
                    font-size: 13px;
                    color: #6b7280;
                    margin-top: 5px;
                }}
                .divider {{
                    height: 1px;
                    background: linear-gradient(to right, transparent, #e5e7eb, transparent);
                    margin: 30px 0;
                }}
                .footer {{
                    background: #f9fafb;
                    padding: 30px;
                    text-align: center;
                    border-top: 1px solid #e5e7eb;
                }}
                .footer-text {{
                    color: #6b7280;
                    font-size: 14px;
                    margin: 5px 0;
                }}
                .social-links {{
                    margin-top: 20px;
                }}
                .social-links a {{
                    display: inline-block;
                    margin: 0 8px;
                    color: #9ca3af;
                    text-decoration: none;
                    font-size: 14px;
                }}
                .brand {{
                    font-weight: 700;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }}
            </style>
        </head>
        <body>
            <div class="email-container">
                <div class="header">
                    <span class="header-emoji">🎉</span>
                    <h1>Welcome to Your New Course!</h1>
                </div>
                
                <div class="content">
                    <p class="greeting">Hi <strong>{user_name}</strong>,</p>
                    
                    <p class="message">
                        Congratulations! 🎊 You've successfully enrolled in your new course. 
                        We're thrilled to have you join our learning community!
                    </p>
                    
                    <div class="course-card">
                        <h2>{course_title}</h2>
                        <span class="course-badge">📚 Full Access Granted</span>
                    </div>
                    
                    <div style="text-align: center;">
                        <a href="{university_url}/university/courses/{course_slug}" class="cta-button">
                            🚀 Start Learning Now
                        </a>
                    </div>
                    
                    <div class="stats">
                        <div class="stat-item">
                            <span class="stat-value">∞</span>
                            <span class="stat-label">Lifetime Access</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value">📖</span>
                            <span class="stat-label">Rich Content</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value">🏆</span>
                            <span class="stat-label">Certificate</span>
                        </div>
                    </div>
                    
                    <div class="features">
                        <h3>What You Get:</h3>
                        <ul class="feature-list">
                            <li>Explore comprehensive course modules and interactive lessons</li>
                            <li>Track your learning progress with detailed analytics</li>
                            <li>Complete hands-on assessments to test your knowledge</li>
                            <li>Earn a professional certificate upon course completion</li>
                            <li>Access to learning resources and study materials</li>
                        </ul>
                    </div>
                    
                    <div class="divider"></div>
                    
                    <p class="message" style="text-align: center;">
                        Ready to begin your learning journey? Your course is waiting for you!
                    </p>
                    
                    <p class="message" style="font-size: 14px; color: #6b7280; text-align: center;">
                        Need help? Our support team is always here to assist you.
                    </p>
                </div>
                
                <div class="footer">
                    <p class="footer-text">
                        Happy Learning! 📚<br>
                        <strong class="brand">The Zygotrix University Team</strong>
                    </p>
                    <div class="divider" style="margin: 20px 40px;"></div>
                    <p class="footer-text" style="font-size: 12px;">
                        This email was sent because you enrolled in a course on Zygotrix University.<br>
                        You're receiving this because you created an account with us.
                    </p>
                </div>
            </div>
        </body>
        </html>
        """).strip()

        # Plain-text fallback
        text_content = (
            f"Hi {user_name},\n\n"
            f"You're enrolled in {course_title}!\n\n"
            f"Start learning: http://localhost:5174/university/courses/{course_slug}\n\n"
            "What you get:\n"
            "- Full access to modules and lessons\n"
            "- Progress tracking\n"
            "- Assessments and certificate on completion\n\n"
            "Happy learning!\nThe Zygotrix University Team"
        )

        # Send email using Resend
        params = {
            "from": settings.resend_from_email,
            "to": [user_email],
            "subject": f"🎓 You're enrolled in {course_title}!",
            "html": html_content,
            "text": text_content,
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

        resend.api_key = settings.resend_api_key

        html_content = dedent(f"""
            <!DOCTYPE html>
            <html>
            <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                * {{
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }}
                body {{
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                    line-height: 1.6;
                    color: #1f2937;
                    background: #f3f4f6;
                    padding: 20px;
                }}
                .email-container {{
                    max-width: 600px;
                    margin: 0 auto;
                    background: white;
                    border-radius: 16px;
                    overflow: hidden;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                }}
                .header {{
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                    padding: 40px 30px;
                    text-align: center;
                    position: relative;
                    overflow: hidden;
                }}
                .header::before {{
                    content: '';
                    position: absolute;
                    top: -50%;
                    left: -50%;
                    width: 200%;
                    height: 200%;
                    background: radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px);
                    background-size: 30px 30px;
                }}
                .header-emoji {{
                    font-size: 72px;
                    margin-bottom: 10px;
                    display: block;
                    animation: celebrate 1s ease-in-out infinite;
                }}
                @keyframes celebrate {{
                    0%, 100% {{ transform: rotate(-5deg); }}
                    50% {{ transform: rotate(5deg); }}
                }}
                .header h1 {{
                    color: white;
                    font-size: 32px;
                    font-weight: 700;
                    margin: 0;
                    position: relative;
                    z-index: 1;
                }}
                .content {{
                    padding: 40px 30px;
                }}
                .greeting {{
                    font-size: 18px;
                    color: #1f2937;
                    margin-bottom: 20px;
                }}
                .message {{
                    font-size: 16px;
                    color: #4b5563;
                    margin-bottom: 25px;
                }}
                .certificate-card {{
                    background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
                    border: 3px solid #10b981;
                    border-radius: 12px;
                    padding: 30px;
                    margin: 30px 0;
                    text-align: center;
                    box-shadow: 0 4px 20px rgba(16, 185, 129, 0.2);
                    position: relative;
                }}
                .certificate-card::before {{
                    content: '🎖️';
                    position: absolute;
                    top: -20px;
                    right: -20px;
                    font-size: 50px;
                    opacity: 0.3;
                }}
                .certificate-card h2 {{
                    color: #10b981;
                    font-size: 26px;
                    font-weight: 700;
                    margin-bottom: 15px;
                    line-height: 1.3;
                }}
                .certificate-badge {{
                    display: inline-block;
                    background: rgba(16, 185, 129, 0.2);
                    color: #059669;
                    padding: 8px 16px;
                    border-radius: 20px;
                    font-size: 14px;
                    font-weight: 600;
                    margin-top: 10px;
                }}
                .achievement-stats {{
                    display: flex;
                    justify-content: space-around;
                    margin: 30px 0;
                    padding: 25px;
                    background: #f9fafb;
                    border-radius: 12px;
                }}
                .stat-item {{
                    text-align: center;
                }}
                .stat-icon {{
                    font-size: 36px;
                    margin-bottom: 8px;
                }}
                .stat-label {{
                    font-size: 13px;
                    color: #6b7280;
                    font-weight: 500;
                }}
                .button-group {{
                    text-align: center;
                    margin: 30px 0;
                }}
                .cta-button {{
                    display: inline-block;
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                    color: white;
                    padding: 16px 32px;
                    text-decoration: none;
                    border-radius: 8px;
                    font-weight: 600;
                    font-size: 16px;
                    margin: 8px;
                    box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4);
                    transition: all 0.3s ease;
                }}
                .cta-button.secondary {{
                    background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
                    box-shadow: 0 4px 14px rgba(107, 114, 128, 0.3);
                }}
                .next-steps {{
                    background: #f9fafb;
                    border-radius: 12px;
                    padding: 25px;
                    margin: 25px 0;
                }}
                .next-steps h3 {{
                    color: #1f2937;
                    font-size: 18px;
                    margin-bottom: 15px;
                    font-weight: 600;
                }}
                .step-list {{
                    list-style: none;
                    padding: 0;
                }}
                .step-list li {{
                    padding: 12px 0;
                    color: #4b5563;
                    font-size: 15px;
                    position: relative;
                    padding-left: 35px;
                }}
                .step-list li::before {{
                    content: '→';
                    position: absolute;
                    left: 0;
                    color: #10b981;
                    font-weight: bold;
                    font-size: 20px;
                    background: #d1fae5;
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }}
                .divider {{
                    height: 1px;
                    background: linear-gradient(to right, transparent, #e5e7eb, transparent);
                    margin: 30px 0;
                }}
                .footer {{
                    background: #f9fafb;
                    padding: 30px;
                    text-align: center;
                    border-top: 1px solid #e5e7eb;
                }}
                .footer-text {{
                    color: #6b7280;
                    font-size: 14px;
                    margin: 5px 0;
                }}
                .brand {{
                    font-weight: 700;
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }}
                .congrats-banner {{
                    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
                    padding: 15px;
                    text-align: center;
                    border-radius: 8px;
                    margin-bottom: 25px;
                    border: 2px solid #fbbf24;
                }}
                .congrats-banner strong {{
                    color: #92400e;
                    font-size: 16px;
                }}
            </style>
        </head>
        <body>
            <div class="email-container">
                <div class="header">
                    <span class="header-emoji">🏆</span>
                    <h1>Congratulations!</h1>
                </div>
                
                <div class="content">
                    <div class="congrats-banner">
                        <strong>🎊 Outstanding Achievement! You did it! 🎊</strong>
                    </div>
                    
                    <p class="greeting">Hi <strong>{user_name}</strong>,</p>
                    
                    <p class="message">
                        Amazing work! You've successfully completed your course and demonstrated 
                        dedication to your learning journey. We're incredibly proud of your achievement!
                    </p>
                    
                    <div class="certificate-card">
                        <h2>{course_title}</h2>
                        <div class="certificate-badge">✨ Certificate of Completion Earned ✨</div>
                    </div>
                    
                    <div class="achievement-stats">
                        <div class="stat-item">
                            <div class="stat-icon">📜</div>
                            <div class="stat-label">Certificate Ready</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-icon">⭐</div>
                            <div class="stat-label">Skills Mastered</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-icon">🎯</div>
                            <div class="stat-label">Goals Achieved</div>
                        </div>
                    </div>
                    
                    <div class="button-group">
                        <a href="http://localhost:5174/university/analytics" class="cta-button">
                            📥 Download Certificate
                        </a>
                        <a href="http://localhost:5174/university/courses/{course_slug}" class="cta-button secondary">
                            📖 Review Course
                        </a>
                    </div>
                    
                    <div class="next-steps">
                        <h3>🚀 What's Next?</h3>
                        <ul class="step-list">
                            <li>Explore more courses to expand your knowledge and skills</li>
                            <li>Share your achievement with your professional network</li>
                            <li>Apply what you've learned in real-world projects</li>
                            <li>Join our community to connect with fellow learners</li>
                            <li>Leave a review to help future students</li>
                        </ul>
                    </div>
                    
                    <div class="divider"></div>
                    
                    <p class="message" style="text-align: center;">
                        Your dedication and hard work have paid off. Keep up the excellent work!
                    </p>
                </div>
                
                <div class="footer">
                    <p class="footer-text">
                        Congratulations again on this achievement! 🌟<br>
                        <strong class="brand">The Zygotrix University Team</strong>
                    </p>
                    <div class="divider" style="margin: 20px 40px;"></div>
                    <p class="footer-text" style="font-size: 12px;">
                        This email was sent to celebrate your course completion on Zygotrix University.<br>
                        Continue your learning journey with us!
                    </p>
                </div>
            </div>
        </body>
        </html>
        """).strip()

        text_content = (
            f"Hi {user_name},\n\n"
            f"Congratulations on completing {course_title}!\n\n"
            "Your certificate is ready.\n\n"
            "Download: http://localhost:5174/university/analytics\n"
            f"Review course: http://localhost:5174/university/courses/{course_slug}\n\n"
            "Keep learning!\nThe Zygotrix University Team"
        )

        params = {
            "from": settings.resend_from_email,
            "to": [user_email],
            "subject": f"🎉 Congratulations! You completed {course_title}",
            "html": html_content,
            "text": text_content,
        }

        response = resend.Emails.send(params)
        logger.info(
            f"Completion email sent successfully to {user_email} for course {course_slug}"
        )

        return True

    except Exception as e:
        logger.error(f"Failed to send completion email: {str(e)}")
        return False
