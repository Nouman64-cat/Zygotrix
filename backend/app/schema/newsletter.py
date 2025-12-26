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
    template_type: Literal["changelog", "release", "news", "update", "marketing"]
    subject: str
    content: str


class SendNewsletterResponse(BaseModel):
    """Response after sending newsletter."""
    total: int
    success: int
    failed: int
    failed_emails: List[dict]


class GenerateTemplateRequest(BaseModel):
    """Request to generate email template with AI."""
    description: str
    template_type: str = "custom"


class GenerateTemplateResponse(BaseModel):
    """Response with AI-generated template."""
    html: str
    description: str
    template_type: str
    generated_at: str
    token_usage: dict


class SaveTemplateRequest(BaseModel):
    """Request to save custom email template."""
    name: str
    html: str
    description: str
    template_type: str
    thumbnail_url: str | None = None


class TemplateResponse(BaseModel):
    """Response with template information."""
    _id: str
    name: str
    html: str
    description: str
    template_type: str
    created_by: str
    thumbnail_url: str | None
    created_at: datetime
    updated_at: datetime
    is_active: bool
    usage_count: int
