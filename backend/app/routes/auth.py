from fastapi import APIRouter, Depends, HTTPException, Request
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


def _get_client_ip(request: Request) -> str:
    """Extract client IP from request, handling proxies."""
    # Check for forwarded headers (when behind proxy/load balancer)
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        # Get the first IP in the chain (original client)
        return forwarded_for.split(",")[0].strip()

    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip.strip()

    # Fall back to direct client IP
    return request.client.host if request.client else "Unknown"


@router.post("/login", response_model=AuthResponse)
def login(payload: UserLoginRequest, request: Request) -> AuthResponse:
    user = services.authenticate_user(
        email=payload.email,
        password=payload.password.get_secret_value(),
    )

    # Update user activity with IP and browser info
    ip_address = _get_client_ip(request)
    user_agent = request.headers.get("User-Agent")
    services.update_user_activity(
        user_id=user["id"],
        ip_address=ip_address,
        user_agent=user_agent
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
