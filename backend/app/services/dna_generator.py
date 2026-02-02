from __future__ import annotations

from fastapi import HTTPException
from app.services.aws_worker_client import get_aws_worker
from ..schema.dna_generator import DnaGenerateRequest, DnaGenerateResponse

def generate_dna_sequence(request: DnaGenerateRequest) -> DnaGenerateResponse:
    """
    Generate a DNA sequence using the AWS C++ Engine Lambda.

    Args:
        request: DNA generation request with length, gc_content, and optional seed

    Returns:
        DnaGenerateResponse with the generated sequence and metadata
    """
    try:
        worker = get_aws_worker()
        
        # Prepare payload
        payload = request.model_dump(exclude_none=True)
        # Use action='dna' as established
        response_data = worker.invoke(action="dna", payload=payload)
        
        return DnaGenerateResponse.model_validate(response_data)

    except Exception as e:
        # Propagate error as 500
        raise HTTPException(status_code=500, detail=str(e))
