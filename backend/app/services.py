"""Domain services wrapping zygotrix_engine for API consumption."""

from __future__ import annotations

import json
import os
import secrets
import string
from datetime import datetime, timedelta, timezone
from functools import lru_cache
from typing import TYPE_CHECKING, Any, Dict, Iterable, List, Mapping, Optional, Tuple

import httpx
import jwt
from bson import ObjectId
from fastapi import HTTPException
from passlib.context import CryptContext
from pymongo import MongoClient
from pymongo.collection import Collection
from pymongo.errors import DuplicateKeyError, PyMongoError

from zygotrix_engine import (
    BLOOD_TYPE,
    EYE_COLOR,
    HAIR_COLOR,
    PolygenicCalculator,
    Simulator,
    Trait,
)

from .config import get_settings


if TYPE_CHECKING:
    # Import Pydantic schema types for type checkers only to avoid circular imports
    from .schemas import (
        Project,
        ProjectLine,
        ProjectLinePayload,
        ProjectLineSaveResponse,
        ProjectLineSaveSummary,
        ProjectLineSnapshot,
        ProjectNote,
        ProjectNotePayload,
        ProjectNoteSaveResponse,
        ProjectNoteSaveSummary,
        ProjectNoteSnapshot,
        ProjectDrawing,
        ProjectDrawingPayload,
        ProjectDrawingSaveResponse,
        ProjectDrawingSaveSummary,
        ProjectDrawingSnapshot,
        ProjectTemplate,
    )


def _load_real_gene_traits() -> Dict[str, Trait]:
    """Load real gene traits from the traits_dataset.json file."""
    # Get the directory of the current file
    current_dir = os.path.dirname(os.path.abspath(__file__))
    # Navigate to the data directory
    traits_file_path = os.path.join(current_dir, "..", "data", "traits_dataset.json")

    if not os.path.exists(traits_file_path):
        return {}

    try:
        with open(traits_file_path, "r", encoding="utf-8") as f:
            traits_data = json.load(f)

        real_gene_traits = {}
        for trait_data in traits_data:
            # Convert trait name to key format (lowercase, underscores)
            trait_key = trait_data["trait"].lower().replace(" ", "_").replace("-", "_")

            # Create metadata with real gene information
            metadata = {
                "gene": trait_data["gene"],
                "chromosome": str(trait_data["chromosome"]),
                "inheritance_pattern": trait_data["inheritance"],
                "category": "real_gene",
                "verification_status": "verified",
            }

            # Create the Trait object
            trait = Trait(
                name=trait_data["trait"],
                alleles=tuple(trait_data["alleles"]),
                phenotype_map=trait_data["phenotypes"],
                description=f"Real gene trait - {trait_data['gene']} gene on chromosome {trait_data['chromosome']}",
                metadata=metadata,
            )

            real_gene_traits[trait_key] = trait

        return real_gene_traits
    except (json.JSONDecodeError, KeyError, FileNotFoundError) as e:
        print(f"Warning: Could not load real gene traits: {e}")
        return {}


REAL_GENE_TRAITS = _load_real_gene_traits()
ALL_TRAITS = dict(REAL_GENE_TRAITS)

_mongo_client: Optional[MongoClient] = None
_password_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
_OTP_LENGTH = 6
_MAX_OTP_ATTEMPTS = 5


def _ensure_utc(dt: object) -> Optional[datetime]:
    if isinstance(dt, datetime):
        return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
    return None


def _build_trait_from_document(document: Mapping[str, object]) -> Trait:
    # Extract base metadata and enhance with new fields for backward compatibility
    base_metadata: Dict[str, str] = {}

    # Handle existing metadata dictionary
    metadata_obj = document.get("metadata", {})
    if isinstance(metadata_obj, dict):
        base_metadata.update({str(k): str(v) for k, v in metadata_obj.items()})

    # Add new Mendelian trait metadata fields if they exist
    if "inheritance_pattern" in document and document["inheritance_pattern"]:
        base_metadata["inheritance_pattern"] = str(document["inheritance_pattern"])
    if "verification_status" in document and document["verification_status"]:
        base_metadata["verification_status"] = str(document["verification_status"])
    if "gene_info" in document and document["gene_info"]:
        base_metadata["gene_info"] = str(document["gene_info"])
    if "category" in document and document["category"]:
        base_metadata["category"] = str(document["category"])

    # Handle alleles list
    alleles_obj = document.get("alleles", [])
    alleles_list = []
    if isinstance(alleles_obj, (list, tuple)):
        alleles_list = [str(allele) for allele in alleles_obj]

    # Handle phenotype_map dictionary
    phenotype_obj = document.get("phenotype_map", {})
    phenotype_dict: Dict[str, str] = {}
    if isinstance(phenotype_obj, dict):
        phenotype_dict = {str(k): str(v) for k, v in phenotype_obj.items()}

    return Trait(
        name=str(document.get("name", "")),
        alleles=tuple(alleles_list),
        phenotype_map=phenotype_dict,
        description=str(document.get("description", "")),
        metadata=base_metadata,
    )


def _normalize_email(email: str) -> str:
    return email.strip().lower()


def _clean_full_name(full_name: Optional[str]) -> Optional[str]:
    if not full_name:
        return None
    cleaned = full_name.strip()
    return cleaned or None


def _serialize_user(document: Mapping[str, Any]) -> Dict[str, Any]:
    created_at = document.get("created_at")
    if isinstance(created_at, datetime):
        created_iso = created_at.astimezone(timezone.utc).isoformat()
    else:
        created_iso = datetime.now(timezone.utc).isoformat()
    return {
        "id": str(document.get("_id")),
        "email": str(document.get("email", "")),
        "full_name": _clean_full_name(document.get("full_name")),
        "created_at": created_iso,
    }


def hash_password(password: str) -> str:
    return _password_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return _password_context.verify(password, password_hash)
    except ValueError:
        return False


def generate_otp_code() -> str:
    return "".join(secrets.choice(string.digits) for _ in range(_OTP_LENGTH))


