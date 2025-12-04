from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any, Mapping, cast
from bson import ObjectId
from pymongo.collection import Collection
import secrets
import string
import httpx
import jwt
from fastapi import HTTPException
from passlib.context import CryptContext
from pymongo.errors import DuplicateKeyError, PyMongoError
from app.config import get_settings
from app.services.notifications import send_new_user_whatsapp_notification

_password_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
_OTP_LENGTH = 6
_MAX_OTP_ATTEMPTS = 5
user_cache = {}

# Utility functions


def _normalize_email(email: str) -> str:
    return email.strip().lower()


def _clean_full_name(full_name: Optional[str]) -> Optional[str]:
    if not full_name:
        return None
    cleaned = full_name.strip()
    return cleaned or None


def _serialize_datetime(dt: Any) -> Optional[str]:
    """Helper to serialize datetime to ISO format string."""
    if isinstance(dt, datetime):
        # If datetime is naive (no timezone), assume it's UTC
        if dt.tzinfo is None:
            utc_dt = dt.replace(tzinfo=timezone.utc)
        else:
            utc_dt = dt.astimezone(timezone.utc)
        return utc_dt.strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"
    return None


def _serialize_user(document: Mapping[str, Any]) -> Dict[str, Any]:
    created_at = document.get("created_at")
    if isinstance(created_at, datetime):
        created_iso = created_at.astimezone(timezone.utc).isoformat()
    else:
        created_iso = datetime.now(timezone.utc).isoformat()

    deactivated_at = document.get("deactivated_at")
    if isinstance(deactivated_at, datetime):
        deactivated_iso = deactivated_at.astimezone(timezone.utc).isoformat()
    else:
        deactivated_iso = None

    return {
        "id": str(document.get("_id")),
        "email": str(document.get("email", "")),
        "full_name": _clean_full_name(document.get("full_name")),
        "profile_picture_url": document.get("profile_picture_url"),
        "profile_picture_thumbnail_url": document.get("profile_picture_thumbnail_url"),
        "phone": document.get("phone"),
        "organization": document.get("organization"),
        "department": document.get("department"),
        "title": document.get("title"),
        "bio": document.get("bio"),
        "location": document.get("location"),
        "timezone": document.get("timezone"),
        "research_interests": document.get("research_interests"),
        "experience_level": document.get("experience_level"),
        "use_case": document.get("use_case"),
        "organism_focus": document.get("organism_focus"),
        "onboarding_completed": document.get("onboarding_completed", False),
        # University-specific onboarding fields
        "learning_goals": document.get("learning_goals"),
        "learning_style": document.get("learning_style"),
        "topics_of_interest": document.get("topics_of_interest"),
        "time_commitment": document.get("time_commitment"),
        "institution": document.get("institution"),
        "role": document.get("role"),
        "field_of_study": document.get("field_of_study"),
        "university_onboarding_completed": document.get("university_onboarding_completed", False),
        "preferences": document.get("preferences"),
        "created_at": created_iso,
        # Admin-related fields
        "user_role": document.get("user_role", "user"),
        "is_active": document.get("is_active", True),
        "deactivated_at": deactivated_iso,
        "deactivated_by": document.get("deactivated_by"),
        # Activity tracking fields
        "last_accessed_at": _serialize_datetime(document.get("last_accessed_at")),
        "last_ip_address": document.get("last_ip_address"),
        "last_location": document.get("last_location"),
        "last_browser": document.get("last_browser"),
        "login_history": _serialize_login_history(document.get("login_history")),
    }


def _serialize_login_history(history: Any) -> Optional[list]:
    """Serialize login history entries."""
    if not history or not isinstance(history, list):
        return None

    serialized = []
    for entry in history:
        if isinstance(entry, dict):
            serialized.append({
                "timestamp": _serialize_datetime(entry.get("timestamp")) or "",
                "ip_address": entry.get("ip_address", "Unknown"),
                "location": entry.get("location", "Unknown"),
                "browser": entry.get("browser", "Unknown"),
            })

    # Return in reverse order (most recent first)
    return list(reversed(serialized)) if serialized else None


def hash_password(password: str) -> str:
    # bcrypt has a 72-byte limit, truncate if necessary
    if len(password.encode("utf-8")) > 72:
        password = password.encode(
            "utf-8")[:72].decode("utf-8", errors="ignore")
    return _password_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    try:
        # Apply same 72-byte truncation as hash_password for consistency
        if len(password.encode("utf-8")) > 72:
            password = password.encode(
                "utf-8")[:72].decode("utf-8", errors="ignore")
        return _password_context.verify(password, password_hash)
    except ValueError:
        return False


