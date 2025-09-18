"""Pydantic schemas for the Zygotrix backend."""

from __future__ import annotations

from typing import Dict, List, Mapping, Optional

from pydantic import BaseModel, Field, field_validator


class TraitInfo(BaseModel):
    """Metadata surfaced for each registered trait."""

    key: str
    name: str
    description: Optional[str] = None
    alleles: List[str] = Field(default_factory=list)
    phenotype_map: Mapping[str, str] = Field(default_factory=dict)
    metadata: Mapping[str, str] = Field(default_factory=dict)


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