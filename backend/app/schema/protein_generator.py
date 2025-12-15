from pydantic import BaseModel, Field
from typing import Optional


class ProteinGenerateRequest(BaseModel):
    """Request schema for DNA/RNA/Protein sequence generation."""

    length: int = Field(
        ...,
        ge=3,
        le=1000000,
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


class ProteinSequenceResponse(BaseModel):
    """Response schema for protein sequence generation."""

    protein_3letter: str = Field(..., description="Protein sequence in 3-letter format (e.g., Met-Ala-Gly)")
    protein_1letter: str = Field(..., description="Protein sequence in 1-letter format (e.g., MAG)")
    protein_length: int = Field(..., description="Number of amino acids in the protein")
    protein_type: str = Field(..., description="Protein type classification")
    stability_score: int = Field(..., description="Protein stability score")