def generate_otp_code() -> str:
    return "".join(secrets.choice(string.digits) for _ in range(_OTP_LENGTH))


# MongoDB collection accessors


def get_users_collection(required: bool = False):
    from app.services.common import get_mongo_client

    client = get_mongo_client()
    if client is None:
        if required:
            raise HTTPException(
                status_code=503, detail="MongoDB connection is not configured."
            )
        return None
    settings = get_settings()
    database = client[settings.mongodb_db_name]
    collection = database[settings.mongodb_users_collection]
    try:
        collection.create_index("email", unique=True)
    except PyMongoError:
        pass
    return collection


def get_pending_signups_collection(required: bool = False):
    from .common import get_mongo_client

    client = get_mongo_client()
    if client is None:
        if required:
            raise HTTPException(
                status_code=503, detail="MongoDB connection is not configured."
            )
        return None
    settings = get_settings()
    database = client[settings.mongodb_db_name]
    collection = database[settings.mongodb_pending_signups_collection]
    try:
        collection.create_index("email", unique=True)
        collection.create_index("expires_at", expireAfterSeconds=0)
    except PyMongoError:
        pass
    return collection


# User account management


def _insert_user_document(
    email: str, password_hash: str, full_name: Optional[str]
) -> Dict[str, Any]:
    collection = cast(Collection, get_users_collection(required=True))
    name = _clean_full_name(full_name)
    settings = get_settings()

    # Check if this email is the super admin email
    normalized_email = _normalize_email(email)
    is_super_admin = normalized_email == _normalize_email(
        settings.super_admin_email) if settings.super_admin_email else False

    document = {
        "email": normalized_email,
        "password_hash": password_hash,
        "full_name": name,
        "created_at": datetime.now(timezone.utc),
        "user_role": "super_admin" if is_super_admin else "user",
        "is_active": True,
    }
    try:
        result = collection.insert_one(document)
    except DuplicateKeyError:
        raise HTTPException(
            status_code=400, detail="Email is already registered.")
    except PyMongoError as exc:
        raise HTTPException(
            status_code=500, detail=f"Failed to create user: {exc}"
        ) from exc
    document["_id"] = result.inserted_id
    return _serialize_user(document)


def create_user_account(
    email: str, password: str, full_name: Optional[str]
) -> Dict[str, Any]:
    return _insert_user_document(email, hash_password(password), full_name)


def _get_user_document_by_email(email: str) -> Optional[Dict[str, Any]]:
    collection = get_users_collection()
    if collection is None:
        return None
    return collection.find_one({"email": _normalize_email(email)})


def get_pending_signup(email: str) -> Optional[Dict[str, Any]]:
    collection = get_pending_signups_collection()
    if collection is None:
        return None
    return collection.find_one({"email": _normalize_email(email)})


# Email sending


def _send_resend_email(api_key: str, payload: Dict[str, Any]) -> httpx.Response:
    return httpx.post(
        "https://api.resend.com/emails",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        json=payload,
        timeout=10.0,
    )


def _extract_resend_error(response: httpx.Response) -> str:
    try:
        data = response.json()
    except ValueError:
        text = response.text.strip()
        return text or response.reason_phrase or "unknown error"
    if isinstance(data, dict):
        return str(
            data.get("message") or data.get(
                "error") or data.get("detail") or data
        )
    return str(data)


