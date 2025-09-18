"""Domain services wrapping zygotrix_engine for API consumption."""

from __future__ import annotations

from functools import lru_cache
from typing import Dict, Iterable, List, Mapping, Tuple

from fastapi import HTTPException

from zygotrix_engine import (
    BLOOD_TYPE,
    EYE_COLOR,
    HAIR_COLOR,
    PolygenicCalculator,
    Simulator,
    Trait,
)


@lru_cache(maxsize=1)
def get_trait_registry() -> Dict[str, Trait]:
    """Return the default trait registry shipped with the engine."""

    return {
        "eye_color": EYE_COLOR,
        "blood_type": BLOOD_TYPE,
        "hair_color": HAIR_COLOR,
    }


@lru_cache(maxsize=1)
def get_simulator() -> Simulator:
    """Instantiate a simulator with the default registry."""

    return Simulator(trait_registry=get_trait_registry())


@lru_cache(maxsize=1)
def get_polygenic_calculator() -> PolygenicCalculator:
    """Return a singleton polygenic calculator."""

    return PolygenicCalculator()


def filter_traits(requested: Iterable[str] | None) -> Tuple[Dict[str, Trait], List[str]]:
    """Return the traits subset if a filter is provided and track missing keys."""

    registry = get_trait_registry()
    if not requested:
        return registry, []

    subset: Dict[str, Trait] = {}
    missing: List[str] = []
    for key in requested:
        if key in registry:
            subset[key] = registry[key]
        else:
            missing.append(key)
    if not subset:
        raise HTTPException(status_code=404, detail="None of the requested traits are available.")
    return subset, missing


def simulate_mendelian_traits(
    parent1: Mapping[str, str],
    parent2: Mapping[str, str],
    trait_filter: Iterable[str] | None,
    as_percentages: bool,
) -> Tuple[Dict[str, Dict[str, float]], List[str]]:
    """Run Mendelian simulations and optionally filter trait outputs."""

    simulator = get_simulator()
    registry, missing = filter_traits(trait_filter)

    parent1_filtered = {key: parent1[key] for key in parent1 if key in registry}
    parent2_filtered = {key: parent2[key] for key in parent2 if key in registry}

    results = simulator.simulate_mendelian_traits(
        parent1_filtered,
        parent2_filtered,
        as_percentages=as_percentages,
    )
    # Ensure trait order reflect filter when provided
    ordered_results: Dict[str, Dict[str, float]] = {}
    for key in (registry.keys() if not trait_filter else trait_filter):
        if key in results:
            ordered_results[key] = results[key]

    return ordered_results, missing


def calculate_polygenic_score(
    parent1_genotype: Mapping[str, float],
    parent2_genotype: Mapping[str, float],
    weights: Mapping[str, float],
) -> float:
    """Forward the computation to the polygenic calculator with validation."""

    if not weights:
        raise HTTPException(status_code=400, detail="Weights mapping cannot be empty.")
    calculator = get_polygenic_calculator()
    return calculator.calculate_polygenic_score(parent1_genotype, parent2_genotype, weights)
