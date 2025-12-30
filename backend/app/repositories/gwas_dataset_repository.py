"""
GWAS Dataset Repository
=======================
Data access layer for GWAS datasets.
"""

from typing import Optional, List, Dict, Any, Tuple
from datetime import datetime
from pymongo.collection import Collection
from bson import ObjectId

from ..core.database.collections import get_collection, CollectionName
from ..schema.gwas import GwasDatasetResponse, GwasDatasetStatus


class GwasDatasetRepository:
    """Repository for GWAS dataset operations."""

    def __init__(self):
        self._collection: Optional[Collection] = None

    def _get_collection(self) -> Collection:
        """Get the GWAS datasets collection."""
        if self._collection is None:
            self._collection = get_collection(CollectionName.GWAS_DATASETS, required=True)
        if self._collection is None:
            raise RuntimeError("GWAS datasets collection not available")
        return self._collection

    def create(
        self,
        user_id: str,
        name: str,
        description: Optional[str],
        file_format: str,
        trait_type: str,
        trait_name: str,
        file_path: Optional[str] = None,
    ) -> GwasDatasetResponse:
        """
        Create a new GWAS dataset.

        Args:
            user_id: Owner user ID
            name: Dataset name
            description: Optional description
            file_format: File format (vcf, plink, custom)
            trait_type: Trait type (quantitative, binary)
            trait_name: Name of the phenotype
            file_path: Path to uploaded file

        Returns:
            Created dataset
        """
        collection = self._get_collection()
        now = datetime.utcnow()

        dataset_doc = {
            "user_id": user_id,
            "name": name,
            "description": description,
            "file_format": file_format,
            "trait_type": trait_type,
            "trait_name": trait_name,
            "status": GwasDatasetStatus.UPLOADING.value,
            "num_snps": None,
            "num_samples": None,
            "file_path": file_path,
            "created_at": now,
            "updated_at": now,
        }

        result = collection.insert_one(dataset_doc)
        dataset_doc["_id"] = result.inserted_id

        return self._doc_to_response(dataset_doc)

    def find_by_id(self, dataset_id: str) -> Optional[GwasDatasetResponse]:
        """Find dataset by ID."""
        collection = self._get_collection()

        try:
            doc = collection.find_one({"_id": ObjectId(dataset_id)})
            if doc:
                return self._doc_to_response(doc)
        except Exception:
            pass  # Invalid ObjectId

        return None

    def find_by_user(
        self,
        user_id: str,
        status: Optional[GwasDatasetStatus] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> Tuple[List[GwasDatasetResponse], int]:
        """
        Find datasets for a user with optional filtering and pagination.

        Args:
            user_id: User ID
            status: Optional status filter
            skip: Number of records to skip
            limit: Max records to return

        Returns:
            Tuple of (datasets list, total count)
        """
        collection = self._get_collection()

        query: Dict[str, Any] = {"user_id": user_id}
        if status:
            query["status"] = status.value

        # Get total count
        total = collection.count_documents(query)

        # Get paginated results
        cursor = collection.find(query).sort("created_at", -1).skip(skip).limit(limit)

        datasets = [self._doc_to_response(doc) for doc in cursor]

        return datasets, total

    def update(
        self,
        dataset_id: str,
        **fields: Any,
    ) -> Optional[GwasDatasetResponse]:
        """
        Update dataset fields.

        Args:
            dataset_id: Dataset ID
            **fields: Fields to update

        Returns:
            Updated dataset or None if not found
        """
        collection = self._get_collection()

        try:
            oid = ObjectId(dataset_id)
        except Exception:
            return None  # Invalid ID

        # Add updated_at timestamp
        update_doc = {"$set": {**fields, "updated_at": datetime.utcnow()}}

        result = collection.find_one_and_update(
            {"_id": oid},
            update_doc,
            return_document=True,  # Return updated document
        )

        if result:
            return self._doc_to_response(result)

        return None

    def update_status(
        self,
        dataset_id: str,
        status: GwasDatasetStatus,
        **additional_fields: Any,
    ) -> Optional[GwasDatasetResponse]:
        """
        Update dataset status and optional additional fields.

        Args:
            dataset_id: Dataset ID
            status: New status
            **additional_fields: Additional fields to update

        Returns:
            Updated dataset or None
        """
        return self.update(dataset_id, status=status.value, **additional_fields)

    def delete(self, dataset_id: str) -> bool:
        """
        Delete a dataset.

        Args:
            dataset_id: Dataset ID

        Returns:
            True if deleted, False if not found
        """
        collection = self._get_collection()

        try:
            oid = ObjectId(dataset_id)
        except Exception:
            return False

        result = collection.delete_one({"_id": oid})
        return result.deleted_count > 0

    def exists(self, dataset_id: str, user_id: Optional[str] = None) -> bool:
        """
        Check if dataset exists, optionally for a specific user.

        Args:
            dataset_id: Dataset ID
            user_id: Optional user ID to check ownership

        Returns:
            True if exists
        """
        collection = self._get_collection()

        try:
            oid = ObjectId(dataset_id)
        except Exception:
            return False

        query: Dict[str, Any] = {"_id": oid}
        if user_id:
            query["user_id"] = user_id

        return collection.count_documents(query, limit=1) > 0

    def _doc_to_response(self, doc: Dict[str, Any]) -> GwasDatasetResponse:
        """Convert MongoDB document to response model."""
        return GwasDatasetResponse(
            id=str(doc["_id"]),
            user_id=doc["user_id"],
            name=doc["name"],
            description=doc.get("description"),
            file_format=doc["file_format"],
            trait_type=doc["trait_type"],
            trait_name=doc["trait_name"],
            status=doc["status"],
            num_snps=doc.get("num_snps"),
            num_samples=doc.get("num_samples"),
            file_path=doc.get("file_path"),
            created_at=doc["created_at"],
            updated_at=doc.get("updated_at"),
        )


# Singleton instance
_gwas_dataset_repository: Optional[GwasDatasetRepository] = None


def get_gwas_dataset_repository() -> GwasDatasetRepository:
    """Get singleton instance of GWAS dataset repository."""
    global _gwas_dataset_repository
    if _gwas_dataset_repository is None:
        _gwas_dataset_repository = GwasDatasetRepository()
    return _gwas_dataset_repository