def send_signup_otp_email(
    recipient: str, otp_code: str, full_name: Optional[str]
) -> None:
    settings = get_settings()
    api_key = settings.resend_api_key
    if not api_key:
        raise HTTPException(
            status_code=503, detail="Email service is not configured.")
    if api_key.startswith("test"):
        return
    subject = "Your Zygotrix verification code"
    greeting = full_name or "there"
    minutes = get_settings().signup_otp_ttl_minutes
    html_content = f"""
        <table role='presentation' style='width:100%;background-color:#0f172a;padding:24px;font-family:Segoe UI,Roboto,'Helvetica Neue',Arial,sans-serif;'>
          <tr>
            <td align='center'>
              <table role='presentation' style='max-width:520px;width:100%;background-color:#ffffff;border-radius:16px;padding:32px;text-align:left;'>
                <tr>
                  <td>
                    <p style='color:#0f172a;font-size:13px;margin:0 0 12px;text-transform:uppercase;letter-spacing:0.28em;'>Email Verification</p>
                    <h1 style='color:#0f172a;font-size:26px;margin:0 0 18px;'>Hi {greeting},</h1>
                    <p style='color:#1f2937;font-size:15px;line-height:1.6;margin:0 0 20px;'>Use the one-time code below to finish setting up your Zygotrix portal account.</p>
                    <div style='display:inline-block;padding:14px 24px;background-color:#0f172a;color:#f8fafc;border-radius:12px;font-size:28px;letter-spacing:0.35em;font-weight:700;'>
                      {otp_code}
                    </div>
                    <p style='color:#475569;font-size:14px;line-height:1.6;margin:24px 0 12px;'>This code expires in {minutes} minutes. Enter it on the verification screen to continue.</p>
                    <p style='color:#94a3b8;font-size:13px;line-height:1.6;margin:0;'>Didn't request this? You can safely ignore this email and your account will remain unchanged.</p>
                  </td>
                </tr>
              </table>
              <p style='color:#94a3b8;font-size:12px;margin:18px 0 0;'>Zygotrix - Advanced Genetics Intelligence</p>
            </td>
          </tr>
        </table>
    """
    text_content = (
        f"Hi {greeting},\n\n"
        f"Your Zygotrix verification code is {otp_code}.\n"
        f"This code expires in {minutes} minutes.\n\n"
        "If you didn't request this email, you can ignore it."
    )
    from_email = settings.resend_from_email or "onboarding@resend.dev"
    payload = {
        "from": from_email,
        "to": [recipient],
        "subject": subject,
        "html": html_content,
        "text": text_content,
    }
    try:
        response = _send_resend_email(api_key, payload)
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=503, detail=f"Failed to send OTP email: {exc}"
        ) from exc
    if response.status_code < 400:
        return
    if from_email != "onboarding@resend.dev":
        fallback_payload = dict(payload, **{"from": "onboarding@resend.dev"})
        try:
            fallback_response = _send_resend_email(api_key, fallback_payload)
        except httpx.HTTPError as exc:
            raise HTTPException(
                status_code=503, detail=f"Failed to send OTP email: {exc}"
            ) from exc
        if fallback_response.status_code < 400:
            return
        response = fallback_response
    detail = _extract_resend_error(response)
    raise HTTPException(
        status_code=503,
        detail=f"Email service error ({response.status_code}): {detail}",
    )


# Signup and authentication


def request_signup_otp(email: str, password: str, full_name: Optional[str]) -> datetime:
    # In development mode, bypass OTP and create the account immediately
    if get_settings().is_development:
        if _get_user_document_by_email(email):
            raise HTTPException(
                status_code=400, detail="Email is already registered.")
        create_user_account(email=email, password=password,
                            full_name=full_name)
        # Return an immediate expiry timestamp; route will still fit response model
        return datetime.now(timezone.utc)
    if _get_user_document_by_email(email):
        raise HTTPException(
            status_code=400, detail="Email is already registered.")
    collection = get_pending_signups_collection(required=True)
    assert collection is not None, "Pending signups collection is required"
    normalized_email = _normalize_email(email)
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(minutes=get_settings().signup_otp_ttl_minutes)
    otp_code = generate_otp_code()
    pending_document = {
        "email": normalized_email,
        "password_hash": hash_password(password),
        "full_name": _clean_full_name(full_name),
        "otp_hash": hash_password(otp_code),
        "otp_expires_at": expires_at,
        "otp_attempts": 0,
        "created_at": now,
        "updated_at": now,
    }
    try:
        collection.update_one(
            {"email": normalized_email},
            {"$set": pending_document},
            upsert=True,
        )
    except PyMongoError as exc:
        raise HTTPException(
            status_code=500, detail=f"Failed to start signup: {exc}"
        ) from exc
    send_signup_otp_email(normalized_email, otp_code,
                          pending_document["full_name"])
    return expires_at


