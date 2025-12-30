"""
GWAS Result Repository
======================
Data access layer for GWAS analysis results.
"""

from typing import Optional, List, Dict, Any
from datetime import datetime
from pymongo.collection import Collection
from bson import ObjectId

from ..core.database.collections import get_collection, CollectionName
from ..schema.gwas import (
    GwasResultResponse,
    GwasResultDetailResponse,
    SnpAssociation,
    GwasSummaryStats,
    ManhattanPlotData,
    QQPlotData,
)


class GwasResultRepository:
    """Repository for GWAS analysis result operations."""

    def __init__(self):
        self._collection: Optional[Collection] = None

    def _get_collection(self) -> Collection:
        """Get the GWAS results collection."""
        if self._collection is None:
            self._collection = get_collection(CollectionName.GWAS_RESULTS, required=True)
        if self._collection is None:
            raise RuntimeError("GWAS results collection not available")
        return self._collection

    def create(
        self,
        job_id: str,
        user_id: str,
        dataset_id: str,
        associations: List[Dict[str, Any]],  # Raw dicts from C++ engine
        summary: Dict[str, Any],
        manhattan_plot_data: Dict[str, Any],
        qq_plot_data: Dict[str, Any],
        top_hits: List[Dict[str, Any]],
    ) -> GwasResultResponse:
        """
        Create GWAS analysis results.

        Args:
            job_id: Job ID
            user_id: User ID
            dataset_id: Dataset ID
            associations: List of SNP associations
            summary: Summary statistics
            manhattan_plot_data: Manhattan plot data
            qq_plot_data: Q-Q plot data
            top_hits: Top significant associations (max 100)

        Returns:
            Created result
        """
        collection = self._get_collection()
        now = datetime.utcnow()

        result_doc = {
            "job_id": job_id,
            "user_id": user_id,
            "dataset_id": dataset_id,
            "associations": associations,  # Full results
            "summary": summary,
            "manhattan_plot_data": manhattan_plot_data,
            "qq_plot_data": qq_plot_data,
            "top_hits": top_hits[:100],  # Limit to 100
            "created_at": now,
        }

        insert_result = collection.insert_one(result_doc)
        result_doc["_id"] = insert_result.inserted_id

        return self._doc_to_summary_response(result_doc)

    def find_by_id(self, result_id: str) -> Optional[GwasResultResponse]:
        """Find result by ID (summary only, no full associations)."""
        collection = self._get_collection()

        try:
            doc = collection.find_one(
                {"_id": ObjectId(result_id)},
                projection={"associations": 0},  # Exclude full associations
            )
            if doc:
                return self._doc_to_summary_response(doc)
        except Exception:
            pass  # Invalid ObjectId

        return None

    def find_by_job_id(self, job_id: str) -> Optional[GwasResultResponse]:
        """Find result by job ID (summary only)."""
        collection = self._get_collection()

        doc = collection.find_one(
            {"job_id": job_id},
            projection={"associations": 0},
        )

        if doc:
            return self._doc_to_summary_response(doc)

        return None

    def find_detailed_by_job_id(self, job_id: str) -> Optional[GwasResultDetailResponse]:
        """Find result with full associations by job ID."""
        collection = self._get_collection()

        doc = collection.find_one({"job_id": job_id})

        if doc:
            return self._doc_to_detail_response(doc)

        return None

    def get_top_associations(
        self,
        job_id: str,
        limit: int = 100,
    ) -> List[SnpAssociation]:
        """
        Get top associations for a job.

        Args:
            job_id: Job ID
            limit: Max number of associations (default 100)

        Returns:
            List of top associations
        """
        collection = self._get_collection()

        doc = collection.find_one(
            {"job_id": job_id},
            projection={"top_hits": 1},
        )

        if doc and "top_hits" in doc:
            top_hits = doc["top_hits"][:limit]
            return [SnpAssociation(**hit) for hit in top_hits]

        return []

    def get_associations_by_chromosome(
        self,
        job_id: str,
        chromosome: int,
        p_value_threshold: Optional[float] = None,
    ) -> List[SnpAssociation]:
        """
        Get associations for a specific chromosome.

        Args:
            job_id: Job ID
            chromosome: Chromosome number (1-23)
            p_value_threshold: Optional p-value filter

        Returns:
            List of associations for the chromosome
        """
        collection = self._get_collection()

        # Build aggregation pipeline
        match_stage: Dict[str, Any] = {"job_id": job_id}

        pipeline = [
            {"$match": match_stage},
            {"$unwind": "$associations"},
            {"$match": {"associations.chromosome": chromosome}},
        ]

        if p_value_threshold is not None:
            pipeline.append({"$match": {"associations.p_value": {"$lte": p_value_threshold}}})

        pipeline.extend([
            {"$sort": {"associations.p_value": 1}},  # Sort by p-value ascending
            {"$limit": 1000},  # Limit to prevent huge results
            {"$replaceRoot": {"newRoot": "$associations"}},
        ])

        cursor = collection.aggregate(pipeline)
        return [SnpAssociation(**doc) for doc in cursor]

    def get_visualization_data(
        self,
        job_id: str,
    ) -> Optional[Dict[str, Any]]:
        """
        Get Manhattan and Q-Q plot data for visualization.

        Args:
            job_id: Job ID

        Returns:
            Dict with manhattan_plot_data and qq_plot_data
        """
        collection = self._get_collection()

        doc = collection.find_one(
            {"job_id": job_id},
            projection={
                "manhattan_plot_data": 1,
                "qq_plot_data": 1,
            },
        )

        if doc:
            return {
                "manhattan_plot_data": doc.get("manhattan_plot_data"),
                "qq_plot_data": doc.get("qq_plot_data"),
            }

        return None

    def delete_by_job_id(self, job_id: str) -> bool:
        """
        Delete results for a job.

        Args:
            job_id: Job ID

        Returns:
            True if deleted
        """
        collection = self._get_collection()
        result = collection.delete_one({"job_id": job_id})
        return result.deleted_count > 0

    def _doc_to_summary_response(self, doc: Dict[str, Any]) -> GwasResultResponse:
        """Convert MongoDB document to summary response (without full associations)."""
        return GwasResultResponse(
            id=str(doc["_id"]),
            job_id=doc["job_id"],
            user_id=doc["user_id"],
            dataset_id=doc["dataset_id"],
            summary=GwasSummaryStats(**doc["summary"]),
            manhattan_plot_data=ManhattanPlotData(**doc["manhattan_plot_data"]),
            qq_plot_data=QQPlotData(**doc["qq_plot_data"]),
            top_hits=[SnpAssociation(**hit) for hit in doc.get("top_hits", [])],
            created_at=doc["created_at"],
        )

    def _doc_to_detail_response(self, doc: Dict[str, Any]) -> GwasResultDetailResponse:
        """Convert MongoDB document to detailed response (with all associations)."""
        return GwasResultDetailResponse(
            id=str(doc["_id"]),
            job_id=doc["job_id"],
            summary=GwasSummaryStats(**doc["summary"]),
            associations=[SnpAssociation(**assoc) for assoc in doc.get("associations", [])],
            manhattan_plot_data=ManhattanPlotData(**doc["manhattan_plot_data"]),
            qq_plot_data=QQPlotData(**doc["qq_plot_data"]),
            created_at=doc["created_at"],
        )


# Singleton instance
_gwas_result_repository: Optional[GwasResultRepository] = None


def get_gwas_result_repository() -> GwasResultRepository:
    """Get singleton instance of GWAS result repository."""
    global _gwas_result_repository
    if _gwas_result_repository is None:
        _gwas_result_repository = GwasResultRepository()
    return _gwas_result_repository
