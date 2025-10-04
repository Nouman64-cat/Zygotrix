from __future__ import annotations

from typing import Dict, List, Optional

from pydantic import BaseModel, Field, field_validator


class CohortRequestTrait(BaseModel):
    trait_keys: List[str] = Field(..., min_items=1, max_items=10)


class PopulationSimRequest(BaseModel):
    population: str = Field(..., description="Population code (e.g., AFR, EUR)")
    trait_keys: List[str] = Field(..., min_items=1, max_items=10)
    n: int = Field(..., ge=100, le=200000, description="Number of virtual individuals")
    seed: Optional[int] = Field(None, description="Optional RNG seed for reproducibility")

    @field_validator("population")
    @classmethod
    def normalize_population(cls, value: str) -> str:
        return value.strip().upper()


class PhenotypeConfidenceInterval(BaseModel):
    lower: float = Field(..., ge=0.0)
    upper: float = Field(..., ge=0.0)


class PopulationTraitResult(BaseModel):
    trait_key: str
    population: str
    sample_size: int
    allele_frequencies: Dict[str, float] = Field(default_factory=dict)
    genotype_counts: Dict[str, int] = Field(default_factory=dict)
    phenotype_counts: Dict[str, int] = Field(default_factory=dict)
    phenotype_ci: Dict[str, PhenotypeConfidenceInterval] = Field(default_factory=dict)
    warnings: List[str] = Field(default_factory=list)


class PopulationSimResponse(BaseModel):
    results: List[PopulationTraitResult] = Field(default_factory=list)
    missing_traits: List[str] = Field(default_factory=list)

