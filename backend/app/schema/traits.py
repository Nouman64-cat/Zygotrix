from typing import List, Optional, Mapping
from pydantic import BaseModel, Field, field_validator


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
