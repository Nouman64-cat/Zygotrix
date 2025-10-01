"""FastAPI application exposing Zygotrix simulation capabilities."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from fastapi import Depends, FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from zygotrix_engine import Trait

from . import services
from .schemas import (
    HealthResponse,
    PolygenicScoreRequest,
    PolygenicScoreResponse,
    UserProfile,
)


from .routes.auth import router as auth_router
from .routes.traits import router as trait_router
from .routes.mendelian import router as mendelian_router
from .routes.projects import router as project_router
from .utils import trait_to_info

app = FastAPI(
    title="Zygotrix Backend",
    description="API for running Mendelian and polygenic simulations using the Zygotrix Engine.",
    version="0.3.0",
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

bearer_scheme = HTTPBearer(auto_error=True)

app.include_router(auth_router)
app.include_router(trait_router)
app.include_router(mendelian_router)
app.include_router(project_router)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> UserProfile:
    user = services.resolve_user_from_token(credentials.credentials)
    return UserProfile(**user)


@app.get("/health", response_model=HealthResponse, tags=["System"])
@app.head("/health", response_model=HealthResponse, tags=["System"])
def health() -> HealthResponse:
    return HealthResponse()


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
    return {
        "message": "Welcome to Zygotrix Backend. Visit /docs for API documentation."
    }