def get_mongo_client() -> Optional[MongoClient]:
    settings = get_settings()
    global _mongo_client

    if not settings.mongodb_uri:
        return None

    if _mongo_client is not None:
        return _mongo_client

    try:
        if settings.mongodb_uri.startswith("mongomock://"):
            import mongomock  # type: ignore

            _mongo_client = mongomock.MongoClient()
        else:
            # Optimize MongoDB connection with connection pooling
            _mongo_client = MongoClient(
                settings.mongodb_uri,
                maxPoolSize=50,  # Maximum number of connections
                minPoolSize=10,  # Minimum number of connections
                maxIdleTimeMS=30000,  # Close connections after 30 seconds idle
                serverSelectionTimeoutMS=5000,  # Timeout for server selection
                socketTimeoutMS=20000,  # Socket timeout
                connectTimeoutMS=20000,  # Connection timeout
            )
    except PyMongoError as exc:  # pragma: no cover
        raise HTTPException(
            status_code=503, detail=f"Unable to connect to MongoDB: {exc}"
        ) from exc

    return _mongo_client


def get_traits_collection(required: bool = False) -> Optional[Collection]:
    client = get_mongo_client()
    if client is None:
        if required:
            raise HTTPException(
                status_code=503, detail="MongoDB connection is not configured."
            )
        return None

    settings = get_settings()
    database = client[settings.mongodb_db_name]
    return database[settings.mongodb_traits_collection]


def get_users_collection(required: bool = False) -> Optional[Collection]:
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


def get_pending_signups_collection(required: bool = False) -> Optional[Collection]:
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


def get_projects_collection(required: bool = False) -> Optional[Collection]:
    client = get_mongo_client()
    if client is None:
        if required:
            raise HTTPException(
                status_code=503, detail="MongoDB connection is not configured."
            )
        return None

    settings = get_settings()
    database = client[settings.mongodb_db_name]
    collection = database["projects"]
    try:
        collection.create_index("owner_id")
        collection.create_index("created_at")
        collection.create_index("is_template")
    except PyMongoError:
        pass
    return collection


def get_project_lines_collection(required: bool = False) -> Optional[Collection]:
    client = get_mongo_client()
    if client is None:
        if required:
            raise HTTPException(
                status_code=503, detail="MongoDB connection is not configured."
            )
        return None

    settings = get_settings()
    database = client[settings.mongodb_db_name]
    collection = database[settings.mongodb_project_lines_collection]
    try:
        collection.create_index([("project_id", 1), ("line_id", 1)], unique=True)
        collection.create_index("project_id")
        collection.create_index("updated_at")
    except PyMongoError:
        pass
    return collection


def get_project_notes_collection(required: bool = False) -> Optional[Collection]:
    client = get_mongo_client()
    if client is None:
        if required:
            raise HTTPException(
                status_code=503, detail="MongoDB connection is not configured."
            )
        return None

    settings = get_settings()
    database = client[settings.mongodb_db_name]
    collection = database[settings.mongodb_project_notes_collection]
    try:
        collection.create_index([("project_id", 1), ("note_id", 1)], unique=True)
        collection.create_index("project_id")
        collection.create_index("updated_at")
    except PyMongoError:
        pass
    return collection


def get_project_drawings_collection(required: bool = False) -> Optional[Collection]:
    client = get_mongo_client()
    if client is None:
        if required:
            raise HTTPException(
                status_code=503, detail="MongoDB connection is not configured."
            )
        return None

    settings = get_settings()
    database = client[settings.mongodb_db_name]
    collection = database[settings.mongodb_project_drawings_collection]
    try:
        collection.create_index([("project_id", 1), ("drawing_id", 1)], unique=True)
        collection.create_index("project_id")
        collection.create_index("updated_at")
    except PyMongoError:
        pass
    return collection


def fetch_persistent_traits() -> Dict[str, Trait]:
    collection = get_traits_collection()
    if collection is None:
        return {}

    persistent: Dict[str, Trait] = {}
    try:
        documents = collection.find()
    except PyMongoError:
        return persistent

    for document in documents:
        key = str(document.get("key"))
        if not key:
            continue
        try:
            persistent[key] = _build_trait_from_document(document)
        except Exception:
            continue
    return persistent


def fetch_filtered_traits(
    inheritance_pattern: Optional[str] = None,
    verification_status: Optional[str] = None,
    category: Optional[str] = None,
    gene_info: Optional[str] = None,
) -> Dict[str, Trait]:
    """Fetch traits from MongoDB with optional filtering by metadata fields."""

    collection = get_traits_collection()
    if collection is None:
        return {}

    # Build MongoDB query filter
    query_filter = {}
    if inheritance_pattern:
        query_filter["inheritance_pattern"] = inheritance_pattern
    if verification_status:
        query_filter["verification_status"] = verification_status
    if category:
        query_filter["category"] = category
    if gene_info:
        query_filter["gene_info"] = gene_info

    filtered_traits: Dict[str, Trait] = {}
    try:
        documents = collection.find(query_filter)
        for document in documents:
            key = str(document.get("key"))
            if not key:
                continue
            try:
                filtered_traits[key] = _build_trait_from_document(document)
            except Exception:
                continue
    except PyMongoError:
        pass

    return filtered_traits


def get_trait_registry(
    inheritance_pattern: Optional[str] = None,
    verification_status: Optional[str] = None,
    category: Optional[str] = None,
    gene_info: Optional[str] = None,
) -> Dict[str, Trait]:
    """Get trait registry with optional filtering."""

    # Always include all traits (default + real gene traits)
    registry = dict(ALL_TRAITS)

    # If no filters are applied, get all persistent traits
    if not any([inheritance_pattern, verification_status, category, gene_info]):
        registry.update(fetch_persistent_traits())
    else:
        # Apply filters to persistent traits only
        registry.update(
            fetch_filtered_traits(
                inheritance_pattern=inheritance_pattern,
                verification_status=verification_status,
                category=category,
                gene_info=gene_info,
            )
        )

    return registry


def get_simulator() -> Simulator:
    """Instantiate a simulator using the latest trait registry."""

    return Simulator(trait_registry=get_trait_registry())


@lru_cache(maxsize=1)
def get_polygenic_calculator() -> PolygenicCalculator:
    """Return a singleton polygenic calculator."""

    return PolygenicCalculator()


def filter_traits(
    requested: Iterable[str] | None,
) -> Tuple[Dict[str, Trait], List[str]]:
    """Return the traits subset if a filter is provided and track missing keys."""

    registry = get_trait_registry()
    if not requested:
        return registry, []

    subset: Dict[str, Trait] = {}
    missing: List[str] = []
    for key in requested:
        if key in registry:
            subset[key] = registry[key]
        else:
            missing.append(key)
    if not subset:
        raise HTTPException(
            status_code=404, detail="None of the requested traits are available."
        )
    return subset, missing


