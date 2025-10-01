from typing import Mapping
from zygotrix_engine import PolygenicCalculator
from fastapi import HTTPException
from functools import lru_cache


@lru_cache(maxsize=1)
def get_polygenic_calculator() -> PolygenicCalculator:
    return PolygenicCalculator()


def calculate_polygenic_score(
    parent1_genotype: Mapping[str, float],
    parent2_genotype: Mapping[str, float],
    weights: Mapping[str, float],
) -> float:
    if not weights:
        raise HTTPException(status_code=400, detail="Weights mapping cannot be empty.")
    calculator = get_polygenic_calculator()
    return calculator.calculate_polygenic_score(
        parent1_genotype, parent2_genotype, weights
    )
