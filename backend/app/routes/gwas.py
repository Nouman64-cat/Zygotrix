"""
GWAS API Endpoints
==================
RESTful API for GWAS dataset management, analysis jobs, and results.
"""

from __future__ import annotations

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Path, UploadFile, File, BackgroundTasks
from fastapi.responses import StreamingResponse
import io
import csv
import json

from ..dependencies import get_current_user
from ..schema.auth import UserProfile
from ..schema.gwas import (
    GwasDatasetResponse,
    GwasDatasetStatus,
    GwasJobResponse,
    GwasJobStatus,
    GwasResultResponse,
    GwasAnalysisType,
    GwasFileFormat,
    GwasAnalysisRequest,
    SnpAssociation,
)
from ..repositories import (
    get_gwas_dataset_repository,
    get_gwas_job_repository,
    get_gwas_result_repository,
)
from ..services import get_gwas_analysis_service, get_gwas_dataset_service
from ..services import gwas_dataset  # For legacy trait search

router = APIRouter(prefix="/api/gwas", tags=["GWAS"])


# ============================================================================
# Dataset Endpoints
# ============================================================================

@router.post("/datasets/upload", response_model=GwasDatasetResponse, status_code=201)
async def upload_dataset(
    name: str = Query(..., description="Dataset name"),
    description: Optional[str] = Query(None, description="Dataset description"),
    file_format: GwasFileFormat = Query(..., description="File format (vcf, plink, custom)"),
    trait_type: str = Query(..., description="Trait type (quantitative or binary)"),
    trait_name: str = Query(..., description="Trait name"),
    file: UploadFile = File(..., description="Dataset file (VCF, PLINK, or custom JSON)"),
    current_user: UserProfile = Depends(get_current_user),
) -> GwasDatasetResponse:
    """
    Upload a new GWAS dataset.

    Supported formats:
    - VCF: Variant Call Format (.vcf or .vcf.gz)
    - PLINK: Binary PLINK format (.bed/.bim/.fam - upload as zip)
    - CUSTOM: Custom JSON format

    This endpoint will:
    1. Upload the file to secure storage
    2. Parse the file based on format
    3. Extract SNPs, samples, and phenotypes
    4. Validate data integrity
    5. Save processed data for analysis
    """
    dataset_service = get_gwas_dataset_service()

    # Upload and parse dataset
    dataset = await dataset_service.upload_and_parse_dataset(
        user_id=current_user.id,
        file=file,
        name=name,
        description=description,
        file_format=file_format,
        trait_type=trait_type,
        trait_name=trait_name,
    )

    return dataset


