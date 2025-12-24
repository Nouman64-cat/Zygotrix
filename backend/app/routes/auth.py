from fastapi import APIRouter, Depends, HTTPException, Request
from datetime import datetime, timezone

from ..dependencies import get_current_user
from ..infrastructure.http.client_info import ClientInfoExtractor
from ..schema.auth import (
    AuthResponse,
    SignupInitiateRequest,
    SignupInitiateResponse,
    SignupVerifyRequest,
    SignupResendRequest,
    MessageResponse,
    UserLoginRequest,
    UserProfile,
    UpdateProfileRequest,
    OnboardingRequest,
)
from ..services.auth.signup_service import get_signup_service
from ..services.auth.authentication_service import get_authentication_service
from ..services.auth.user_service import get_user_service
from ..config import get_settings

router = APIRouter(prefix="/api/auth", tags=["Auth"])


@router.post("/signup", response_model=SignupInitiateResponse, status_code=202)
def signup(payload: SignupInitiateRequest) -> SignupInitiateResponse:
    signup_service = get_signup_service()
    settings = get_settings()

    expires_at = signup_service.request_signup_otp(
        email=payload.email,
        password=payload.password.get_secret_value(),
        full_name=payload.full_name,
    )

    message = (
        "Account created directly (development mode). You can now sign in."
        if settings.is_development
        else "An OTP has been sent to your email address. Please verify within the next 10 minutes."
    )
    return SignupInitiateResponse(message=message, expires_at=expires_at)


@router.post("/signup/verify", response_model=MessageResponse)
def verify_signup(payload: SignupVerifyRequest) -> MessageResponse:
    signup_service = get_signup_service()
    signup_service.verify_signup_otp(email=payload.email, otp=payload.otp)
    return MessageResponse(message="Account created successfully. You can now sign in.")


@router.post("/signup/resend", response_model=SignupInitiateResponse)
def resend_signup_otp(payload: SignupResendRequest) -> SignupInitiateResponse:
    signup_service = get_signup_service()
    expires_at = signup_service.resend_signup_otp(email=payload.email)
    return SignupInitiateResponse(
        message="A new OTP has been sent to your email address.",
        expires_at=expires_at,
    )


@router.post("/login", response_model=AuthResponse)
def login(payload: UserLoginRequest, request: Request) -> AuthResponse:
    auth_service = get_authentication_service()

    # Extract client information
    ip_address = ClientInfoExtractor.get_ip_address(request)
    user_agent = request.headers.get("User-Agent")

    # Authenticate and track activity
    auth_response = auth_service.authenticate_and_track(
        email=payload.email,
        password=payload.password.get_secret_value(),
        ip_address=ip_address,
        user_agent=user_agent
    )

    return AuthResponse(**auth_response)


@router.get("/me", response_model=UserProfile)
def read_current_user(
    current_user: UserProfile = Depends(get_current_user),
) -> UserProfile:
    return current_user


@router.patch("/profile", response_model=UserProfile)
def update_profile(
    payload: UpdateProfileRequest,
    current_user: UserProfile = Depends(get_current_user),
) -> UserProfile:
    """Update the current user's profile information."""
    user_service = get_user_service()
    updates = payload.model_dump(exclude_unset=True)
    updated_user = user_service.update_user_profile(current_user.id, updates)
    return UserProfile(**updated_user)


@router.post("/onboarding", response_model=UserProfile)
def complete_onboarding(
    payload: OnboardingRequest,
    current_user: UserProfile = Depends(get_current_user),
) -> UserProfile:
    """Complete user onboarding and save preferences."""
    user_service = get_user_service()
    updates = payload.model_dump(exclude_unset=True)
    updated_user = user_service.update_user_profile(current_user.id, updates)
    return UserProfile(**updated_user)
