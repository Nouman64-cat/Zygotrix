from pydantic import BaseModel, Field
from typing import Optional, Any
from enum import Enum


class JobStatus(str, Enum):
    """Status of a sequence generation job."""
    QUEUED = "queued"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class QueuedJobInfo(BaseModel):
    """Brief info about a queued/processing job."""
    job_id: str = Field(..., description="Unique job identifier")
    sequence_length: int = Field(..., description="Sequence length in base pairs")
    created_at: Optional[str] = Field(None, description="When job was created")


class QueueStatusResponse(BaseModel):
    """Response schema for queue status."""
    queue_enabled: bool = Field(..., description="Whether queue system is active")
    active_jobs: int = Field(..., description="Number of currently processing large jobs")
    queue_length: int = Field(..., description="Number of jobs waiting in queue")
    estimated_wait_seconds: int = Field(..., description="Estimated wait time in seconds")
    queued_jobs: list[QueuedJobInfo] = Field(default_factory=list, description="Jobs waiting in queue")
    processing_jobs: list[QueuedJobInfo] = Field(default_factory=list, description="Jobs currently processing")


class JobStatusResponse(BaseModel):
    """Response schema for job status check."""
    job_id: str = Field(..., description="Unique job identifier")
    status: JobStatus = Field(..., description="Current job status")
    queue_position: Optional[int] = Field(None, description="Position in queue (if queued)")
    estimated_wait_seconds: Optional[int] = Field(None, description="Estimated wait time")
    result: Optional[Any] = Field(None, description="Job result (if completed)")
    error: Optional[str] = Field(None, description="Error message (if failed)")
    created_at: Optional[str] = Field(None, description="When job was created")
    started_at: Optional[str] = Field(None, description="When processing started")
    completed_at: Optional[str] = Field(None, description="When job completed")


class JobHistoryItem(BaseModel):
    """Schema for a single job in history."""
    job_id: str = Field(..., description="Unique job identifier")
    status: JobStatus = Field(..., description="Job status")
    sequence_length: int = Field(..., description="Sequence length in base pairs")
    created_at: Optional[str] = Field(None, description="When job was created")
    started_at: Optional[str] = Field(None, description="When processing started")
    completed_at: Optional[str] = Field(None, description="When job completed")
    duration_seconds: Optional[float] = Field(None, description="Processing duration in seconds")
    error: Optional[str] = Field(None, description="Error message if failed")


class JobHistoryResponse(BaseModel):
    """Response schema for job history."""
    jobs: list[JobHistoryItem] = Field(default_factory=list, description="List of job history items")
    total_jobs: int = Field(0, description="Total number of jobs processed")
    completed_jobs: int = Field(0, description="Number of completed jobs")
    failed_jobs: int = Field(0, description="Number of failed jobs")
    queued_jobs: int = Field(0, description="Number of currently queued jobs")
    processing_jobs: int = Field(0, description="Number of currently processing jobs")
    avg_duration_seconds: Optional[float] = Field(None, description="Average processing duration")
    total_bp_processed: int = Field(0, description="Total base pairs processed")


class GenerateResponse(BaseModel):
    """
    Unified response for generate endpoint.
    Either returns result directly OR job info if queued.
    """
    queued: bool = Field(..., description="Whether the request was queued")
    job_id: Optional[str] = Field(None, description="Job ID (if queued)")
    queue_position: Optional[int] = Field(None, description="Position in queue (if queued)")
    estimated_wait_seconds: Optional[int] = Field(None, description="Estimated wait time (if queued)")
    result: Optional["ProteinGenerateResponse"] = Field(None, description="Result (if not queued)")


class ProteinGenerateRequest(BaseModel):
    """Request schema for DNA/RNA/Protein sequence generation."""

    length: int = Field(
        ...,
        ge=3,
        le=100000000,
        description="Length of DNA sequence to generate (must be divisible by 3 for complete codons)"
    )
    gc_content: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="GC content ratio (0.0-1.0)"
    )
    seed: Optional[int] = Field(
        None,
        description="Random seed for reproducibility (optional)"
    )


class ProteinGenerateResponse(BaseModel):
    """Response schema for DNA and RNA sequence generation."""

    dna_sequence: str = Field(..., description="Generated DNA sequence")
    rna_sequence: str = Field(..., description="Transcribed RNA sequence")
    length: int = Field(..., description="Actual length of generated sequences")
    gc_content: float = Field(..., description="Target GC content used")
    actual_gc: float = Field(..., description="Actual GC content in generated DNA sequence")


class AminoAcidExtractRequest(BaseModel):
    """Request schema for extracting amino acids from RNA."""

    rna_sequence: str = Field(..., description="RNA sequence to extract amino acids from")


class AminoAcidExtractResponse(BaseModel):
    """Response schema for amino acid extraction."""

    amino_acids: str = Field(..., description="Extracted amino acids in 3-letter format (e.g., Met-Ala-Gly)")


class ProteinSequenceRequest(BaseModel):
    """Request schema for generating protein sequence."""

    rna_sequence: str = Field(..., description="RNA sequence to generate protein from")


class ORFData(BaseModel):
    """Data for a single Open Reading Frame."""

    start_position: int = Field(..., description="Position where the ORF starts in the RNA sequence")
    end_position: int = Field(..., description="Position where the ORF ends (inclusive of stop codon)")
    protein_3letter: str = Field(..., description="Protein sequence in 3-letter format")
    protein_1letter: str = Field(..., description="Protein sequence in 1-letter format")
    length: int = Field(..., description="Number of amino acids (excluding stop codon)")


class ProteinSequenceResponse(BaseModel):
    """Response schema for protein sequence generation."""

    protein_3letter: str = Field(..., description="Protein sequence in 3-letter format (e.g., Met-Ala-Gly)")
    protein_1letter: str = Field(..., description="Protein sequence in 1-letter format (e.g., MAG)")
    protein_length: int = Field(..., description="Number of amino acids in the protein")
    protein_type: str = Field(..., description="Protein type classification")
    stability_score: int = Field(..., description="Protein stability score")
    orfs: list[ORFData] = Field(default_factory=list, description="All Open Reading Frames found in the sequence")
    total_orfs: int = Field(0, description="Total number of ORFs found")
