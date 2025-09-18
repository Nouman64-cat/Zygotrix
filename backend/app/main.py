"""FastAPI application exposing Zygotrix simulation capabilities."""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import services
from .schemas import (
    HealthResponse,
    MendelianSimulationRequest,
    MendelianSimulationResponse,
    PolygenicScoreRequest,
    PolygenicScoreResponse,
    TraitInfo,
    TraitListResponse,
)

app = FastAPI(
    title="Zygotrix Backend",
    description="API for running Mendelian and polygenic simulations using the Zygotrix Engine.",
    version="0.1.0",
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


@app.get("/health", response_model=HealthResponse, tags=["System"])
def health() -> HealthResponse:
    """Simple health probe."""

    return HealthResponse()


@app.get("/api/traits", response_model=TraitListResponse, tags=["Traits"])
def list_traits() -> TraitListResponse:
    """Expose the trait registry for client discovery."""

    traits = [
        TraitInfo(
            key=key,
            name=trait.name,
            description=trait.description or None,
            alleles=list(trait.alleles),
            phenotype_map=dict(trait.phenotype_map),
        )
        for key, trait in services.get_trait_registry().items()
    ]
    return TraitListResponse(traits=traits)


@app.post(
    "/api/mendelian/simulate",
    response_model=MendelianSimulationResponse,
    tags=["Mendelian"],
)
def simulate_mendelian(request: MendelianSimulationRequest) -> MendelianSimulationResponse:
    """Run Mendelian inheritance simulations for the requested traits."""

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
    """Calculate the expected polygenic score for an offspring."""

    score = services.calculate_polygenic_score(
        parent1_genotype=request.parent1_genotype,
        parent2_genotype=request.parent2_genotype,
        weights=request.weights,
    )
    return PolygenicScoreResponse(expected_score=score)


@app.get("/", include_in_schema=False)
def root() -> dict[str, str]:
    """Redirect clients towards documentation."""

    return {"message": "Welcome to Zygotrix Backend. Visit /docs for API documentation."}
