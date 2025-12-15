from __future__ import annotations
from .services import gwas_dataset
from .config import get_settings
from .services.trait_db_setup import create_trait_indexes
from .routes.traits import router as traits_router
from .routes.university import router as university_router
from .routes.community import router as community_router
from .routes.gwas import router as gwas_router
from .routes.cpp_engine import router as cpp_engine_router
from .routes.dna_generator import router as dna_generator_router
from .routes.analytics import router as analytics_router
from .routes.project_templates import router as project_templates_router
from .routes.portal import router as portal_router
from .routes.projects import router as project_router
from .routes.pgs_demo import router as pgs_demo_router
from .routes.population import router as population_router
from .routes.data_import import router as data_import_router
from .routes.preview import router as preview_router
from .routes.mendelian import router as mendelian_router
from .routes.auth import router as auth_router
from .routes.admin import router as admin_router
from .routes.newsletter import router as newsletter_router
from .routes.contact import router as contact_router
from .routes.chatbot import router as chatbot_router
from .schema.auth import UserProfile
from .schema.polygenic import PolygenicScoreRequest, PolygenicScoreResponse
from .schema.common import HealthResponse
from .services import polygenic as polygenic_services
from .services import auth as auth_services
from app.models import Trait
from fastapi.middleware.cors import CORSMiddleware
from fastapi import Depends, FastAPI, HTTPException, Response
from typing import Optional
from datetime import datetime, timezone
import logging

logging.basicConfig(level=logging.INFO)


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


@app.on_event("startup")
async def startup_event():
    settings = get_settings()
    if settings.traits_json_only:
        return

    try:
        gwas_dataset.ensure_dataset_loaded()
    except gwas_dataset.DatasetLoadError as e:
        print(f"⚠️  Warning: GWAS dataset unavailable: {e}")


app.include_router(auth_router)
app.include_router(admin_router)
app.include_router(newsletter_router)
app.include_router(contact_router)
app.include_router(chatbot_router)
app.include_router(mendelian_router)
app.include_router(preview_router)
app.include_router(data_import_router)
app.include_router(population_router)
app.include_router(pgs_demo_router)
app.include_router(project_router)
app.include_router(portal_router)
app.include_router(project_templates_router)
app.include_router(analytics_router)
app.include_router(gwas_router)
app.include_router(community_router)
app.include_router(cpp_engine_router)
app.include_router(dna_generator_router)
app.include_router(university_router)
app.include_router(traits_router)


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
