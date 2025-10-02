from datetime import datetime
from enum import Enum
from typing import List, Optional, Mapping, Dict, Any
from pydantic import BaseModel, Field, field_validator, ConfigDict
from bson import ObjectId


class TraitStatus(str, Enum):
    """Trait status enumeration."""

    DRAFT = "draft"
    ACTIVE = "active"
    DEPRECATED = "deprecated"


class TraitVisibility(str, Enum):
    """Trait visibility enumeration."""

    PRIVATE = "private"
    TEAM = "team"
    PUBLIC = "public"


class GeneInfo(BaseModel):
    """Gene information for traits."""

    genes: Optional[List[str]] = Field(default_factory=list)
    chromosomes: Optional[List[str]] = Field(default_factory=list)
    locus: Optional[str] = None

    # Legacy fields for backward compatibility
    gene: Optional[str] = None
    chromosome: Optional[str] = None


class ValidationRules(BaseModel):
    """Validation rules for traits."""

    passed: bool = True
    errors: List[str] = Field(default_factory=list)


class TraitInfo(BaseModel):
    """Metadata surfaced for each registered trait."""

    model_config = ConfigDict(arbitrary_types_allowed=True)

    key: str
    name: str
    alleles: List[str] = Field(default_factory=list)
    phenotype_map: Mapping[str, str] = Field(default_factory=dict)
    inheritance_pattern: Optional[str] = None
    verification_status: Optional[str] = None
    category: Optional[str] = None
    gene_info: Optional[GeneInfo] = None
    allele_freq: Optional[Dict[str, float]] = Field(default_factory=dict)
    epistasis_hint: Optional[str] = None
    education_note: Optional[str] = None
    references: List[str] = Field(default_factory=list)
    version: str = "1.0.0"
    status: TraitStatus = TraitStatus.DRAFT
    owner_id: Optional[str] = None  # Optional for JSON-loaded traits
    visibility: TraitVisibility = (
        TraitVisibility.PUBLIC
    )  # JSON traits are public by default
    tags: List[str] = Field(default_factory=list)
    validation_rules: ValidationRules = Field(default_factory=ValidationRules)
    test_case_seed: Optional[str] = None
    created_at: Optional[datetime] = None  # Optional for JSON-loaded traits
    updated_at: Optional[datetime] = None  # Optional for JSON-loaded traits
    created_by: Optional[str] = None  # Optional for JSON-loaded traits
    updated_by: Optional[str] = None  # Optional for JSON-loaded traits

    # New fields for updated dataset format
    genes: Optional[List[str]] = Field(default_factory=list)
    chromosomes: Optional[List[str]] = Field(default_factory=list)
    trait_type: Optional[str] = None  # "monogenic" or "polygenic"

    # Legacy fields for backward compatibility
    description: Optional[str] = None
    metadata: Mapping[str, str] = Field(default_factory=dict)
    gene: Optional[str] = None
    chromosome: Optional[int] = None


class TraitListResponse(BaseModel):
    """Response payload for the trait catalogue."""

    traits: List[TraitInfo]


class TraitCreatePayload(BaseModel):
    """Payload for creating traits."""

    key: str
    name: str
    alleles: List[str]
    phenotype_map: Mapping[str, str]
    inheritance_pattern: Optional[str] = None
    verification_status: Optional[str] = None
    category: Optional[str] = None
    gene_info: Optional[GeneInfo] = None
    allele_freq: Optional[Dict[str, float]] = Field(default_factory=dict)
    epistasis_hint: Optional[str] = None
    education_note: Optional[str] = None
    references: List[str] = Field(default_factory=list)
    visibility: TraitVisibility = TraitVisibility.PRIVATE
    tags: List[str] = Field(default_factory=list)
    test_case_seed: Optional[str] = None

    # Legacy fields for backward compatibility
    description: Optional[str] = None
    metadata: Mapping[str, str] = Field(default_factory=dict)

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
        return cleaned

    @field_validator("phenotype_map")
    @classmethod
    def validate_phenotype_map(
        cls, phenotype_map: Mapping[str, str], info
    ) -> Mapping[str, str]:
        """Validate that phenotype map covers all possible genotypes."""
        if "alleles" not in info.data:
            return phenotype_map  # Will be validated later when alleles are available

        alleles = info.data["alleles"]
        if not alleles:
            return phenotype_map

        # Generate all possible genotypes
        expected_genotypes = set()
        for i, allele1 in enumerate(alleles):
            for j, allele2 in enumerate(alleles):
                # Canonical genotype ordering (sorted)
                genotype = "".join(sorted([allele1, allele2]))
                expected_genotypes.add(genotype)

        # Check coverage
        provided_genotypes = set(phenotype_map.keys())
        missing = expected_genotypes - provided_genotypes
        if missing:
            raise ValueError(
                f"Phenotype map missing genotypes: {', '.join(sorted(missing))}"
            )

        return phenotype_map


class TraitUpdatePayload(BaseModel):
    """Payload for updating traits."""

    name: Optional[str] = None
    alleles: Optional[List[str]] = None
    phenotype_map: Optional[Mapping[str, str]] = None
    inheritance_pattern: Optional[str] = None
    verification_status: Optional[str] = None
    category: Optional[str] = None
    gene_info: Optional[GeneInfo] = None
    allele_freq: Optional[Dict[str, float]] = None
    epistasis_hint: Optional[str] = None
    education_note: Optional[str] = None
    references: Optional[List[str]] = None
    visibility: Optional[TraitVisibility] = None
    tags: Optional[List[str]] = None
    test_case_seed: Optional[str] = None

    # Legacy fields for backward compatibility
    description: Optional[str] = None
    metadata: Optional[Mapping[str, str]] = None

    @field_validator("alleles")
    @classmethod
    def validate_alleles(cls, alleles: Optional[List[str]]) -> Optional[List[str]]:
        if alleles is None:
            return alleles
        cleaned = [allele.strip() for allele in alleles if allele.strip()]
        if not cleaned:
            raise ValueError("At least one allele symbol must be provided.")
        return cleaned


class TraitFilters(BaseModel):
    """Query filters for trait listing."""

    inheritance_pattern: Optional[str] = None
    verification_status: Optional[str] = None
    category: Optional[str] = None
    gene: Optional[str] = None
    tags: Optional[List[str]] = None
    search: Optional[str] = None
    status: Optional[TraitStatus] = None
    visibility: Optional[TraitVisibility] = None
    # If true, only return traits owned by the authenticated user (no system/JSON traits).
    owned_only: Optional[bool] = None


# Legacy alias for backward compatibility
TraitMutationPayload = TraitCreatePayload


class TraitCreateResponse(BaseModel):
    """Response for trait creation."""

    trait: TraitInfo


class TraitUpdateResponse(BaseModel):
    """Response for trait updates."""

    trait: TraitInfo


# Legacy alias for backward compatibility
TraitMutationResponse = TraitCreateResponse
