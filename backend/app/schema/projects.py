from typing import List, Optional, Dict, Literal
from datetime import datetime
from pydantic import BaseModel, Field


class MendelianSimulationResult(BaseModel):
    genotypic_ratios: Dict[str, float] = Field(default_factory=dict)
    phenotypic_ratios: Dict[str, float] = Field(default_factory=dict)


class MendelianProjectTool(BaseModel):
    id: str
    type: str = "mendelian"
    name: str
    trait_configurations: Dict[str, Dict[str, str]] = Field(default_factory=dict)
    simulation_results: Optional[Dict[str, MendelianSimulationResult]] = None
    notes: Optional[str] = None
    position: Optional[Dict[str, float]] = None


class MendelianToolCreateRequest(BaseModel):
    name: str
    trait_configurations: Dict[str, Dict[str, str]] = Field(default_factory=dict)
    simulation_results: Optional[Dict[str, MendelianSimulationResult]] = None
    notes: Optional[str] = None
    position: Optional[Dict[str, float]] = None


class MendelianToolUpdateRequest(BaseModel):
    name: Optional[str] = None
    trait_configurations: Optional[Dict[str, Dict[str, str]]] = None
    simulation_results: Optional[Dict[str, MendelianSimulationResult]] = None
    notes: Optional[str] = None
    position: Optional[Dict[str, float]] = None


class MendelianToolResponse(BaseModel):
    tool: MendelianProjectTool


class ProjectLinePoint(BaseModel):
    x: float
    y: float


class ProjectLinePayload(BaseModel):
    id: str
    start_point: ProjectLinePoint
    end_point: ProjectLinePoint
    stroke_color: str
    stroke_width: float
    arrow_type: Literal["none", "end"] = "none"
    is_deleted: bool = False
    updated_at: datetime
    version: int = 0
    origin: Optional[str] = None


class ProjectLine(ProjectLinePayload):
    project_id: str


class ProjectLineSnapshot(BaseModel):
    lines: List[ProjectLine]
    snapshot_version: int = 0


class ProjectLineSaveSummary(BaseModel):
    created: int = 0
    updated: int = 0
    deleted: int = 0
    ignored: int = 0


class ProjectLineSaveRequest(BaseModel):
    lines: List[ProjectLinePayload] = Field(default_factory=list)


class ProjectLineSaveResponse(ProjectLineSnapshot):
    summary: ProjectLineSaveSummary = Field(default_factory=ProjectLineSaveSummary)


class ProjectNoteSize(BaseModel):
    width: float
    height: float


class ProjectNotePayload(BaseModel):
    id: str
    content: str
    position: ProjectLinePoint
    size: ProjectNoteSize
    is_deleted: bool = False
    updated_at: datetime
    version: int = 0
    origin: Optional[str] = None


class ProjectNote(ProjectNotePayload):
    project_id: str


class ProjectNoteSaveSummary(BaseModel):
    created: int = 0
    updated: int = 0
    deleted: int = 0
    ignored: int = 0


class ProjectNoteSnapshot(BaseModel):
    notes: List[ProjectNote]
    snapshot_version: int = 0


class ProjectNoteSaveRequest(BaseModel):
    notes: List[ProjectNotePayload] = Field(default_factory=list)


class ProjectNoteSaveResponse(ProjectNoteSnapshot):
    summary: ProjectNoteSaveSummary = Field(default_factory=ProjectNoteSaveSummary)


class ProjectDrawingPoint(BaseModel):
    x: float
    y: float


class ProjectDrawingPayload(BaseModel):
    id: str
    points: List[ProjectDrawingPoint]
    stroke_color: str
    stroke_width: float
    is_deleted: bool = False
    updated_at: datetime
    version: int = 0
    origin: Optional[str] = None


class ProjectDrawing(ProjectDrawingPayload):
    project_id: str


class ProjectDrawingSaveSummary(BaseModel):
    created: int = 0
    updated: int = 0
    deleted: int = 0
    ignored: int = 0


class ProjectDrawingSnapshot(BaseModel):
    drawings: List[ProjectDrawing]
    snapshot_version: int = 0


class ProjectDrawingSaveRequest(BaseModel):
    drawings: List[ProjectDrawingPayload] = Field(default_factory=list)


class ProjectDrawingSaveResponse(ProjectDrawingSnapshot):
    summary: ProjectDrawingSaveSummary = Field(
        default_factory=ProjectDrawingSaveSummary
    )


class Project(BaseModel):
    id: Optional[str] = None
    name: str
    description: Optional[str] = None
    type: str = "genetics"
    owner_id: str
    tools: List[MendelianProjectTool] = Field(default_factory=list)
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    tags: List[str] = Field(default_factory=list)
    is_template: bool = False
    template_category: Optional[str] = None
    color: Optional[str] = "bg-blue-500"


class ProjectCreateRequest(BaseModel):
    name: str
    description: Optional[str] = None
    type: str = "genetics"
    tags: List[str] = Field(default_factory=list)
    from_template: Optional[str] = None
    color: Optional[str] = "bg-blue-500"


class ProjectUpdateRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[List[str]] = None
    tools: Optional[List[MendelianProjectTool]] = None
    color: Optional[str] = None


class ProjectResponse(BaseModel):
    project: Project


class ProjectListResponse(BaseModel):
    projects: List[Project]
    total: int
    page: int
    page_size: int


class ProjectTemplate(BaseModel):
    id: str
    name: str
    description: str
    category: str
    preview_image: Optional[str] = None
    tools: List[MendelianProjectTool]
    tags: List[str] = Field(default_factory=list)


class ProjectTemplateListResponse(BaseModel):
    templates: List[ProjectTemplate]
