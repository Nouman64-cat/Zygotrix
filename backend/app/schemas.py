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


class TraitListResponse(BaseModel):
    """Response payload for the trait catalogue."""

    traits: List[TraitInfo]


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