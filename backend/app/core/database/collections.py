"""
MongoDB Collections Factory and Configuration.

This module provides centralized collection access and index management
for all MongoDB collections used in the application.
"""
from enum import Enum
from typing import Optional, Dict, List, Any
from pymongo.collection import Collection
from pymongo.errors import PyMongoError
import logging

from app.core.database.connection import DatabaseConnectionManager
from app.core.exceptions.database import DatabaseNotAvailableError
from app.config import get_settings

logger = logging.getLogger(__name__)


class CollectionName(Enum):
    """Enumeration of all MongoDB collection names."""

    # User Management
    USERS = "users"
    PENDING_SIGNUPS = "pending_signups"

    # Traits
    TRAITS = "traits"

    # Projects
    PROJECTS = "projects"
    PROJECT_LINES = "project_lines"
    PROJECT_NOTES = "project_notes"
    PROJECT_DRAWINGS = "project_drawings"

    # Community Features
    QUESTIONS = "questions"
    ANSWERS = "answers"
    COMMENTS = "comments"

    # University/Learning
    COURSES = "university_courses"
    PRACTICE_SETS = "university_practice_sets"
    COURSE_PROGRESS = "university_course_progress"
    ENROLLMENTS = "university_enrollments"
    ASSESSMENT_ATTEMPTS = "assessment_attempts"

    # Analytics & Logging
    SIMULATION_LOGS = "simulation_logs"
    TOKEN_USAGE = "token_usage"

    # Communication
    NEWSLETTERS = "newsletters"
    CONTACT_MESSAGES = "contact_messages"

    # AI/Chatbot
    CHATBOT_SETTINGS = "chatbot_settings"
    PROMPT_TEMPLATES = "prompt_templates"
    CONVERSATIONS = "conversations"
    CHAT_HISTORY = "chat_history"


