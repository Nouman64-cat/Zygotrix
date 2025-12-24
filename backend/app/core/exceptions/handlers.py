"""
Exception Handlers for FastAPI.

Centralized exception handling for consistent API error responses.
"""

import logging
from fastapi import Request, FastAPI, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from .auth import (
    AuthenticationError,
    InvalidCredentialsError,
    TokenExpiredError,
    InvalidTokenError,
)
from .business import (
    OTPExpiredError,
    MaxAttemptsExceededError,
    InvalidOTPError,
    UserNotFoundError,
    UnauthorizedError,
)
from .database import (
    DatabaseError,
    DatabaseNotAvailableError,
    RecordNotFoundError,
    DatabaseConnectionError,
    DatabaseQueryError,
)

logger = logging.getLogger(__name__)


def register_exception_handlers(app: FastAPI) -> None:
    """
    Register all exception handlers with the FastAPI application.

    Args:
        app: FastAPI application instance
    """

    # =========================================================================
    # AUTHENTICATION EXCEPTIONS
    # =========================================================================

    @app.exception_handler(InvalidCredentialsError)
    async def invalid_credentials_handler(
        request: Request, exc: InvalidCredentialsError
    ) -> JSONResponse:
        """Handle invalid credentials errors."""
        logger.warning(f"Invalid credentials attempt from {request.client.host if request.client else 'unknown'}")
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={
                "detail": exc.message,
                "type": "invalid_credentials",
            },
        )

    @app.exception_handler(TokenExpiredError)
    async def token_expired_handler(
        request: Request, exc: TokenExpiredError
    ) -> JSONResponse:
        """Handle expired token errors."""
        logger.info(f"Expired token from {request.client.host if request.client else 'unknown'}")
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={
                "detail": exc.message,
                "type": "token_expired",
            },
        )

    @app.exception_handler(InvalidTokenError)
    async def invalid_token_handler(
        request: Request, exc: InvalidTokenError
    ) -> JSONResponse:
        """Handle invalid token errors."""
        logger.warning(f"Invalid token from {request.client.host if request.client else 'unknown'}")
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={
                "detail": exc.message,
                "type": "invalid_token",
            },
        )

    @app.exception_handler(AuthenticationError)
    async def authentication_error_handler(
        request: Request, exc: AuthenticationError
    ) -> JSONResponse:
        """Handle general authentication errors."""
        logger.warning(f"Authentication error: {exc.message}")
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={
                "detail": exc.message,
                "type": "authentication_error",
            },
        )

    # =========================================================================
    # BUSINESS LOGIC EXCEPTIONS
    # =========================================================================

    @app.exception_handler(OTPExpiredError)
    async def otp_expired_handler(
        request: Request, exc: OTPExpiredError
    ) -> JSONResponse:
        """Handle expired OTP errors."""
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "detail": exc.message,
                "type": "otp_expired",
            },
        )

    @app.exception_handler(MaxAttemptsExceededError)
    async def max_attempts_handler(
        request: Request, exc: MaxAttemptsExceededError
    ) -> JSONResponse:
        """Handle max attempts exceeded errors."""
        return JSONResponse(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            content={
                "detail": exc.message,
                "type": "max_attempts_exceeded",
            },
        )

    @app.exception_handler(InvalidOTPError)
    async def invalid_otp_handler(
        request: Request, exc: InvalidOTPError
    ) -> JSONResponse:
        """Handle invalid OTP errors."""
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "detail": exc.message,
                "type": "invalid_otp",
            },
        )

    @app.exception_handler(UserNotFoundError)
    async def user_not_found_handler(
        request: Request, exc: UserNotFoundError
    ) -> JSONResponse:
        """Handle user not found errors."""
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={
                "detail": exc.message,
                "type": "user_not_found",
            },
        )

    @app.exception_handler(UnauthorizedError)
    async def unauthorized_handler(
        request: Request, exc: UnauthorizedError
    ) -> JSONResponse:
        """Handle unauthorized access errors."""
        logger.warning(f"Unauthorized access attempt: {exc.message}")
        return JSONResponse(
            status_code=status.HTTP_403_FORBIDDEN,
            content={
                "detail": exc.message,
                "type": "unauthorized",
            },
        )

    # =========================================================================
    # DATABASE EXCEPTIONS
    # =========================================================================

    @app.exception_handler(DatabaseNotAvailableError)
    async def database_not_available_handler(
        request: Request, exc: DatabaseNotAvailableError
    ) -> JSONResponse:
        """Handle database not available errors."""
        logger.error(f"Database not available: {exc.message}")
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "detail": "Database service is currently unavailable. Please try again later.",
                "type": "database_unavailable",
            },
        )

    @app.exception_handler(RecordNotFoundError)
    async def record_not_found_handler(
        request: Request, exc: RecordNotFoundError
    ) -> JSONResponse:
        """Handle record not found errors."""
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={
                "detail": exc.message,
                "type": "record_not_found",
            },
        )

    @app.exception_handler(DatabaseConnectionError)
    async def database_connection_handler(
        request: Request, exc: DatabaseConnectionError
    ) -> JSONResponse:
        """Handle database connection errors."""
        logger.error(f"Database connection error: {exc.message}")
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "detail": "Unable to connect to database. Please try again later.",
                "type": "database_connection_error",
            },
        )

    @app.exception_handler(DatabaseQueryError)
    async def database_query_handler(
        request: Request, exc: DatabaseQueryError
    ) -> JSONResponse:
        """Handle database query errors."""
        logger.error(f"Database query error: {exc.message}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "detail": "An error occurred while processing your request.",
                "type": "database_query_error",
            },
        )

    @app.exception_handler(DatabaseError)
    async def database_error_handler(
        request: Request, exc: DatabaseError
    ) -> JSONResponse:
        """Handle general database errors."""
        logger.error(f"Database error: {exc.message}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "detail": "A database error occurred. Please try again later.",
                "type": "database_error",
            },
        )

    # =========================================================================
    # VALIDATION EXCEPTIONS
    # =========================================================================

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        """Handle Pydantic validation errors."""
        errors = []
        for error in exc.errors():
            field = ".".join(str(loc) for loc in error["loc"] if loc != "body")
            errors.append({
                "field": field,
                "message": error["msg"],
                "type": error["type"],
            })

        logger.warning(f"Validation error: {errors}")
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "detail": "Validation error",
                "type": "validation_error",
                "errors": errors,
            },
        )

    # =========================================================================
    # HTTP EXCEPTIONS
    # =========================================================================

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(
        request: Request, exc: StarletteHTTPException
    ) -> JSONResponse:
        """Handle Starlette HTTP exceptions."""
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "detail": exc.detail,
                "type": "http_error",
            },
        )

    # =========================================================================
    # GENERIC EXCEPTION HANDLER
    # =========================================================================

    @app.exception_handler(Exception)
    async def generic_exception_handler(
        request: Request, exc: Exception
    ) -> JSONResponse:
        """Handle unexpected exceptions."""
        logger.exception(f"Unexpected error: {str(exc)}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "detail": "An unexpected error occurred. Please try again later.",
                "type": "internal_server_error",
            },
        )
