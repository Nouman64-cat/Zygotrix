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
    AuthResponse,
    GenotypeRequest,
    GenotypeResponse,
    HealthResponse,
    JointPhenotypeSimulationRequest,
    JointPhenotypeSimulationResponse,
    MendelianProjectTool,
    MendelianToolCreateRequest,
    MendelianToolResponse,
    MendelianToolUpdateRequest,
    MessageResponse,
    MendelianSimulationRequest,
    MendelianSimulationResponse,
    PolygenicScoreRequest,
    PolygenicScoreResponse,
    PortalStatusResponse,
    Project,
    ProjectCreateRequest,
    ProjectListResponse,
    ProjectResponse,
    ProjectLineSaveRequest,
    ProjectLineSaveResponse,
    ProjectLineSnapshot,
    ProjectTemplate,
    ProjectTemplateListResponse,
    ProjectUpdateRequest,
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
    # Extract Mendelian trait metadata from trait.metadata
    metadata_dict = dict(trait.metadata)

    # Extract chromosome as integer if present
    chromosome = None
    if "chromosome" in metadata_dict:
        try:
            chromosome = int(metadata_dict["chromosome"])
        except (ValueError, TypeError):
            chromosome = None

    return TraitInfo(
        key=key,
        name=trait.name,
        description=trait.description or None,
        alleles=list(trait.alleles),
        phenotype_map=dict(trait.phenotype_map),
        metadata=metadata_dict,
        inheritance_pattern=metadata_dict.get("inheritance_pattern"),
        verification_status=metadata_dict.get("verification_status"),
        gene_info=metadata_dict.get("gene_info"),
        category=metadata_dict.get("category"),
        gene=metadata_dict.get("gene"),
        chromosome=chromosome,
    )


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
def read_current_user(
    current_user: UserProfile = Depends(get_current_user),
) -> UserProfile:
    return current_user


@app.get("/api/portal/status", response_model=PortalStatusResponse, tags=["Portal"])
def portal_status(
    current_user: UserProfile = Depends(get_current_user),
) -> PortalStatusResponse:
    greeting = current_user.full_name or current_user.email
    return PortalStatusResponse(
        message=f"Welcome to the portal, {greeting}.",
        accessed_at=datetime.now(timezone.utc),
    )


@app.get("/api/traits", response_model=TraitListResponse, tags=["Traits"])
def list_traits(
    inheritance_pattern: Optional[str] = None,
    verification_status: Optional[str] = None,
    category: Optional[str] = None,
    gene_info: Optional[str] = None,
) -> TraitListResponse:
    traits = [
        trait_to_info(key, trait)
        for key, trait in services.get_trait_registry(
            inheritance_pattern=inheritance_pattern,
            verification_status=verification_status,
            category=category,
            gene_info=gene_info,
        ).items()
    ]
    return TraitListResponse(traits=traits)


@app.post(
    "/api/traits",
    response_model=TraitMutationResponse,
    tags=["Traits"],
    status_code=201,
)
def create_trait(payload: TraitMutationPayload) -> TraitMutationResponse:
    trait_definition = {
        "name": payload.name,
        "alleles": payload.alleles,
        "phenotype_map": dict(payload.phenotype_map),
        "description": payload.description or "",
        "metadata": dict(payload.metadata),
    }

    # Add new Mendelian trait fields if provided
    if payload.inheritance_pattern:
        trait_definition["inheritance_pattern"] = payload.inheritance_pattern
    if payload.verification_status:
        trait_definition["verification_status"] = payload.verification_status
    if payload.gene_info:
        trait_definition["gene_info"] = payload.gene_info
    if payload.category:
        trait_definition["category"] = payload.category

    trait = services.save_trait(payload.key, trait_definition)
    return TraitMutationResponse(trait=trait_to_info(payload.key, trait))