def simulate_mendelian_traits(
    parent1: Mapping[str, str],
    parent2: Mapping[str, str],
    trait_filter: Iterable[str] | None,
    as_percentages: bool,
    max_traits: int = 5,
) -> Tuple[Dict[str, Dict[str, Dict[str, float]]], List[str]]:
    """Run Mendelian simulations and optionally filter trait outputs.

    Args:
        parent1: Parent 1 genotypes mapping
        parent2: Parent 2 genotypes mapping
        trait_filter: Optional filter for specific traits
        as_percentages: Return results as percentages
        max_traits: Maximum number of traits allowed (default: 5)

    Returns:
        Tuple of (results, missing_traits)

    Raises:
        ValueError: If more than max_traits are provided
    """

    registry, missing = filter_traits(trait_filter)

    # Validate trait count
    trait_keys = set(parent1.keys()) & set(parent2.keys()) & set(registry.keys())
    if len(trait_keys) > max_traits:
        raise ValueError(f"Maximum {max_traits} traits allowed, got {len(trait_keys)}")

    simulator = Simulator(trait_registry=registry)

    parent1_filtered = {key: parent1[key] for key in parent1 if key in registry}
    parent2_filtered = {key: parent2[key] for key in parent2 if key in registry}

    results = simulator.simulate_mendelian_traits(
        parent1_filtered,
        parent2_filtered,
        as_percentages=as_percentages,
        max_traits=max_traits,
    )
    ordered_results: Dict[str, Dict[str, Dict[str, float]]] = {}
    for key in registry.keys() if not trait_filter else trait_filter:
        if key in results:
            ordered_results[key] = results[key]

    return ordered_results, missing


def simulate_joint_phenotypes(
    parent1: Mapping[str, str],
    parent2: Mapping[str, str],
    trait_filter: Iterable[str] | None,
    as_percentages: bool,
    max_traits: int = 5,
) -> Tuple[Dict[str, float], List[str]]:
    """Run joint phenotype simulations across multiple traits.

    Args:
        parent1: Parent 1 genotypes mapping
        parent2: Parent 2 genotypes mapping
        trait_filter: Optional filter for specific traits
        as_percentages: Return results as percentages
        max_traits: Maximum number of traits allowed (default: 5)

    Returns:
        Tuple of (joint_phenotype_results, missing_traits)

    Raises:
        ValueError: If more than max_traits are provided
    """

    registry, missing = filter_traits(trait_filter)

    # Validate trait count
    trait_keys = set(parent1.keys()) & set(parent2.keys()) & set(registry.keys())
    if len(trait_keys) > max_traits:
        raise ValueError(f"Maximum {max_traits} traits allowed, got {len(trait_keys)}")

    simulator = Simulator(trait_registry=registry)

    parent1_filtered = {key: parent1[key] for key in parent1 if key in registry}
    parent2_filtered = {key: parent2[key] for key in parent2 if key in registry}

    results = simulator.simulate_joint_phenotypes(
        parent1_filtered,
        parent2_filtered,
        as_percentages=as_percentages,
        max_traits=max_traits,
    )

    return results, missing


def get_possible_genotypes_for_traits(
    trait_keys: List[str],
    max_traits: int = 5,
) -> Tuple[Dict[str, List[str]], List[str]]:
    """Get all possible genotypes for given trait keys.

    Args:
        trait_keys: List of trait keys to get genotypes for
        max_traits: Maximum number of traits allowed (default: 5)

    Returns:
        Tuple of (genotypes_mapping, missing_traits)

    Raises:
        ValueError: If more than max_traits are provided
    """
    if len(trait_keys) > max_traits:
        raise ValueError(f"Maximum {max_traits} traits allowed, got {len(trait_keys)}")

    registry, missing = filter_traits(trait_keys)
    simulator = Simulator(trait_registry=registry)

    # Filter out missing traits from the request
    valid_trait_keys = [key for key in trait_keys if key in registry]

    try:
        genotypes = simulator.get_possible_genotypes_for_traits(valid_trait_keys)
        return genotypes, missing
    except ValueError as e:
        raise ValueError(str(e)) from e


def calculate_polygenic_score(
    parent1_genotype: Mapping[str, float],
    parent2_genotype: Mapping[str, float],
    weights: Mapping[str, float],
) -> float:
    """Forward the computation to the polygenic calculator with validation."""

    if not weights:
        raise HTTPException(status_code=400, detail="Weights mapping cannot be empty.")
    calculator = get_polygenic_calculator()
    return calculator.calculate_polygenic_score(
        parent1_genotype, parent2_genotype, weights
    )


def save_trait(key: str, definition: Mapping[str, object]) -> Trait:
    collection = get_traits_collection(required=True)
    assert collection is not None, "Traits collection is required"
    trait = _build_trait_from_document({"key": key, **definition})

    # Prepare the document for MongoDB with enhanced fields
    document_update = {
        "key": key,
        "name": trait.name,
        "alleles": list(trait.alleles),
        "phenotype_map": dict(trait.phenotype_map),
        "description": trait.description,
        "metadata": dict(trait.metadata),
    }

    # Add new Mendelian trait fields if they exist in the definition
    if "inheritance_pattern" in definition:
        document_update["inheritance_pattern"] = str(definition["inheritance_pattern"])
    if "verification_status" in definition:
        document_update["verification_status"] = str(definition["verification_status"])
    if "gene_info" in definition:
        document_update["gene_info"] = (
            str(definition["gene_info"]) if definition["gene_info"] else None
        )
    if "category" in definition:
        document_update["category"] = str(definition["category"])

    try:
        collection.update_one(
            {"key": key},
            {"$set": document_update},
            upsert=True,
        )
    except PyMongoError as exc:
        raise HTTPException(
            status_code=500, detail=f"Failed to save trait: {exc}"
        ) from exc

    return trait


def delete_trait(key: str) -> None:
    collection = get_traits_collection(required=True)
    assert collection is not None, "Traits collection is required"
    try:
        result = collection.delete_one({"key": key})
    except PyMongoError as exc:
        raise HTTPException(
            status_code=500, detail=f"Failed to delete trait: {exc}"
        ) from exc

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail=f"Trait '{key}' does not exist.")


def _insert_user_document(
    email: str, password_hash: str, full_name: Optional[str]
) -> Dict[str, Any]:
    collection = get_users_collection(required=True)
    assert collection is not None, "Users collection is required"
    normalized_email = _normalize_email(email)
    name = _clean_full_name(full_name)
    document = {
        "email": normalized_email,
        "password_hash": password_hash,
        "full_name": name,
        "created_at": datetime.now(timezone.utc),
    }

    try:
        result = collection.insert_one(document)
    except DuplicateKeyError:
        raise HTTPException(status_code=400, detail="Email is already registered.")
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
            data.get("message") or data.get("error") or data.get("detail") or data
        )
    return str(data)


