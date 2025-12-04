from datetime import datetime
from enum import Enum
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field, SecretStr, field_validator


class UserRole(str, Enum):
    """User role enumeration."""
    USER = "user"
    ADMIN = "admin"
    SUPER_ADMIN = "super_admin"


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
    # Admin-related fields
    user_role: Optional[str] = UserRole.USER.value
    is_active: Optional[bool] = True
    deactivated_at: Optional[str] = None
    deactivated_by: Optional[str] = None
    # Activity tracking fields
    last_accessed_at: Optional[str] = None
    last_ip_address: Optional[str] = None
    last_location: Optional[str] = None
    last_browser: Optional[str] = None


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


# Admin-specific schemas
class AdminUserListItem(BaseModel):
    """Condensed user info for admin listing."""

    id: str
    email: EmailStr
    full_name: Optional[str] = None
    user_role: str = UserRole.USER.value
    is_active: bool = True
    created_at: str
    organization: Optional[str] = None
    onboarding_completed: Optional[bool] = False
    university_onboarding_completed: Optional[bool] = False
    deactivated_at: Optional[str] = None
    # Activity tracking fields
    last_accessed_at: Optional[str] = None
    last_ip_address: Optional[str] = None
    last_location: Optional[str] = None
    last_browser: Optional[str] = None


class AdminUserListResponse(BaseModel):
    """Response containing list of users for admin."""

    users: List[AdminUserListItem]
    total: int
    page: int
    page_size: int
    total_pages: int


class AdminUserActionRequest(BaseModel):
    """Request to perform action on a user."""

    user_id: str
    reason: Optional[str] = None


class AdminUserActionResponse(BaseModel):
    """Response after performing admin action on user."""

    message: str
    user: UserProfile


class AdminUpdateUserRoleRequest(BaseModel):
    """Request to update user role."""

    user_id: str
    new_role: UserRole
