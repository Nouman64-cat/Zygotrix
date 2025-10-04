from __future__ import annotations

from typing import Dict, List, Optional

from pydantic import BaseModel, Field, field_validator


class PreviewTrait(BaseModel):
    alleles: List[str] = Field(..., min_length=1)
    phenotype_map: Dict[str, str] = Field(default_factory=dict)
    inheritance_pattern: Optional[str] = Field(default=None)

    @field_validator("alleles", mode="before")
    @classmethod
    def _normalize_alleles(cls, value: List[str]) -> List[str]:
        if not isinstance(value, list):
            raise TypeError("Alleles must be provided as a list of strings")
        normalized: List[str] = []
        seen = set()
        for raw in value:
            allele = str(raw).strip()
            if not allele:
                raise ValueError("Allele symbols cannot be empty")
            if allele not in seen:
                normalized.append(allele)
                seen.add(allele)
        return normalized

    @field_validator("phenotype_map", mode="before")
    @classmethod
    def _sanitize_map(
        cls, value: Dict[str, str] | None
    ) -> Dict[str, str]:
        if value is None:
            return {}
        if not isinstance(value, dict):
            raise TypeError("phenotype_map must be a mapping of genotype to phenotype")
        cleaned: Dict[str, str] = {}
        for key, phenotype in value.items():
            genotype = str(key).replace(" ", "")
            if not genotype:
                raise ValueError("Genotype keys in phenotype_map cannot be empty")
            cleaned[genotype] = str(phenotype)
        return cleaned


class PreviewRequest(BaseModel):
    trait: PreviewTrait
    parent1: str = Field(..., min_length=1)
    parent2: str = Field(..., min_length=1)
    as_percentages: bool = Field(default=True)
    seed: Optional[int] = Field(default=None)

    @field_validator("parent1", "parent2", mode="before")
    @classmethod
    def _strip_parent_genotypes(cls, value: str) -> str:
        if isinstance(value, str):
            cleaned = value.replace(" ", "")
            if not cleaned:
                raise ValueError("Parent genotypes cannot be empty")
            return cleaned
        return str(value)


class GameteProbability(BaseModel):
    allele: str
    probability: float


class PunnettCell(BaseModel):
    genotype: str
    probability: float
    parent1_allele: str
    parent2_allele: str


class PreviewResponse(BaseModel):
    gametes: Dict[str, List[GameteProbability]] = Field(default_factory=dict)
    punnett: List[List[PunnettCell]] = Field(default_factory=list)
    genotype_dist: Dict[str, float] = Field(default_factory=dict)
    phenotype_dist: Dict[str, float] = Field(default_factory=dict)
    steps: List[str] = Field(default_factory=list)
    errors: List[str] = Field(default_factory=list)

