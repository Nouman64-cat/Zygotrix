from fastapi import APIRouter, HTTPException

from ..schema.preview import PreviewRequest, PreviewResponse
from ..services.mendelian import preview_mendelian, PreviewValidationError


router = APIRouter(prefix="/api/mendelian", tags=["Mendelian Preview"])


@router.post("/preview", response_model=PreviewResponse)
def preview_trait(request: PreviewRequest) -> PreviewResponse:
    try:
        payload = preview_mendelian(
            trait_data=request.trait.model_dump(),
            parent1=request.parent1,
            parent2=request.parent2,
            as_percentages=request.as_percentages,
        )
        return PreviewResponse(**payload)
    except PreviewValidationError as exc:
        raise HTTPException(status_code=422, detail={"errors": exc.errors}) from exc
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

