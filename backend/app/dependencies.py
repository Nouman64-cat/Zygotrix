from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from .schema.auth import UserProfile
from .services import auth as auth_services
from .services import admin as admin_services

bearer_scheme = HTTPBearer(auto_error=True)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> UserProfile:
    user = auth_services.resolve_user_from_token(credentials.credentials)

    # Check if user is active
    if not user.get("is_active", True):
        raise HTTPException(
            status_code=401,
            detail="Your account has been deactivated. Please contact support."
        )

    return UserProfile(**user)


def get_current_admin(
    current_user: UserProfile = Depends(get_current_user),
) -> UserProfile:
    """Dependency that requires the user to be an admin or super admin."""
    if not admin_services.is_admin_or_super_admin(current_user.id):
        raise HTTPException(
            status_code=403,
            detail="Admin privileges required."
        )
    return current_user


def get_current_super_admin(
    current_user: UserProfile = Depends(get_current_user),
) -> UserProfile:
    """Dependency that requires the user to be a super admin."""
    if not admin_services.is_super_admin(current_user.id):
        raise HTTPException(
            status_code=403,
            detail="Super admin privileges required."
        )
    return current_user
