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
    backend_url: str = os.getenv(
        "BACKEND_URL", "http://127.0.0.1:8000"
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
    mongodb_password_resets_collection: str = os.getenv(
        "MONGODB_PASSWORD_RESETS_COLLECTION", "password_resets"
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
    # AWS SES configuration
    aws_ses_username: str = os.getenv("AWS_SES_USERNAME", "")
    aws_ses_password: str = os.getenv("AWS_SES_PASSWORD", "")
    aws_ses_region: str = os.getenv("AWS_SES_REGION", "us-east-1")
    aws_ses_from_email: str = os.getenv("AWS_SES_FROM_EMAIL", "no-reply@zygotrix.com")
    aws_smtp_port: int = _get_int("AWS_SMTP_PORT", 465)
    signup_otp_ttl_minutes: int = _get_int("SIGNUP_OTP_TTL_MINUTES", 10)
    password_reset_otp_ttl_minutes: int = _get_int("PASSWORD_RESET_OTP_TTL_MINUTES", 10)
    # Super admin configuration
    super_admin_email: str = os.getenv("SUPER_ADMIN_EMAIL", "")
    # Trait source control: when true, serve traits from JSON only and disable trait CRUD
    traits_json_only: bool = _get_bool("TRAITS_JSON_ONLY", False)
    # Migration flag: when true, use C++ engine for Mendelian calculations
    use_cpp_engine: bool = _get_bool("USE_CPP_ENGINE", True)
    _default_cli = "zyg_cross_cli.exe" if os.name == "nt" else "zyg_cross_cli"
    cpp_engine_cli_path: str = os.getenv(
        "CPP_ENGINE_CLI_PATH",
        os.path.join("..", "zygotrix_engine_cpp", "build", _default_cli),
    )
    # C++ Protein Generator CLI path
    _default_protein_cli = "zyg_protein_cli.exe" if os.name == "nt" else "zyg_protein_cli"
    cpp_protein_cli_path: str = os.getenv(
        "CPP_PROTEIN_CLI_PATH",
        os.path.join("..", "zygotrix_engine_cpp", "build", _default_protein_cli),
    )
    # C++ Parallel DNA Generator CLI path (for large sequences)
    _default_parallel_dna_cli = "zyg_parallel_dna_cli.exe" if os.name == "nt" else "zyg_parallel_dna_cli"
    cpp_parallel_dna_cli_path: str = os.getenv(
        "CPP_PARALLEL_DNA_CLI_PATH",
        os.path.join("..", "zygotrix_engine_cpp", "build", _default_parallel_dna_cli),
    )
    # Threshold for using parallel generation (in base pairs)
    parallel_dna_threshold: int = _get_int("PARALLEL_DNA_THRESHOLD", 1_000_000)  # 1M bp
    # C++ GWAS CLI path
    _default_gwas_cli = "zyg_gwas_cli.exe" if os.name == "nt" else "zyg_gwas_cli"
    cpp_gwas_cli_path: str = os.getenv(
        "CPP_GWAS_CLI_PATH",
        os.path.join("..", "zygotrix_engine_cpp", "build", _default_gwas_cli),
    )
    # Twilio WhatsApp notification settings
    twilio_account_sid: str = os.getenv("TWILIO_ACCOUNT_SID", "")
    twilio_auth_token: str = os.getenv("TWILIO_AUTH_TOKEN", "")
    twilio_whatsapp_from: str = os.getenv("TWILIO_WHATSAPP_FROM", "")
    admin_whatsapp_to: str = os.getenv("ADMIN_WHATSAPP_TO", "")
    # Frontend URL for chatbot links
    frontend_url: str = os.getenv("FRONTEND_URL", "http://localhost:5173")

    @property
    def is_development(self) -> bool:
        return self.backend_env.strip().lower() in {"dev", "development"}


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
