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


def _get_bool(name: str, default: bool) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


@dataclass(frozen=True)
class Settings:
    university_url: str = os.getenv(
        "UNIVERSITY_URL", "https://zygotrix.university.courtcierge.online"
    )
    backend_env: str = os.getenv("BACKEND_ENV", "Production")
    mongodb_uri: str = os.getenv("MONGODB_URI", "")
    mongodb_db_name: str = os.getenv("MONGODB_DB_NAME", "zygotrix")
    mongodb_traits_collection: str = os.getenv(
        "MONGODB_TRAITS_COLLECTION", "traits")
    mongodb_users_collection: str = os.getenv(
        "MONGODB_USERS_COLLECTION", "users")
    mongodb_pending_signups_collection: str = os.getenv(
        "MONGODB_PENDING_SIGNUPS_COLLECTION", "pending_signups"
    )
    mongodb_project_lines_collection: str = os.getenv(
        "MONGODB_PROJECT_LINES_COLLECTION", "project_lines"
    )
    mongodb_project_notes_collection: str = os.getenv(
        "MONGODB_PROJECT_NOTES_COLLECTION", "project_notes"
    )
    mongodb_project_drawings_collection: str = os.getenv(
        "MONGODB_PROJECT_DRAWINGS_COLLECTION", "project_drawings"
    )
    mongodb_project_lines_collection: str = os.getenv(
        "MONGODB_PROJECT_LINES_COLLECTION", "project_lines"
    )
    mongodb_questions_collection: str = os.getenv(
        "MONGODB_QUESTIONS_COLLECTION", "questions"
    )
    mongodb_answers_collection: str = os.getenv(
        "MONGODB_ANSWERS_COLLECTION", "answers")
    mongodb_comments_collection: str = os.getenv(
        "MONGODB_COMMENTS_COLLECTION", "comments"
    )
    mongodb_courses_collection: str = os.getenv(
        "MONGODB_COURSES_COLLECTION", "university_courses"
    )
    mongodb_practice_sets_collection: str = os.getenv(
        "MONGODB_PRACTICE_SETS_COLLECTION", "university_practice_sets"
    )
    mongodb_course_progress_collection: str = os.getenv(
        "MONGODB_COURSE_PROGRESS_COLLECTION", "university_course_progress"
    )
    mongodb_enrollments_collection: str = os.getenv(
        "MONGODB_ENROLLMENTS_COLLECTION", "university_enrollments"
    )
    hygraph_endpoint: str = os.getenv("HYGRAPH_ENDPOINT", "")
    hygraph_token: str = os.getenv("HYGRAPH_TOKEN", "")
    redis_url: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    redis_cache_ttl_seconds: int = _get_int("REDIS_CACHE_TTL_SECONDS", 300)
    auth_secret_key: str = os.getenv("AUTH_SECRET_KEY", "change-me-in-prod")
    auth_token_ttl_minutes: int = _get_int("AUTH_TOKEN_TTL_MINUTES", 60)
    auth_jwt_algorithm: str = os.getenv("AUTH_JWT_ALGORITHM", "HS256")
    resend_api_key: str = os.getenv("RESEND_API_KEY", "")
    resend_from_email: str = os.getenv(
        "RESEND_FROM_EMAIL", "onboarding@resend.dev")
    signup_otp_ttl_minutes: int = _get_int("SIGNUP_OTP_TTL_MINUTES", 10)
    # Trait source control: when true, serve traits from JSON only and disable trait CRUD
    traits_json_only: bool = _get_bool("TRAITS_JSON_ONLY", False)
    # Migration flag: when true, use C++ engine for Mendelian calculations
    use_cpp_engine: bool = _get_bool("USE_CPP_ENGINE", True)
    _default_cli = "zyg_cross_cli.exe" if os.name == "nt" else "zyg_cross_cli"
    cpp_engine_cli_path: str = os.getenv(
        "CPP_ENGINE_CLI_PATH",
        os.path.join("..", "zygotrix_engine_cpp", "build", _default_cli),
    )

    @property
    def is_development(self) -> bool:
        return self.backend_env.strip().lower() in {"dev", "development"}


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
