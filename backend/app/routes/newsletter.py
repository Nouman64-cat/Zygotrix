from fastapi import APIRouter, Depends
from datetime import datetime

from ..schema.newsletter import (
    NewsletterSubscribeRequest,
    NewsletterSubscribeResponse,
    SendNewsletterRequest,
    SendNewsletterResponse,
)
from ..services import newsletter as newsletter_service
from ..dependencies import get_current_admin
from ..schema.auth import UserProfile

router = APIRouter(prefix="/api/newsletter", tags=["Newsletter"])


@router.post("/subscribe", response_model=NewsletterSubscribeResponse, status_code=201)
def subscribe_to_newsletter(payload: NewsletterSubscribeRequest) -> NewsletterSubscribeResponse:
    """
    Subscribe to the newsletter.

    This endpoint allows users to subscribe to the newsletter by providing their email.
    The email is stored in the database and marked as active.
    """
    subscription = newsletter_service.subscribe_to_newsletter(email=payload.email)

    return NewsletterSubscribeResponse(
        message="Successfully subscribed to the newsletter!",
        email=subscription["email"],
        subscribed_at=subscription["subscribed_at"]
    )


@router.get("/subscriptions")
def get_all_subscriptions(
    current_user: UserProfile = Depends(get_current_admin)
):
    """
    Get all newsletter subscriptions (Admin only).

    This endpoint is restricted to admin users only.
    """
    subscriptions = newsletter_service.get_all_subscriptions()
    return {
        "count": len(subscriptions),
        "subscriptions": subscriptions
    }


@router.get("/recipients")
def get_all_recipients(
    current_user: UserProfile = Depends(get_current_admin)
):
    """
    Get all potential email recipients including newsletter subscribers and system users (Admin only).

    This endpoint returns both newsletter subscribers and system users, classified separately.
    """
    recipients = newsletter_service.get_all_recipients()
    return {
        "newsletter_subscribers": recipients["newsletter_subscribers"],
        "system_users": recipients["system_users"],
        "total_newsletter_subscribers": len(recipients["newsletter_subscribers"]),
        "total_system_users": len(recipients["system_users"]),
        "total": len(recipients["newsletter_subscribers"]) + len(recipients["system_users"])
    }




@router.get("/unsubscribe/{email}")
def unsubscribe_from_newsletter_public(email: str):
    """
    Unsubscribe an email from the newsletter (Public endpoint for email links).

    This endpoint is public and can be accessed by anyone clicking the unsubscribe
    link in a newsletter email. Returns an HTML page confirming unsubscription.
    """
    from fastapi.responses import HTMLResponse

    try:
        newsletter_service.unsubscribe_from_newsletter(email=email)
        html_content = """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Unsubscribed - Zygotrix</title>
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0;
                    padding: 20px;
                }
                .container {
                    background: white;
                    padding: 40px;
                    border-radius: 16px;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                    max-width: 500px;
                    text-align: center;
                }
                h1 {
                    color: #10B981;
                    font-size: 32px;
                    margin-bottom: 16px;
                }
                p {
                    color: #6B7280;
                    font-size: 16px;
                    line-height: 1.6;
                    margin-bottom: 24px;
                }
                .email {
                    background: #F3F4F6;
                    padding: 12px 20px;
                    border-radius: 8px;
                    color: #374151;
                    font-weight: 600;
                    margin: 20px 0;
                }
                a {
                    display: inline-block;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 12px 32px;
                    border-radius: 8px;
                    text-decoration: none;
                    font-weight: 600;
                    transition: transform 0.2s;
                }
                a:hover {
                    transform: translateY(-2px);
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>✓ Successfully Unsubscribed</h1>
                <p>You've been unsubscribed from the Zygotrix newsletter.</p>
                <div class="email">""" + email + """</div>
                <p>We're sorry to see you go! If you change your mind, you can always subscribe again from our website.</p>
                <a href="https://zygotrix.com">Visit Zygotrix</a>
            </div>
        </body>
        </html>
        """
        return HTMLResponse(content=html_content)
    except Exception as e:
        error_html = """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Error - Zygotrix</title>
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0;
                    padding: 20px;
                }
                .container {
                    background: white;
                    padding: 40px;
                    border-radius: 16px;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                    max-width: 500px;
                    text-align: center;
                }
                h1 {
                    color: #EF4444;
                    font-size: 32px;
                    margin-bottom: 16px;
                }
                p {
                    color: #6B7280;
                    font-size: 16px;
                    line-height: 1.6;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>⚠ Error</h1>
                <p>""" + str(e) + """</p>
            </div>
        </body>
        </html>
        """
        return HTMLResponse(content=error_html, status_code=404)


@router.delete("/unsubscribe/{email}")
def unsubscribe_from_newsletter_admin(
    email: str,
    current_user: UserProfile = Depends(get_current_admin)
):
    """
    Unsubscribe an email from the newsletter (Admin only - for dashboard use).

    This endpoint is restricted to admin users only.
    """
    newsletter_service.unsubscribe_from_newsletter(email=email)
    return {"message": f"Successfully unsubscribed {email} from the newsletter."}


@router.post("/send", response_model=SendNewsletterResponse)
def send_newsletter(
    payload: SendNewsletterRequest,
    current_user: UserProfile = Depends(get_current_admin)
) -> SendNewsletterResponse:
    """
    Send newsletter to selected subscribers (Admin only).

    This endpoint allows admins to send customized newsletter emails
    using predefined templates (changelog, release, news, update).
    """
    result = newsletter_service.send_newsletter_email(
        recipient_emails=payload.recipient_emails,
        template_type=payload.template_type,
        subject=payload.subject,
        content=payload.content
    )

    return SendNewsletterResponse(**result)
