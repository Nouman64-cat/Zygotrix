from datetime import datetime
from pydantic import BaseModel, EmailStr


class NewsletterSubscribeRequest(BaseModel):
    """Request to subscribe to newsletter."""
    email: EmailStr


class NewsletterSubscribeResponse(BaseModel):
    """Response after newsletter subscription."""
    message: str
    email: str
    subscribed_at: datetime
