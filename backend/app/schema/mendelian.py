from typing import Dict, List, Optional, Mapping
from pydantic import BaseModel, Field, field_validator


class MendelianSimulationRequest(BaseModel):
    parent1_genotypes: Dict[str, str] = Field(...)
    parent2_genotypes: Dict[str, str] = Field(...)
    trait_filter: Optional[List[str]] = Field(default=None)
    as_percentages: bool = Field(default=False)

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
    genotypic_ratios: Dict[str, float] = Field(...)
    phenotypic_ratios: Dict[str, float] = Field(...)


class MendelianSimulationResponse(BaseModel):
    results: Dict[str, TraitSimulationResult]
    missing_traits: List[str] = Field(default_factory=list)


class JointPhenotypeSimulationRequest(BaseModel):
    parent1_genotypes: Dict[str, str] = Field(...)
    parent2_genotypes: Dict[str, str] = Field(...)
    trait_filter: Optional[List[str]] = Field(default=None)
    as_percentages: bool = Field(default=False)

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
    results: Dict[str, float] = Field(...)
    missing_traits: List[str] = Field(default_factory=list)


class GenotypeRequest(BaseModel):
    trait_keys: List[str] = Field(...)

    @field_validator("trait_keys")
    @classmethod
    def validate_trait_count(cls, value: List[str]) -> List[str]:
        if len(value) > 5:
            raise ValueError("Maximum 5 traits allowed")
        return value


class GenotypeResponse(BaseModel):
    genotypes: Dict[str, List[str]] = Field(...)
    missing_traits: List[str] = Field(default_factory=list)
