from fastapi import APIRouter, HTTPException, Depends
from app.schema.pedigree import PedigreeRequest, PedigreeResponse
from app.services.pedigree_agent import process_pedigree_query
from app.dependencies import get_current_user
from app.schema.auth import UserProfile

router = APIRouter(prefix="/api/pedigree", tags=["Pedigree Analyst"])

@router.post("/analyze", response_model=PedigreeResponse)
async def analyze_pedigree(
    request: PedigreeRequest,
    current_user: UserProfile = Depends(get_current_user)
):
    """
    Conversational endpoint for Pedigree Analysis.
    Orchestrates LLM extraction -> C++ Validation -> LLM Explanation.
    """
    try:
        return await process_pedigree_query(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))