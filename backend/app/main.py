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
    GenotypeRequest,
    GenotypeResponse,
    HealthResponse,
    JointPhenotypeSimulationRequest,
    JointPhenotypeSimulationResponse,
    MendelianProjectTool,
    MendelianToolCreateRequest,
    MendelianToolResponse,
    MendelianToolUpdateRequest,
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
    ProjectNoteSaveRequest,
    ProjectNoteSaveResponse,
    ProjectNoteSnapshot,
    ProjectDrawingSaveRequest,
    ProjectDrawingSaveResponse,
    ProjectDrawingSnapshot,
    ProjectTemplate,
    ProjectTemplateListResponse,
    ProjectUpdateRequest,
    TraitInfo,
    TraitListResponse,
    TraitMutationPayload,
    TraitMutationResponse,
    UserProfile,
)


from .routes.auth import router as auth_router
from .routes.traits import router as trait_router
from .routes.mendelian import router as mendelian_router
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


@app.get(
    "/api/projects/{project_id}/notes",
    response_model=ProjectNoteSnapshot,
    tags=["Projects"],
)
def get_project_notes(
    project_id: str,
    current_user: UserProfile = Depends(get_current_user),
) -> ProjectNoteSnapshot:
    snapshot = services.get_project_note_snapshot(project_id, current_user.id)
    if snapshot is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return snapshot


@app.post(
    "/api/projects/{project_id}/notes/save",
    response_model=ProjectNoteSaveResponse,
    tags=["Projects"],
)
def save_project_notes(
    project_id: str,
    payload: ProjectNoteSaveRequest,
    current_user: UserProfile = Depends(get_current_user),
) -> ProjectNoteSaveResponse:
    result = services.save_project_notes(project_id, current_user.id, payload.notes)
    if result is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return result


@app.get(
    "/api/projects/{project_id}/drawings",
    response_model=ProjectDrawingSnapshot,
    tags=["Projects"],
)
def get_project_drawings(
    project_id: str,
    current_user: UserProfile = Depends(get_current_user),
) -> ProjectDrawingSnapshot:
    snapshot = services.get_project_drawing_snapshot(project_id, current_user.id)
    if snapshot is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return snapshot


@app.post(
    "/api/projects/{project_id}/drawings/save",
    response_model=ProjectDrawingSaveResponse,
    tags=["Projects"],
)
def save_project_drawings(
    project_id: str,
    payload: ProjectDrawingSaveRequest,
    current_user: UserProfile = Depends(get_current_user),
) -> ProjectDrawingSaveResponse:
    result = services.save_project_drawings(
        project_id, current_user.id, payload.drawings
    )
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
