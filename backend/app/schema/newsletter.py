from datetime import datetime
from typing import List, Literal
from pydantic import BaseModel, EmailStr


class NewsletterSubscribeRequest(BaseModel):
    """Request to subscribe to newsletter."""
    email: EmailStr


class NewsletterSubscribeResponse(BaseModel):
    """Response after newsletter subscription."""
    message: str
    email: str
    subscribed_at: datetime


class SendNewsletterRequest(BaseModel):
    """Request to send newsletter to subscribers."""
    recipient_emails: List[EmailStr]
    template_type: Literal["changelog", "release", "news", "update"]
    subject: str
    content: str


class SendNewsletterResponse(BaseModel):
    """Response after sending newsletter."""
    total: int
    success: int
    failed: int
    failed_emails: List[dict]