@router.get("/datasets", response_model=dict)
def list_datasets(
    status: Optional[GwasDatasetStatus] = Query(None, description="Filter by status"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(50, ge=1, le=100, description="Max records to return"),
    current_user: UserProfile = Depends(get_current_user),
) -> dict:
    """
    List user's GWAS datasets with pagination.

    Returns:
        {
            "datasets": [...],
            "total": int,
            "skip": int,
            "limit": int
        }
    """
    dataset_repo = get_gwas_dataset_repository()

    datasets, total = dataset_repo.find_by_user(
        user_id=current_user.id,
        status=status,
        skip=skip,
        limit=limit,
    )

    return {
        "datasets": datasets,
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@router.get("/datasets/{dataset_id}", response_model=GwasDatasetResponse)
def get_dataset(
    dataset_id: str = Path(..., description="Dataset ID"),
    current_user: UserProfile = Depends(get_current_user),
) -> GwasDatasetResponse:
    """Get detailed information about a specific dataset."""
    dataset_repo = get_gwas_dataset_repository()
    dataset = dataset_repo.find_by_id(dataset_id)

    if not dataset:
        raise HTTPException(status_code=404, detail=f"Dataset {dataset_id} not found")

    if dataset.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized access to dataset")

    return dataset


@router.delete("/datasets/{dataset_id}", status_code=204)
def delete_dataset(
    dataset_id: str = Path(..., description="Dataset ID"),
    current_user: UserProfile = Depends(get_current_user),
):
    """
    Delete a GWAS dataset.

    Note: This will also delete all associated jobs and results.
    """
    dataset_repo = get_gwas_dataset_repository()
    job_repo = get_gwas_job_repository()

    dataset = dataset_repo.find_by_id(dataset_id)

    if not dataset:
        raise HTTPException(status_code=404, detail=f"Dataset {dataset_id} not found")

    if dataset.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized access to dataset")

    # Delete dataset and all associated files
    dataset_service = get_gwas_dataset_service()
    success = dataset_service.delete_dataset(user_id=current_user.id, dataset_id=dataset_id)

    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete dataset")


# ============================================================================
# Analysis Job Endpoints
# ============================================================================

@router.post("/jobs", response_model=GwasJobResponse, status_code=201)
def create_analysis_job(
    request: GwasAnalysisRequest,
    background_tasks: BackgroundTasks,
    current_user: UserProfile = Depends(get_current_user),
) -> GwasJobResponse:
    """
    Create and start a new GWAS analysis job.

    The analysis runs in the background. Use GET /jobs/{job_id} to check status.

    Request body:
    ```json
    {
        "dataset_id": "dataset_123",
        "analysis_type": "linear",
        "phenotype_column": "height",
        "covariates": ["age", "sex"],
        "maf_threshold": 0.01,
        "num_threads": 4
    }
    ```
    """
    dataset_repo = get_gwas_dataset_repository()
    job_repo = get_gwas_job_repository()
    analysis_service = get_gwas_analysis_service()

    # Verify dataset exists and user has access
    dataset = dataset_repo.find_by_id(request.dataset_id)
    if not dataset:
        raise HTTPException(status_code=404, detail=f"Dataset {request.dataset_id} not found")

    if dataset.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized access to dataset")

    if dataset.status != GwasDatasetStatus.READY:
        raise HTTPException(
            status_code=400,
            detail=f"Dataset is not ready for analysis (status: {dataset.status})",
        )

    # Check for active job limit (optional rate limiting)
    active_jobs = job_repo.count_active_jobs(current_user.id)
    if active_jobs >= 5:
        raise HTTPException(
            status_code=429,
            detail="Maximum active jobs limit reached (5). Please wait for existing jobs to complete.",
        )

    # Create job
    job = job_repo.create(
        user_id=current_user.id,
        dataset_id=request.dataset_id,
        analysis_type=request.analysis_type,
        phenotype_column=request.phenotype_column,
        covariates=request.covariates or [],
        maf_threshold=request.maf_threshold,
    )

    # Run analysis in background
    background_tasks.add_task(
        _run_analysis_background,
        job_id=job.id,
        user_id=current_user.id,
        dataset_id=request.dataset_id,
        analysis_type=request.analysis_type,
        phenotype_column=request.phenotype_column,
        covariates=request.covariates,
        maf_threshold=request.maf_threshold,
        num_threads=request.num_threads,
    )

    return job


def _run_analysis_background(
    job_id: str,
    user_id: str,
    dataset_id: str,
    analysis_type: GwasAnalysisType,
    phenotype_column: str,
    covariates: Optional[List[str]],
    maf_threshold: float,
    num_threads: int,
) -> None:
    """Background task to run GWAS analysis."""
    analysis_service = get_gwas_analysis_service()

    try:
        analysis_service.run_analysis(
            job_id=job_id,
            user_id=user_id,
            dataset_id=dataset_id,
            analysis_type=analysis_type,
            phenotype_column=phenotype_column,
            covariates=covariates,
            maf_threshold=maf_threshold,
            num_threads=num_threads,
        )
    except Exception as e:
        # Error handling is done in the service
        print(f"Background analysis failed: {e}")


@router.get("/jobs", response_model=dict)
def list_jobs(
    status: Optional[GwasJobStatus] = Query(None, description="Filter by status"),
    dataset_id: Optional[str] = Query(None, description="Filter by dataset ID"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: UserProfile = Depends(get_current_user),
) -> dict:
    """
    List user's GWAS analysis jobs with pagination.

    Returns:
        {
            "jobs": [...],
            "total": int,
            "skip": int,
            "limit": int
        }
    """
    job_repo = get_gwas_job_repository()

    jobs, total = job_repo.find_by_user(
        user_id=current_user.id,
        status=status,
        dataset_id=dataset_id,
        skip=skip,
        limit=limit,
    )

    return {
        "jobs": jobs,
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@router.get("/jobs/{job_id}", response_model=GwasJobResponse)
def get_job_status(
    job_id: str = Path(..., description="Job ID"),
    current_user: UserProfile = Depends(get_current_user),
) -> GwasJobResponse:
    """
    Get current status of a GWAS analysis job.

    Job statuses:
    - QUEUED: Waiting to start
    - PROCESSING: Currently running
    - COMPLETED: Successfully finished
    - FAILED: Analysis failed
    - CANCELLED: User cancelled
    """
    analysis_service = get_gwas_analysis_service()

    job = analysis_service.get_job_status(job_id, current_user.id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Job {job_id} not found")

    return job


@router.delete("/jobs/{job_id}", status_code=204)
def cancel_job(
    job_id: str = Path(..., description="Job ID"),
    current_user: UserProfile = Depends(get_current_user),
):
    """
    Cancel a running or queued GWAS analysis job.

    Note: Jobs in COMPLETED or FAILED status cannot be cancelled.
    """
    job_repo = get_gwas_job_repository()

    job = job_repo.find_by_id(job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Job {job_id} not found")

    if job.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized access to job")

    if job.status in [GwasJobStatus.COMPLETED, GwasJobStatus.FAILED]:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot cancel job in {job.status} status",
        )

    job_repo.update_status(job_id, GwasJobStatus.CANCELLED)


# ============================================================================
# Results Endpoints
# ============================================================================

@router.get("/jobs/{job_id}/results", response_model=GwasResultResponse)
def get_job_results(
    job_id: str = Path(..., description="Job ID"),
    current_user: UserProfile = Depends(get_current_user),
) -> GwasResultResponse:
    """
    Get complete results for a GWAS analysis job.

    Includes:
    - Association results for all SNPs
    - Manhattan plot data
    - Q-Q plot data
    - Summary statistics

    Note: Job must be in COMPLETED status.
    """
    analysis_service = get_gwas_analysis_service()

    result = analysis_service.get_job_results(job_id, current_user.id)
    return result


@router.get("/jobs/{job_id}/visualization", response_model=dict)
def get_visualization_data(
    job_id: str = Path(..., description="Job ID"),
    current_user: UserProfile = Depends(get_current_user),
) -> dict:
    """
    Get visualization data (Manhattan and Q-Q plots) for a job.

    Returns only the plot data without full association results.
    Useful for rendering visualizations without large payloads.
    """
    analysis_service = get_gwas_analysis_service()

    viz_data = analysis_service.get_visualization_data(job_id, current_user.id)
    if not viz_data:
        raise HTTPException(
            status_code=404,
            detail=f"Visualization data not found for job {job_id}",
        )

    return viz_data


@router.get("/jobs/{job_id}/top-associations", response_model=List[SnpAssociation])
def get_top_associations(
    job_id: str = Path(..., description="Job ID"),
    limit: int = Query(100, ge=1, le=1000, description="Max associations to return"),
    p_threshold: float = Query(1e-5, gt=0, lt=1, description="P-value threshold"),
    current_user: UserProfile = Depends(get_current_user),
) -> List[SnpAssociation]:
    """
    Get top significant associations for a job.

    Filters by p-value threshold and returns top N results sorted by significance.
    """
    result_repo = get_gwas_result_repository()

    # Verify access
    analysis_service = get_gwas_analysis_service()
    job = analysis_service.get_job_status(job_id, current_user.id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Job {job_id} not found")

    # Get result
    result = result_repo.find_by_job_id(job_id)
    if not result:
        raise HTTPException(
            status_code=404,
            detail=f"Results not found for job {job_id}",
        )

    # Filter and sort associations
    associations = [
        SnpAssociation(**assoc) for assoc in result.associations
        if assoc.get("p_value", 1.0) < p_threshold
    ]
    associations.sort(key=lambda x: x.p_value)

    return associations[:limit]


@router.get("/jobs/{job_id}/export")
def export_results(
    job_id: str = Path(..., description="Job ID"),
    format: str = Query("csv", regex="^(csv|json)$", description="Export format"),
    current_user: UserProfile = Depends(get_current_user),
) -> StreamingResponse:
    """
    Export GWAS results as CSV or JSON.

    Formats:
    - csv: Comma-separated values (suitable for Excel, R, Python)
    - json: JSON array of association objects
    """
    analysis_service = get_gwas_analysis_service()

    result = analysis_service.get_job_results(job_id, current_user.id)

    if format == "csv":
        return _export_as_csv(result)
    else:
        return _export_as_json(result)


def _export_as_csv(result: GwasResultResponse) -> StreamingResponse:
    """Export results as CSV."""
    output = io.StringIO()
    writer = csv.DictWriter(
        output,
        fieldnames=[
            "rsid", "chromosome", "position", "ref_allele", "alt_allele",
            "p_value", "beta", "se", "t_stat", "maf", "n_samples",
            "odds_ratio", "ci_lower", "ci_upper",
        ],
    )
    writer.writeheader()

    for assoc in result.associations:
        writer.writerow({
            "rsid": assoc.get("rsid"),
            "chromosome": assoc.get("chromosome"),
            "position": assoc.get("position"),
            "ref_allele": assoc.get("ref_allele"),
            "alt_allele": assoc.get("alt_allele"),
            "p_value": assoc.get("p_value"),
            "beta": assoc.get("beta"),
            "se": assoc.get("se"),
            "t_stat": assoc.get("t_stat"),
            "maf": assoc.get("maf"),
            "n_samples": assoc.get("n_samples"),
            "odds_ratio": assoc.get("odds_ratio"),
            "ci_lower": assoc.get("ci_lower"),
            "ci_upper": assoc.get("ci_upper"),
        })

    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode("utf-8")),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=gwas_results_{result.job_id}.csv"},
    )


def _export_as_json(result: GwasResultResponse) -> StreamingResponse:
    """Export results as JSON."""
    output = json.dumps(result.associations, indent=2)
    return StreamingResponse(
        io.BytesIO(output.encode("utf-8")),
        media_type="application/json",
        headers={"Content-Disposition": f"attachment; filename=gwas_results_{result.job_id}.json"},
    )


# ============================================================================
# Legacy Trait Search Endpoints (from original gwas.py)
# ============================================================================

@router.get("/search-traits", response_model=list[str])
def search_traits(
    q: str = Query(..., min_length=1, description="Search text")
) -> list[str]:
    """
    Search for GWAS traits in the public catalog.

    This is a legacy endpoint for the demo GWAS dataset (public catalog).
    """
    try:
        return gwas_dataset.search_traits(q)
    except gwas_dataset.DatasetLoadError as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/trait/{trait_name:path}")
def trait_details(
    trait_name: str = Path(..., description="Full mapped trait name"),
    limit: int = Query(50, ge=1, le=200, description="Maximum number of study rows"),
) -> dict[str, list]:
    """
    Get details for a specific trait from the public GWAS catalog.

    This is a legacy endpoint for the demo GWAS dataset (public catalog).
    """
    try:
        records = gwas_dataset.trait_records(trait_name, limit=limit)
        columns = gwas_dataset.dataset_columns()
    except gwas_dataset.DatasetLoadError as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    return {"columns": columns, "records": records}
