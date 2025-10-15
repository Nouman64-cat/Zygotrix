from __future__ import annotations

from enum import Enum
from typing import Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field, validator


class ChromosomeType(str, Enum):
    autosomal = "autosomal"
    x = "x"
    y = "y"


class DominancePattern(str, Enum):
    complete = "complete"
    codominant = "codominant"
    incomplete = "incomplete"


class EpistasisRequirement(str, Enum):
    present = "present"
    homozygous = "homozygous"
    heterozygous = "heterozygous"
    hemizygous = "hemizygous"


class EpistasisAction(str, Enum):
    mask = "mask"
    modify = "modify"


class AlleleEffect(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    trait_id: str = Field(..., alias="trait_id")
    magnitude: float
    description: Optional[str] = None


class AlleleDefinition(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    id: str
    dominance_rank: int = Field(0, alias="dominance_rank")
    effects: List[AlleleEffect] = Field(default_factory=list)


class GeneDefinition(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    id: str
    chromosome: ChromosomeType
    dominance: DominancePattern
    default_allele_id: str = Field(..., alias="defaultAlleleId")
    alleles: List[AlleleDefinition]
    linkage_group: Optional[int] = Field(None, alias="linkageGroup")
    recombination_probability: Optional[float] = Field(0.5, alias="recombinationProbability")
    incomplete_blend_weight: Optional[float] = Field(0.5, alias="incompleteBlendWeight")

    @validator("alleles")
    def validate_alleles(cls, value: List[AlleleDefinition]) -> List[AlleleDefinition]:
        if not value:
            raise ValueError("At least one allele definition is required")
        return value


class EpistasisRule(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    regulator_gene: str = Field(..., alias="regulatorGene")
    triggering_allele: str = Field(..., alias="triggeringAllele")
    requirement: EpistasisRequirement = EpistasisRequirement.present
    action: EpistasisAction = EpistasisAction.mask
    target_trait: str = Field(..., alias="targetTrait")
    modifier: float = 1.0
    override_description: Optional[str] = Field(None, alias="overrideDescription")
    override_value: Optional[float] = Field(None, alias="overrideValue")

    def dict(self, *args, **kwargs):  # type: ignore[override]
        data = super().dict(*args, **kwargs)
        # Normalize action names to align with C++ parser expectations.
        if data.get("action") == EpistasisAction.mask:
            data["action"] = "mask"
        elif data.get("action") == EpistasisAction.modify:
            data["action"] = "modify"
        return data


class ParentGenotype(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    sex: Optional[str] = Field(None, pattern="^(male|female)$", description="Sex of the parent")
    genotype: Dict[str, List[str]]


class GeneticCrossRequest(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        json_schema_extra={
            "example": {
                "genes": [
                    {
                        "id": "fur_color",
                        "chromosome": "autosomal",
                        "dominance": "complete",
                        "default_allele_id": "B",
                        "alleles": [
                            {
                                "id": "B",
                                "dominance_rank": 2,
                                "effects": [
                                    {
                                        "trait_id": "coat_color",
                                        "magnitude": 1.0,
                                        "description": "black pigment",
                                    }
                                ],
                            },
                            {
                                "id": "b",
                                "dominance_rank": 1,
                                "effects": [
                                    {
                                        "trait_id": "coat_color",
                                        "magnitude": 0.6,
                                        "description": "brown pigment",
                                    }
                                ],
                            },
                        ],
                    }
                ],
                "mother": {"sex": "female", "genotype": {"fur_color": ["B", "b"]}},
                "father": {"sex": "male", "genotype": {"fur_color": ["b", "b"]}},
                "simulations": 2500,
            }
        },
    )
    genes: List[GeneDefinition]
    epistasis: List[EpistasisRule] = Field(default_factory=list)
    mother: ParentGenotype
    father: ParentGenotype
    simulations: Optional[int] = Field(500, ge=1, le=50000)


class TraitSummary(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    mean_quantitative: float = Field(..., alias="mean_quantitative")
    descriptor_counts: Dict[str, int] = Field(..., alias="descriptor_counts")


class GeneticCrossResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    simulations: int
    sex_counts: Dict[str, int] = Field(..., alias="sex_counts")
    trait_summaries: Dict[str, TraitSummary] = Field(..., alias="trait_summaries")