class IndexConfig:
    """Index configuration for MongoDB collections."""

    @staticmethod
    def get_all_indexes() -> Dict[CollectionName, List[Dict[str, Any]]]:
        """
        Get index configuration for all collections.

        Returns:
            Dictionary mapping collection names to their index configurations.
        """
        return {
            # ===== USER MANAGEMENT =====
            CollectionName.USERS: [
                {
                    "keys": "email",
                    "unique": True,
                    "name": "email_unique_idx"
                },
                {
                    "keys": "created_at",
                    "name": "created_at_idx"
                },
                {
                    "keys": "user_role",
                    "name": "user_role_idx"
                },
                {
                    "keys": "is_active",
                    "name": "is_active_idx"
                },
                {
                    "keys": [("email", 1), ("is_active", 1)],
                    "name": "email_active_compound_idx"
                },
            ],
            CollectionName.PENDING_SIGNUPS: [
                {
                    "keys": "email",
                    "unique": True,
                    "name": "email_unique_idx"
                },
                {
                    "keys": "expires_at",
                    "expireAfterSeconds": 0,
                    "name": "expires_at_ttl_idx"
                },
            ],

            # ===== TRAITS =====
            CollectionName.TRAITS: [
                {
                    "keys": "key",
                    "unique": True,
                    "sparse": True,
                    "name": "key_unique_idx"
                },
                {
                    "keys": [("name", "text"), ("description", "text"), ("tags", "text")],
                    "name": "text_search_idx",
                    "weights": {
                        "name": 10,
                        "tags": 5,
                        "description": 1
                    }
                },
                {
                    "keys": "inheritance_pattern",
                    "name": "inheritance_pattern_idx"
                },
                {
                    "keys": "category",
                    "name": "category_idx"
                },
                {
                    "keys": "verification_status",
                    "name": "verification_status_idx"
                },
                {
                    "keys": "status",
                    "name": "status_idx"
                },
                {
                    "keys": "visibility",
                    "name": "visibility_idx"
                },
                {
                    "keys": "owner_id",
                    "name": "owner_id_idx"
                },
                {
                    "keys": "updated_at",
                    "name": "updated_at_idx"
                },
                {
                    "keys": [("owner_id", 1), ("visibility", 1)],
                    "name": "owner_visibility_compound_idx"
                },
            ],

            # ===== PROJECTS =====
            CollectionName.PROJECTS: [
                {
                    "keys": "user_id",
                    "name": "user_id_idx"
                },
                {
                    "keys": "created_at",
                    "name": "created_at_idx"
                },
                {
                    "keys": "updated_at",
                    "name": "updated_at_idx"
                },
                {
                    "keys": [("user_id", 1), ("created_at", -1)],
                    "name": "user_created_compound_idx"
                },
            ],
            CollectionName.PROJECT_LINES: [
                {
                    "keys": "project_id",
                    "name": "project_id_idx"
                },
                {
                    "keys": "user_id",
                    "name": "user_id_idx"
                },
                {
                    "keys": [("project_id", 1), ("generation", 1)],
                    "name": "project_generation_compound_idx"
                },
            ],
            CollectionName.PROJECT_NOTES: [
                {
                    "keys": "project_id",
                    "name": "project_id_idx"
                },
                {
                    "keys": "user_id",
                    "name": "user_id_idx"
                },
                {
                    "keys": "created_at",
                    "name": "created_at_idx"
                },
            ],
            CollectionName.PROJECT_DRAWINGS: [
                {
                    "keys": "project_id",
                    "name": "project_id_idx"
                },
                {
                    "keys": "user_id",
                    "name": "user_id_idx"
                },
                {
                    "keys": "created_at",
                    "name": "created_at_idx"
                },
            ],

            # ===== COMMUNITY =====
            CollectionName.QUESTIONS: [
                {
                    "keys": "author_id",
                    "name": "author_id_idx"
                },
                {
                    "keys": "created_at",
                    "name": "created_at_idx"
                },
                {
                    "keys": "tags",
                    "name": "tags_idx"
                },
                {
                    "keys": "status",
                    "name": "status_idx"
                },
                {
                    "keys": [("title", "text"), ("content", "text"), ("tags", "text")],
                    "name": "text_search_idx",
                    "weights": {
                        "title": 10,
                        "tags": 5,
                        "content": 1
                    }
                },
                {
                    "keys": [("created_at", -1), ("vote_count", -1)],
                    "name": "created_votes_compound_idx"
                },
            ],
            CollectionName.ANSWERS: [
                {
                    "keys": "question_id",
                    "name": "question_id_idx"
                },
                {
                    "keys": "author_id",
                    "name": "author_id_idx"
                },
                {
                    "keys": "created_at",
                    "name": "created_at_idx"
                },
                {
                    "keys": "is_accepted",
                    "name": "is_accepted_idx"
                },
                {
                    "keys": [("question_id", 1), ("created_at", -1)],
                    "name": "question_created_compound_idx"
                },
            ],
            CollectionName.COMMENTS: [
                {
                    "keys": "parent_id",
                    "name": "parent_id_idx"
                },
                {
                    "keys": "parent_type",
                    "name": "parent_type_idx"
                },
                {
                    "keys": "author_id",
                    "name": "author_id_idx"
                },
                {
                    "keys": "created_at",
                    "name": "created_at_idx"
                },
                {
                    "keys": [("parent_id", 1), ("parent_type", 1), ("created_at", 1)],
                    "name": "parent_compound_idx"
                },
            ],

            # ===== UNIVERSITY/LEARNING =====
            CollectionName.COURSES: [
                {
                    "keys": "slug",
                    "unique": True,
                    "sparse": True,
                    "name": "slug_unique_idx"
                },
                {
                    "keys": "title",
                    "name": "title_idx"
                },
                {
                    "keys": "category",
                    "name": "category_idx"
                },
                {
                    "keys": "difficulty_level",
                    "name": "difficulty_level_idx"
                },
                {
                    "keys": "is_published",
                    "name": "is_published_idx"
                },
                {
                    "keys": "created_at",
                    "name": "created_at_idx"
                },
            ],
            CollectionName.PRACTICE_SETS: [
                {
                    "keys": "slug",
                    "unique": True,
                    "sparse": True,
                    "name": "slug_unique_idx"
                },
                {
                    "keys": "course_slug",
                    "name": "course_slug_idx"
                },
                {
                    "keys": "module_id",
                    "name": "module_id_idx"
                },
                {
                    "keys": [("course_slug", 1), ("module_id", 1)],
                    "name": "course_module_compound_idx"
                },
            ],
            CollectionName.COURSE_PROGRESS: [
                {
                    "keys": [("user_id", 1), ("course_slug", 1)],
                    "unique": True,
                    "name": "user_course_unique_idx"
                },
                {
                    "keys": "user_id",
                    "name": "user_id_idx"
                },
                {
                    "keys": "course_slug",
                    "name": "course_slug_idx"
                },
                {
                    "keys": "last_accessed_at",
                    "name": "last_accessed_at_idx"
                },
            ],
            CollectionName.ENROLLMENTS: [
                {
                    "keys": [("user_id", 1), ("course_slug", 1)],
                    "unique": True,
                    "name": "user_course_unique_idx"
                },
                {
                    "keys": "user_id",
                    "name": "user_id_idx"
                },
                {
                    "keys": "course_slug",
                    "name": "course_slug_idx"
                },
                {
                    "keys": "enrolled_at",
                    "name": "enrolled_at_idx"
                },
                {
                    "keys": "status",
                    "name": "status_idx"
                },
            ],
            CollectionName.ASSESSMENT_ATTEMPTS: [
                {
                    "keys": "user_id",
                    "name": "user_id_idx"
                },
                {
                    "keys": [("user_id", 1), ("course_slug", 1), ("module_id", 1)],
                    "name": "user_course_module_compound_idx"
                },
                {
                    "keys": [("course_slug", 1), ("module_id", 1)],
                    "name": "course_module_compound_idx"
                },
                {
                    "keys": "attempted_at",
                    "name": "attempted_at_idx"
                },
                {
                    "keys": "completed_at",
                    "name": "completed_at_idx"
                },
            ],

            # ===== ANALYTICS & LOGGING =====
            CollectionName.SIMULATION_LOGS: [
                {
                    "keys": "user_id",
                    "name": "user_id_idx"
                },
                {
                    "keys": "simulation_type",
                    "name": "simulation_type_idx"
                },
                {
                    "keys": "timestamp",
                    "name": "timestamp_idx"
                },
                {
                    "keys": [("user_id", 1), ("timestamp", -1)],
                    "name": "user_timestamp_compound_idx"
                },
                {
                    "keys": "timestamp",
                    "expireAfterSeconds": 7776000,  # 90 days
                    "name": "timestamp_ttl_idx"
                },
            ],
            CollectionName.TOKEN_USAGE: [
                {
                    "keys": "user_id",
                    "name": "user_id_idx"
                },
                {
                    "keys": "timestamp",
                    "name": "timestamp_idx"
                },
                {
                    "keys": [("user_id", 1), ("timestamp", -1)],
                    "name": "user_timestamp_compound_idx"
                },
                {
                    "keys": "model",
                    "name": "model_idx"
                },
                {
                    "keys": "service",
                    "name": "service_idx"
                },
            ],

            # ===== COMMUNICATION =====
            CollectionName.NEWSLETTERS: [
                {
                    "keys": "email",
                    "unique": True,
                    "name": "email_unique_idx"
                },
                {
                    "keys": "subscribed_at",
                    "name": "subscribed_at_idx"
                },
                {
                    "keys": "status",
                    "name": "status_idx"
                },
                {
                    "keys": "is_active",
                    "name": "is_active_idx"
                },
            ],
            CollectionName.CONTACT_MESSAGES: [
                {
                    "keys": "email",
                    "name": "email_idx"
                },
                {
                    "keys": "created_at",
                    "name": "created_at_idx"
                },
                {
                    "keys": "status",
                    "name": "status_idx"
                },
                {
                    "keys": "is_read",
                    "name": "is_read_idx"
                },
                {
                    "keys": [("status", 1), ("created_at", -1)],
                    "name": "status_created_compound_idx"
                },
            ],

            # ===== AI/CHATBOT =====
            CollectionName.CHATBOT_SETTINGS: [
                {
                    "keys": "user_id",
                    "name": "user_id_idx"
                },
                {
                    "keys": "version",
                    "name": "version_idx"
                },
                {
                    "keys": "is_active",
                    "name": "is_active_idx"
                },
                {
                    "keys": "created_at",
                    "name": "created_at_idx"
                },
                {
                    "keys": [("user_id", 1), ("is_active", 1)],
                    "name": "user_active_compound_idx"
                },
            ],
            CollectionName.PROMPT_TEMPLATES: [
                {
                    "keys": "name",
                    "unique": True,
                    "name": "name_unique_idx"
                },
                {
                    "keys": "category",
                    "name": "category_idx"
                },
                {
                    "keys": "is_active",
                    "name": "is_active_idx"
                },
                {
                    "keys": "version",
                    "name": "version_idx"
                },
                {
                    "keys": "created_at",
                    "name": "created_at_idx"
                },
            ],
            CollectionName.CONVERSATIONS: [
                {
                    "keys": "user_id",
                    "name": "user_id_idx"
                },
                {
                    "keys": "session_id",
                    "name": "session_id_idx"
                },
                {
                    "keys": "created_at",
                    "name": "created_at_idx"
                },
                {
                    "keys": "updated_at",
                    "name": "updated_at_idx"
                },
                {
                    "keys": [("user_id", 1), ("updated_at", -1)],
                    "name": "user_updated_compound_idx"
                },
            ],
            CollectionName.CHAT_HISTORY: [
                {
                    "keys": "conversation_id",
                    "name": "conversation_id_idx"
                },
                {
                    "keys": "user_id",
                    "name": "user_id_idx"
                },
                {
                    "keys": "timestamp",
                    "name": "timestamp_idx"
                },
                {
                    "keys": [("conversation_id", 1), ("timestamp", 1)],
                    "name": "conversation_timestamp_compound_idx"
                },
                {
                    "keys": "timestamp",
                    "expireAfterSeconds": 2592000,  # 30 days
                    "name": "timestamp_ttl_idx"
                },
            ],
        }


