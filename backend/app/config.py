from __future__ import annotations

import os
from dataclasses import dataclass
from functools import lru_cache
from typing import Any, Dict

import yaml
from dotenv import load_dotenv

load_dotenv()


def _load_config_yaml() -> Dict[str, Any]:
    """Load configuration from config.yml if it exists."""
    config_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "config.yml")
    if os.path.exists(config_path):
        with open(config_path, "r") as f:
            return yaml.safe_load(f) or {}
    return {}


_YAML_CONFIG = _load_config_yaml()


def _get_yaml_value(path: str, default: Any = None) -> Any:
    """Retrieve a value from the YAML config using a dot-notation path."""
    keys = path.split(".")
    value = _YAML_CONFIG
    for key in keys:
        if isinstance(value, dict) and key in value:
            value = value[key]
        else:
            return default
    return value


def _get_str(env_var: str, yaml_path: str, default: str) -> str:
    """Get string value from env var (priority) or YAML config."""
    env_val = os.getenv(env_var)
    if env_val is not None:
        return env_val
    yaml_val = _get_yaml_value(yaml_path)
    return str(yaml_val) if yaml_val is not None else default


def _get_int(env_var: str, yaml_path: str, default: int) -> int:
    """Get int value from env var (priority) or YAML config."""
    env_val = os.getenv(env_var)
    if env_val is not None:
        try:
            return int(env_val)
        except ValueError:
            pass
    yaml_val = _get_yaml_value(yaml_path)
    if yaml_val is not None:
        try:
            return int(yaml_val)
        except (ValueError, TypeError):
            pass
    return default


def _get_bool(env_var: str, yaml_path: str, default: bool) -> bool:
    """Get bool value from env var (priority) or YAML config."""
    env_val = os.getenv(env_var)
    if env_val is not None:
        return env_val.strip().lower() in {"1", "true", "yes", "on"}
    
    yaml_val = _get_yaml_value(yaml_path)
    if yaml_val is not None:
         return str(yaml_val).strip().lower() in {"1", "true", "yes", "on"}
    
    return default


