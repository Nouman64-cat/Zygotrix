from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone

from ..dependencies import get_current_user

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
from ..services import auth as services

router = APIRouter(prefix="/api/auth", tags=["Auth"])


@router.post("/signup", response_model=SignupInitiateResponse, status_code=202)
def signup(payload: SignupInitiateRequest) -> SignupInitiateResponse:
    expires_at = services.request_signup_otp(
        email=payload.email,
        password=payload.password.get_secret_value(),
        full_name=payload.full_name,
    )
    message = (
        "Account created directly (development mode). You can now sign in."
        if services.get_settings().is_development
        else "An OTP has been sent to your email address. Please verify within the next 10 minutes."
    )
    return SignupInitiateResponse(message=message, expires_at=expires_at)


@router.post("/signup/verify", response_model=MessageResponse)
def verify_signup(payload: SignupVerifyRequest) -> MessageResponse:
    services.verify_signup_otp(email=payload.email, otp=payload.otp)
    return MessageResponse(message="Account created successfully. You can now sign in.")


@router.post("/signup/resend", response_model=SignupInitiateResponse)
def resend_signup_otp(payload: SignupResendRequest) -> SignupInitiateResponse:
    expires_at = services.resend_signup_otp(email=payload.email)
    return SignupInitiateResponse(
        message="A new OTP has been sent to your email address.",
        expires_at=expires_at,
    )


@router.post("/login", response_model=AuthResponse)
def login(payload: UserLoginRequest) -> AuthResponse:
    user = services.authenticate_user(
        email=payload.email,
        password=payload.password.get_secret_value(),
    )
    return AuthResponse(**services.build_auth_response(user))


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
    updates = payload.model_dump(exclude_unset=True)
    updated_user = services.update_user_profile(current_user.id, updates)
    return UserProfile(**updated_user)


@router.post("/onboarding", response_model=UserProfile)
def complete_onboarding(
    payload: OnboardingRequest,
    current_user: UserProfile = Depends(get_current_user),
) -> UserProfile:
    """Complete user onboarding and save preferences."""
    updates = payload.model_dump(exclude_unset=True)
    updated_user = services.update_user_profile(current_user.id, updates)
    return UserProfile(**updated_user)
