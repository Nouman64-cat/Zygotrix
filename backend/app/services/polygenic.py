from typing import Mapping
from app.models import PolygenicCalculator
from fastapi import HTTPException
from functools import lru_cache


from .service_factory import get_service_factory

_trait_service = get_service_factory().get_trait_service()


def get_polygenic_calculator():
    return _trait_service.get_polygenic_calculator()


@lru_cache(maxsize=1)
def get_polygenic_calculator() -> PolygenicCalculator:
    return PolygenicCalculator()


def calculate_polygenic_score(
    parent1_genotype: Mapping[str, float],
    parent2_genotype: Mapping[str, float],
    weights: Mapping[str, float],
) -> float:
    if not weights:
        raise HTTPException(
            status_code=400, detail="Weights mapping cannot be empty.")
    calculator = get_polygenic_calculator()
    return calculator.calculate_polygenic_score(
        parent1_genotype, parent2_genotype, weights
    )
