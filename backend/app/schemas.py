"""Pydantic schemas for the Zygotrix backend."""

from __future__ import annotations

from datetime import datetime
from typing import Dict, List, Literal, Mapping, Optional

from pydantic import BaseModel, EmailStr, Field, SecretStr, field_validator


class TraitInfo(BaseModel):
    """Metadata surfaced for each registered trait."""

    key: str
    name: str
    description: Optional[str] = None
    alleles: List[str] = Field(default_factory=list)
    phenotype_map: Mapping[str, str] = Field(default_factory=dict)
    metadata: Mapping[str, str] = Field(default_factory=dict)
    inheritance_pattern: Optional[str] = None
    verification_status: Optional[str] = None
    gene_info: Optional[str] = None
    category: Optional[str] = None
    # New fields for Level 3 - Real Genes
    gene: Optional[str] = None
    chromosome: Optional[int] = None


class TraitListResponse(BaseModel):
    """Response payload for the trait catalogue."""

    traits: List[TraitInfo]


class TraitMutationPayload(BaseModel):
    """Payload for creating or updating traits."""

    key: str
    name: str
    alleles: List[str]
    phenotype_map: Mapping[str, str]
    description: Optional[str] = ""
    metadata: Mapping[str, str] = Field(default_factory=dict)
    inheritance_pattern: Optional[str] = None
    verification_status: Optional[str] = None
    gene_info: Optional[str] = None
    category: Optional[str] = None

    @field_validator("key")
    @classmethod
    def validate_key(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Trait key cannot be empty.")
        return value

    @field_validator("alleles")
    @classmethod
    def validate_alleles(cls, alleles: List[str]) -> List[str]:
        cleaned = [allele.strip() for allele in alleles if allele.strip()]
        if not cleaned:
            raise ValueError("At least one allele symbol must be provided.")
        for allele in cleaned:
            if len(allele) != 1:
                raise ValueError("Alleles must be single-character symbols.")
        return cleaned


class TraitMutationResponse(BaseModel):
    """Response for mutation operations."""

    trait: TraitInfo


class MendelianSimulationRequest(BaseModel):
    """Inputs required to simulate Mendelian traits."""

    parent1_genotypes: Dict[str, str] = Field(
        ..., json_schema_extra={"example": {"eye_color": "Bb"}}
    )
    parent2_genotypes: Dict[str, str] = Field(
        ..., json_schema_extra={"example": {"eye_color": "bb"}}
    )
    trait_filter: Optional[List[str]] = Field(
        default=None,
        description="Restrict the response to specific trait keys if provided.",
    )
    as_percentages: bool = Field(
        default=False,
        description="Return phenotype distributions as 0-100 percentages instead of probabilities.",
    )

    @field_validator("parent1_genotypes", "parent2_genotypes", mode="before")
    @classmethod
    def _strip_spaces(cls, value: Mapping[str, str] | Dict[str, str]) -> Dict[str, str]:
        if isinstance(value, Mapping):
            mapping = dict(value)
        elif isinstance(value, dict):
            mapping = value
        else:
            raise TypeError(
                "Genotype payload must be a mapping of trait keys to genotypes."
            )
        return {
            key: str(genotype).replace(" ", "") for key, genotype in mapping.items()
        }


class TraitSimulationResult(BaseModel):
    """Simulation results for a single trait containing both genotypic and phenotypic ratios."""

    genotypic_ratios: Dict[str, float] = Field(
        ..., description="Genotype to probability mapping (e.g., {'BB': 25.0, 'Bb': 50.0, 'bb': 25.0})"
    )
    phenotypic_ratios: Dict[str, float] = Field(
        ..., description="Phenotype to probability mapping (e.g., {'Brown': 75.0, 'Blue': 25.0})"
    )


class MendelianSimulationResponse(BaseModel):
    """Genotypic and phenotypic distributions returned from the simulator."""

    results: Dict[str, TraitSimulationResult]
    missing_traits: List[str] = Field(
        default_factory=list,
        description="Requested trait keys that were not available in the registry.",
    )


class JointPhenotypeSimulationRequest(BaseModel):
    """Inputs required to simulate joint phenotypes across multiple Mendelian traits."""

    parent1_genotypes: Dict[str, str] = Field(
        ..., json_schema_extra={"example": {"eye_color": "Bb", "hair_texture": "Cc"}}
    )
    parent2_genotypes: Dict[str, str] = Field(
        ..., json_schema_extra={"example": {"eye_color": "Bb", "hair_texture": "Cc"}}
    )
    trait_filter: Optional[List[str]] = Field(
        default=None,
        description="Restrict the response to specific trait keys if provided.",
    )
    as_percentages: bool = Field(
        default=False,
        description="Return joint phenotype distributions as 0-100 percentages instead of probabilities.",
    )

    @field_validator("parent1_genotypes", "parent2_genotypes", mode="before")
    @classmethod
    def _strip_spaces(cls, value: Mapping[str, str] | Dict[str, str]) -> Dict[str, str]:
        if isinstance(value, Mapping):
            mapping = dict(value)
        elif isinstance(value, dict):
            mapping = value
        else:
            raise TypeError(
                "Genotype payload must be a mapping of trait keys to genotypes."
            )
        return {
            key: str(genotype).replace(" ", "") for key, genotype in mapping.items()
        }


class JointPhenotypeSimulationResponse(BaseModel):
    """Joint phenotype distributions returned from the simulator."""

    results: Dict[str, float] = Field(
        ...,
        description="Dictionary mapping combined phenotype strings to their probabilities",
        json_schema_extra={
            "example": {
                "Brown + Curly": 56.25,
                "Brown + Straight": 18.75,
                "Blue + Curly": 18.75,
                "Blue + Straight": 6.25,
            }
        },
    )
    missing_traits: List[str] = Field(
        default_factory=list,
        description="Requested trait keys that were not available in the registry.",
    )


class GenotypeRequest(BaseModel):
    """Request for getting possible genotypes for traits."""

    trait_keys: List[str] = Field(
        ...,
        json_schema_extra={"example": ["eye_color", "hair_color"]},
        description="List of trait keys to get genotypes for (max 5)",
    )

    @field_validator("trait_keys")
    @classmethod
    def validate_trait_count(cls, value: List[str]) -> List[str]:
        if len(value) > 5:
            raise ValueError("Maximum 5 traits allowed")
        return value


class GenotypeResponse(BaseModel):
    """Response containing possible genotypes for requested traits."""

    genotypes: Dict[str, List[str]] = Field(
        ..., description="Mapping of trait keys to lists of possible genotypes"
    )
    missing_traits: List[str] = Field(
        default_factory=list,
        description="Requested trait keys that were not available in the registry.",
    )


class PolygenicScoreRequest(BaseModel):
    """Inputs required to compute a polygenic score."""

    parent1_genotype: Mapping[str, float]
    parent2_genotype: Mapping[str, float]
    weights: Mapping[str, float]


class PolygenicScoreResponse(BaseModel):
    """Polygenic score output payload."""

    expected_score: float


class HealthResponse(BaseModel):
    """Simple health check result."""

    status: str = "ok"


class UserProfile(BaseModel):
    """Authenticated user profile surfaced to clients."""

    id: str
    email: EmailStr
    full_name: Optional[str] = None
    created_at: str


class SignupInitiateRequest(BaseModel):
    """Payload required to start the signup process."""

    email: EmailStr
    password: SecretStr
    full_name: Optional[str] = Field(default=None, description="Optional display name.")

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: SecretStr) -> SecretStr:
        password = value.get_secret_value()
        if len(password) < 8:
            raise ValueError("Password must be at least 8 characters long.")
        return value


