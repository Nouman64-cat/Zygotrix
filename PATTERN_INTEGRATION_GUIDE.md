# Pattern Integration Guide

**How to Integrate Phase 4 Design Patterns into Existing Routes**

This guide demonstrates practical integration of the four advanced design patterns implemented in Phase 4 of the backend refactoring.

---

## Table of Contents

1. [Strategy Pattern - Authentication](#1-strategy-pattern---authentication)
2. [Builder Pattern - Query Construction](#2-builder-pattern---query-construction)
3. [Chain of Responsibility - Validation](#3-chain-of-responsibility---validation)
4. [Adapter Pattern - Notifications](#4-adapter-pattern---notifications)

---

## 1. Strategy Pattern - Authentication

### Current Implementation (Before)

**File**: `backend/app/routes/auth.py`

```python
@router.post("/login", response_model=AuthResponse)
def login(payload: UserLoginRequest, request: Request) -> AuthResponse:
    # Direct authentication logic in route
    user = services.authenticate_user(
        email=payload.email,
        password=payload.password.get_secret_value(),
    )

    if not user.get("is_active", True):
        raise HTTPException(status_code=401, detail="Account deactivated")

    # ... more logic
```

### With Strategy Pattern (After)

**Step 1**: Import the strategies

```python
# At top of auth.py
from ..services.auth.strategies import (
    PasswordAuthenticationStrategy,
    OTPAuthenticationStrategy,
)
from ..core.exceptions.auth import InvalidCredentialsError, AuthenticationError
from ..core.exceptions.business import AccountDeactivatedError
```

**Step 2**: Update login endpoint

```python
@router.post("/login", response_model=AuthResponse)
def login(payload: UserLoginRequest, request: Request) -> AuthResponse:
    """
    User login endpoint supporting multiple authentication strategies.
    """
    try:
        # Select authentication strategy based on payload
        if hasattr(payload, 'otp_code') and payload.otp_code:
            # OTP authentication
            strategy = OTPAuthenticationStrategy()
            credentials = {
                "email": payload.email,
                "otp_code": payload.otp_code
            }
        else:
            # Password authentication (default)
            strategy = PasswordAuthenticationStrategy()
            credentials = {
                "email": payload.email,
                "password": payload.password.get_secret_value()
            }

        # Authenticate using the selected strategy
        user = strategy.authenticate(credentials)

        # Track user activity
        client_info = ClientInfoExtractor.extract_all(request)
        services.update_user_activity(
            user_id=user["id"],
            ip_address=client_info["ip_address"],
            user_agent=client_info["user_agent"]
        )

        # Build response
        return AuthResponse(**services.build_auth_response(user))

    except (InvalidCredentialsError, AccountDeactivatedError) as e:
        # These are handled by exception handlers automatically
        raise
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise AuthenticationError("Login failed")
```

**Step 3**: Create dedicated OTP verification endpoint

```python
@router.post("/verify-otp", response_model=AuthResponse)
def verify_otp(payload: OTPVerificationRequest, request: Request) -> AuthResponse:
    """
    Verify OTP and complete signup/authentication.
    """
    strategy = OTPAuthenticationStrategy()

    user = strategy.authenticate({
        "email": payload.email,
        "otp_code": payload.otp_code
    })

    # Track activity
    client_info = ClientInfoExtractor.extract_all(request)
    services.update_user_activity(
        user_id=user["id"],
        ip_address=client_info["ip_address"],
        user_agent=client_info["user_agent"]
    )

    return AuthResponse(**services.build_auth_response(user))
```

### Benefits

- ✅ Easy to add new auth methods (OAuth, SAML, biometric)
- ✅ Auth logic separated from HTTP concerns
- ✅ Each strategy can be tested independently
- ✅ Consistent error handling across all strategies

---

## 2. Builder Pattern - Query Construction

### Current Implementation (Before)

**File**: `backend/app/routes/admin.py`

```python
@router.get("/users")
def get_users(
    page: int = 1,
    page_size: int = 20,
    search: Optional[str] = None,
    role: Optional[str] = None,
    is_active: Optional[bool] = None
):
    collection = get_users_collection()

    # Manually build complex query
    query = {}
    if search:
        query["$or"] = [
            {"email": {"$regex": search, "$options": "i"}},
            {"name": {"$regex": search, "$options": "i"}}
        ]
    if role:
        query["user_role"] = role
    if is_active is not None:
        query["is_active"] = is_active

    # Manual pagination
    skip = (page - 1) * page_size

    total = collection.count_documents(query)
    users = list(
        collection.find(query)
        .sort("created_at", -1)
        .skip(skip)
        .limit(page_size)
    )

    return {"users": users, "total": total}
```

### With Builder Pattern (After)

**Step 1**: Import the builder

```python
# At top of admin.py
from ..repositories.builders import MongoQueryBuilder
```

**Step 2**: Use builder to construct query

```python
@router.get("/users")
def get_users(
    page: int = 1,
    page_size: int = 20,
    search: Optional[str] = None,
    role: Optional[str] = None,
    is_active: Optional[bool] = None
):
    """Get users with advanced filtering."""
    collection = get_users_collection()

    # Build query using fluent interface
    builder = MongoQueryBuilder()

    # Add search filter if provided
    if search:
        builder.with_or([
            {"email": {"$regex": search, "$options": "i"}},
            {"name": {"$regex": search, "$options": "i"}}
        ])

    # Add role filter if provided
    if role:
        builder.with_field("user_role", role)

    # Add active status filter if provided
    if is_active is not None:
        builder.with_field("is_active", is_active)

    # Add sorting and pagination
    builder.sorted_by("created_at", descending=True).paginated(page, page_size)

    # Build the query
    query_spec = builder.build()

    # Execute query
    total = collection.count_documents(query_spec["filter"])
    cursor = collection.find(query_spec["filter"])

    if query_spec["sort"]:
        cursor = cursor.sort(query_spec["sort"])
    if query_spec["skip"]:
        cursor = cursor.skip(query_spec["skip"])
    if query_spec["limit"]:
        cursor = cursor.limit(query_spec["limit"])

    users = list(cursor)

    return {"users": users, "total": total, "page": page, "page_size": page_size}
```

### More Complex Example: Token Usage Analytics

**File**: `backend/app/routes/analytics.py`

```python
from datetime import datetime, timedelta
from ..repositories.builders import MongoQueryBuilder

@router.get("/token-usage")
def get_token_usage(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    user_id: Optional[str] = None,
    model: Optional[str] = None,
    min_tokens: Optional[int] = None,
    page: int = 1,
    page_size: int = 50
):
    """Get token usage with complex filtering."""
    collection = get_token_usage_collection()

    # Build complex query with builder
    query = (MongoQueryBuilder()
        # Date range filter
        .with_date_range("timestamp", start_date, end_date)
        # User filter
        .with_field("user_id", user_id) if user_id else MongoQueryBuilder()
    )

    # Add model filter if provided
    if model:
        query.with_field("model", model)

    # Filter by minimum tokens
    if min_tokens:
        query.with_greater_than_or_equal("total_tokens", min_tokens)

    # Sort by most recent first, paginate
    query.sorted_by("timestamp", descending=True).paginated(page, page_size)

    # Build and execute
    query_spec = query.build()

    total = collection.count_documents(query_spec["filter"])
    results = list(
        collection.find(query_spec["filter"])
        .sort(query_spec["sort"])
        .skip(query_spec["skip"])
        .limit(query_spec["limit"])
    )

    return {
        "results": results,
        "total": total,
        "page": page,
        "page_size": page_size
    }
```

### Benefits

- ✅ More readable and maintainable query construction
- ✅ Reusable across different endpoints
- ✅ Type-safe with IDE autocomplete
- ✅ Easy to add new filter types
- ✅ Reduces query construction bugs

---

## 3. Chain of Responsibility - Validation

### Current Implementation (Before)

**File**: `backend/app/routes/auth.py`

```python
@router.post("/signup")
def signup(payload: UserSignupRequest):
    # Inline validation logic scattered throughout
    email = payload.email.lower().strip()

    # Email format check
    if not re.match(r"^[\w\.-]+@[\w\.-]+\.\w+$", email):
        raise HTTPException(status_code=400, detail="Invalid email format")

    # Password length check
    if len(payload.password) < 8:
        raise HTTPException(status_code=400, detail="Password too short")

    # Password strength check
    if not re.search(r"[A-Z]", payload.password):
        raise HTTPException(status_code=400, detail="Password needs uppercase")
    if not re.search(r"[a-z]", payload.password):
        raise HTTPException(status_code=400, detail="Password needs lowercase")
    if not re.search(r"\d", payload.password):
        raise HTTPException(status_code=400, detail="Password needs digit")

    # Common password check
    if payload.password.lower() in ["password", "123456", "qwerty"]:
        raise HTTPException(status_code=400, detail="Password too common")

    # ... signup logic
```

### With Validation Chain (After)

**Step 1**: Import validation components

```python
# At top of auth.py
from ..core.validation import (
    ValidationChain,
    EmailFormatValidator,
    EmailDomainValidator,
    PasswordLengthValidator,
    PasswordStrengthValidator,
    PasswordCommonValidator,
)
from ..core.exceptions.validation import (
    ValidationError,
    InvalidEmailFormatError,
    InvalidPasswordError,
)
```

**Step 2**: Create reusable validation chains

```python
# Create validation chains (can be module-level or in a service)

def get_signup_validation_chain():
    """Get validation chain for user signup."""
    return (ValidationChain()
        .add(EmailFormatValidator())
        .add(EmailDomainValidator())
        .add(PasswordLengthValidator(min_length=8, max_length=128))
        .add(PasswordStrengthValidator(
            require_uppercase=True,
            require_lowercase=True,
            require_digit=True,
            require_special=True
        ))
        .add(PasswordCommonValidator())
        .build()
    )

# Or create once at module level
SIGNUP_VALIDATOR = get_signup_validation_chain()
```

**Step 3**: Use validation chain in endpoint

```python
@router.post("/signup")
def signup(payload: UserSignupRequest):
    """
    User signup with validation chain.
    """
    try:
        # Prepare data for validation
        signup_data = {
            "email": payload.email,
            "password": payload.password.get_secret_value(),
            "name": payload.name
        }

        # Validate using chain - will raise ValidationError if invalid
        validated_data = SIGNUP_VALIDATOR.handle(signup_data)

        # Validation passed - proceed with signup
        # Email is now sanitized (lowercase, trimmed)
        email = validated_data["email"]
        password = validated_data["password"]

        # Check if user already exists
        if services.user_exists(email):
            raise HTTPException(
                status_code=409,
                detail="User with this email already exists"
            )

        # Create pending signup and send OTP
        otp_code = services.generate_otp()
        services.create_pending_signup(
            email=email,
            password=password,
            name=payload.name,
            otp_code=otp_code
        )

        # Send OTP email
        services.send_signup_otp_email(email, otp_code, payload.name)

        return {"message": "Verification code sent to email"}

    except (ValidationError, InvalidEmailFormatError, InvalidPasswordError) as e:
        # Validation errors are handled by exception handlers
        raise
    except Exception as e:
        logger.error(f"Signup error: {str(e)}")
        raise HTTPException(status_code=500, detail="Signup failed")
```

### Custom Validation Chain Example

**Create custom validator for your specific needs**:

```python
# backend/app/core/validation/custom_validators.py

from .chain import ValidationHandler
from ..exceptions.validation import InvalidInputError

class UsernameValidator(ValidationHandler):
    """Validate username format and availability."""

    def __init__(self, min_length=3, max_length=20, next_handler=None):
        super().__init__(next_handler)
        self.min_length = min_length
        self.max_length = max_length

    def validate(self, data: dict) -> dict:
        username = data.get("username", "")

        # Length check
        if len(username) < self.min_length:
            raise InvalidInputError(
                "username",
                f"Must be at least {self.min_length} characters"
            )

        if len(username) > self.max_length:
            raise InvalidInputError(
                "username",
                f"Must be at most {self.max_length} characters"
            )

        # Format check (alphanumeric + underscore)
        if not username.replace("_", "").isalnum():
            raise InvalidInputError(
                "username",
                "Can only contain letters, numbers, and underscores"
            )

        # Sanitize
        data["username"] = username.lower().strip()
        return data


# Use it in a chain
profile_validator = (ValidationChain()
    .add(UsernameValidator(min_length=3, max_length=20))
    .add(EmailFormatValidator())
    .build()
)
```

### Benefits

- ✅ Validation logic reusable across endpoints
- ✅ Easy to add/remove validators
- ✅ Clear separation of validation concerns
- ✅ Data sanitization during validation
- ✅ Consistent error messages
- ✅ Easy to test each validator independently

---

## 4. Adapter Pattern - Notifications

### Current Implementation (Before)

**File**: `backend/app/services/auth.py`

```python
def send_signup_otp_email(recipient: str, otp_code: str, full_name: str):
    """Send OTP via email - hardcoded to AWS SES."""
    settings = get_settings()

    # Hardcoded to AWS SES
    smtp_server = "email-smtp.us-east-1.amazonaws.com"
    smtp_port = 465

    sender_email = settings.aws_ses_from_email
    sender_password = settings.aws_ses_password

    # ... 80+ lines of email sending logic

    with smtplib.SMTP_SSL(smtp_server, smtp_port) as server:
        server.login(sender_email, sender_password)
        server.sendmail(sender_email, recipient, message.as_string())
```

### With Adapter Pattern (After)

**Step 1**: Create notification service configuration

```python
# backend/app/config.py or new file: backend/app/core/notifications.py

from functools import lru_cache
from ..infrastructure.notifications import (
    NotificationService,
    TwilioNotificationAdapter,
    AWSSNSNotificationAdapter,
)
from ..config import get_settings

@lru_cache()
def get_sms_notification_service() -> NotificationService:
    """
    Get SMS notification service.

    Configured via environment variables. Easy to swap providers.
    """
    settings = get_settings()

    # Can switch based on config
    provider = settings.sms_provider  # "twilio" or "aws_sns"

    if provider == "twilio":
        return TwilioNotificationAdapter(
            account_sid=settings.twilio_account_sid,
            auth_token=settings.twilio_auth_token,
            from_phone=settings.twilio_from_phone,
            from_whatsapp=settings.twilio_from_whatsapp,
        )
    elif provider == "aws_sns":
        return AWSSNSNotificationAdapter(
            aws_access_key_id=settings.aws_access_key_id,
            aws_secret_access_key=settings.aws_secret_access_key,
            region_name=settings.aws_region,
        )
    else:
        # Default to Twilio
        return TwilioNotificationAdapter(
            account_sid=settings.twilio_account_sid,
            auth_token=settings.twilio_auth_token,
            from_phone=settings.twilio_from_phone,
        )
```

**Step 2**: Update auth service to use adapter

```python
# backend/app/services/auth.py

from ..infrastructure.notifications import (
    NotificationMessage,
    NotificationChannel,
)
from ..core.notifications import get_sms_notification_service

def send_otp_sms(phone_number: str, otp_code: str) -> bool:
    """
    Send OTP via SMS using configured notification service.

    Provider is abstracted - can be Twilio, AWS SNS, or any other service.
    """
    notification_service = get_sms_notification_service()

    message = NotificationMessage(
        recipient=phone_number,
        message=f"Your Zygotrix verification code is: {otp_code}. Valid for 10 minutes.",
        channel=NotificationChannel.SMS
    )

    result = notification_service.send(message)

    if result.success:
        logger.info(f"OTP SMS sent to {phone_number} (Message ID: {result.message_id})")
        return True
    else:
        logger.error(f"Failed to send OTP SMS: {result.error}")
        return False


def send_whatsapp_otp(phone_number: str, otp_code: str, user_name: str) -> bool:
    """Send OTP via WhatsApp."""
    notification_service = get_sms_notification_service()

    message = NotificationMessage(
        recipient=phone_number,
        message=f"Hi {user_name},\n\nYour Zygotrix verification code is: *{otp_code}*\n\nThis code expires in 10 minutes.\n\nIf you didn't request this code, please ignore this message.",
        channel=NotificationChannel.WHATSAPP
    )

    result = notification_service.send(message)
    return result.success
```

**Step 3**: Use in routes

```python
# backend/app/routes/auth.py

from ..services import auth as auth_services

@router.post("/signup")
def signup(payload: UserSignupRequest):
    """User signup with SMS OTP."""
    # ... validation ...

    # Generate OTP
    otp_code = auth_services.generate_otp()

    # Save pending signup
    auth_services.create_pending_signup(
        email=payload.email,
        phone=payload.phone_number,
        password=payload.password.get_secret_value(),
        otp_code=otp_code
    )

    # Send OTP via SMS (abstracted - provider configured externally)
    if payload.phone_number:
        success = auth_services.send_otp_sms(
            payload.phone_number,
            otp_code
        )
    else:
        # Fallback to email
        success = auth_services.send_signup_otp_email(
            payload.email,
            otp_code,
            payload.name
        )

    if not success:
        raise HTTPException(
            status_code=500,
            detail="Failed to send verification code"
        )

    return {
        "message": "Verification code sent",
        "method": "sms" if payload.phone_number else "email"
    }
```

### Advanced: Multi-Channel Notification with Fallback

```python
# backend/app/services/notification_service.py

from ..infrastructure.notifications import (
    NotificationMessage,
    NotificationChannel,
)
from ..core.notifications import get_sms_notification_service

class NotificationOrchestrator:
    """Orchestrate multi-channel notifications with fallback."""

    def __init__(self):
        self.sms_service = get_sms_notification_service()
        # Could add email service, push service, etc.

    def send_otp_with_fallback(
        self,
        user_email: str,
        user_phone: Optional[str],
        otp_code: str,
        user_name: str
    ) -> tuple[bool, str]:
        """
        Send OTP with fallback strategy.

        Try SMS first (if phone provided), fallback to email.

        Returns:
            (success, method_used)
        """
        # Try SMS first if phone provided
        if user_phone:
            message = NotificationMessage(
                recipient=user_phone,
                message=f"Your Zygotrix code: {otp_code}",
                channel=NotificationChannel.SMS
            )

            result = self.sms_service.send(message)
            if result.success:
                return True, "sms"

            logger.warning(f"SMS failed, falling back to email: {result.error}")

        # Fallback to email
        try:
            auth_services.send_signup_otp_email(user_email, otp_code, user_name)
            return True, "email"
        except Exception as e:
            logger.error(f"Email also failed: {str(e)}")
            return False, "none"


# Use in route
orchestrator = NotificationOrchestrator()

@router.post("/signup")
def signup(payload: UserSignupRequest):
    # ... validation ...

    success, method = orchestrator.send_otp_with_fallback(
        user_email=payload.email,
        user_phone=payload.phone_number,
        otp_code=otp_code,
        user_name=payload.name
    )

    if not success:
        raise HTTPException(status_code=500, detail="Failed to send OTP")

    return {
        "message": f"Verification code sent via {method}",
        "method": method
    }
```

### Benefits

- ✅ Easy to switch notification providers (change one line in config)
- ✅ No vendor lock-in - business logic independent of provider
- ✅ Add new providers without changing existing code
- ✅ Easy to mock for testing
- ✅ Consistent interface across all notification methods
- ✅ Fallback strategies possible

---

## Complete Integration Example

Here's a complete example showing all patterns working together in an auth endpoint:

```python
# backend/app/routes/auth.py

from fastapi import APIRouter, Depends, Request, HTTPException
from typing import Optional
import logging

# Pattern imports
from ..services.auth.strategies import PasswordAuthenticationStrategy, OTPAuthenticationStrategy
from ..repositories.builders import MongoQueryBuilder
from ..core.validation import (
    ValidationChain,
    EmailFormatValidator,
    EmailDomainValidator,
    PasswordLengthValidator,
    PasswordStrengthValidator,
    PasswordCommonValidator,
)
from ..infrastructure.notifications import NotificationMessage, NotificationChannel
from ..infrastructure.http import ClientInfoExtractor

# Exception imports
from ..core.exceptions.auth import InvalidCredentialsError, AuthenticationError
from ..core.exceptions.business import AccountDeactivatedError
from ..core.exceptions.validation import ValidationError

# Service imports
from ..services import auth as auth_services
from ..core.notifications import get_sms_notification_service
from ..schema.auth import UserSignupRequest, UserLoginRequest, AuthResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/auth", tags=["Authentication"])

# ============================================================================
# VALIDATION CHAINS (Created once, reused across endpoints)
# ============================================================================

SIGNUP_VALIDATOR = (ValidationChain()
    .add(EmailFormatValidator())
    .add(EmailDomainValidator())
    .add(PasswordLengthValidator(min_length=8))
    .add(PasswordStrengthValidator())
    .add(PasswordCommonValidator())
    .build()
)

# ============================================================================
# ENDPOINTS
# ============================================================================

@router.post("/signup")
def signup(payload: UserSignupRequest, request: Request):
    """
    Complete signup endpoint using all 4 patterns.

    - Validation Chain: Validates email and password
    - Query Builder: Checks for existing users
    - Notification Adapter: Sends OTP
    - Strategy Pattern: (Used later in verify-otp)
    """
    try:
        # 1. VALIDATION CHAIN - Validate input
        validated_data = SIGNUP_VALIDATOR.handle({
            "email": payload.email,
            "password": payload.password.get_secret_value(),
        })

        email = validated_data["email"]  # Sanitized (lowercase, trimmed)
        password = validated_data["password"]

        # 2. QUERY BUILDER - Check if user exists
        users_collection = auth_services.get_users_collection()

        existing_user_query = (MongoQueryBuilder()
            .with_field("email", email)
            .build_filter_only()
        )

        if users_collection.find_one(existing_user_query):
            raise HTTPException(
                status_code=409,
                detail="User with this email already exists"
            )

        # Generate OTP and create pending signup
        otp_code = auth_services.generate_otp()
        auth_services.create_pending_signup(
            email=email,
            password=password,
            name=payload.name,
            otp_code=otp_code
        )

        # 3. ADAPTER PATTERN - Send OTP notification
        if payload.phone_number:
            # Send via SMS
            notification_service = get_sms_notification_service()
            message = NotificationMessage(
                recipient=payload.phone_number,
                message=f"Your Zygotrix verification code: {otp_code}",
                channel=NotificationChannel.SMS
            )
            result = notification_service.send(message)

            if not result.success:
                logger.warning(f"SMS failed, falling back to email: {result.error}")
                auth_services.send_signup_otp_email(email, otp_code, payload.name)
                method = "email"
            else:
                method = "sms"
        else:
            # Send via email
            auth_services.send_signup_otp_email(email, otp_code, payload.name)
            method = "email"

        return {
            "message": f"Verification code sent via {method}",
            "email": email,
            "method": method
        }

    except ValidationError:
        # Handled by exception handlers
        raise
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Signup error: {str(e)}")
        raise HTTPException(status_code=500, detail="Signup failed")


@router.post("/verify-otp", response_model=AuthResponse)
def verify_otp(
    email: str,
    otp_code: str,
    request: Request
) -> AuthResponse:
    """
    Verify OTP and complete signup.

    - Strategy Pattern: OTP authentication strategy
    """
    # 4. STRATEGY PATTERN - OTP Authentication
    strategy = OTPAuthenticationStrategy()

    user = strategy.authenticate({
        "email": email,
        "otp_code": otp_code
    })

    # Track user activity
    client_info = ClientInfoExtractor.extract_all(request)
    auth_services.update_user_activity(
        user_id=user["id"],
        ip_address=client_info["ip_address"],
        user_agent=client_info["user_agent"]
    )

    return AuthResponse(**auth_services.build_auth_response(user))


@router.post("/login", response_model=AuthResponse)
def login(payload: UserLoginRequest, request: Request) -> AuthResponse:
    """
    Login endpoint.

    - Strategy Pattern: Password authentication strategy
    """
    # STRATEGY PATTERN - Password Authentication
    strategy = PasswordAuthenticationStrategy()

    user = strategy.authenticate({
        "email": payload.email,
        "password": payload.password.get_secret_value()
    })

    # Track activity
    client_info = ClientInfoExtractor.extract_all(request)
    auth_services.update_user_activity(
        user_id=user["id"],
        ip_address=client_info["ip_address"],
        user_agent=client_info["user_agent"]
    )

    return AuthResponse(**auth_services.build_auth_response(user))


@router.get("/admin/users")
def get_users(
    page: int = 1,
    page_size: int = 20,
    search: Optional[str] = None,
    role: Optional[str] = None,
    is_active: Optional[bool] = None,
    admin: UserProfile = Depends(get_current_admin)
):
    """
    Get users with filtering (admin only).

    - Query Builder: Complex query construction
    """
    users_collection = auth_services.get_users_collection()

    # QUERY BUILDER - Build complex query
    builder = MongoQueryBuilder()

    if search:
        builder.with_or([
            {"email": {"$regex": search, "$options": "i"}},
            {"name": {"$regex": search, "$options": "i"}}
        ])

    if role:
        builder.with_field("user_role", role)

    if is_active is not None:
        builder.with_field("is_active", is_active)

    builder.sorted_by("created_at", descending=True).paginated(page, page_size)

    query_spec = builder.build()

    total = users_collection.count_documents(query_spec["filter"])
    users = list(
        users_collection.find(query_spec["filter"])
        .sort(query_spec["sort"])
        .skip(query_spec["skip"])
        .limit(query_spec["limit"])
    )

    return {
        "users": users,
        "total": total,
        "page": page,
        "page_size": page_size
    }
```

---

## Quick Reference

### When to Use Each Pattern

| Pattern | Use When | Example |
|---------|----------|---------|
| **Strategy** | Multiple ways to do the same thing | Different auth methods (password, OTP, OAuth) |
| **Builder** | Complex object construction with many options | MongoDB queries with filters, sorting, pagination |
| **Chain of Responsibility** | Sequential processing with multiple steps | Input validation, request processing pipeline |
| **Adapter** | Wrapping external services/APIs | SMS providers (Twilio, AWS SNS), email services |

### Pattern Benefits Summary

- **Strategy**: Swap algorithms/behaviors at runtime
- **Builder**: Readable construction of complex objects
- **Chain of Responsibility**: Flexible request processing pipeline
- **Adapter**: Decoupled from external service implementations

---

## Migration Checklist

- [ ] Update auth endpoints to use Strategy Pattern
- [ ] Replace manual query building with Builder Pattern
- [ ] Add Validation Chains to input validation
- [ ] Wrap notification services with Adapter Pattern
- [ ] Update service container with new pattern instances
- [ ] Test each pattern integration independently
- [ ] Update API documentation with new validation rules

---

**Last Updated**: December 24, 2025
**Status**: Ready for Integration
**Next Steps**: Begin integrating patterns into production routes one at a time