@app.put("/api/traits/{key}", response_model=TraitMutationResponse, tags=["Traits"])
def update_trait(key: str, payload: TraitMutationPayload) -> TraitMutationResponse:
    if key != payload.key:
        raise HTTPException(
            status_code=400, detail="Trait key mismatch between path and payload."
        )

    trait_definition = {
        "name": payload.name,
        "alleles": payload.alleles,
        "phenotype_map": dict(payload.phenotype_map),
        "description": payload.description or "",
        "metadata": dict(payload.metadata),
    }

    # Add new Mendelian trait fields if provided
    if payload.inheritance_pattern:
        trait_definition["inheritance_pattern"] = payload.inheritance_pattern
    if payload.verification_status:
        trait_definition["verification_status"] = payload.verification_status
    if payload.gene_info:
        trait_definition["gene_info"] = payload.gene_info
    if payload.category:
        trait_definition["category"] = payload.category

    trait = services.save_trait(payload.key, trait_definition)
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
def simulate_mendelian(
    request: MendelianSimulationRequest,
) -> MendelianSimulationResponse:
    try:
        results, missing = services.simulate_mendelian_traits(
            parent1=request.parent1_genotypes,
            parent2=request.parent2_genotypes,
            trait_filter=request.trait_filter,
            as_percentages=request.as_percentages,
            max_traits=5,
        )
        return MendelianSimulationResponse(results=results, missing_traits=missing)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post(
    "/api/mendelian/simulate-joint",
    response_model=JointPhenotypeSimulationResponse,
    tags=["Mendelian"],
)
def simulate_joint_phenotypes(
    request: JointPhenotypeSimulationRequest,
) -> JointPhenotypeSimulationResponse:
    """Simulate joint phenotype probabilities across multiple traits.

    This endpoint calculates combined phenotype probabilities using Mendel's law
    of independent assortment. Instead of returning separate distributions for
    each trait, it returns a single distribution of combined phenotypes.

    Example: Eye color (Bb × Bb) + Hair texture (Cc × Cc) returns:
    - "Brown + Curly": 56.25%
    - "Brown + Straight": 18.75%
    - "Blue + Curly": 18.75%
    - "Blue + Straight": 6.25%
    """
    try:
        results, missing = services.simulate_joint_phenotypes(
            parent1=request.parent1_genotypes,
            parent2=request.parent2_genotypes,
            trait_filter=request.trait_filter,
            as_percentages=request.as_percentages,
            max_traits=5,
        )
        return JointPhenotypeSimulationResponse(results=results, missing_traits=missing)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post(
    "/api/mendelian/genotypes",
    response_model=GenotypeResponse,
    tags=["Mendelian"],
)
def get_trait_genotypes(request: GenotypeRequest) -> GenotypeResponse:
    """Get possible genotypes for given trait keys."""
    try:
        genotypes, missing = services.get_possible_genotypes_for_traits(
            trait_keys=request.trait_keys,
            max_traits=5,
        )
        return GenotypeResponse(genotypes=genotypes, missing_traits=missing)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


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


@app.get("/api/projects", response_model=ProjectListResponse, tags=["Projects"])
def list_projects(
    page: int = 1,
    page_size: int = 20,
    current_user: UserProfile = Depends(get_current_user),
) -> ProjectListResponse:
    projects, total = services.get_user_projects(
        user_id=current_user.id,
        page=page,
        page_size=page_size,
    )
    return ProjectListResponse(
        projects=projects,
        total=total,
        page=page,
        page_size=page_size,
    )


@app.post(
    "/api/projects", response_model=ProjectResponse, status_code=201, tags=["Projects"]
)
def create_project(
    payload: ProjectCreateRequest,
    current_user: UserProfile = Depends(get_current_user),
) -> ProjectResponse:
    project = services.create_project(
        name=payload.name,
        description=payload.description,
        project_type=payload.type,
        owner_id=current_user.id,
        tags=payload.tags,
        from_template=payload.from_template,
        color=payload.color,
    )
    return ProjectResponse(project=project)