class SignupInitiateResponse(BaseModel):
    """Response returned after requesting an OTP."""

    message: str
    expires_at: datetime


class SignupVerifyRequest(BaseModel):
    """Payload required to finalise account creation."""

    email: EmailStr
    otp: str = Field(min_length=6, max_length=6)


class SignupResendRequest(BaseModel):
    """Payload to resend a signup OTP."""

    email: EmailStr


class MessageResponse(BaseModel):
    """Simple acknowledgement payload."""

    message: str


class UserLoginRequest(BaseModel):
    """Payload required to authenticate an existing account."""

    email: EmailStr
    password: SecretStr


class AuthResponse(BaseModel):
    """Response returned after successful authentication."""

    access_token: str
    token_type: str = "bearer"
    user: UserProfile


class PortalStatusResponse(BaseModel):
    """Simple payload to confirm portal access."""

    message: str
    accessed_at: datetime


class MendelianSimulationResult(BaseModel):
    """Stores genotypic and phenotypic ratio percentages for a trait."""

    genotypic_ratios: Dict[str, float] = Field(default_factory=dict)
    phenotypic_ratios: Dict[str, float] = Field(default_factory=dict)


class MendelianProjectTool(BaseModel):
    """Configuration for a Mendelian genetics tool within a project."""

    id: str
    type: str = "mendelian"
    name: str
    trait_configurations: Dict[str, Dict[str, str]] = Field(default_factory=dict)
    simulation_results: Optional[Dict[str, MendelianSimulationResult]] = None
    notes: Optional[str] = None
    position: Optional[Dict[str, float]] = None


class MendelianToolCreateRequest(BaseModel):
    """Request payload for creating a new Mendelian tool in a project."""

    name: str
    trait_configurations: Dict[str, Dict[str, str]] = Field(default_factory=dict)
    simulation_results: Optional[Dict[str, MendelianSimulationResult]] = None
    notes: Optional[str] = None
    position: Optional[Dict[str, float]] = None


class MendelianToolUpdateRequest(BaseModel):
    """Request payload for updating a Mendelian tool."""

    name: Optional[str] = None
    trait_configurations: Optional[Dict[str, Dict[str, str]]] = None
    simulation_results: Optional[Dict[str, MendelianSimulationResult]] = None
    notes: Optional[str] = None
    position: Optional[Dict[str, float]] = None