def send_signup_otp_email(
    recipient: str, otp_code: str, full_name: Optional[str]
) -> None:
    settings = get_settings()
    api_key = settings.resend_api_key
    if not api_key:
        raise HTTPException(status_code=503, detail="Email service is not configured.")

    if api_key.startswith("test"):
        return

    subject = "Your Zygotrix verification code"
    greeting = full_name or "there"
    minutes = get_settings().signup_otp_ttl_minutes
    html_content = f"""
        <table role='presentation' style='width:100%;background-color:#0f172a;padding:24px;font-family:Segoe UI,Roboto,"Helvetica Neue",Arial,sans-serif;'>
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


def request_signup_otp(email: str, password: str, full_name: Optional[str]) -> datetime:
    if _get_user_document_by_email(email):
        raise HTTPException(status_code=400, detail="Email is already registered.")

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

    send_signup_otp_email(normalized_email, otp_code, pending_document["full_name"])
    return expires_at


def verify_signup_otp(email: str, otp: str) -> Dict[str, Any]:
    collection = get_pending_signups_collection(required=True)
    assert collection is not None, "Pending signups collection is required"
    normalized_email = _normalize_email(email)
    pending = collection.find_one({"email": normalized_email})
    if not pending:
        raise HTTPException(
            status_code=400, detail="No pending signup found for this email."
        )

    now = datetime.now(timezone.utc)
    expires_at = _ensure_utc(pending.get("otp_expires_at"))
    if expires_at and expires_at < now:
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
        raise HTTPException(status_code=400, detail="Invalid OTP. Please try again.")

    password_hash = str(pending.get("password_hash", ""))
    full_name = pending.get("full_name")
    user = _insert_user_document(normalized_email, password_hash, full_name)

    collection.delete_one({"email": normalized_email})
    return user


def resend_signup_otp(email: str) -> datetime:
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
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    return _serialize_user(user)


# Cache for user data to avoid database hits on every request
user_cache = {}


def clear_user_cache(user_id: Optional[str] = None):
    """Clear user cache for a specific user or all users"""
    global user_cache
    if user_id:
        user_cache.pop(user_id, None)
    else:
        user_cache.clear()


def get_user_by_id(user_id: str) -> Dict[str, Any]:
    # Check cache first
    if user_id in user_cache:
        cached_user, cache_time = user_cache[user_id]
        # Cache for 5 minutes
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
    # Cache the user data
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
            token, settings.auth_secret_key, algorithms=[settings.auth_jwt_algorithm]
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
        raise HTTPException(status_code=401, detail="Invalid authentication token.")
    return get_user_by_id(user_id)


def build_auth_response(user: Dict[str, Any]) -> Dict[str, Any]:
    access_token = create_access_token(user["id"])
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user,
    }


def _serialize_project(document: Mapping[str, Any]) -> "Project":
    """Convert MongoDB project document to Project model."""
    from .schemas import MendelianProjectTool, Project

    tools_data = document.get("tools", [])
    tools = []
    if isinstance(tools_data, list):
        for tool_data in tools_data:
            if isinstance(tool_data, dict):
                tools.append(MendelianProjectTool(**tool_data))

    created_at = document.get("created_at")
    updated_at = document.get("updated_at")

    return Project(
        id=str(document.get("_id")),
        name=str(document.get("name", "")),
        description=document.get("description"),
        type=str(document.get("type", "genetics")),
        owner_id=str(document.get("owner_id", "")),
        tools=tools,
        created_at=_ensure_utc(created_at),
        updated_at=_ensure_utc(updated_at),
        tags=document.get("tags", []),
        is_template=bool(document.get("is_template", False)),
        template_category=document.get("template_category"),
        color=document.get("color", "bg-blue-500"),
    )


def _serialize_project_line(document: Mapping[str, Any]) -> ProjectLine:
    # Import ProjectLine and related types here to avoid runtime import when TYPE_CHECKING is used
    from .schemas import ProjectLine, ProjectLinePoint
    from typing import cast, Literal

    updated_at = _ensure_utc(document.get("updated_at")) or datetime.now(timezone.utc)

    start_point_doc = document.get("start_point", {})
    end_point_doc = document.get("end_point", {})

    def _coerce_point(data: Mapping[str, Any]) -> Dict[str, float]:
        try:
            return {
                "x": float(data.get("x", 0.0)),
                "y": float(data.get("y", 0.0)),
            }
        except (TypeError, ValueError):
            return {"x": 0.0, "y": 0.0}

    start = ProjectLinePoint(**_coerce_point(start_point_doc))
    end = ProjectLinePoint(**_coerce_point(end_point_doc))

    arrow_raw = str(document.get("arrow_type", "none"))
    if arrow_raw not in ("none", "end"):
        arrow_raw = "none"
    arrow = cast(Literal["none", "end"], arrow_raw)

    return ProjectLine(
        id=str(document.get("line_id", "")),
        project_id=str(document.get("project_id", "")),
        start_point=start,
        end_point=end,
        stroke_color=str(document.get("stroke_color", "#000000")),
        stroke_width=float(document.get("stroke_width", 1.0)),
        arrow_type=arrow,
        is_deleted=bool(document.get("is_deleted", False)),
        updated_at=updated_at,
        version=int(document.get("version", 0)),
        origin=document.get("origin"),
    )


def _serialize_project_note(document: Mapping[str, Any]) -> "ProjectNote":
    from .schemas import ProjectLinePoint, ProjectNote, ProjectNoteSize

    updated_at = _ensure_utc(document.get("updated_at")) or datetime.now(timezone.utc)

    position_doc = document.get("position", {})
    size_doc = document.get("size", {})

    def _coerce_point(data: Mapping[str, Any]) -> Dict[str, float]:
        try:
            return {
                "x": float(data.get("x", 0.0)),
                "y": float(data.get("y", 0.0)),
            }
        except (TypeError, ValueError):
            return {"x": 0.0, "y": 0.0}

    def _coerce_size(data: Mapping[str, Any]) -> Dict[str, float]:
        try:
            return {
                "width": float(data.get("width", 200.0)),
                "height": float(data.get("height", 120.0)),
            }
        except (TypeError, ValueError):
            return {"width": 200.0, "height": 120.0}

    position = ProjectLinePoint(**_coerce_point(position_doc))
    size = ProjectNoteSize(**_coerce_size(size_doc))

    origin_value = document.get("origin")
    origin = str(origin_value) if origin_value is not None else None

    return ProjectNote(
        id=str(document.get("note_id", "")),
        project_id=str(document.get("project_id", "")),
        content=str(document.get("content", "")),
        position=position,
        size=size,
        is_deleted=bool(document.get("is_deleted", False)),
        updated_at=updated_at,
        version=int(document.get("version", 0)),
        origin=origin,
    )


def _serialize_project_drawing(document: Mapping[str, Any]) -> "ProjectDrawing":
    from .schemas import ProjectDrawing, ProjectDrawingPoint

    updated_at = _ensure_utc(document.get("updated_at")) or datetime.now(timezone.utc)

    points_doc = document.get("points", [])
    points: List[ProjectDrawingPoint] = []
    if isinstance(points_doc, (list, tuple)):
        for point in points_doc:
            if isinstance(point, Mapping):
                try:
                    points.append(
                        ProjectDrawingPoint(
                            x=float(point.get("x", 0.0)),
                            y=float(point.get("y", 0.0)),
                        )
                    )
                except (TypeError, ValueError):
                    continue

    origin_value = document.get("origin")
    origin = str(origin_value) if origin_value is not None else None

    stroke_width_raw = document.get("stroke_width", 2.0)
    try:
        stroke_width = float(stroke_width_raw)
    except (TypeError, ValueError):
        stroke_width = 2.0

    return ProjectDrawing(
        id=str(document.get("drawing_id", "")),
        project_id=str(document.get("project_id", "")),
        points=points,
        stroke_color=str(document.get("stroke_color", "#000000")),
        stroke_width=stroke_width,
        is_deleted=bool(document.get("is_deleted", False)),
        updated_at=updated_at,
        version=int(document.get("version", 0)),
        origin=origin,
    )


def get_user_projects(
    user_id: str, page: int = 1, page_size: int = 20
) -> Tuple[List["Project"], int]:
    """Get user's projects with pagination."""
    collection = get_projects_collection(required=True)
    assert collection is not None, "Projects collection is required"

    skip = (page - 1) * page_size

    query = {"owner_id": user_id, "is_template": {"$ne": True}}
    total = collection.count_documents(query)

    cursor = collection.find(query).sort("updated_at", -1).skip(skip).limit(page_size)
    projects = [_serialize_project(doc) for doc in cursor]

    return projects, total


