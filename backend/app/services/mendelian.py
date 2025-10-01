from typing import Mapping, Iterable, List, Dict, Tuple
from zygotrix_engine import Simulator
from .traits import filter_traits

# Mendelian simulation services


def simulate_mendelian_traits(
    parent1: Mapping[str, str],
    parent2: Mapping[str, str],
    trait_filter: Iterable[str] | None,
    as_percentages: bool,
    max_traits: int = 5,
) -> Tuple[Dict[str, Dict[str, Dict[str, float]]], List[str]]:
    registry, missing = filter_traits(trait_filter)
    trait_keys = set(parent1.keys()) & set(parent2.keys()) & set(registry.keys())
    if len(trait_keys) > max_traits:
        raise ValueError(f"Maximum {max_traits} traits allowed, got {len(trait_keys)}")
    simulator = Simulator(trait_registry=registry)
    parent1_filtered = {key: parent1[key] for key in parent1 if key in registry}
    parent2_filtered = {key: parent2[key] for key in parent2 if key in registry}
    results = simulator.simulate_mendelian_traits(
        parent1_filtered,
        parent2_filtered,
        as_percentages=as_percentages,
        max_traits=max_traits,
    )
    ordered_results: Dict[str, Dict[str, Dict[str, float]]] = {}
    for key in registry.keys() if not trait_filter else trait_filter:
        if key in results:
            ordered_results[key] = results[key]
    return ordered_results, missing


def simulate_joint_phenotypes(
    parent1: Mapping[str, str],
    parent2: Mapping[str, str],
    trait_filter: Iterable[str] | None,
    as_percentages: bool,
    max_traits: int = 5,
) -> Tuple[Dict[str, float], List[str]]:
    registry, missing = filter_traits(trait_filter)
    trait_keys = set(parent1.keys()) & set(parent2.keys()) & set(registry.keys())
    if len(trait_keys) > max_traits:
        raise ValueError(f"Maximum {max_traits} traits allowed, got {len(trait_keys)}")
    simulator = Simulator(trait_registry=registry)
    parent1_filtered = {key: parent1[key] for key in parent1 if key in registry}
    parent2_filtered = {key: parent2[key] for key in parent2 if key in registry}
    results = simulator.simulate_joint_phenotypes(
        parent1_filtered,
        parent2_filtered,
        as_percentages=as_percentages,
        max_traits=max_traits,
    )
    return results, missing


def get_possible_genotypes_for_traits(
    trait_keys: List[str],
    max_traits: int = 5,
) -> Tuple[Dict[str, List[str]], List[str]]:
    if len(trait_keys) > max_traits:
        raise ValueError(f"Maximum {max_traits} traits allowed, got {len(trait_keys)}")
    registry, missing = filter_traits(trait_keys)
    simulator = Simulator(trait_registry=registry)
    valid_trait_keys = [key for key in trait_keys if key in registry]
    try:
        genotypes = simulator.get_possible_genotypes_for_traits(valid_trait_keys)
        return genotypes, missing
    except ValueError as e:
        raise ValueError(str(e)) from e
