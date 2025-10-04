from __future__ import annotations

from typing import Dict, List, Optional

from pydantic import BaseModel, Field, field_validator


class SNPWeight(BaseModel):
    rsid: str = Field(..., min_length=1)
    effect_allele: str = Field(..., min_length=1, max_length=2)
    weight: float

    @field_validator("effect_allele")
    @classmethod
    def normalize_effect(cls, value: str) -> str:
        return value.upper()


class PGSDemoRequest(BaseModel):
    weights: List[SNPWeight] = Field(..., min_length=1, max_length=500)
    genotype_calls: Dict[str, float] = Field(
        default_factory=dict,
        description="Dosage per rsID (0-2)",
    )
    reference_mean: Optional[float] = Field(None)
    reference_sd: Optional[float] = Field(None, gt=0.0)


class PGSDemoResponse(BaseModel):
    raw_score: float
    z_score: float
    percentile: float
    used_snps: List[str] = Field(default_factory=list)
    missing_snps: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)

