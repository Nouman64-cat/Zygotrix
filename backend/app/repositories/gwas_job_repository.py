"""
GWAS Job Repository
===================
Data access layer for GWAS analysis jobs.
"""

from typing import Optional, List, Dict, Any, Tuple
from datetime import datetime
from pymongo.collection import Collection
from bson import ObjectId

from ..core.database.collections import get_collection, CollectionName
from ..schema.gwas import GwasJobResponse, GwasJobStatus, GwasAnalysisType


class GwasJobRepository:
    """Repository for GWAS analysis job operations."""

    def __init__(self):
        self._collection: Optional[Collection] = None

    def _get_collection(self) -> Collection:
        """Get the GWAS jobs collection."""
        if self._collection is None:
            self._collection = get_collection(CollectionName.GWAS_JOBS, required=True)
        if self._collection is None:
            raise RuntimeError("GWAS jobs collection not available")
        return self._collection

    def create(
        self,
        user_id: str,
        dataset_id: str,
        analysis_type: GwasAnalysisType,
        phenotype_column: str,
        covariates: List[str],
        maf_threshold: float = 0.01,
        significance_threshold: float = 5e-8,
    ) -> GwasJobResponse:
        """
        Create a new GWAS analysis job.

        Args:
            user_id: User ID
            dataset_id: Dataset to analyze
            analysis_type: Type of analysis (linear, logistic, chi_square)
            phenotype_column: Phenotype column name
            covariates: List of covariate column names
            maf_threshold: Minimum allele frequency
            significance_threshold: P-value threshold

        Returns:
            Created job
        """
        collection = self._get_collection()
        now = datetime.utcnow()

        job_doc = {
            "user_id": user_id,
            "dataset_id": dataset_id,
            "analysis_type": analysis_type.value if isinstance(analysis_type, GwasAnalysisType) else analysis_type,
            "phenotype_column": phenotype_column,
            "covariates": covariates,
            "maf_threshold": maf_threshold,
            "significance_threshold": significance_threshold,
            "status": GwasJobStatus.QUEUED.value,
            "progress": 0,
            "error_message": None,
            "result_id": None,
            "snps_tested": None,
            "significant_snps": None,
            "execution_time_seconds": None,
            "created_at": now,
            "started_at": None,
            "completed_at": None,
        }

        result = collection.insert_one(job_doc)
        job_doc["_id"] = result.inserted_id

        return self._doc_to_response(job_doc)

    def find_by_id(self, job_id: str) -> Optional[GwasJobResponse]:
        """Find job by ID."""
        collection = self._get_collection()

        try:
            doc = collection.find_one({"_id": ObjectId(job_id)})
            if doc:
                return self._doc_to_response(doc)
        except Exception:
            pass  # Invalid ObjectId

        return None

    def find_by_user(
        self,
        user_id: str,
        status: Optional[GwasJobStatus] = None,
        dataset_id: Optional[str] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> Tuple[List[GwasJobResponse], int]:
        """
        Find jobs for a user with optional filtering and pagination.

        Args:
            user_id: User ID
            status: Optional status filter
            dataset_id: Optional dataset filter
            skip: Number of records to skip
            limit: Max records to return

        Returns:
            Tuple of (jobs list, total count)
        """
        collection = self._get_collection()

        query: Dict[str, Any] = {"user_id": user_id}
        if status:
            query["status"] = status.value
        if dataset_id:
            query["dataset_id"] = dataset_id

        # Get total count
        total = collection.count_documents(query)

        # Get paginated results (most recent first)
        cursor = collection.find(query).sort("created_at", -1).skip(skip).limit(limit)

        jobs = [self._doc_to_response(doc) for doc in cursor]

        return jobs, total

    def find_by_dataset(self, dataset_id: str) -> List[GwasJobResponse]:
        """Find all jobs for a dataset."""
        collection = self._get_collection()

        cursor = collection.find({"dataset_id": dataset_id}).sort("created_at", -1)
        return [self._doc_to_response(doc) for doc in cursor]

    def update_status(
        self,
        job_id: str,
        status: GwasJobStatus,
        **additional_fields: Any,
    ) -> Optional[GwasJobResponse]:
        """
        Update job status and optional additional fields.

        Args:
            job_id: Job ID
            status: New status
            **additional_fields: Additional fields (e.g., error_message, result_id)

        Returns:
            Updated job or None
        """
        collection = self._get_collection()

        try:
            oid = ObjectId(job_id)
        except Exception:
            return None

        update_doc: Dict[str, Any] = {"status": status.value}

        # Set timestamps based on status
        if status == GwasJobStatus.PROCESSING and "started_at" not in additional_fields:
            update_doc["started_at"] = datetime.utcnow()
        elif status in (GwasJobStatus.COMPLETED, GwasJobStatus.FAILED, GwasJobStatus.CANCELLED):
            if "completed_at" not in additional_fields:
                update_doc["completed_at"] = datetime.utcnow()

        # Merge additional fields
        update_doc.update(additional_fields)

        result = collection.find_one_and_update(
            {"_id": oid},
            {"$set": update_doc},
            return_document=True,
        )

        if result:
            return self._doc_to_response(result)

        return None

    def update_progress(
        self,
        job_id: str,
        progress: int,
    ) -> Optional[GwasJobResponse]:
        """
        Update job progress percentage.

        Args:
            job_id: Job ID
            progress: Progress percentage (0-100)

        Returns:
            Updated job or None
        """
        collection = self._get_collection()

        try:
            oid = ObjectId(job_id)
        except Exception:
            return None

        result = collection.find_one_and_update(
            {"_id": oid},
            {"$set": {"progress": min(100, max(0, progress))}},
            return_document=True,
        )

        if result:
            return self._doc_to_response(result)

        return None

    def delete(self, job_id: str) -> bool:
        """
        Delete a job.

        Args:
            job_id: Job ID

        Returns:
            True if deleted, False if not found
        """
        collection = self._get_collection()

        try:
            oid = ObjectId(job_id)
        except Exception:
            return False

        result = collection.delete_one({"_id": oid})
        return result.deleted_count > 0

    def count_active_jobs(self, user_id: str) -> int:
        """
        Count active (queued or processing) jobs for a user.

        Args:
            user_id: User ID

        Returns:
            Count of active jobs
        """
        collection = self._get_collection()

        return collection.count_documents({
            "user_id": user_id,
            "status": {"$in": [GwasJobStatus.QUEUED.value, GwasJobStatus.PROCESSING.value]},
        })

    def _doc_to_response(self, doc: Dict[str, Any]) -> GwasJobResponse:
        """Convert MongoDB document to response model."""
        return GwasJobResponse(
            id=str(doc["_id"]),
            user_id=doc["user_id"],
            dataset_id=doc["dataset_id"],
            analysis_type=doc["analysis_type"],
            phenotype_column=doc["phenotype_column"],
            covariates=doc.get("covariates", []),
            maf_threshold=doc.get("maf_threshold", 0.01),
            significance_threshold=doc.get("significance_threshold", 5e-8),
            status=doc["status"],
            progress=doc.get("progress", 0),
            error_message=doc.get("error_message"),
            result_id=doc.get("result_id"),
            snps_tested=doc.get("snps_tested"),
            significant_snps=doc.get("significant_snps"),
            execution_time_seconds=doc.get("execution_time_seconds"),
            created_at=doc["created_at"],
            started_at=doc.get("started_at"),
            completed_at=doc.get("completed_at"),
        )


# Singleton instance
_gwas_job_repository: Optional[GwasJobRepository] = None


def get_gwas_job_repository() -> GwasJobRepository:
    """Get singleton instance of GWAS job repository."""
    global _gwas_job_repository
    if _gwas_job_repository is None:
        _gwas_job_repository = GwasJobRepository()
    return _gwas_job_repository