def create_project(
    name: str,
    description: Optional[str],
    project_type: str,
    owner_id: str,
    tags: List[str],
    from_template: Optional[str] = None,
    color: Optional[str] = "bg-blue-500",
) -> "Project":
    """Create a new project."""
    collection = get_projects_collection(required=True)
    assert collection is not None, "Projects collection is required"

    now = datetime.now(timezone.utc)

    project_doc = {
        "name": name,
        "description": description,
        "type": project_type,
        "owner_id": owner_id,
        "tools": [],
        "created_at": now,
        "updated_at": now,
        "tags": tags,
        "is_template": False,
        "template_category": None,
        "color": color,
    }

    # If creating from template, copy tools
    if from_template:
        # Get template from hardcoded templates instead of database
        templates_objs = get_project_templates()
        template_obj = next((t for t in templates_objs if t.id == from_template), None)
        if template_obj:
            # Copy template tools
            project_doc["tools"] = [tool.model_dump() for tool in template_obj.tools]

    result = collection.insert_one(project_doc)
    project_doc["_id"] = result.inserted_id

    return _serialize_project(project_doc)


def get_project(project_id: str, user_id: str) -> Optional["Project"]:
    """Get a specific project by ID."""
    collection = get_projects_collection(required=True)
    assert collection is not None, "Projects collection is required"

    try:
        object_id = ObjectId(project_id)
    except Exception:
        return None

    project_doc = collection.find_one(
        {"_id": object_id, "owner_id": user_id, "is_template": {"$ne": True}}
    )

    if not project_doc:
        return None

    return _serialize_project(project_doc)


def _project_accessible(project_id: str, user_id: str) -> bool:
    collection = get_projects_collection(required=True)
    assert collection is not None, "Projects collection is required"

    try:
        object_id = ObjectId(project_id)
    except Exception:
        return False

    doc = collection.find_one(
        {"_id": object_id, "owner_id": user_id, "is_template": {"$ne": True}},
        projection={"_id": 1},
    )
    return doc is not None


def update_project(
    project_id: str,
    user_id: str,
    updates: Dict[str, Any],
) -> Optional["Project"]:
    """Update a project."""
    collection = get_projects_collection(required=True)
    assert collection is not None, "Projects collection is required"

    try:
        object_id = ObjectId(project_id)
    except Exception:
        return None

    # Convert tools from Pydantic models to dicts if present
    if "tools" in updates and updates["tools"]:
        tools_data = []
        for tool in updates["tools"]:
            if hasattr(tool, "model_dump"):
                tools_data.append(tool.model_dump())
            elif isinstance(tool, dict):
                tools_data.append(tool)
        updates["tools"] = tools_data

    updates["updated_at"] = datetime.now(timezone.utc)

    result = collection.find_one_and_update(
        {"_id": object_id, "owner_id": user_id, "is_template": {"$ne": True}},
        {"$set": updates},
        return_document=True,
    )

    if not result:
        return None

    return _serialize_project(result)


def delete_project(project_id: str, user_id: str) -> bool:
    """Delete a project."""
    collection = get_projects_collection(required=True)
    assert collection is not None, "Projects collection is required"

    try:
        object_id = ObjectId(project_id)
    except Exception:
        return False

    result = collection.delete_one(
        {"_id": object_id, "owner_id": user_id, "is_template": {"$ne": True}}
    )

    return result.deleted_count > 0


def get_project_line_snapshot(
    project_id: str, user_id: str
) -> Optional[ProjectLineSnapshot]:
    # Import here to avoid runtime circular imports and keep imports local to usage
    from .schemas import ProjectLineSnapshot

    if not _project_accessible(project_id, user_id):
        return None

    collection = get_project_lines_collection(required=True)
    assert collection is not None, "Project lines collection is required"

    try:
        cursor = collection.find({"project_id": project_id}).sort("line_id", 1)
    except PyMongoError:
        cursor = []

    lines = [_serialize_project_line(doc) for doc in cursor]
    snapshot_version = max((line.version for line in lines), default=0)
    return ProjectLineSnapshot(lines=lines, snapshot_version=snapshot_version)


