"""Pydantic schemas for the Zygotrix backend."""

from __future__ import annotations

from datetime import datetime
from typing import Dict, List, Mapping, Optional

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
            raise TypeError("Genotype payload must be a mapping of trait keys to genotypes.")
        return {key: str(genotype).replace(" ", "") for key, genotype in mapping.items()}


class MendelianSimulationResponse(BaseModel):
    """Phenotype distributions returned from the simulator."""

    results: Dict[str, Dict[str, float]]
    missing_traits: List[str] = Field(
        default_factory=list,
        description="Requested trait keys that were not available in the registry.",
    )


class GenotypeRequest(BaseModel):
    """Request for getting possible genotypes for traits."""
    
    trait_keys: List[str] = Field(
        ..., 
        json_schema_extra={"example": ["eye_color", "hair_color"]},
        description="List of trait keys to get genotypes for (max 5)"
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
        ...,
        description="Mapping of trait keys to lists of possible genotypes"
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


class MendelianProjectTool(BaseModel):
    """Configuration for a Mendelian genetics tool within a project."""
    
    id: str
    type: str = "mendelian"
    name: str
    trait_configurations: Dict[str, Dict[str, str]] = Field(default_factory=dict)
    simulation_results: Optional[Dict[str, Dict[str, float]]] = None
    notes: Optional[str] = None
    position: Optional[Dict[str, float]] = None


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


class ProjectCreateRequest(BaseModel):
    """Request payload for creating a new project."""
    
    name: str
    description: Optional[str] = None
    type: str = "genetics"
    tags: List[str] = Field(default_factory=list)
    from_template: Optional[str] = None


class ProjectUpdateRequest(BaseModel):
    """Request payload for updating a project."""
    
    name: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[List[str]] = None
    tools: Optional[List[MendelianProjectTool]] = None


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
