from __future__ import annotations

from typing import Dict, List, Optional

from pydantic import BaseModel, Field


class NormalizedCall(BaseModel):
    rsid: str = Field(..., description="Variant identifier (rsID or locus)")
    genotype: Optional[str] = Field(
        None, description="Canonical genotype e.g., 0/1 or A/G"
    )
    reference: Optional[str] = Field(None, description="Reference allele")
    alternate: Optional[str] = Field(None, description="Alternate allele")
    dosage: Optional[float] = Field(None, description="Number of alternate alleles (0-2)")


class MappedTraitResult(BaseModel):
    trait_key: Optional[str] = Field(None, description="Trait identifier")
    genotype: Optional[str] = Field(None, description="Inferred genotype for the trait")
    confidence: Optional[float] = Field(None, description="Confidence score 0-1")
    sources: List[str] = Field(default_factory=list, description="Variant markers used")
    notes: Optional[str] = Field(None, description="Additional interpretation notes")


class VCFParseResponse(BaseModel):
    normalized_calls: List[NormalizedCall] = Field(default_factory=list)
    mapped_traits: Dict[str, MappedTraitResult] = Field(default_factory=dict)
    unmapped_variants: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)
    persisted_path: Optional[str] = Field(
        default=None,
        description="Filesystem path if the upload was persisted for the session",
    )