def verify_signup_otp(email: str, otp: str) -> Dict[str, Any]:
    # In development mode, if the user already exists (created during signup),
    # simply return the user without OTP verification to smooth the dev flow.
    if get_settings().is_development:
        existing = _get_user_document_by_email(email)
        if existing:
            return _serialize_user(existing)
    collection = get_pending_signups_collection(required=True)
    assert collection is not None, "Pending signups collection is required"
    normalized_email = _normalize_email(email)
    pending = collection.find_one({"email": normalized_email})
    if not pending:
        raise HTTPException(
            status_code=400, detail="No pending signup found for this email."
        )
    now = datetime.now(timezone.utc)
    expires_at = pending.get("otp_expires_at")
    # Ensure timezone consistency for comparison
    if expires_at:
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at < now:
            collection.delete_one({"email": normalized_email})
            raise HTTPException(
                status_code=400, detail="OTP has expired. Please request a new code."
            )
    attempts = int(pending.get("otp_attempts", 0))
    if attempts >= _MAX_OTP_ATTEMPTS:
        collection.delete_one({"email": normalized_email})
        raise HTTPException(
            status_code=400, detail="Too many invalid attempts. Please restart signup."
        )
    otp_hash = str(pending.get("otp_hash", ""))
    if not verify_password(otp, otp_hash):
        collection.update_one(
            {"email": normalized_email},
            {"$inc": {"otp_attempts": 1}, "$set": {"updated_at": now}},
        )
        raise HTTPException(
            status_code=400, detail="Invalid OTP. Please try again.")
    password_hash = str(pending.get("password_hash", ""))
    full_name = pending.get("full_name")
    user = _insert_user_document(normalized_email, password_hash, full_name)
    collection.delete_one({"email": normalized_email})

    # Send WhatsApp notification to admin about new registration
    # This runs asynchronously and doesn't block the signup process
    try:
        send_new_user_whatsapp_notification(
            email=normalized_email,
            full_name=full_name
        )
    except Exception:
        # Don't fail signup if notification fails
        pass

    return user


def resend_signup_otp(email: str) -> datetime:
    # In development mode, there's no OTP; just return a timestamp
    if get_settings().is_development:
        return datetime.now(timezone.utc)
    collection = get_pending_signups_collection(required=True)
    assert collection is not None, "Pending signups collection is required"
    normalized_email = _normalize_email(email)
    pending = collection.find_one({"email": normalized_email})
    if not pending:
        raise HTTPException(
            status_code=400, detail="No pending signup found for this email."
        )
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(minutes=get_settings().signup_otp_ttl_minutes)
    otp_code = generate_otp_code()
    try:
        collection.update_one(
            {"email": normalized_email},
            {
                "$set": {
                    "otp_hash": hash_password(otp_code),
                    "otp_expires_at": expires_at,
                    "otp_attempts": 0,
                    "updated_at": now,
                }
            },
        )
    except PyMongoError as exc:
        raise HTTPException(
            status_code=500, detail=f"Failed to resend OTP: {exc}"
        ) from exc
    send_signup_otp_email(normalized_email, otp_code, pending.get("full_name"))
    return expires_at


def authenticate_user(email: str, password: str) -> Dict[str, Any]:
    collection = get_users_collection(required=True)
    assert collection is not None, "Users collection is required"
    user = collection.find_one({"email": _normalize_email(email)})
    if not user or not verify_password(password, str(user.get("password_hash", ""))):
        raise HTTPException(
            status_code=401, detail="Invalid email or password.")
    return _serialize_user(user)


def clear_user_cache(user_id: Optional[str] = None):
    global user_cache
    if user_id:
        user_cache.pop(user_id, None)
    else:
        user_cache.clear()


def get_user_by_id(user_id: str) -> Dict[str, Any]:
    if user_id in user_cache:
        cached_user, cache_time = user_cache[user_id]
        if datetime.now(timezone.utc) - cache_time < timedelta(minutes=5):
            return cached_user
    collection = get_users_collection(required=True)
    assert collection is not None, "Users collection is required"
    try:
        object_id = ObjectId(user_id)
    except Exception as exc:
        raise HTTPException(
            status_code=401, detail="Invalid authentication token."
        ) from exc
    user = collection.find_one({"_id": object_id})
    if not user:
        raise HTTPException(status_code=401, detail="User not found.")
    serialized_user = _serialize_user(user)
    user_cache[user_id] = (serialized_user, datetime.now(timezone.utc))
    return serialized_user


def create_access_token(
    user_id: str, extra_claims: Optional[Mapping[str, Any]] = None
) -> str:
    settings = get_settings()
    now = datetime.now(timezone.utc)
    payload: Dict[str, Any] = {
        "sub": user_id,
        "iat": int(now.timestamp()),
        "exp": int(
            (now + timedelta(minutes=settings.auth_token_ttl_minutes)).timestamp()
        ),
    }
    if extra_claims:
        payload.update(dict(extra_claims))
    return jwt.encode(
        payload, settings.auth_secret_key, algorithm=settings.auth_jwt_algorithm
    )


def decode_access_token(token: str) -> Dict[str, Any]:
    settings = get_settings()
    try:
        return jwt.decode(
            token, settings.auth_secret_key, algorithms=[
                settings.auth_jwt_algorithm]
        )
    except jwt.ExpiredSignatureError as exc:
        raise HTTPException(
            status_code=401, detail="Authentication token has expired."
        ) from exc
    except jwt.PyJWTError as exc:  # type: ignore[attr-defined]
        raise HTTPException(
            status_code=401, detail="Invalid authentication token."
        ) from exc


