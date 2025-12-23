"""
MongoDB Repository Implementation.

This module provides a concrete implementation of the BaseRepository
for MongoDB, including CRUD operations, querying, pagination, and more.
"""
from typing import Optional, List, Dict, Any, TypeVar, Callable, Tuple, Union
from datetime import datetime, timezone
from bson import ObjectId
from pymongo.collection import Collection
from pymongo.errors import PyMongoError, DuplicateKeyError
from pymongo import ASCENDING, DESCENDING
import logging

from app.core.database.base import BaseRepository
from app.core.database.connection import DatabaseConnectionManager
from app.core.exceptions.database import (
    DatabaseError,
    RecordNotFoundError,
    DatabaseNotAvailableError
)
from app.config import get_settings

logger = logging.getLogger(__name__)

T = TypeVar("T")


class MongoRepository(BaseRepository[T]):
    """
    MongoDB implementation of BaseRepository.

    This class provides a complete implementation of repository pattern
    for MongoDB with additional MongoDB-specific features.

    Type parameter T represents the domain entity type.
    """

    def __init__(
        self,
        collection_name: str,
        entity_class: Optional[type] = None,
        id_field: str = "_id"
    ):
        """
        Initialize MongoDB repository.

        Args:
            collection_name: Name of the MongoDB collection
            entity_class: Optional entity class for type conversion
            id_field: Name of the ID field (default: "_id")
        """
        self.collection_name = collection_name
        self.entity_class = entity_class
        self.id_field = id_field
        self._connection_manager = DatabaseConnectionManager()

    @property
    def collection(self) -> Collection:
        """
        Get the MongoDB collection.

        Returns:
            MongoDB Collection object

        Raises:
            DatabaseNotAvailableError: If database connection is unavailable
        """
        try:
            client = self._connection_manager.get_client()
            if client is None:
                raise DatabaseNotAvailableError(
                    f"MongoDB client not available for collection {self.collection_name}"
                )

            db = client[self._get_database_name()]
            return db[self.collection_name]

        except Exception as e:
            logger.error(f"Error accessing collection {self.collection_name}: {e}")
            raise DatabaseNotAvailableError(
                f"Collection {self.collection_name} not available: {str(e)}"
            )

    def _get_database_name(self) -> str:
        """Get the database name from settings."""
        settings = get_settings()
        return settings.mongodb_db_name

    # ==================== CRUD Operations ====================

    def find_by_id(self, id: str) -> Optional[T]:
        """
        Find a document by ID.

        Args:
            id: Document ID (as string)

        Returns:
            Entity if found, None otherwise

        Raises:
            DatabaseError: If database operation fails
        """
        try:
            if not ObjectId.is_valid(id):
                return None

            document = self.collection.find_one({self.id_field: ObjectId(id)})

            if document is None:
                return None

            return self._document_to_entity(document)

        except PyMongoError as e:
            logger.error(f"Error finding document by ID {id}: {e}")
            raise DatabaseError(f"Failed to find document: {str(e)}")

    def find_all(
        self,
        filters: Optional[Dict[str, Any]] = None,
        sort: Optional[List[Tuple[str, int]]] = None,
        limit: Optional[int] = None,
        skip: Optional[int] = None
    ) -> List[T]:
        """
        Find all documents matching filters.

        Args:
            filters: Query filters (MongoDB query format)
            sort: List of (field, direction) tuples for sorting
            limit: Maximum number of documents to return
            skip: Number of documents to skip

        Returns:
            List of entities

        Raises:
            DatabaseError: If database operation fails
        """
        try:
            query = filters or {}
            cursor = self.collection.find(query)

            if sort:
                cursor = cursor.sort(sort)

            if skip is not None and skip > 0:
                cursor = cursor.skip(skip)

            if limit is not None and limit > 0:
                cursor = cursor.limit(limit)

            return [self._document_to_entity(doc) for doc in cursor]

        except PyMongoError as e:
            logger.error(f"Error finding documents: {e}")
            raise DatabaseError(f"Failed to find documents: {str(e)}")

    def create(self, entity: Union[T, Dict[str, Any]]) -> T:
        """
        Create a new document.

        Args:
            entity: Entity to create (can be entity object or dict)

        Returns:
            Created entity with ID

        Raises:
            DatabaseError: If database operation fails
            DuplicateKeyError: If unique constraint is violated
        """
        try:
            document = self._entity_to_document(entity)

            # Add timestamps if not present
            if "created_at" not in document:
                document["created_at"] = datetime.now(timezone.utc)
            if "updated_at" not in document:
                document["updated_at"] = datetime.now(timezone.utc)

            result = self.collection.insert_one(document)
            document[self.id_field] = result.inserted_id

            return self._document_to_entity(document)

        except DuplicateKeyError as e:
            logger.warning(f"Duplicate key error creating document: {e}")
            raise DatabaseError(
                "Document with this unique field already exists",
                details={"error": str(e)}
            )
        except PyMongoError as e:
            logger.error(f"Error creating document: {e}")
            raise DatabaseError(f"Failed to create document: {str(e)}")

    def update(
        self,
        id: str,
        entity: Union[T, Dict[str, Any]],
        upsert: bool = False
    ) -> Optional[T]:
        """
        Update a document by ID.

        Args:
            id: Document ID
            entity: Updated entity data (can be entity object or dict)
            upsert: If True, create document if it doesn't exist

        Returns:
            Updated entity if found, None otherwise

        Raises:
            DatabaseError: If database operation fails
        """
        try:
            if not ObjectId.is_valid(id):
                return None

            update_doc = self._entity_to_document(entity)

            # Remove ID from update document
            update_doc.pop(self.id_field, None)

            # Update timestamp
            update_doc["updated_at"] = datetime.now(timezone.utc)

            result = self.collection.update_one(
                {self.id_field: ObjectId(id)},
                {"$set": update_doc},
                upsert=upsert
            )

            if result.matched_count == 0 and not upsert:
                return None

            # Retrieve and return updated document
            updated_doc = self.collection.find_one({self.id_field: ObjectId(id)})
            return self._document_to_entity(updated_doc) if updated_doc else None

        except PyMongoError as e:
            logger.error(f"Error updating document {id}: {e}")
            raise DatabaseError(f"Failed to update document: {str(e)}")

    def delete(self, id: str) -> bool:
        """
        Delete a document by ID.

        Args:
            id: Document ID

        Returns:
            True if deleted, False if not found

        Raises:
            DatabaseError: If database operation fails
        """
        try:
            if not ObjectId.is_valid(id):
                return False

            result = self.collection.delete_one({self.id_field: ObjectId(id)})
            return result.deleted_count > 0

        except PyMongoError as e:
            logger.error(f"Error deleting document {id}: {e}")
            raise DatabaseError(f"Failed to delete document: {str(e)}")

    # ==================== Additional Query Methods ====================

    def find_one(self, filters: Dict[str, Any]) -> Optional[T]:
        """
        Find a single document matching filters.

        Args:
            filters: Query filters

        Returns:
            Entity if found, None otherwise

        Raises:
            DatabaseError: If database operation fails
        """
        try:
            document = self.collection.find_one(filters)
            return self._document_to_entity(document) if document else None

        except PyMongoError as e:
            logger.error(f"Error finding document: {e}")
            raise DatabaseError(f"Failed to find document: {str(e)}")

    def find_many(
        self,
        filters: Dict[str, Any],
        projection: Optional[Dict[str, int]] = None,
        sort: Optional[List[Tuple[str, int]]] = None,
        limit: Optional[int] = None,
        skip: Optional[int] = None
    ) -> List[T]:
        """
        Find multiple documents with projection support.

        Args:
            filters: Query filters
            projection: Fields to include/exclude
            sort: Sort specification
            limit: Maximum results
            skip: Number to skip

        Returns:
            List of entities

        Raises:
            DatabaseError: If database operation fails
        """
        try:
            cursor = self.collection.find(filters, projection)

            if sort:
                cursor = cursor.sort(sort)
            if skip:
                cursor = cursor.skip(skip)
            if limit:
                cursor = cursor.limit(limit)

            return [self._document_to_entity(doc) for doc in cursor]

        except PyMongoError as e:
            logger.error(f"Error finding documents: {e}")
            raise DatabaseError(f"Failed to find documents: {str(e)}")

    def count(self, filters: Optional[Dict[str, Any]] = None) -> int:
        """
        Count documents matching filters.

        Args:
            filters: Query filters

        Returns:
            Number of matching documents

        Raises:
            DatabaseError: If database operation fails
        """
        try:
            return self.collection.count_documents(filters or {})

        except PyMongoError as e:
            logger.error(f"Error counting documents: {e}")
            raise DatabaseError(f"Failed to count documents: {str(e)}")

    def exists(self, filters: Dict[str, Any]) -> bool:
        """
        Check if a document exists matching filters.

        Args:
            filters: Query filters

        Returns:
            True if exists, False otherwise

        Raises:
            DatabaseError: If database operation fails
        """
        try:
            return self.collection.count_documents(filters, limit=1) > 0

        except PyMongoError as e:
            logger.error(f"Error checking document existence: {e}")
            raise DatabaseError(f"Failed to check existence: {str(e)}")

    # ==================== Pagination ====================

    def find_paginated(
        self,
        filters: Optional[Dict[str, Any]] = None,
        page: int = 1,
        page_size: int = 20,
        sort: Optional[List[Tuple[str, int]]] = None
    ) -> Tuple[List[T], int, int]:
        """
        Find documents with pagination.

        Args:
            filters: Query filters
            page: Page number (1-indexed)
            page_size: Number of items per page
            sort: Sort specification

        Returns:
            Tuple of (documents, total_count, total_pages)

        Raises:
            DatabaseError: If database operation fails
        """
        try:
            query = filters or {}

            # Get total count
            total_count = self.count(query)

            # Calculate pagination
            total_pages = (total_count + page_size - 1) // page_size
            skip = (page - 1) * page_size

            # Get documents
            documents = self.find_all(
                filters=query,
                sort=sort,
                limit=page_size,
                skip=skip
            )

            return documents, total_count, total_pages

        except DatabaseError:
            raise
        except Exception as e:
            logger.error(f"Error in pagination: {e}")
            raise DatabaseError(f"Failed to paginate: {str(e)}")

    # ==================== Bulk Operations ====================

    def create_many(self, entities: List[Union[T, Dict[str, Any]]]) -> List[T]:
        """
        Create multiple documents.

        Args:
            entities: List of entities to create

        Returns:
            List of created entities with IDs

        Raises:
            DatabaseError: If database operation fails
        """
        try:
            documents = [self._entity_to_document(entity) for entity in entities]

            # Add timestamps
            now = datetime.now(timezone.utc)
            for doc in documents:
                if "created_at" not in doc:
                    doc["created_at"] = now
                if "updated_at" not in doc:
                    doc["updated_at"] = now

            result = self.collection.insert_many(documents)

            # Update documents with inserted IDs
            for doc, inserted_id in zip(documents, result.inserted_ids):
                doc[self.id_field] = inserted_id

            return [self._document_to_entity(doc) for doc in documents]

        except PyMongoError as e:
            logger.error(f"Error creating multiple documents: {e}")
            raise DatabaseError(f"Failed to create documents: {str(e)}")

    def update_many(
        self,
        filters: Dict[str, Any],
        update: Dict[str, Any]
    ) -> int:
        """
        Update multiple documents.

        Args:
            filters: Query filters
            update: Update operations (MongoDB update format)

        Returns:
            Number of documents updated

        Raises:
            DatabaseError: If database operation fails
        """
        try:
            # Add updated_at timestamp
            if "$set" in update:
                update["$set"]["updated_at"] = datetime.now(timezone.utc)
            else:
                update["$set"] = {"updated_at": datetime.now(timezone.utc)}

            result = self.collection.update_many(filters, update)
            return result.modified_count

        except PyMongoError as e:
            logger.error(f"Error updating multiple documents: {e}")
            raise DatabaseError(f"Failed to update documents: {str(e)}")

    def delete_many(self, filters: Dict[str, Any]) -> int:
        """
        Delete multiple documents.

        Args:
            filters: Query filters

        Returns:
            Number of documents deleted

        Raises:
            DatabaseError: If database operation fails
        """
        try:
            result = self.collection.delete_many(filters)
            return result.deleted_count

        except PyMongoError as e:
            logger.error(f"Error deleting multiple documents: {e}")
            raise DatabaseError(f"Failed to delete documents: {str(e)}")

    # ==================== Advanced Queries ====================

    def aggregate(self, pipeline: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Execute an aggregation pipeline.

        Args:
            pipeline: MongoDB aggregation pipeline

        Returns:
            List of aggregation results

        Raises:
            DatabaseError: If database operation fails
        """
        try:
            return list(self.collection.aggregate(pipeline))

        except PyMongoError as e:
            logger.error(f"Error executing aggregation: {e}")
            raise DatabaseError(f"Failed to execute aggregation: {str(e)}")

    def find_distinct(self, field: str, filters: Optional[Dict[str, Any]] = None) -> List[Any]:
        """
        Get distinct values for a field.

        Args:
            field: Field name
            filters: Optional query filters

        Returns:
            List of distinct values

        Raises:
            DatabaseError: If database operation fails
        """
        try:
            return self.collection.distinct(field, filters or {})

        except PyMongoError as e:
            logger.error(f"Error getting distinct values: {e}")
            raise DatabaseError(f"Failed to get distinct values: {str(e)}")

    # ==================== Partial Updates ====================

    def update_fields(
        self,
        id: str,
        fields: Dict[str, Any]
    ) -> Optional[T]:
        """
        Update specific fields of a document.

        Args:
            id: Document ID
            fields: Dictionary of fields to update

        Returns:
            Updated entity if found, None otherwise

        Raises:
            DatabaseError: If database operation fails
        """
        try:
            if not ObjectId.is_valid(id):
                return None

            # Add updated_at timestamp
            fields["updated_at"] = datetime.now(timezone.utc)

            result = self.collection.update_one(
                {self.id_field: ObjectId(id)},
                {"$set": fields}
            )

            if result.matched_count == 0:
                return None

            updated_doc = self.collection.find_one({self.id_field: ObjectId(id)})
            return self._document_to_entity(updated_doc) if updated_doc else None

        except PyMongoError as e:
            logger.error(f"Error updating fields for {id}: {e}")
            raise DatabaseError(f"Failed to update fields: {str(e)}")

    def increment_field(
        self,
        id: str,
        field: str,
        amount: Union[int, float] = 1
    ) -> Optional[T]:
        """
        Increment a numeric field.

        Args:
            id: Document ID
            field: Field name to increment
            amount: Amount to increment (default: 1)

        Returns:
            Updated entity if found, None otherwise

        Raises:
            DatabaseError: If database operation fails
        """
        try:
            if not ObjectId.is_valid(id):
                return None

            result = self.collection.update_one(
                {self.id_field: ObjectId(id)},
                {
                    "$inc": {field: amount},
                    "$set": {"updated_at": datetime.now(timezone.utc)}
                }
            )

            if result.matched_count == 0:
                return None

            updated_doc = self.collection.find_one({self.id_field: ObjectId(id)})
            return self._document_to_entity(updated_doc) if updated_doc else None

        except PyMongoError as e:
            logger.error(f"Error incrementing field {field} for {id}: {e}")
            raise DatabaseError(f"Failed to increment field: {str(e)}")

    def push_to_array(
        self,
        id: str,
        field: str,
        value: Any
    ) -> Optional[T]:
        """
        Push a value to an array field.

        Args:
            id: Document ID
            field: Array field name
            value: Value to push

        Returns:
            Updated entity if found, None otherwise

        Raises:
            DatabaseError: If database operation fails
        """
        try:
            if not ObjectId.is_valid(id):
                return None

            result = self.collection.update_one(
                {self.id_field: ObjectId(id)},
                {
                    "$push": {field: value},
                    "$set": {"updated_at": datetime.now(timezone.utc)}
                }
            )

            if result.matched_count == 0:
                return None

            updated_doc = self.collection.find_one({self.id_field: ObjectId(id)})
            return self._document_to_entity(updated_doc) if updated_doc else None

        except PyMongoError as e:
            logger.error(f"Error pushing to array {field} for {id}: {e}")
            raise DatabaseError(f"Failed to push to array: {str(e)}")

    def pull_from_array(
        self,
        id: str,
        field: str,
        value: Any
    ) -> Optional[T]:
        """
        Remove a value from an array field.

        Args:
            id: Document ID
            field: Array field name
            value: Value to remove

        Returns:
            Updated entity if found, None otherwise

        Raises:
            DatabaseError: If database operation fails
        """
        try:
            if not ObjectId.is_valid(id):
                return None

            result = self.collection.update_one(
                {self.id_field: ObjectId(id)},
                {
                    "$pull": {field: value},
                    "$set": {"updated_at": datetime.now(timezone.utc)}
                }
            )

            if result.matched_count == 0:
                return None

            updated_doc = self.collection.find_one({self.id_field: ObjectId(id)})
            return self._document_to_entity(updated_doc) if updated_doc else None

        except PyMongoError as e:
            logger.error(f"Error pulling from array {field} for {id}: {e}")
            raise DatabaseError(f"Failed to pull from array: {str(e)}")

    # ==================== Soft Delete ====================

    def soft_delete(self, id: str) -> Optional[T]:
        """
        Soft delete a document (mark as deleted instead of removing).

        Args:
            id: Document ID

        Returns:
            Updated entity if found, None otherwise

        Raises:
            DatabaseError: If database operation fails
        """
        return self.update_fields(
            id,
            {
                "is_deleted": True,
                "deleted_at": datetime.now(timezone.utc)
            }
        )

    def restore(self, id: str) -> Optional[T]:
        """
        Restore a soft-deleted document.

        Args:
            id: Document ID

        Returns:
            Updated entity if found, None otherwise

        Raises:
            DatabaseError: If database operation fails
        """
        return self.update_fields(
            id,
            {
                "is_deleted": False,
                "deleted_at": None
            }
        )

    # ==================== Serialization ====================

    def _entity_to_document(self, entity: Union[T, Dict[str, Any]]) -> Dict[str, Any]:
        """
        Convert entity to MongoDB document.

        Args:
            entity: Entity object or dictionary

        Returns:
            MongoDB document dictionary
        """
        if isinstance(entity, dict):
            return entity.copy()

        # If entity has a to_dict method, use it
        if hasattr(entity, "to_dict"):
            return entity.to_dict()

        # If entity has __dict__, use it
        if hasattr(entity, "__dict__"):
            return entity.__dict__.copy()

        # Fallback: return as-is
        return entity

    def _document_to_entity(self, document: Dict[str, Any]) -> T:
        """
        Convert MongoDB document to entity.

        Args:
            document: MongoDB document

        Returns:
            Entity object
        """
        if document is None:
            return None

        # Convert ObjectId to string for id field
        if self.id_field in document and isinstance(document[self.id_field], ObjectId):
            document["id"] = str(document[self.id_field])

        # If entity_class is specified, use it to construct entity
        if self.entity_class is not None:
            try:
                # Try to construct using **kwargs
                if hasattr(self.entity_class, "from_dict"):
                    return self.entity_class.from_dict(document)
                else:
                    return self.entity_class(**document)
            except Exception as e:
                logger.warning(
                    f"Failed to construct entity from document: {e}. "
                    f"Returning document as-is."
                )

        # Return document as-is (will be Dict[str, Any])
        return document

    # ==================== Helper Methods ====================

    @staticmethod
    def build_sort(field: str, descending: bool = False) -> List[Tuple[str, int]]:
        """
        Build a sort specification.

        Args:
            field: Field name to sort by
            descending: If True, sort descending

        Returns:
            Sort specification for MongoDB
        """
        return [(field, DESCENDING if descending else ASCENDING)]

    @staticmethod
    def build_text_search_query(search_term: str, *fields: str) -> Dict[str, Any]:
        """
        Build a text search query for multiple fields.

        Args:
            search_term: Search term
            fields: Field names to search

        Returns:
            MongoDB query with $or for regex search
        """
        if not search_term or not fields:
            return {}

        regex = {"$regex": search_term, "$options": "i"}
        return {"$or": [{field: regex} for field in fields]}

    def create_index(
        self,
        keys: Union[str, List[Tuple[str, int]]],
        **kwargs
    ) -> str:
        """
        Create an index on the collection.

        Args:
            keys: Index specification (field name or list of tuples)
            **kwargs: Additional index options (unique, sparse, etc.)

        Returns:
            Index name

        Raises:
            DatabaseError: If index creation fails
        """
        try:
            return self.collection.create_index(keys, **kwargs)

        except PyMongoError as e:
            logger.error(f"Error creating index: {e}")
            raise DatabaseError(f"Failed to create index: {str(e)}")

    def drop_index(self, index_name: str) -> None:
        """
        Drop an index from the collection.

        Args:
            index_name: Name of index to drop

        Raises:
            DatabaseError: If index drop fails
        """
        try:
            self.collection.drop_index(index_name)

        except PyMongoError as e:
            logger.error(f"Error dropping index {index_name}: {e}")
            raise DatabaseError(f"Failed to drop index: {str(e)}")