def _client_line_wins(
    existing_doc: Mapping[str, Any], payload: ProjectLinePayload
) -> bool:
    # Deletions always override non‑deleted versions
    existing_deleted = bool(existing_doc.get("is_deleted", False))
    if payload.is_deleted and not existing_deleted:
        return True
    if not payload.is_deleted and existing_deleted:
        return False

    existing_version = int(existing_doc.get("version", 0))
    payload_version = int(payload.version)

    if payload_version > existing_version:
        return True
    if payload_version < existing_version:
        return False

    existing_updated = _ensure_utc(
        existing_doc.get("updated_at")
    ) or datetime.min.replace(tzinfo=timezone.utc)
    payload_updated = _ensure_utc(payload.updated_at) or datetime.min.replace(
        tzinfo=timezone.utc
    )

    if payload_updated > existing_updated:
        return True
    if payload_updated < existing_updated:
        return False

    existing_origin = str(existing_doc.get("origin") or "")
    payload_origin = payload.origin or ""

    if payload_origin and existing_origin:
        if payload_origin < existing_origin:
            return True
        if payload_origin > existing_origin:
            return False
    elif payload_origin and not existing_origin:
        return True

    return False


def _line_payload_to_document(
    project_id: str,
    payload: ProjectLinePayload,
    version: int,
    updated_at: datetime,
) -> Dict[str, Any]:
    return {
        "project_id": project_id,
        "line_id": payload.id,
        "start_point": payload.start_point.model_dump(),
        "end_point": payload.end_point.model_dump(),
        "stroke_color": payload.stroke_color,
        "stroke_width": float(payload.stroke_width),
        "arrow_type": payload.arrow_type,
        "is_deleted": bool(payload.is_deleted),
        "updated_at": updated_at,
        "version": int(version),
        "origin": payload.origin,
    }


def _client_note_wins(
    existing_doc: Mapping[str, Any], payload: "ProjectNotePayload"
) -> bool:
    existing_deleted = bool(existing_doc.get("is_deleted", False))
    if payload.is_deleted and not existing_deleted:
        return True
    if not payload.is_deleted and existing_deleted:
        return False

    existing_version = int(existing_doc.get("version", 0))
    if payload.version > existing_version:
        return True
    if payload.version < existing_version:
        return False

    existing_updated = _ensure_utc(
        existing_doc.get("updated_at")
    ) or datetime.min.replace(tzinfo=timezone.utc)
    payload_updated = _ensure_utc(payload.updated_at) or datetime.min.replace(
        tzinfo=timezone.utc
    )

    if payload_updated > existing_updated:
        return True
    if payload_updated < existing_updated:
        return False

    existing_origin = str(existing_doc.get("origin") or "")
    payload_origin = payload.origin or ""
    if payload_origin and existing_origin:
        if payload_origin < existing_origin:
            return True
        if payload_origin > existing_origin:
            return False
    elif payload_origin and not existing_origin:
        return True

    return False


def _note_payload_to_document(
    project_id: str,
    payload: "ProjectNotePayload",
    version: int,
    updated_at: datetime,
) -> Dict[str, Any]:
    return {
        "project_id": project_id,
        "note_id": payload.id,
        "content": payload.content,
        "position": payload.position.model_dump(),
        "size": payload.size.model_dump(),
        "is_deleted": bool(payload.is_deleted),
        "updated_at": updated_at,
        "version": int(version),
        "origin": payload.origin,
    }


def _client_drawing_wins(
    existing_doc: Mapping[str, Any], payload: "ProjectDrawingPayload"
) -> bool:
    existing_deleted = bool(existing_doc.get("is_deleted", False))
    if payload.is_deleted and not existing_deleted:
        return True
    if not payload.is_deleted and existing_deleted:
        return False

    existing_version = int(existing_doc.get("version", 0))
    if payload.version > existing_version:
        return True
    if payload.version < existing_version:
        return False

    existing_updated = _ensure_utc(
        existing_doc.get("updated_at")
    ) or datetime.min.replace(tzinfo=timezone.utc)
    payload_updated = _ensure_utc(payload.updated_at) or datetime.min.replace(
        tzinfo=timezone.utc
    )

    if payload_updated > existing_updated:
        return True
    if payload_updated < existing_updated:
        return False

    existing_origin = str(existing_doc.get("origin") or "")
    payload_origin = payload.origin or ""
    if payload_origin and existing_origin:
        if payload_origin < existing_origin:
            return True
        if payload_origin > existing_origin:
            return False
    elif payload_origin and not existing_origin:
        return True

    return False


def _drawing_payload_to_document(
    project_id: str,
    payload: "ProjectDrawingPayload",
    version: int,
    updated_at: datetime,
) -> Dict[str, Any]:
    return {
        "project_id": project_id,
        "drawing_id": payload.id,
        "points": [point.model_dump() for point in payload.points],
        "stroke_color": payload.stroke_color,
        "stroke_width": float(payload.stroke_width),
        "is_deleted": bool(payload.is_deleted),
        "updated_at": updated_at,
        "version": int(version),
        "origin": payload.origin,
    }


def save_project_lines(
    project_id: str,
    user_id: str,
    lines: List[ProjectLinePayload],
) -> Optional[ProjectLineSaveResponse]:
    # Verify the user has access to the project
    if not _project_accessible(project_id, user_id):
        return None

    collection = get_project_lines_collection(required=True)
    assert collection is not None, "Project lines collection is required"

    # Import runtime schema classes locally to avoid circular imports
    from .schemas import (
        ProjectLineSaveSummary,
        ProjectLineSaveResponse,
        ProjectLineSnapshot,
    )

    summary = ProjectLineSaveSummary()
    now = datetime.now(timezone.utc)

    # 1. Tombstone any missing lines (lines present in DB but absent in the incoming payload)
    incoming_ids = {p.id for p in lines if p.id}
    try:
        existing_docs = list(collection.find({"project_id": project_id}))
    except PyMongoError:
        existing_docs = []

    for doc in existing_docs:
        line_id = str(doc.get("line_id"))
        if line_id and line_id not in incoming_ids and not doc.get("is_deleted", False):
            # Mark the line as deleted with a new version and updated timestamp
            version = int(doc.get("version", 0)) + 1
            filter_query = {"project_id": project_id, "line_id": line_id}
            try:
                collection.update_one(
                    filter_query,
                    {
                        "$set": {
                            "is_deleted": True,
                            "version": version,
                            "updated_at": now,
                        }
                    },
                )
                summary.deleted += 1
            except PyMongoError:
                summary.ignored += 1
                continue

    # 2. Process each incoming payload
    for payload in lines:
        if not payload.id:
            summary.ignored += 1
            continue

        filter_query = {"project_id": project_id, "line_id": payload.id}

        try:
            existing_doc = collection.find_one(filter_query)
        except PyMongoError:
            existing_doc = None

        if existing_doc is None:
            # Insert new line
            version = max(int(payload.version), 0) + 1
            document = _line_payload_to_document(project_id, payload, version, now)
            document["created_at"] = now
            try:
                collection.insert_one(document)
                if payload.is_deleted:
                    summary.deleted += 1
                else:
                    summary.created += 1
            except DuplicateKeyError:
                # Rare race: treat as update in next iteration
                summary.ignored += 1
            continue

        # Decide if the client’s update should win
        if not _client_line_wins(existing_doc, payload):
            summary.ignored += 1
            continue

        # Update existing line with new data
        version = int(existing_doc.get("version", 0)) + 1
        document = _line_payload_to_document(project_id, payload, version, now)
        try:
            collection.update_one(filter_query, {"$set": document})
            if payload.is_deleted and not existing_doc.get("is_deleted", False):
                summary.deleted += 1
            elif not payload.is_deleted:
                summary.updated += 1
        except PyMongoError:
            summary.ignored += 1
            continue

    # 3. Fetch the snapshot and return the response
    snapshot = get_project_line_snapshot(project_id, user_id)
    if snapshot is None:
        return None

    return ProjectLineSaveResponse(
        lines=snapshot.lines,
        snapshot_version=snapshot.snapshot_version,
        summary=summary,
    )


