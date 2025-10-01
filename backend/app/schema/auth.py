from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, SecretStr, field_validator


class UserProfile(BaseModel):
    """Authenticated user profile surfaced to clients."""

    id: str
    email: EmailStr
    full_name: Optional[str] = None
    created_at: str


class SignupInitiateRequest(BaseModel):
    """Payload required to start the signup process."""

    email: EmailStr
    password: SecretStr
    full_name: Optional[str] = Field(default=None, description="Optional display name.")

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: SecretStr) -> SecretStr:
        password = value.get_secret_value()
        if len(password) < 8:
            raise ValueError("Password must be at least 8 characters long.")
        return value


class SignupInitiateResponse(BaseModel):
    """Response returned after requesting an OTP."""

    message: str
    expires_at: datetime


class SignupVerifyRequest(BaseModel):
    """Payload required to finalise account creation."""

    email: EmailStr
    otp: str = Field(min_length=6, max_length=6)


class SignupResendRequest(BaseModel):
    """Payload to resend a signup OTP."""

    email: EmailStr


class MessageResponse(BaseModel):
    """Simple acknowledgement payload."""

    message: str


class UserLoginRequest(BaseModel):
    """Payload required to authenticate an existing account."""

    email: EmailStr
    password: SecretStr


class AuthResponse(BaseModel):
    """Response returned after successful authentication."""

    access_token: str
    token_type: str = "bearer"
    user: UserProfile