class CollectionFactory:
    """
    Factory for creating and managing MongoDB collections.

    This class provides centralized access to all MongoDB collections
    with automatic index creation and connection management.
    """

    def __init__(self):
        """Initialize the collection factory."""
        self._connection_manager = DatabaseConnectionManager()
        self._index_config = IndexConfig.get_all_indexes()
        self._indexed_collections = set()  # Track which collections have been indexed

    def get_collection(
        self,
        name: CollectionName,
        required: bool = False
    ) -> Optional[Collection]:
        """
        Get a MongoDB collection by name.

        Args:
            name: The collection name from CollectionName enum
            required: If True, raises exception when collection is unavailable

        Returns:
            Collection object if available, None otherwise

        Raises:
            DatabaseNotAvailableError: If required=True and collection unavailable
        """
        try:
            client = self._connection_manager.get_client()
            if client is None:
                if required:
                    raise DatabaseNotAvailableError(
                        f"MongoDB client not available for collection {name.value}"
                    )
                return None

            settings = get_settings()
            db = client[settings.mongodb_db_name]
            collection = db[name.value]

            # Create indexes if not already done for this collection
            if name not in self._indexed_collections and name in self._index_config:
                self._create_indexes(collection, self._index_config[name])
                self._indexed_collections.add(name)

            return collection

        except DatabaseNotAvailableError:
            raise
        except Exception as e:
            logger.error(f"Error accessing collection {name.value}: {e}")
            if required:
                raise DatabaseNotAvailableError(
                    f"Collection {name.value} not available: {str(e)}"
                )
            return None

    def _create_indexes(
        self,
        collection: Collection,
        index_configs: List[Dict[str, Any]]
    ) -> None:
        """
        Create indexes for a collection.

        Args:
            collection: The MongoDB collection
            index_configs: List of index configuration dictionaries
        """
        for index_config in index_configs:
            try:
                keys = index_config.pop("keys")
                name = index_config.get("name", None)

                # Handle different key types
                if isinstance(keys, str):
                    # Single field index
                    collection.create_index(keys, **index_config)
                elif isinstance(keys, list):
                    # Compound or text index
                    collection.create_index(keys, **index_config)
                else:
                    logger.warning(
                        f"Invalid index keys type for {collection.name}: {type(keys)}"
                    )

                if name:
                    logger.debug(f"Created index '{name}' on collection {collection.name}")

            except PyMongoError as e:
                # Don't fail if index already exists
                if "already exists" not in str(e).lower():
                    logger.warning(
                        f"Failed to create index on {collection.name}: {e}"
                    )
            except Exception as e:
                logger.error(
                    f"Unexpected error creating index on {collection.name}: {e}"
                )

    def ensure_all_indexes(self) -> Dict[str, List[str]]:
        """
        Ensure all indexes are created for all collections.

        This method can be called during application startup to ensure
        all indexes are properly created.

        Returns:
            Dictionary mapping collection names to list of created index names
        """
        results = {}

        for collection_name in CollectionName:
            try:
                collection = self.get_collection(collection_name, required=False)
                if collection is not None:
                    # Get existing index names
                    existing_indexes = collection.list_indexes()
                    index_names = [idx["name"] for idx in existing_indexes]
                    results[collection_name.value] = index_names
                    logger.info(
                        f"Collection {collection_name.value}: {len(index_names)} indexes"
                    )
            except Exception as e:
                logger.error(
                    f"Error ensuring indexes for {collection_name.value}: {e}"
                )
                results[collection_name.value] = []

        return results

    def drop_all_indexes(self, collection_name: CollectionName) -> bool:
        """
        Drop all indexes for a collection (except _id).

        WARNING: Use with caution! This is primarily for testing.

        Args:
            collection_name: The collection name

        Returns:
            True if successful, False otherwise
        """
        try:
            collection = self.get_collection(collection_name, required=True)
            if collection is None:
                return False

            collection.drop_indexes()
            logger.info(f"Dropped all indexes for collection {collection_name.value}")

            # Remove from indexed collections set
            self._indexed_collections.discard(collection_name)

            return True

        except Exception as e:
            logger.error(f"Error dropping indexes for {collection_name.value}: {e}")
            return False

    def get_collection_stats(self, collection_name: CollectionName) -> Dict[str, Any]:
        """
        Get statistics for a collection.

        Args:
            collection_name: The collection name

        Returns:
            Dictionary containing collection statistics
        """
        try:
            collection = self.get_collection(collection_name, required=True)
            if collection is None:
                return {}

            stats = collection.database.command("collStats", collection_name.value)

            return {
                "name": collection_name.value,
                "count": stats.get("count", 0),
                "size": stats.get("size", 0),
                "avgObjSize": stats.get("avgObjSize", 0),
                "storageSize": stats.get("storageSize", 0),
                "indexes": stats.get("nindexes", 0),
                "totalIndexSize": stats.get("totalIndexSize", 0),
            }

        except Exception as e:
            logger.error(f"Error getting stats for {collection_name.value}: {e}")
            return {}


# Singleton instance
_collection_factory: Optional[CollectionFactory] = None


def get_collection_factory() -> CollectionFactory:
    """
    Get the singleton CollectionFactory instance.

    Returns:
        CollectionFactory instance
    """
    global _collection_factory
    if _collection_factory is None:
        _collection_factory = CollectionFactory()
    return _collection_factory


def get_collection(
    name: CollectionName,
    required: bool = False
) -> Optional[Collection]:
    """
    Convenience function to get a collection.

    Args:
        name: The collection name from CollectionName enum
        required: If True, raises exception when collection is unavailable

    Returns:
        Collection object if available, None otherwise

    Raises:
        DatabaseNotAvailableError: If required=True and collection unavailable
    """
    factory = get_collection_factory()
    return factory.get_collection(name, required)