def get_project_note_snapshot(
    project_id: str, user_id: str
) -> Optional[ProjectNoteSnapshot]:
    from .schemas import ProjectNoteSnapshot

    if not _project_accessible(project_id, user_id):
        return None

    collection = get_project_notes_collection(required=True)
    assert collection is not None, "Project notes collection is required"

    try:
        cursor = collection.find({"project_id": project_id}).sort("note_id", 1)
    except PyMongoError:
        cursor = []

    notes = [_serialize_project_note(doc) for doc in cursor]
    snapshot_version = max((note.version for note in notes), default=0)
    return ProjectNoteSnapshot(notes=notes, snapshot_version=snapshot_version)


def save_project_notes(
    project_id: str,
    user_id: str,
    notes: List[ProjectNotePayload],
) -> Optional[ProjectNoteSaveResponse]:
    from .schemas import (
        ProjectNotePayload,
        ProjectNoteSaveResponse,
        ProjectNoteSaveSummary,
    )

    if not _project_accessible(project_id, user_id):
        return None

    collection = get_project_notes_collection(required=True)
    assert collection is not None, "Project notes collection is required"

    summary = ProjectNoteSaveSummary()
    now = datetime.now(timezone.utc)

    incoming_ids = {payload.id for payload in notes if payload.id}
    try:
        existing_docs = list(collection.find({"project_id": project_id}))
    except PyMongoError:
        existing_docs = []

    for doc in existing_docs:
        note_id = str(doc.get("note_id"))
        if note_id and note_id not in incoming_ids and not doc.get("is_deleted", False):
            version = int(doc.get("version", 0)) + 1
            filter_query = {"project_id": project_id, "note_id": note_id}
            try:
                collection.update_one(
                    filter_query,
                    {
                        "$set": {
                            "is_deleted": True,
                            "version": version,
                            "updated_at": now,
                        }
                    },
                )
                summary.deleted += 1
            except PyMongoError:
                summary.ignored += 1

    for payload in notes:
        if not payload.id:
            summary.ignored += 1
            continue

        filter_query = {"project_id": project_id, "note_id": payload.id}

        try:
            existing_doc = collection.find_one(filter_query)
        except PyMongoError:
            existing_doc = None

        if existing_doc is None:
            version = max(int(payload.version), 0) + 1
            document = _note_payload_to_document(project_id, payload, version, now)
            document["created_at"] = now
            try:
                collection.insert_one(document)
                if payload.is_deleted:
                    summary.deleted += 1
                else:
                    summary.created += 1
            except DuplicateKeyError:
                summary.ignored += 1
            continue

        if not _client_note_wins(existing_doc, payload):
            summary.ignored += 1
            continue

        version = int(existing_doc.get("version", 0)) + 1
        document = _note_payload_to_document(project_id, payload, version, now)
        try:
            collection.update_one(filter_query, {"$set": document})
            if payload.is_deleted and not existing_doc.get("is_deleted", False):
                summary.deleted += 1
            elif not payload.is_deleted:
                summary.updated += 1
        except PyMongoError:
            summary.ignored += 1

    snapshot = get_project_note_snapshot(project_id, user_id)
    if snapshot is None:
        return None

    return ProjectNoteSaveResponse(
        notes=snapshot.notes,
        snapshot_version=snapshot.snapshot_version,
        summary=summary,
    )


def get_project_drawing_snapshot(
    project_id: str, user_id: str
) -> Optional[ProjectDrawingSnapshot]:
    from .schemas import ProjectDrawingSnapshot

    if not _project_accessible(project_id, user_id):
        return None

    collection = get_project_drawings_collection(required=True)
    assert collection is not None, "Project drawings collection is required"

    try:
        cursor = collection.find({"project_id": project_id}).sort("drawing_id", 1)
    except PyMongoError:
        cursor = []

    drawings = [_serialize_project_drawing(doc) for doc in cursor]
    snapshot_version = max((drawing.version for drawing in drawings), default=0)
    return ProjectDrawingSnapshot(drawings=drawings, snapshot_version=snapshot_version)