@app.get(
    "/api/projects/{project_id}", response_model=ProjectResponse, tags=["Projects"]
)
def get_project(
    project_id: str,
    current_user: UserProfile = Depends(get_current_user),
) -> ProjectResponse:
    project = services.get_project(project_id=project_id, user_id=current_user.id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return ProjectResponse(project=project)


@app.put(
    "/api/projects/{project_id}", response_model=ProjectResponse, tags=["Projects"]
)
def update_project(
    project_id: str,
    payload: ProjectUpdateRequest,
    current_user: UserProfile = Depends(get_current_user),
) -> ProjectResponse:
    project = services.update_project(
        project_id=project_id,
        user_id=current_user.id,
        updates=payload.model_dump(exclude_unset=True),
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return ProjectResponse(project=project)


@app.delete("/api/projects/{project_id}", status_code=204, tags=["Projects"])
def delete_project(
    project_id: str,
    current_user: UserProfile = Depends(get_current_user),
) -> Response:
    success = services.delete_project(project_id=project_id, user_id=current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Project not found")
    return Response(status_code=204)


@app.get(
    "/api/project-templates",
    response_model=ProjectTemplateListResponse,
    tags=["Projects"],
)
def list_project_templates() -> ProjectTemplateListResponse:
    templates = services.get_project_templates()
    return ProjectTemplateListResponse(templates=templates)


# Tool Management Endpoints
@app.post(
    "/api/projects/{project_id}/tools",
    response_model=MendelianToolResponse,
    status_code=201,
    tags=["Tools"],
)
def create_mendelian_tool(
    project_id: str,
    payload: MendelianToolCreateRequest,
    current_user: UserProfile = Depends(get_current_user),
) -> MendelianToolResponse:
    tool_data = payload.model_dump()
    tool = services.create_tool(
        project_id=project_id,
        user_id=current_user.id,
        tool_data=tool_data,
    )
    if not tool:
        raise HTTPException(status_code=404, detail="Project not found")

    mendelian_tool = MendelianProjectTool(**tool)
    return MendelianToolResponse(tool=mendelian_tool)


@app.put(
    "/api/projects/{project_id}/tools/{tool_id}",
    response_model=MendelianToolResponse,
    tags=["Tools"],
)
def update_mendelian_tool(
    project_id: str,
    tool_id: str,
    payload: MendelianToolUpdateRequest,
    current_user: UserProfile = Depends(get_current_user),
) -> MendelianToolResponse:
    updates = payload.model_dump(exclude_unset=True)
    tool = services.update_tool(
        project_id=project_id,
        tool_id=tool_id,
        user_id=current_user.id,
        updates=updates,
    )
    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")

    mendelian_tool = MendelianProjectTool(**tool)
    return MendelianToolResponse(tool=mendelian_tool)


@app.get(
    "/api/projects/{project_id}/lines",
    response_model=ProjectLineSnapshot,
    tags=["Projects"],
)
def get_project_lines(
    project_id: str,
    current_user: UserProfile = Depends(get_current_user),
) -> ProjectLineSnapshot:
    snapshot = services.get_project_line_snapshot(project_id, current_user.id)
    if snapshot is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return snapshot


@app.post(
    "/api/projects/{project_id}/lines/save",
    response_model=ProjectLineSaveResponse,
    tags=["Projects"],
)
def save_project_lines(
    project_id: str,
    payload: ProjectLineSaveRequest,
    current_user: UserProfile = Depends(get_current_user),
) -> ProjectLineSaveResponse:
    result = services.save_project_lines(project_id, current_user.id, payload.lines)
    if result is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return result


@app.delete(
    "/api/projects/{project_id}/tools/{tool_id}", status_code=204, tags=["Tools"]
)
def delete_mendelian_tool(
    project_id: str,
    tool_id: str,
    current_user: UserProfile = Depends(get_current_user),
) -> Response:
    success = services.delete_tool(
        project_id=project_id,
        tool_id=tool_id,
        user_id=current_user.id,
    )
    if not success:
        raise HTTPException(status_code=404, detail="Tool not found")
    return Response(status_code=204)


@app.get("/", include_in_schema=False)
def root() -> dict[str, str]:
    return {
        "message": "Welcome to Zygotrix Backend. Visit /docs for API documentation."
    }
