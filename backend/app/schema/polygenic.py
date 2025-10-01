from typing import Mapping
from pydantic import BaseModel


class PolygenicScoreRequest(BaseModel):
    parent1_genotype: Mapping[str, float]
    parent2_genotype: Mapping[str, float]
    weights: Mapping[str, float]


class PolygenicScoreResponse(BaseModel):
    expected_score: float
