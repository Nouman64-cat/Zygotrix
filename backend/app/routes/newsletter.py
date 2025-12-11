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


@router.delete("/unsubscribe/{email}")
def unsubscribe_from_newsletter(
    email: str,
    current_user: UserProfile = Depends(get_current_admin)
):
    """
    Unsubscribe an email from the newsletter (Admin only).

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
