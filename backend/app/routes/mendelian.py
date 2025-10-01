from fastapi import APIRouter, HTTPException
from typing import Optional
from ..services import mendelian as mendelian_services
from ..schema.mendelian import (
    MendelianSimulationRequest,
    MendelianSimulationResponse,
    JointPhenotypeSimulationRequest,
    JointPhenotypeSimulationResponse,
    GenotypeRequest,
    GenotypeResponse,
)

router = APIRouter(prefix="/api/mendelian", tags=["Mendelian"])


@router.post("/simulate", response_model=MendelianSimulationResponse)
def simulate_mendelian(
    request: MendelianSimulationRequest,
) -> MendelianSimulationResponse:
    try:
        results, missing = mendelian_services.simulate_mendelian_traits(
            parent1=request.parent1_genotypes,
            parent2=request.parent2_genotypes,
            trait_filter=request.trait_filter,
            as_percentages=request.as_percentages,
            max_traits=5,
        )
        return MendelianSimulationResponse(results=results, missing_traits=missing)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/simulate-joint", response_model=JointPhenotypeSimulationResponse)
def simulate_joint_phenotypes(
    request: JointPhenotypeSimulationRequest,
) -> JointPhenotypeSimulationResponse:
    try:
        results, missing = mendelian_services.simulate_joint_phenotypes(
            parent1=request.parent1_genotypes,
            parent2=request.parent2_genotypes,
            trait_filter=request.trait_filter,
            as_percentages=request.as_percentages,
            max_traits=5,
        )
        return JointPhenotypeSimulationResponse(results=results, missing_traits=missing)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/genotypes", response_model=GenotypeResponse)
def get_trait_genotypes(request: GenotypeRequest) -> GenotypeResponse:
    """Get possible genotypes for given trait keys."""
    try:
        possible_genotypes = mendelian_services.get_possible_genotypes_for_traits(
            trait_keys=request.trait_keys,
            max_traits=5,
        )
        return GenotypeResponse(genotypes=genotypes, missing_traits=missing)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
