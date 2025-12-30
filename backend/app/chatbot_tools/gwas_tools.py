"""
GWAS Chatbot Tools
==================
Tools for running GWAS analysis and managing datasets via Claude chatbot.
"""

from typing import Optional, List, Dict, Any
import logging

from ..repositories import (
    get_gwas_dataset_repository,
    get_gwas_job_repository,
    get_gwas_result_repository,
)
from ..services import get_gwas_analysis_service
from ..schema.gwas import (
    GwasAnalysisType,
    GwasJobStatus,
)

logger = logging.getLogger(__name__)


def list_gwas_datasets(user_id: str) -> dict:
    """
    List user's GWAS datasets.

    Args:
        user_id: User identifier

    Returns:
        dict: List of datasets with status and metadata
    """
    try:
        dataset_repo = get_gwas_dataset_repository()
        datasets, total = dataset_repo.find_by_user(
            user_id=user_id,
            status=None,
            skip=0,
            limit=50,
        )

        return {
            "success": True,
            "total": total,
            "datasets": [
                {
                    "id": ds.id,
                    "name": ds.name,
                    "trait_name": ds.trait_name,
                    "trait_type": ds.trait_type,
                    "status": ds.status.value,
                    "num_snps": ds.num_snps,
                    "num_samples": ds.num_samples,
                    "created_at": ds.created_at.isoformat() if ds.created_at else None,
                }
                for ds in datasets
            ],
        }
    except Exception as e:
        logger.error(f"Error listing GWAS datasets: {e}")
        return {
            "success": False,
            "error": str(e),
        }


def get_gwas_job_status(job_id: str, user_id: str) -> dict:
    """
    Get status of a GWAS analysis job.

    Args:
        job_id: Job identifier
        user_id: User identifier (for authorization)

    Returns:
        dict: Job status and progress information
    """
    try:
        analysis_service = get_gwas_analysis_service()
        job = analysis_service.get_job_status(job_id, user_id)

        if not job:
            return {
                "success": False,
                "error": f"Job {job_id} not found",
            }

        return {
            "success": True,
            "job_id": job.id,
            "dataset_id": job.dataset_id,
            "status": job.status.value,
            "progress": job.progress,
            "analysis_type": job.analysis_type.value,
            "phenotype": job.phenotype_column,
            "snps_tested": job.snps_tested,
            "execution_time_seconds": job.execution_time_seconds,
            "error_message": job.error_message,
            "created_at": job.created_at.isoformat() if job.created_at else None,
            "completed_at": job.completed_at.isoformat() if job.completed_at else None,
        }
    except Exception as e:
        logger.error(f"Error getting GWAS job status: {e}")
        return {
            "success": False,
            "error": str(e),
        }


def run_gwas_analysis(
    dataset_id: str,
    user_id: str,
    phenotype_column: str,
    analysis_type: str = "linear",
    covariates: Optional[List[str]] = None,
    maf_threshold: float = 0.01,
    num_threads: int = 4,
) -> dict:
    """
    Run GWAS analysis and return interactive visualization widget.

    This is the PRIMARY GWAS tool. Use when user asks to:
    - Run GWAS analysis
    - Analyze genetic associations
    - Find SNPs associated with a trait
    - Run linear/logistic regression
    - Generate Manhattan plot or Q-Q plot

    Args:
        dataset_id: Dataset ID to analyze
        user_id: User identifier (for authorization)
        phenotype_column: Name of phenotype column to analyze
        analysis_type: Type of analysis ('linear', 'logistic', 'chi_square')
        covariates: List of covariate column names (optional)
        maf_threshold: Minimum minor allele frequency (default: 0.01)
        num_threads: Number of CPU threads (default: 4)

    Returns:
        dict: Widget data with Manhattan plot, Q-Q plot, and top associations
    """
    try:
        # Validate analysis type
        try:
            analysis_type_enum = GwasAnalysisType(analysis_type.lower())
        except ValueError:
            return {
                "success": False,
                "error": f"Invalid analysis type: {analysis_type}. Must be 'linear', 'logistic', or 'chi_square'",
            }

        # Create job
        job_repo = get_gwas_job_repository()
        job = job_repo.create(
            user_id=user_id,
            dataset_id=dataset_id,
            analysis_type=analysis_type_enum,
            phenotype_column=phenotype_column,
            covariates=covariates or [],
            maf_threshold=maf_threshold,
        )

        # Run analysis (synchronous for chatbot - we want immediate results)
        analysis_service = get_gwas_analysis_service()
        result = analysis_service.run_analysis(
            job_id=job.id,
            user_id=user_id,
            dataset_id=dataset_id,
            analysis_type=analysis_type_enum,
            phenotype_column=phenotype_column,
            covariates=covariates,
            maf_threshold=maf_threshold,
            num_threads=num_threads,
        )

        # Get updated job status
        job = job_repo.find_by_id(job.id)

        # Get visualization data
        viz_data = analysis_service.get_visualization_data(job.id, user_id)

        # Format widget data for frontend
        widget_data = {
            "widget_type": "gwas_results",
            "gwas_data": {
                "job_id": job.id,
                "dataset_id": dataset_id,
                "analysis_type": analysis_type,
                "phenotype": phenotype_column,
                "status": job.status.value,
                "manhattan_data": viz_data.get("manhattan_plot_data", {}),
                "qq_data": viz_data.get("qq_plot_data", {}),
                "top_associations": result.associations[:100] if result.associations else [],
                "summary": {
                    "total_snps": job.snps_tested or 0,
                    "snps_filtered": job.snps_filtered if hasattr(job, 'snps_filtered') else 0,
                    "execution_time_seconds": job.execution_time_seconds,
                    "lambda_gc": viz_data.get("qq_plot_data", {}).get("lambda_gc", 1.0),
                },
            },
        }

        return widget_data

    except Exception as e:
        logger.error(f"Error running GWAS analysis: {e}", exc_info=True)
        return {
            "success": False,
            "error": str(e),
        }