@dataclass(frozen=True)
class Settings:
    # App Settings
    app_name: str = _get_str("APP_NAME", "app.name", "Zygotrix")
    backend_env: str = _get_str("BACKEND_ENV", "app.env", "Production")
    frontend_url: str = _get_str("FRONTEND_URL", "app.frontend_url", "http://localhost:5173")
    university_url: str = _get_str("UNIVERSITY_URL", "app.university_url", "https://zygotrix.university.courtcierge.online")
    zygotrix_bot_name: str = _get_str("ZYGOTRIX_BOT_NAME", "app.bot_name", "Zygotrix AI")
    backend_url: str = os.getenv("BACKEND_URL", "http://127.0.0.1:8000")

    # Database
    mongodb_uri: str = os.getenv("MONGODB_URI", "")
    mongodb_db_name: str = _get_str("MONGODB_DB_NAME", "database.mongodb.db_name", "zygotrix")
    mongodb_traits_collection: str = _get_str("MONGODB_TRAITS_COLLECTION", "database.mongodb.collections.traits", "traits")
    mongodb_users_collection: str = _get_str("MONGODB_USERS_COLLECTION", "database.mongodb.collections.users", "users")
    mongodb_pending_signups_collection: str = _get_str("MONGODB_PENDING_SIGNUPS_COLLECTION", "database.mongodb.collections.pending_signups", "pending_signups")
    traits_json_only: bool = _get_bool("TRAITS_JSON_ONLY", "database.mongodb.traits_json_only", False)
    
    redis_url: str = "redis://host.docker.internal:6379/0" if os.path.exists("/.dockerenv") else os.getenv("REDIS_URL", "redis://localhost:6379/0")
    redis_cache_ttl_seconds: int = _get_int("REDIS_CACHE_TTL_SECONDS", "database.redis.cache_ttl_seconds", 300)

    # Auth
    auth_secret_key: str = os.getenv("AUTH_SECRET_KEY", "change-me-in-prod")
    auth_token_ttl_minutes: int = _get_int("AUTH_TOKEN_TTL_MINUTES", "auth.token_ttl_minutes", 60)
    auth_jwt_algorithm: str = _get_str("AUTH_JWT_ALGORITHM", "auth.jwt_algorithm", "HS256")
    signup_otp_ttl_minutes: int = _get_int("SIGNUP_OTP_TTL_MINUTES", "auth.signup_otp_ttl_minutes", 10)
    super_admin_email: str = os.getenv("SUPER_ADMIN_EMAIL", "")

    # Email
    resend_api_key: str = os.getenv("RESEND_API_KEY", "")
    resend_from_email: str = _get_str("RESEND_FROM_EMAIL", "email.resend.from", "onboarding@resend.dev")
    resend_support_email: str = _get_str("RESEND_SUPPORT_EMAIL", "email.resend.support", "support@zygotrix.com")
    
    # AWS SES
    aws_ses_username: str = os.getenv("AWS_SES_USERNAME", "")
    aws_ses_password: str = os.getenv("AWS_SES_PASSWORD", "")
    aws_ses_region: str = _get_str("AWS_SES_REGION", "compute.aws.ses_region", "us-east-1")
    aws_smtp_port: int = _get_int("AWS_SMTP_PORT", "compute.aws.smtp_port", 465)

    # AI & Models
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")
    openai_embedding_model: str = _get_str("OPENAI_EMBEDDING_MODEL", "ai.openai.embedding_model", "text-embedding-3-small")
    
    claude_api_key: str = os.getenv("CLAUDE_API_KEY", "")
    claude_model: str = _get_str("CLAUDE_MODEL", "ai.claude.model", "claude-3-haiku-20240307")
    
    cohere_api_key: str = os.getenv("COHERE_API_KEY", "")
    cohere_model: str = _get_str("COHERE_MODEL", "ai.cohere.model", "rerank-v4.0-fast")
    
    pinecone_api_key: str = os.getenv("PINECONE_API_KEY", "")
    pinecone_index_name: str = _get_str("PINECONE_INDEX_NAME", "ai.pinecone.index_name", "zygotrix-embeddings")
    pinecone_host: str = _get_str("PINECONE_HOST", "ai.pinecone.host", "")

    # Intelligent Routing
    enable_intelligent_routing: bool = _get_bool("ENABLE_INTELLIGENT_ROUTING", "ai.routing.enable", True)
    enable_llm_classifier: bool = _get_bool("ENABLE_LLM_CLASSIFIER", "ai.routing.enable_llm_classifier", True)
    classifier_confidence_threshold: float = float(_get_str("CLASSIFIER_CONFIDENCE_THRESHOLD", "ai.routing.confidence_threshold", "0.85"))

    aws_access_key: str = os.getenv("AWS_IAM_KEY", "")
    aws_secret_key: str = os.getenv("AWS_IAM_SECRET", "")
    aws_region: str = _get_str("AWS_REGION", "compute.aws.ses_region", "us-east-1")
    aws_lambda_function_name: str = _get_str("AWS_LAMBDA_FUNCTION_NAME", "compute.aws.lambda_function_name", "zygotrix-engine-dev-dispatcher")
    aws_bucket_name: str = _get_str("AWS_BUCKET_NAME", "compute.aws.bucket_name", "vcf-zygotrix")
    
    use_cpp_engine: bool = _get_bool("USE_CPP_ENGINE", "compute.cpp_engine.use_cpp", True)
    parallel_dna_threshold: int = _get_int("PARALLEL_DNA_THRESHOLD", "compute.cpp_engine.parallel_dna_threshold", 1_000_000)

    # External Services
    hygraph_endpoint: str = _get_str("HYGRAPH_ENDPOINT", "cms.hygraph.endpoint", "")
    hygraph_token: str = os.getenv("HYGRAPH_TOKEN", "")
    digitial_ocean_space_secret_key: str = os.getenv("DIGITIAL_OCEAN_SPACE_SECRET_KEY", "")
    digitial_ocean_space_access_key_id: str = os.getenv("DIGITIAL_OCEAN_SPACE_ACCESS_KEY_ID", "")

    # Legacy / Unused in Config.yml but kept for compatibility or fallback
    mongodb_password_resets_collection: str = os.getenv("MONGODB_PASSWORD_RESETS_COLLECTION", "password_resets")
    mongodb_project_lines_collection: str = os.getenv("MONGODB_PROJECT_LINES_COLLECTION", "project_lines")
    mongodb_project_notes_collection: str = os.getenv("MONGODB_PROJECT_NOTES_COLLECTION", "project_notes")
    mongodb_project_drawings_collection: str = os.getenv("MONGODB_PROJECT_DRAWINGS_COLLECTION", "project_drawings")
    mongodb_questions_collection: str = os.getenv("MONGODB_QUESTIONS_COLLECTION", "questions")
    mongodb_answers_collection: str = os.getenv("MONGODB_ANSWERS_COLLECTION", "answers")
    mongodb_comments_collection: str = os.getenv("MONGODB_COMMENTS_COLLECTION", "comments")
    mongodb_courses_collection: str = os.getenv("MONGODB_COURSES_COLLECTION", "university_courses")
    mongodb_practice_sets_collection: str = os.getenv("MONGODB_PRACTICE_SETS_COLLECTION", "university_practice_sets")
    mongodb_course_progress_collection: str = os.getenv("MONGODB_COURSE_PROGRESS_COLLECTION", "university_course_progress")
    mongodb_enrollments_collection: str = os.getenv("MONGODB_ENROLLMENTS_COLLECTION", "university_enrollments")
    
    # Twilio (Not in config.yml yet, reading from ENV directly)
    twilio_account_sid: str = os.getenv("TWILIO_ACCOUNT_SID", "")
    twilio_auth_token: str = os.getenv("TWILIO_AUTH_TOKEN", "")
    twilio_whatsapp_from: str = os.getenv("TWILIO_WHATSAPP_FROM", "")
    admin_whatsapp_to: str = os.getenv("ADMIN_WHATSAPP_TO", "")

    # Deep Research (Values not yet in config.yml)
    deep_research_max_depth: int = _get_int("DEEP_RESEARCH_MAX_DEPTH", "ai.deep_research.max_depth", 10)
    deep_research_max_chunks: int = _get_int("DEEP_RESEARCH_MAX_CHUNKS", "ai.deep_research.max_chunks", 20)
    deep_research_top_k: int = _get_int("DEEP_RESEARCH_TOP_K", "ai.deep_research.top_k", 5)
    clarification_model: str = _get_str("CLARIFICATION_MODEL", "ai.deep_research.clarification_model", "gpt-4o-mini")

    @property
    def is_development(self) -> bool:
        return self.backend_env.strip().lower() in {"dev", "development"}


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
