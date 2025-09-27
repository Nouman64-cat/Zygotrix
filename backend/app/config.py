"""Application configuration helpers."""

from __future__ import annotations

import os
from dataclasses import dataclass
from functools import lru_cache

from dotenv import load_dotenv

load_dotenv()


def _get_int(name: str, default: int) -> int:
    value = os.getenv(name)
    if value is None:
        return default
    try:
        return int(value)
    except ValueError:
        return default


@dataclass(frozen=True)
class Settings:
    mongodb_uri: str = os.getenv("MONGODB_URI", "")
    mongodb_db_name: str = os.getenv("MONGODB_DB_NAME", "zygotrix")
    mongodb_traits_collection: str = os.getenv("MONGODB_TRAITS_COLLECTION", "traits")
    mongodb_users_collection: str = os.getenv("MONGODB_USERS_COLLECTION", "users")
    mongodb_pending_signups_collection: str = os.getenv("MONGODB_PENDING_SIGNUPS_COLLECTION", "pending_signups")
    mongodb_project_lines_collection: str = os.getenv(
        "MONGODB_PROJECT_LINES_COLLECTION", "project_lines"
    )
    auth_secret_key: str = os.getenv("AUTH_SECRET_KEY", "change-me-in-prod")
    auth_token_ttl_minutes: int = _get_int("AUTH_TOKEN_TTL_MINUTES", 60)
    auth_jwt_algorithm: str = os.getenv("AUTH_JWT_ALGORITHM", "HS256")
    resend_api_key: str = os.getenv("RESEND_API_KEY", "")
    resend_from_email: str = os.getenv("RESEND_FROM_EMAIL", "onboarding@resend.dev")
    signup_otp_ttl_minutes: int = _get_int("SIGNUP_OTP_TTL_MINUTES", 10)


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return cached application settings."""

    return Settings()
