from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from typing import Optional
from datetime import datetime, timezone
import time

from ..services import mendelian as mendelian_services
from ..services import auth as auth_services
from ..services.common import get_simulation_logs_collection
from ..schema.mendelian import (
    MendelianSimulationRequest,
    MendelianSimulationResponse,
    JointPhenotypeSimulationRequest,
    JointPhenotypeSimulationResponse,
    GenotypeRequest,
    GenotypeResponse,
)

router = APIRouter(prefix="/api/mendelian", tags=["Mendelian"])
security = HTTPBearer(auto_error=False)


@router.post("/simulate", response_model=MendelianSimulationResponse)
def simulate_mendelian(
    request: MendelianSimulationRequest,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> MendelianSimulationResponse:
    try:
        # Resolve user id if token provided (endpoint remains public)
        user_id: Optional[str] = None
        if credentials and credentials.credentials:
            try:
                user = auth_services.resolve_user_from_token(credentials.credentials)
                user_id = user.get("id")
            except Exception:
                user_id = None

        start = time.perf_counter()
        results, missing = mendelian_services.simulate_mendelian_traits(
            parent1=request.parent1_genotypes,
            parent2=request.parent2_genotypes,
            trait_filter=request.trait_filter,
            as_percentages=request.as_percentages,
            max_traits=5,
        )
        duration = time.perf_counter() - start

        # Best-effort logging for analytics
        try:
            collection = get_simulation_logs_collection(required=False)
            if collection is not None:
                total_points = 0
                conf_sum = 0.0
                conf_count = 0
                for _trait, res in results.items():
                    geno = res.genotypic_ratios if hasattr(res, "genotypic_ratios") else res.get("genotypic_ratios", {})  # type: ignore[attr-defined]
                    pheno = res.phenotypic_ratios if hasattr(res, "phenotypic_ratios") else res.get("phenotypic_ratios", {})  # type: ignore[attr-defined]
                    total_points += len(geno) + len(pheno)
                    if pheno:
                        try:
                            conf_sum += max(float(v) for v in pheno.values()) * 100.0
                            conf_count += 1
                        except Exception:
                            pass
                avg_conf = (conf_sum / conf_count) if conf_count else 0.0
                collection.insert_one(
                    {
                        "timestamp": datetime.now(timezone.utc),
                        "user_id": user_id,
                        "traits": list(results.keys()),
                        "total_data_points": int(total_points),
                        "avg_confidence": float(avg_conf),
                        "processing_time_seconds": float(duration),
                        "mode": "mendelian",
                    }
                )
        except Exception:
            # Ignore logging failures to keep simulation endpoint robust
            pass
        return MendelianSimulationResponse(results=results, missing_traits=missing)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/simulate-joint", response_model=JointPhenotypeSimulationResponse)
def simulate_joint_phenotypes(
    request: JointPhenotypeSimulationRequest,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> JointPhenotypeSimulationResponse:
    try:
        user_id: Optional[str] = None
        if credentials and credentials.credentials:
            try:
                user = auth_services.resolve_user_from_token(credentials.credentials)
                user_id = user.get("id")
            except Exception:
                user_id = None

        start = time.perf_counter()
        results, missing = mendelian_services.simulate_joint_phenotypes(
            parent1=request.parent1_genotypes,
            parent2=request.parent2_genotypes,
            trait_filter=request.trait_filter,
            as_percentages=request.as_percentages,
            max_traits=5,
        )
        duration = time.perf_counter() - start

        # Best-effort logging: we can estimate metrics from joint results
        try:
            collection = get_simulation_logs_collection(required=False)
            if collection is not None:
                values = list(results.values())
                avg_conf = (sum(values) / len(values) * 100.0) if values else 0.0
                collection.insert_one(
                    {
                        "timestamp": datetime.now(timezone.utc),
                        "user_id": user_id,
                        "traits": request.trait_filter or [],
                        "total_data_points": len(values),
                        "avg_confidence": float(avg_conf),
                        "processing_time_seconds": float(duration),
                        "mode": "joint",
                    }
                )
        except Exception:
            pass
        return JointPhenotypeSimulationResponse(results=results, missing_traits=missing)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/genotypes", response_model=GenotypeResponse)
def get_trait_genotypes(request: GenotypeRequest) -> GenotypeResponse:
    """Get possible genotypes for given trait keys."""
    try:
        genotypes, missing = mendelian_services.get_possible_genotypes_for_traits(
            trait_keys=request.trait_keys,
            max_traits=5,
        )
        return GenotypeResponse(genotypes=genotypes, missing_traits=missing)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
