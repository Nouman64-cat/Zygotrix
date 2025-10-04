"""FastAPI application exposing Zygotrix simulation capabilities."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from fastapi import Depends, FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from zygotrix_engine import Trait

from .services import auth as auth_services
from .services import polygenic as polygenic_services
from .schema.common import HealthResponse
from .schema.polygenic import PolygenicScoreRequest, PolygenicScoreResponse
from .schema.auth import UserProfile


from .routes.auth import router as auth_router
from .routes.traits import router as trait_router
from .routes.mendelian import router as mendelian_router
from .routes.preview import router as preview_router
from .routes.projects import router as project_router
from .routes.portal import router as portal_router
from .routes.project_templates import router as project_templates_router
from .routes.analytics import router as analytics_router
from .services.trait_db_setup import create_trait_indexes
from .config import get_settings
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
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "https://site.zygotrix.courtcierge.online",
        "https://zygotrix.courtcierge.online",
        "*",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=[
        "Accept",
        "Accept-Language",
        "Content-Language",
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "Origin",
        "Access-Control-Request-Method",
        "Access-Control-Request-Headers",
    ],
)


# Register routers
# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    """Initialize database indexes on application startup."""
    settings = get_settings()
    if settings.traits_json_only:
        print(
            "ℹ️ JSON-only mode enabled: skipping MongoDB index initialization for traits"
        )
        return
    try:
        create_trait_indexes()
        print("✅ Trait management database indexes initialized")
    except Exception as e:
        print(f"⚠️  Warning: Could not initialize trait indexes: {e}")


# Register routers
app.include_router(auth_router)
app.include_router(trait_router)
app.include_router(mendelian_router)
app.include_router(preview_router)
app.include_router(project_router)
app.include_router(portal_router)
app.include_router(project_templates_router)
app.include_router(analytics_router)

bearer_scheme = HTTPBearer(auto_error=True)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> UserProfile:
    user = auth_services.resolve_user_from_token(credentials.credentials)
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
    score = polygenic_services.calculate_polygenic_score(
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
