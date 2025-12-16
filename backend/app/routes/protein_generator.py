from fastapi import APIRouter, HTTPException

from ..schema.protein_generator import (
    ProteinGenerateRequest,
    ProteinGenerateResponse,
    AminoAcidExtractRequest,
    AminoAcidExtractResponse,
    ProteinSequenceRequest,
    ProteinSequenceResponse,
    QueueStatusResponse,
    JobStatusResponse,
    JobHistoryResponse,
    GenerateResponse,
    JobStatus,
)
from ..services.protein_generator import (
    generate_dna_rna,
    extract_amino_acids_from_rna,
    generate_protein_sequence,
)
from ..services.sequence_queue import queue_service, LARGE_SEQUENCE_THRESHOLD

router = APIRouter(prefix="/api/protein", tags=["Protein Generator"])


def _process_queued_job(job_data: dict):
    """
    Process a job that was dequeued from the queue.
    This runs in a background thread.
    """
    import logging
    logger = logging.getLogger(__name__)
    
    job_id = job_data.get("job_id")
    request_data = job_data.get("request", {})
    
    logger.info(f"🔄 Processing queued job {job_id}")
    
    try:
        # Create the request object
        request = ProteinGenerateRequest(
            length=request_data.get("length", 100),
            gc_content=request_data.get("gc_content", 0.5),
            seed=request_data.get("seed"),
        )
        
        # Generate the sequence
        result = generate_dna_rna(request)
        
        # Mark job as completed with result
        queue_service.complete_job(job_id, result.model_dump())
        logger.info(f"✅ Queued job {job_id} completed successfully")
        
    except Exception as e:
        logger.error(f"❌ Queued job {job_id} failed: {e}")
        queue_service.fail_job(job_id, str(e))


# Register the job processor on module load
queue_service.set_job_processor(_process_queued_job)


@router.get("/queue-status", response_model=QueueStatusResponse)
def get_queue_status() -> QueueStatusResponse:
    """
    Get current queue status for large sequence generation.

    Returns:
        Queue status including active jobs and queue length
    """
    status = queue_service.get_queue_status()
    return QueueStatusResponse(**status)


@router.get("/job-history", response_model=JobHistoryResponse)
def get_job_history(limit: int = 50) -> JobHistoryResponse:
    """
    Get job history for admin monitoring.
    
    Args:
        limit: Maximum number of jobs to return (default: 50, max: 100)
    
    Returns:
        Job history with statistics including completed, failed, and queued jobs
    """
    # Cap limit at 100
    limit = min(limit, 100)
    history = queue_service.get_job_history(limit)
    return JobHistoryResponse(**history)


@router.get("/job/{job_id}", response_model=JobStatusResponse)
def get_job_status(job_id: str) -> JobStatusResponse:
    """
    Get status of a queued/processing job.

    Args:
        job_id: The job ID returned when request was queued

    Returns:
        Job status, queue position, and result if completed
    """
    job_data = queue_service.get_job_status(job_id)

    if job_data is None:
        raise HTTPException(status_code=404, detail=f"Job {job_id} not found")

    # Calculate estimated wait if queued
    estimated_wait = None
    if job_data.get("status") == JobStatus.QUEUED.value:
        position = job_data.get("queue_position", 0)
        estimated_wait = position * 360  # ~6 min per job

    return JobStatusResponse(
        job_id=job_data["job_id"],
        status=JobStatus(job_data["status"]),
        queue_position=job_data.get("queue_position"),
        estimated_wait_seconds=estimated_wait,
        result=job_data.get("result"),
        error=job_data.get("error"),
        created_at=job_data.get("created_at"),
        started_at=job_data.get("started_at"),
        completed_at=job_data.get("completed_at"),
    )


@router.post("/generate", response_model=GenerateResponse)
def generate_dna_and_rna(request: ProteinGenerateRequest) -> GenerateResponse:
    """
    Generate DNA sequence and transcribe it to RNA.

    For sequences >= 10M bp, requests may be queued if server is busy.
    Check the 'queued' field in response:
    - If queued=False: result is in the 'result' field
    - If queued=True: poll /job/{job_id} for status

    Args:
        request: DNA generation parameters (length, gc_content, optional seed)

    Returns:
        Either the result directly or job info if queued

    Example:
        ```json
        {
            "length": 99,
            "gc_content": 0.6,
            "seed": 42
        }
        ```
    """
    is_large = queue_service.is_large_sequence(request.length)

    # For small sequences, always process immediately
    if not is_large:
        result = generate_dna_rna(request)
        return GenerateResponse(
            queued=False,
            result=result,
        )

    # For large sequences, check queue
    request_data = {
        "length": request.length,
        "gc_content": request.gc_content,
        "seed": request.seed,
    }

    job_info = queue_service.create_job(request_data)

    if job_info["status"] == JobStatus.PROCESSING.value:
        # Can process immediately
        try:
            result = generate_dna_rna(request)
            queue_service.complete_job(job_info["job_id"], result.model_dump())
            return GenerateResponse(
                queued=False,
                result=result,
            )
        except Exception as e:
            queue_service.fail_job(job_info["job_id"], str(e))
            raise HTTPException(status_code=500, detail=str(e))
    else:
        # Request was queued
        estimated_wait = job_info.get("queue_position", 1) * 360
        return GenerateResponse(
            queued=True,
            job_id=job_info["job_id"],
            queue_position=job_info.get("queue_position", 1),
            estimated_wait_seconds=estimated_wait,
        )


@router.post("/extract-amino-acids", response_model=AminoAcidExtractResponse)
def extract_amino_acids_endpoint(request: AminoAcidExtractRequest) -> AminoAcidExtractResponse:
    """
    Extract amino acids from RNA sequence.

    Args:
        request: RNA sequence

    Returns:
        Amino acids in 3-letter format (e.g., Met-Ala-Gly-STOP)

    Example:
        ```json
        {
            "rna_sequence": "AUGGCUGGA..."
        }
        ```
    """
    return extract_amino_acids_from_rna(request)


@router.post("/generate-protein", response_model=ProteinSequenceResponse)
def generate_protein_from_rna(request: ProteinSequenceRequest) -> ProteinSequenceResponse:
    """
    Generate protein sequence from RNA.

    Args:
        request: RNA sequence

    Returns:
        Protein sequences in both 3-letter and 1-letter formats with analysis

    Example:
        ```json
        {
            "rna_sequence": "AUGGCUGGA..."
        }
        ```
    """
    return generate_protein_sequence(request)