class MendelianToolResponse(BaseModel):
    """Response payload for Mendelian tool operations."""

    tool: MendelianProjectTool


class ProjectLinePoint(BaseModel):
    """2D coordinate expressed in workspace canvas space."""

    x: float
    y: float


class ProjectLinePayload(BaseModel):
    """Client-submitted representation of a workspace connector line."""

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
    """Canonical representation of a connector line persisted on the server."""

    project_id: str


class ProjectLineSnapshot(BaseModel):
    """Canonical snapshot of all lines for a project."""

    lines: List[ProjectLine]
    snapshot_version: int = 0


class ProjectLineSaveSummary(BaseModel):
    """Server-side summary of the last save merge operation."""

    created: int = 0
    updated: int = 0
    deleted: int = 0
    ignored: int = 0


class ProjectLineSaveRequest(BaseModel):
    """Batch of line mutations submitted by the client."""

    lines: List[ProjectLinePayload] = Field(default_factory=list)


class ProjectLineSaveResponse(ProjectLineSnapshot):
    """Response payload returned after processing a save request."""

    summary: ProjectLineSaveSummary = Field(default_factory=ProjectLineSaveSummary)


class ProjectNoteSize(BaseModel):
    """Dimensions for a workspace note."""

    width: float
    height: float


class ProjectNotePayload(BaseModel):
    """Client-submitted representation of a workspace note."""

    id: str
    content: str
    position: ProjectLinePoint
    size: ProjectNoteSize
    is_deleted: bool = False
    updated_at: datetime
    version: int = 0
    origin: Optional[str] = None


class ProjectNote(ProjectNotePayload):
    """Canonical representation of a workspace note stored on the server."""

    project_id: str


class ProjectNoteSaveSummary(BaseModel):
    """Summary counts for note save operations."""

    created: int = 0
    updated: int = 0
    deleted: int = 0
    ignored: int = 0


class ProjectNoteSnapshot(BaseModel):
    """Snapshot of all notes for a project."""

    notes: List[ProjectNote]
    snapshot_version: int = 0


class ProjectNoteSaveRequest(BaseModel):
    """Batch of note mutations submitted by the client."""

    notes: List[ProjectNotePayload] = Field(default_factory=list)


class ProjectNoteSaveResponse(ProjectNoteSnapshot):
    """Response payload returned after saving notes."""

    summary: ProjectNoteSaveSummary = Field(default_factory=ProjectNoteSaveSummary)


class ProjectDrawingPoint(BaseModel):
    """Single coordinate in a freehand drawing."""

    x: float
    y: float


class ProjectDrawingPayload(BaseModel):
    """Client-submitted representation of a freehand drawing."""

    id: str
    points: List[ProjectDrawingPoint]
    stroke_color: str
    stroke_width: float
    is_deleted: bool = False
    updated_at: datetime
    version: int = 0
    origin: Optional[str] = None


class ProjectDrawing(ProjectDrawingPayload):
    """Canonical representation of a freehand drawing stored on the server."""

    project_id: str


class ProjectDrawingSaveSummary(BaseModel):
    """Summary counts for drawing save operations."""

    created: int = 0
    updated: int = 0
    deleted: int = 0
    ignored: int = 0


class ProjectDrawingSnapshot(BaseModel):
    """Snapshot of all drawings for a project."""

    drawings: List[ProjectDrawing]
    snapshot_version: int = 0


class ProjectDrawingSaveRequest(BaseModel):
    """Batch of drawing mutations submitted by the client."""

    drawings: List[ProjectDrawingPayload] = Field(default_factory=list)


class ProjectDrawingSaveResponse(ProjectDrawingSnapshot):
    """Response payload returned after saving drawings."""

    summary: ProjectDrawingSaveSummary = Field(default_factory=ProjectDrawingSaveSummary)


class Project(BaseModel):
    """A user project containing genetics studies and tools."""

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
    color: Optional[str] = "bg-blue-500"  # Default color


class ProjectCreateRequest(BaseModel):
    """Request payload for creating a new project."""

    name: str
    description: Optional[str] = None
    type: str = "genetics"
    tags: List[str] = Field(default_factory=list)
    from_template: Optional[str] = None
    color: Optional[str] = "bg-blue-500"  # Default color


class ProjectUpdateRequest(BaseModel):
    """Request payload for updating a project."""

    name: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[List[str]] = None
    tools: Optional[List[MendelianProjectTool]] = None
    color: Optional[str] = None


class ProjectResponse(BaseModel):
    """Response payload for project operations."""

    project: Project


class ProjectListResponse(BaseModel):
    """Response payload for listing projects."""

    projects: List[Project]
    total: int
    page: int
    page_size: int


class ProjectTemplate(BaseModel):
    """A template project that users can instantiate."""

    id: str
    name: str
    description: str
    category: str
    preview_image: Optional[str] = None
    tools: List[MendelianProjectTool]
    tags: List[str] = Field(default_factory=list)


class ProjectTemplateListResponse(BaseModel):
    """Response payload for listing project templates."""

    templates: List[ProjectTemplate]
