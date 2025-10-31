from __future__ import annotations

from fastapi import APIRouter, Depends

from ..dependencies import get_current_user
from ..schema.auth import UserProfile
from ..schema.population import PopulationSimRequest, PopulationSimResponse
from ..services.population import simulate_population


router = APIRouter(prefix="/api/population", tags=["Population Simulation"])


@router.post("/simulate", response_model=PopulationSimResponse)
def simulate_population_route(
    request: PopulationSimRequest,
    current_user: UserProfile = Depends(get_current_user),  # noqa: F841 - ensures auth
) -> PopulationSimResponse:
    return simulate_population(request)
