from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from .schema.auth import UserProfile
from .services import auth as auth_services

bearer_scheme = HTTPBearer(auto_error=True)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> UserProfile:
    user = auth_services.resolve_user_from_token(credentials.credentials)
    return UserProfile(**user)
