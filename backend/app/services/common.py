def get_project_drawings_collection(required: bool = False):
    client = get_mongo_client()
    if client is None:
        if required:
            raise HTTPException(status_code=503, detail="MongoDB client not available")
        return None
    settings = get_settings()
    db = client[settings.mongodb_db_name]
    return db["project_drawings"]


def get_project_notes_collection(required: bool = False):
    client = get_mongo_client()
    if client is None:
        if required:
            raise HTTPException(status_code=503, detail="MongoDB client not available")
        return None
    settings = get_settings()
    db = client[settings.mongodb_db_name]
    return db["project_notes"]


def get_project_lines_collection(required: bool = False):
    client = get_mongo_client()
    if client is None:
        if required:
            raise HTTPException(status_code=503, detail="MongoDB client not available")
        return None
    settings = get_settings()
    db = client[settings.mongodb_db_name]
    return db["project_lines"]


def get_projects_collection(required: bool = False):
    client = get_mongo_client()
    if client is None:
        if required:
            raise HTTPException(status_code=503, detail="MongoDB client not available")
        return None
    settings = get_settings()
    db = client[settings.mongodb_db_name]
    return db["projects"]


def get_traits_collection(required: bool = False):
    client = get_mongo_client()
    if client is None:
        if required:
            raise HTTPException(status_code=503, detail="MongoDB client not available")
        return None
    settings = get_settings()
    db = client[settings.mongodb_db_name]
    return db["traits"]


def get_simulation_logs_collection(required: bool = False):
    """Return the collection used to store ad-hoc simulation logs.

    This provides analytics even when users run simulations outside of a
    saved Project/Tool. Schema (flexible):
      - timestamp: datetime (UTC)
      - user_id: Optional[str]
      - traits: List[str]
      - total_data_points: int
      - avg_confidence: float  (0-100)
      - processing_time_seconds: float
    """
    client = get_mongo_client()
    if client is None:
        if required:
            raise HTTPException(status_code=503, detail="MongoDB client not available")
        return None
    settings = get_settings()
    db = client[settings.mongodb_db_name]
    # Keep name stable without new setting for now
    return db["simulation_logs"]


from datetime import datetime, timezone
from typing import Optional, Mapping, Dict
from fastapi import HTTPException
from pymongo import MongoClient
from pymongo.errors import PyMongoError
from app.config import get_settings

# Utility: ensure datetime is UTC


def ensure_utc(dt: object) -> Optional[datetime]:
    if isinstance(dt, datetime):
        return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
    return None


# MongoDB client helper
_mongo_client: Optional[MongoClient] = None


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
            _mongo_client = MongoClient(
                settings.mongodb_uri,
                maxPoolSize=50,
                minPoolSize=10,
                maxIdleTimeMS=30000,
                serverSelectionTimeoutMS=5000,
                socketTimeoutMS=20000,
                connectTimeoutMS=20000,
            )
    except PyMongoError as exc:
        raise HTTPException(
            status_code=503, detail=f"Unable to connect to MongoDB: {exc}"
        ) from exc
    return _mongo_client
