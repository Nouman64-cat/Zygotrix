"""FastAPI application exposing Zygotrix simulation capabilities."""

from __future__ import annotations

from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware

from zygotrix_engine import Trait

from . import services
from .schemas import (
    HealthResponse,
    MendelianSimulationRequest,
    MendelianSimulationResponse,
    PolygenicScoreRequest,
    PolygenicScoreResponse,
    TraitInfo,
    TraitListResponse,
    TraitMutationPayload,
    TraitMutationResponse,
)

app = FastAPI(
    title="Zygotrix Backend",
    description="API for running Mendelian and polygenic simulations using the Zygotrix Engine.",
    version="0.2.0",
    license_info={
        "name": "Proprietary",
    },
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def trait_to_info(key: str, trait: Trait) -> TraitInfo:
    return TraitInfo(
        key=key,
        name=trait.name,
        description=trait.description or None,
        alleles=list(trait.alleles),
        phenotype_map=dict(trait.phenotype_map),
        metadata=dict(trait.metadata),
    )


@app.get("/health", response_model=HealthResponse, tags=["System"])
def health() -> HealthResponse:
    return HealthResponse()


@app.get("/api/traits", response_model=TraitListResponse, tags=["Traits"])
def list_traits() -> TraitListResponse:
    traits = [trait_to_info(key, trait) for key, trait in services.get_trait_registry().items()]
    return TraitListResponse(traits=traits)


@app.post("/api/traits", response_model=TraitMutationResponse, tags=["Traits"], status_code=201)
def create_trait(payload: TraitMutationPayload) -> TraitMutationResponse:
    trait = services.save_trait(
        payload.key,
        {
            "name": payload.name,
            "alleles": payload.alleles,
            "phenotype_map": dict(payload.phenotype_map),
            "description": payload.description or "",
            "metadata": dict(payload.metadata),
        },
    )
    return TraitMutationResponse(trait=trait_to_info(payload.key, trait))


@app.put("/api/traits/{key}", response_model=TraitMutationResponse, tags=["Traits"])
def update_trait(key: str, payload: TraitMutationPayload) -> TraitMutationResponse:
    if key != payload.key:
        raise HTTPException(status_code=400, detail="Trait key mismatch between path and payload.")
    trait = services.save_trait(
        payload.key,
        {
            "name": payload.name,
            "alleles": payload.alleles,
            "phenotype_map": dict(payload.phenotype_map),
            "description": payload.description or "",
            "metadata": dict(payload.metadata),
        },
    )
    return TraitMutationResponse(trait=trait_to_info(payload.key, trait))


@app.delete("/api/traits/{key}", status_code=204, tags=["Traits"])
def remove_trait(key: str) -> Response:
    services.delete_trait(key)
    return Response(status_code=204)


@app.post(
    "/api/mendelian/simulate",
    response_model=MendelianSimulationResponse,
    tags=["Mendelian"],
)
def simulate_mendelian(request: MendelianSimulationRequest) -> MendelianSimulationResponse:
    results, missing = services.simulate_mendelian_traits(
        parent1=request.parent1_genotypes,
        parent2=request.parent2_genotypes,
        trait_filter=request.trait_filter,
        as_percentages=request.as_percentages,
    )
    return MendelianSimulationResponse(results=results, missing_traits=missing)


@app.post(
    "/api/polygenic/score",
    response_model=PolygenicScoreResponse,
    tags=["Polygenic"],
)
def polygenic_score(request: PolygenicScoreRequest) -> PolygenicScoreResponse:
    score = services.calculate_polygenic_score(
        parent1_genotype=request.parent1_genotype,
        parent2_genotype=request.parent2_genotype,
        weights=request.weights,
    )
    return PolygenicScoreResponse(expected_score=score)


@app.get("/", include_in_schema=False)
def root() -> dict[str, str]:
    return {"message": "Welcome to Zygotrix Backend. Visit /docs for API documentation."}