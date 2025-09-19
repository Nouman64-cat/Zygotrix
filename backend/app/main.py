"""FastAPI application exposing Zygotrix simulation capabilities."""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import Depends, FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from zygotrix_engine import Trait

from . import services
from .schemas import (
    AuthResponse,
    HealthResponse,
    MessageResponse,
    MendelianSimulationRequest,
    MendelianSimulationResponse,
    PolygenicScoreRequest,
    PolygenicScoreResponse,
    PortalStatusResponse,
    SignupInitiateRequest,
    SignupInitiateResponse,
    SignupResendRequest,
    SignupVerifyRequest,
    TraitInfo,
    TraitListResponse,
    TraitMutationPayload,
    TraitMutationResponse,
    UserLoginRequest,
    UserProfile,
)

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


def trait_to_info(key: str, trait: Trait) -> TraitInfo:
    return TraitInfo(
        key=key,
        name=trait.name,
        description=trait.description or None,
        alleles=list(trait.alleles),
        phenotype_map=dict(trait.phenotype_map),
        metadata=dict(trait.metadata),
    )


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> UserProfile:
    user = services.resolve_user_from_token(credentials.credentials)
    return UserProfile(**user)


@app.get("/health", response_model=HealthResponse, tags=["System"])
def health() -> HealthResponse:
    return HealthResponse()


@app.post(
    "/api/auth/signup",
    response_model=SignupInitiateResponse,
    status_code=202,
    tags=["Auth"],
)
def signup(payload: SignupInitiateRequest) -> SignupInitiateResponse:
    expires_at = services.request_signup_otp(
        email=payload.email,
        password=payload.password.get_secret_value(),
        full_name=payload.full_name,
    )
    return SignupInitiateResponse(
        message="An OTP has been sent to your email address. Please verify within the next 10 minutes.",
        expires_at=expires_at,
    )


@app.post(
    "/api/auth/signup/verify",
    response_model=MessageResponse,
    tags=["Auth"],
)
def verify_signup(payload: SignupVerifyRequest) -> MessageResponse:
    services.verify_signup_otp(email=payload.email, otp=payload.otp)
    return MessageResponse(message="Account created successfully. You can now sign in.")


@app.post(
    "/api/auth/signup/resend",
    response_model=SignupInitiateResponse,
    tags=["Auth"],
)
def resend_signup_otp(payload: SignupResendRequest) -> SignupInitiateResponse:
    expires_at = services.resend_signup_otp(email=payload.email)
    return SignupInitiateResponse(
        message="A new OTP has been sent to your email address.",
        expires_at=expires_at,
    )


@app.post("/api/auth/login", response_model=AuthResponse, tags=["Auth"])
def login(payload: UserLoginRequest) -> AuthResponse:
    user = services.authenticate_user(
        email=payload.email,
        password=payload.password.get_secret_value(),
    )
    return AuthResponse(**services.build_auth_response(user))


@app.get("/api/auth/me", response_model=UserProfile, tags=["Auth"])
def read_current_user(current_user: UserProfile = Depends(get_current_user)) -> UserProfile:
    return current_user


@app.get("/api/portal/status", response_model=PortalStatusResponse, tags=["Portal"])
def portal_status(current_user: UserProfile = Depends(get_current_user)) -> PortalStatusResponse:
    greeting = current_user.full_name or current_user.email
    return PortalStatusResponse(
        message=f"Welcome to the portal, {greeting}.",
        accessed_at=datetime.now(timezone.utc),
    )


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