def resolve_user_from_token(token: str) -> Dict[str, Any]:
    payload = decode_access_token(token)
    user_id = payload.get("sub")
    if not isinstance(user_id, str):
        raise HTTPException(
            status_code=401, detail="Invalid authentication token.")
    return get_user_by_id(user_id)


def build_auth_response(user: Dict[str, Any]) -> Dict[str, Any]:
    access_token = create_access_token(user["id"])
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user,
    }


def update_user_profile(user_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
    """Update user profile fields and return the updated user."""
    collection = get_users_collection(required=True)
    assert collection is not None, "Users collection is required"

    try:
        object_id = ObjectId(user_id)
    except Exception as exc:
        raise HTTPException(
            status_code=401, detail="Invalid user ID."
        ) from exc

    # Clean the full_name if it's being updated
    if "full_name" in updates:
        updates["full_name"] = _clean_full_name(updates["full_name"])

    # Filter out None values to avoid overwriting existing data
    filtered_updates = {k: v for k, v in updates.items() if v is not None}

    if not filtered_updates:
        # If no updates provided, just return current user
        return get_user_by_id(user_id)

    try:
        result = collection.update_one(
            {"_id": object_id},
            {"$set": filtered_updates}
        )

        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="User not found.")

        # Clear cache for this user
        clear_user_cache(user_id)

        # Return updated user
        return get_user_by_id(user_id)
    except PyMongoError as exc:
        raise HTTPException(
            status_code=500, detail=f"Failed to update profile: {exc}"
        ) from exc


def _parse_user_agent(user_agent: Optional[str]) -> str:
    """Parse user agent string to get browser info."""
    if not user_agent:
        return "Unknown"

    # Simple parsing - can be enhanced with user-agents library
    ua_lower = user_agent.lower()

    if "edge" in ua_lower or "edg/" in ua_lower:
        return "Microsoft Edge"
    elif "chrome" in ua_lower and "chromium" not in ua_lower:
        return "Google Chrome"
    elif "firefox" in ua_lower:
        return "Mozilla Firefox"
    elif "safari" in ua_lower and "chrome" not in ua_lower:
        return "Apple Safari"
    elif "opera" in ua_lower or "opr/" in ua_lower:
        return "Opera"
    elif "msie" in ua_lower or "trident" in ua_lower:
        return "Internet Explorer"
    else:
        return "Unknown Browser"


def _get_location_from_ip(ip_address: Optional[str]) -> Optional[str]:
    """Get location from IP address using free IP geolocation API."""
    if not ip_address or ip_address in ["127.0.0.1", "localhost", "::1"]:
        return "Local"

    try:
        # Using ip-api.com (free tier, 45 requests per minute)
        response = httpx.get(
            f"http://ip-api.com/json/{ip_address}?fields=status,country,city",
            timeout=5.0
        )
        if response.status_code == 200:
            data = response.json()
            if data.get("status") == "success":
                city = data.get("city", "")
                country = data.get("country", "")
                if city and country:
                    return f"{city}, {country}"
                return country or city or None
    except Exception:
        pass

    return None


def update_user_activity(
    user_id: str,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
) -> None:
    """Update user's last activity information and login history."""
    collection = get_users_collection(required=True)
    assert collection is not None, "Users collection is required"

    try:
        object_id = ObjectId(user_id)
    except Exception:
        return

    now = datetime.now(timezone.utc)
    browser = _parse_user_agent(user_agent) if user_agent else "Unknown"
    location = _get_location_from_ip(ip_address) if ip_address else None

    # Create login history entry
    login_entry = {
        "timestamp": now,
        "ip_address": ip_address or "Unknown",
        "location": location or "Unknown",
        "browser": browser,
    }

    updates: Dict[str, Any] = {
        "last_accessed_at": now,
        "last_ip_address": ip_address,
        "last_location": location,
        "last_browser": browser,
    }

    try:
        # Update last activity and push to login history (keep last 10)
        collection.update_one(
            {"_id": object_id},
            {
                "$set": updates,
                "$push": {
                    "login_history": {
                        "$each": [login_entry],
                        "$slice": -10  # Keep only last 10 entries
                    }
                }
            }
        )
        # Clear cache for this user
        clear_user_cache(user_id)
    except PyMongoError:
        pass  # Silently fail - activity tracking is not critical
