from fastapi import APIRouter, Depends, HTTPException, Response
from typing import Optional
from app.services.projects import (
    get_user_projects,
    create_project,
    get_project,
    update_project,
    delete_project,
)
from app.services.project_tools import (
    create_tool,
    update_tool,
    delete_tool,
    get_project_line_snapshot,
    save_project_lines,
    get_project_note_snapshot,
    save_project_notes,
    get_project_drawing_snapshot,
    save_project_drawings,
)
from ..schema.projects import (
    ProjectListResponse,
    ProjectResponse,
    ProjectCreateRequest,
    ProjectUpdateRequest,
    ProjectTemplateListResponse,
    MendelianToolResponse,
    MendelianToolCreateRequest,
    MendelianToolUpdateRequest,
    MendelianProjectTool,
    ProjectLineSaveRequest,
    ProjectLineSaveResponse,
    ProjectLineSnapshot,
    ProjectNoteSaveRequest,
    ProjectNoteSaveResponse,
    ProjectNoteSnapshot,
    ProjectDrawingSaveRequest,
    ProjectDrawingSaveResponse,
    ProjectDrawingSnapshot,
)
from ..schema.auth import UserProfile
from ..routes.auth import get_current_user

router = APIRouter(prefix="/api/projects", tags=["Projects"])


@router.get("/", response_model=ProjectListResponse)
def list_projects(
    page: int = 1,
    page_size: int = 20,
    current_user: UserProfile = Depends(get_current_user),
) -> ProjectListResponse:
    projects, total = get_user_projects(
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


def create_project_local(
    payload: ProjectCreateRequest,
    current_user: UserProfile = Depends(get_current_user),
) -> ProjectResponse:
    project = create_project(
        name=payload.name,
        description=payload.description,
        project_type=payload.type,
        owner_id=current_user.id,
        tags=payload.tags,
        from_template=payload.from_template,
        color=payload.color,
    )
    return ProjectResponse(project=project)


@router.post("/", response_model=ProjectResponse, status_code=201)
def create_project_route(
    payload: ProjectCreateRequest,
    current_user: UserProfile = Depends(get_current_user),
) -> ProjectResponse:
    project = create_project(
        name=payload.name,
        description=payload.description,
        project_type=payload.type,
        owner_id=current_user.id,
        tags=payload.tags,
        from_template=payload.from_template,
        color=payload.color,
    )
    return ProjectResponse(project=project)


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project_route(
    project_id: str,
    current_user: UserProfile = Depends(get_current_user),
) -> ProjectResponse:
    project = get_project(project_id, current_user.id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return ProjectResponse(project=project)


@router.put("/{project_id}", response_model=ProjectResponse)
def update_project_route(
    project_id: str,
    payload: ProjectUpdateRequest,
    current_user: UserProfile = Depends(get_current_user),
) -> ProjectResponse:
    project = update_project(
        project_id=project_id,
        user_id=current_user.id,
        updates=payload.model_dump(exclude_unset=True),
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return ProjectResponse(project=project)


@router.delete("/{project_id}", status_code=204)
def delete_project(
    project_id: str,
    current_user: UserProfile = Depends(get_current_user),
) -> Response:
    success = delete_project(project_id=project_id, user_id=current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Project not found")
    return Response(status_code=204)


# Remove the templates route from the projects router


# Tool Management Endpoints
@router.post(
    "/{project_id}/tools", response_model=MendelianToolResponse, status_code=201
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


@router.put("/{project_id}/tools/{tool_id}", response_model=MendelianToolResponse)
def update_mendelian_tool(
    project_id: str,
    tool_id: str,
    payload: MendelianToolUpdateRequest,
    current_user: UserProfile = Depends(get_current_user),
) -> MendelianToolResponse:
    updates = payload.model_dump(exclude_unset=True)
    tool = update_tool(
        project_id=project_id,
        tool_id=tool_id,
        user_id=current_user.id,
        updates=updates,
    )
    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")

    mendelian_tool = MendelianProjectTool(**tool)
    return MendelianToolResponse(tool=mendelian_tool)


@router.get("/{project_id}/lines", response_model=ProjectLineSnapshot)
def get_project_lines(
    project_id: str,
    current_user: UserProfile = Depends(get_current_user),
) -> ProjectLineSnapshot:
    if project_id in ("null", "None", None, ""):
        raise HTTPException(status_code=400, detail="Invalid project ID")
    snapshot = get_project_line_snapshot(project_id, current_user.id)
    if snapshot is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return snapshot


@router.post("/{project_id}/lines/save", response_model=ProjectLineSaveResponse)
def save_project_lines_route(
    project_id: str,
    payload: ProjectLineSaveRequest,
    current_user: UserProfile = Depends(get_current_user),
) -> ProjectLineSaveResponse:
    result = save_project_lines(project_id, current_user.id, payload.lines)
    if result is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return result


@router.get("/{project_id}/notes", response_model=ProjectNoteSnapshot)
def get_project_notes(
    project_id: str,
    current_user: UserProfile = Depends(get_current_user),
) -> ProjectNoteSnapshot:
    if project_id in ("null", "None", None, ""):
        raise HTTPException(status_code=400, detail="Invalid project ID")
    snapshot = get_project_note_snapshot(project_id, current_user.id)
    if snapshot is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return snapshot


@router.post("/{project_id}/notes/save", response_model=ProjectNoteSaveResponse)
def save_project_notes_route(
    project_id: str,
    payload: ProjectNoteSaveRequest,
    current_user: UserProfile = Depends(get_current_user),
) -> ProjectNoteSaveResponse:
    result = save_project_notes(project_id, current_user.id, payload.notes)
    if result is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return result


@router.get("/{project_id}/drawings", response_model=ProjectDrawingSnapshot)
def get_project_drawings(
    project_id: str,
    current_user: UserProfile = Depends(get_current_user),
) -> ProjectDrawingSnapshot:
    if project_id in ("null", "None", None, ""):
        raise HTTPException(status_code=400, detail="Invalid project ID")
    snapshot = get_project_drawing_snapshot(project_id, current_user.id)
    if snapshot is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return snapshot


@router.post("/{project_id}/drawings/save", response_model=ProjectDrawingSaveResponse)
def save_project_drawings_route(
    project_id: str,
    payload: ProjectDrawingSaveRequest,
    current_user: UserProfile = Depends(get_current_user),
) -> ProjectDrawingSaveResponse:
    result = save_project_drawings(project_id, current_user.id, payload.drawings)
    if result is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return result


@router.delete("/{project_id}/tools/{tool_id}", status_code=204)
def delete_mendelian_tool(
    project_id: str,
    tool_id: str,
    current_user: UserProfile = Depends(get_current_user),
) -> Response:
    success = delete_tool(
        project_id=project_id,
        tool_id=tool_id,
        user_id=current_user.id,
    )
    if not success:
        raise HTTPException(status_code=404, detail="Tool not found")
    return Response(status_code=204)
