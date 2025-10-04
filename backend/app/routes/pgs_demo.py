from __future__ import annotations

from fastapi import APIRouter, Depends

from ..routes.auth import get_current_user
from ..schema.auth import UserProfile
from ..schema.pgs_demo import PGSDemoRequest, PGSDemoResponse
from ..services.pgs_demo import compute_pgs_demo


router = APIRouter(prefix="/api/pgs", tags=["Polygenic Demo"])


@router.post("/demo", response_model=PGSDemoResponse)
def run_pgs_demo(
    request: PGSDemoRequest,
    current_user: UserProfile = Depends(get_current_user),  # noqa: F841 - auth guard
) -> PGSDemoResponse:
    return compute_pgs_demo(request)