def save_project_drawings(
    project_id: str,
    user_id: str,
    drawings: List[ProjectDrawingPayload],
) -> Optional[ProjectDrawingSaveResponse]:
    from .schemas import (
        ProjectDrawingPayload,
        ProjectDrawingSaveResponse,
        ProjectDrawingSaveSummary,
    )

    if not _project_accessible(project_id, user_id):
        return None

    collection = get_project_drawings_collection(required=True)
    assert collection is not None, "Project drawings collection is required"

    summary = ProjectDrawingSaveSummary()
    now = datetime.now(timezone.utc)

    incoming_ids = {payload.id for payload in drawings if payload.id}
    try:
        existing_docs = list(collection.find({"project_id": project_id}))
    except PyMongoError:
        existing_docs = []

    for doc in existing_docs:
        drawing_id = str(doc.get("drawing_id"))
        if (
            drawing_id
            and drawing_id not in incoming_ids
            and not doc.get("is_deleted", False)
        ):
            version = int(doc.get("version", 0)) + 1
            filter_query = {"project_id": project_id, "drawing_id": drawing_id}
            try:
                collection.update_one(
                    filter_query,
                    {
                        "$set": {
                            "is_deleted": True,
                            "version": version,
                            "updated_at": now,
                        }
                    },
                )
                summary.deleted += 1
            except PyMongoError:
                summary.ignored += 1

    for payload in drawings:
        if not payload.id:
            summary.ignored += 1
            continue

        filter_query = {"project_id": project_id, "drawing_id": payload.id}

        try:
            existing_doc = collection.find_one(filter_query)
        except PyMongoError:
            existing_doc = None

        if existing_doc is None:
            version = max(int(payload.version), 0) + 1
            document = _drawing_payload_to_document(project_id, payload, version, now)
            document["created_at"] = now
            try:
                collection.insert_one(document)
                if payload.is_deleted:
                    summary.deleted += 1
                else:
                    summary.created += 1
            except DuplicateKeyError:
                summary.ignored += 1
            continue

        if not _client_drawing_wins(existing_doc, payload):
            summary.ignored += 1
            continue

        version = int(existing_doc.get("version", 0)) + 1
        document = _drawing_payload_to_document(project_id, payload, version, now)
        try:
            collection.update_one(filter_query, {"$set": document})
            if payload.is_deleted and not existing_doc.get("is_deleted", False):
                summary.deleted += 1
            elif not payload.is_deleted:
                summary.updated += 1
        except PyMongoError:
            summary.ignored += 1

    snapshot = get_project_drawing_snapshot(project_id, user_id)
    if snapshot is None:
        return None

    return ProjectDrawingSaveResponse(
        drawings=snapshot.drawings,
        snapshot_version=snapshot.snapshot_version,
        summary=summary,
    )


def create_tool(
    project_id: str,
    user_id: str,
    tool_data: Dict[str, Any],
) -> Optional[Dict[str, Any]]:
    """Create a new tool in a project."""
    collection = get_projects_collection(required=True)
    assert collection is not None, "Projects collection is required"

    try:
        object_id = ObjectId(project_id)
    except Exception:
        return None

    # Generate tool ID
    tool_id = str(ObjectId())
    tool_data["id"] = tool_id
    tool_data["type"] = "mendelian"

    # Update the project by adding the new tool
    result = collection.find_one_and_update(
        {"_id": object_id, "owner_id": user_id, "is_template": {"$ne": True}},
        {
            "$push": {"tools": tool_data},
            "$set": {"updated_at": datetime.now(timezone.utc)},
        },
        return_document=True,
    )

    if not result:
        return None

    # Return the created tool
    for tool in result.get("tools", []):
        if tool.get("id") == tool_id:
            return tool

    return None


def update_tool(
    project_id: str,
    tool_id: str,
    user_id: str,
    updates: Dict[str, Any],
) -> Optional[Dict[str, Any]]:
    """Update a specific tool in a project."""
    collection = get_projects_collection(required=True)
    assert collection is not None, "Projects collection is required"

    try:
        object_id = ObjectId(project_id)
    except Exception:
        return None

    # Build update fields for the specific tool
    update_fields = {}
    for key, value in updates.items():
        update_fields[f"tools.$.{key}"] = value

    update_fields["updated_at"] = datetime.now(timezone.utc)

    # Update the specific tool in the tools array
    result = collection.find_one_and_update(
        {
            "_id": object_id,
            "owner_id": user_id,
            "is_template": {"$ne": True},
            "tools.id": tool_id,
        },
        {"$set": update_fields},
        return_document=True,
    )

    if not result:
        return None

    # Return the updated tool
    for tool in result.get("tools", []):
        if tool.get("id") == tool_id:
            return tool

    return None


def delete_tool(
    project_id: str,
    tool_id: str,
    user_id: str,
) -> bool:
    """Delete a specific tool from a project."""
    collection = get_projects_collection(required=True)
    assert collection is not None, "Projects collection is required"

    try:
        object_id = ObjectId(project_id)
    except Exception:
        return False

    # Remove the tool from the tools array
    result = collection.find_one_and_update(
        {"_id": object_id, "owner_id": user_id, "is_template": {"$ne": True}},
        {
            "$pull": {"tools": {"id": tool_id}},
            "$set": {"updated_at": datetime.now(timezone.utc)},
        },
    )

    return result is not None


def get_project_templates() -> List["ProjectTemplate"]:
    """Get all available project templates."""
    from .schemas import ProjectTemplate, MendelianProjectTool

    # For now, return hardcoded templates
    # In production, these could be stored in the database
    templates = [
        ProjectTemplate(
            id="mendelian_basic",
            name="Basic Mendelian Inheritance",
            description="Explore simple dominant and recessive traits like eye color and blood type",
            category="mendelian",
            tools=[
                MendelianProjectTool(
                    id="eye_color_study",
                    name="Eye Color Study",
                    trait_configurations={
                        "eye_color": {"parent1": "Bb", "parent2": "bb"}
                    },
                    position={"x": 100, "y": 100},
                ),
                MendelianProjectTool(
                    id="blood_type_study",
                    name="Blood Type Study",
                    trait_configurations={
                        "blood_type": {"parent1": "AB", "parent2": "OO"}
                    },
                    position={"x": 400, "y": 100},
                ),
            ],
            tags=["beginner", "mendelian", "genetics"],
        ),
        ProjectTemplate(
            id="mendelian_advanced",
            name="Advanced Mendelian Patterns",
            description="Study complex inheritance patterns including codominance and incomplete dominance",
            category="mendelian",
            tools=[
                MendelianProjectTool(
                    id="blood_type_codominance",
                    name="Blood Type Codominance",
                    trait_configurations={
                        "blood_type": {"parent1": "AB", "parent2": "AB"}
                    },
                    position={"x": 150, "y": 150},
                )
            ],
            tags=["advanced", "mendelian", "codominance"],
        ),
        ProjectTemplate(
            id="multiple_traits",
            name="Multiple Trait Analysis",
            description="Analyze inheritance of multiple independent traits simultaneously",
            category="mendelian",
            tools=[
                MendelianProjectTool(
                    id="multi_trait_study",
                    name="Eye Color + Hair Color",
                    trait_configurations={
                        "eye_color": {"parent1": "Bb", "parent2": "bb"},
                        "hair_color": {"parent1": "Dd", "parent2": "dd"},
                    },
                    position={"x": 200, "y": 200},
                )
            ],
            tags=["multiple-traits", "mendelian", "complex"],
        ),
    ]

    return templates
