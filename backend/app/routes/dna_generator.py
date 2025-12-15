from fastapi import APIRouter

from ..schema.dna_generator import DnaGenerateRequest, DnaGenerateResponse
from ..services.dna_generator import generate_dna_sequence

router = APIRouter(prefix="/api/dna", tags=["DNA Generator"])


@router.post("/generate", response_model=DnaGenerateResponse)
def generate_dna(request: DnaGenerateRequest) -> DnaGenerateResponse:
    """
    Generate a stochastic DNA sequence with specified length and GC content.

    Args:
        request: DNA generation parameters (length, gc_content, optional seed)

    Returns:
        Generated DNA sequence with metadata including actual GC content

    Example:
        ```json
        {
            "length": 100,
            "gc_content": 0.6,
            "seed": 42
        }
        ```
    """
    return generate_dna_sequence(request)