def get_gwas_results(job_id: str, user_id: str) -> dict:
    """
    Get results from a completed GWAS analysis.

    Use this when user asks to:
    - View previous GWAS results
    - Show Manhattan plot for completed job
    - Get top associations from a job

    Args:
        job_id: Job identifier
        user_id: User identifier (for authorization)

    Returns:
        dict: Widget data with visualization and results
    """
    try:
        analysis_service = get_gwas_analysis_service()

        # Check job status
        job = analysis_service.get_job_status(job_id, user_id)
        if not job:
            return {
                "success": False,
                "error": f"Job {job_id} not found",
            }

        if job.status != GwasJobStatus.COMPLETED:
            return {
                "success": False,
                "error": f"Job {job_id} is not completed (status: {job.status.value})",
                "job_status": job.status.value,
            }

        # Get results
        result = analysis_service.get_job_results(job_id, user_id)
        viz_data = analysis_service.get_visualization_data(job_id, user_id)

        # Format widget data
        widget_data = {
            "widget_type": "gwas_results",
            "gwas_data": {
                "job_id": job_id,
                "dataset_id": job.dataset_id,
                "analysis_type": job.analysis_type.value,
                "phenotype": job.phenotype_column,
                "status": job.status.value,
                "manhattan_data": viz_data.get("manhattan_plot_data", {}),
                "qq_data": viz_data.get("qq_plot_data", {}),
                "top_associations": result.associations[:100] if result.associations else [],
                "summary": {
                    "total_snps": job.snps_tested or 0,
                    "snps_filtered": job.snps_filtered if hasattr(job, 'snps_filtered') else 0,
                    "execution_time_seconds": job.execution_time_seconds,
                    "lambda_gc": viz_data.get("qq_plot_data", {}).get("lambda_gc", 1.0),
                },
            },
        }

        return widget_data

    except Exception as e:
        logger.error(f"Error getting GWAS results: {e}")
        return {
            "success": False,
            "error": str(e),
        }


def list_gwas_jobs(user_id: str, status: Optional[str] = None, limit: int = 10) -> dict:
    """
    List user's GWAS analysis jobs.

    Args:
        user_id: User identifier
        status: Optional status filter ('queued', 'processing', 'completed', 'failed')
        limit: Maximum number of jobs to return (default: 10)

    Returns:
        dict: List of jobs with status and metadata
    """
    try:
        job_repo = get_gwas_job_repository()

        # Convert status string to enum
        status_enum = None
        if status:
            try:
                status_enum = GwasJobStatus(status.lower())
            except ValueError:
                return {
                    "success": False,
                    "error": f"Invalid status: {status}. Must be one of: queued, processing, completed, failed, cancelled",
                }

        jobs, total = job_repo.find_by_user(
            user_id=user_id,
            status=status_enum,
            dataset_id=None,
            skip=0,
            limit=limit,
        )

        return {
            "success": True,
            "total": total,
            "jobs": [
                {
                    "id": job.id,
                    "dataset_id": job.dataset_id,
                    "analysis_type": job.analysis_type.value,
                    "phenotype": job.phenotype_column,
                    "status": job.status.value,
                    "progress": job.progress,
                    "snps_tested": job.snps_tested,
                    "execution_time_seconds": job.execution_time_seconds,
                    "error_message": job.error_message,
                    "created_at": job.created_at.isoformat() if job.created_at else None,
                    "completed_at": job.completed_at.isoformat() if job.completed_at else None,
                }
                for job in jobs
            ],
        }
    except Exception as e:
        logger.error(f"Error listing GWAS jobs: {e}")
        return {
            "success": False,
            "error": str(e),
        }
