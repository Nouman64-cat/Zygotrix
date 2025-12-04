from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, SecretStr, field_validator


class UserProfile(BaseModel):
    """Authenticated user profile surfaced to clients."""

    id: str
    email: EmailStr
    full_name: Optional[str] = None
    profile_picture_url: Optional[str] = None
    profile_picture_thumbnail_url: Optional[str] = None
    phone: Optional[str] = None
    organization: Optional[str] = None
    department: Optional[str] = None
    title: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    timezone: Optional[str] = None
    research_interests: Optional[list[str]] = None
    experience_level: Optional[str] = None
    use_case: Optional[str] = None
    organism_focus: Optional[list[str]] = None
    onboarding_completed: Optional[bool] = False
    # University-specific onboarding fields
    learning_goals: Optional[list[str]] = None
    learning_style: Optional[str] = None
    topics_of_interest: Optional[list[str]] = None
    time_commitment: Optional[str] = None
    institution: Optional[str] = None
    role: Optional[str] = None
    field_of_study: Optional[str] = None
    university_onboarding_completed: Optional[bool] = False
    preferences: Optional[dict] = None
    created_at: str


class UpdateProfileRequest(BaseModel):
    """Payload for updating user profile information."""

    full_name: Optional[str] = None
    profile_picture_url: Optional[str] = None
    profile_picture_thumbnail_url: Optional[str] = None
    phone: Optional[str] = None
    organization: Optional[str] = None
    department: Optional[str] = None
    title: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    timezone: Optional[str] = None
    preferences: Optional[dict] = None


class OnboardingRequest(BaseModel):
    """Payload for completing user onboarding."""

    research_interests: Optional[list[str]] = None
    experience_level: Optional[str] = None
    use_case: Optional[str] = None
    organism_focus: Optional[list[str]] = None
    organization: Optional[str] = None
    title: Optional[str] = None
    department: Optional[str] = None
    onboarding_completed: bool = True


class UniversityOnboardingRequest(BaseModel):
    """Payload for completing Zygotrix University user onboarding."""

    learning_goals: Optional[list[str]] = None
    experience_level: Optional[str] = None
    learning_style: Optional[str] = None
    topics_of_interest: Optional[list[str]] = None
    time_commitment: Optional[str] = None
    institution: Optional[str] = None
    role: Optional[str] = None
    field_of_study: Optional[str] = None
    university_onboarding_completed: bool = True


class SignupInitiateRequest(BaseModel):
    """Payload required to start the signup process."""

    email: EmailStr
    password: SecretStr
    full_name: Optional[str] = Field(
        default=None, description="Optional display name.")

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
