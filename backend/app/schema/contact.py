from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr


class ContactFormRequest(BaseModel):
    """Request to submit contact form."""
    name: Optional[str] = None
    email: EmailStr
    phone: Optional[str] = None
    message: str


class ContactFormResponse(BaseModel):
    """Response after contact form submission."""
    message: str
    id: str
    submitted_at: datetime


class ContactSubmission(BaseModel):
    """Contact form submission data."""
    id: str
    name: Optional[str]
    email: str
    phone: Optional[str]
    message: str
    submitted_at: datetime
    is_read: bool = False
