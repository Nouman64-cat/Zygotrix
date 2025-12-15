from fastapi import APIRouter

from ..schema.protein_generator import (
    ProteinGenerateRequest,
    ProteinGenerateResponse,
    AminoAcidExtractRequest,
    AminoAcidExtractResponse,
    ProteinSequenceRequest,
    ProteinSequenceResponse,
)
from ..services.protein_generator import (
    generate_dna_rna,
    extract_amino_acids,
    generate_protein_sequence,
)

router = APIRouter(prefix="/api/protein", tags=["Protein Generator"])


@router.post("/generate", response_model=ProteinGenerateResponse)
def generate_dna_and_rna(request: ProteinGenerateRequest) -> ProteinGenerateResponse:
    """
    Generate DNA sequence and transcribe it to RNA.

    Args:
        request: DNA generation parameters (length, gc_content, optional seed)

    Returns:
        Both DNA and RNA sequences with metadata

    Example:
        ```json
        {
            "length": 99,
            "gc_content": 0.6,
            "seed": 42
        }
        ```
    """
    return generate_dna_rna(request)


@router.post("/extract-amino-acids", response_model=AminoAcidExtractResponse)
def extract_amino_acids_from_rna(request: AminoAcidExtractRequest) -> AminoAcidExtractResponse:
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
    return extract_amino_acids(request)


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
