from pydantic import BaseModel, Field
from typing import Optional


class DnaGenerateRequest(BaseModel):
    """Request schema for DNA sequence generation."""

    length: int = Field(
        ...,
        ge=1,
        le=1000000,
        description="Length of DNA sequence to generate (1-1,000,000 bp)"
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


class DnaGenerateResponse(BaseModel):
    """Response schema for DNA sequence generation."""

    sequence: str = Field(..., description="Generated DNA sequence")
    length: int = Field(..., description="Actual length of generated sequence")
    gc_content: float = Field(..., description="Target GC content used")
    actual_gc: float = Field(..., description="Actual GC content in generated sequence")
