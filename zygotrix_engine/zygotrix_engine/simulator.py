"""Simulation orchestrator combining Mendelian and polygenic logic."""

from __future__ import annotations

from typing import Dict, Mapping

from .mendelian import MendelianCalculator
from .polygenic import PolygenicCalculator
from .traits import BLOOD_TYPE, EYE_COLOR, HAIR_COLOR, Trait
from .utils import normalize_probabilities, to_percentage_distribution


class Simulator:
    """Coordinate Mendelian and polygenic computations for multiple traits."""

    def __init__(
        self,
        trait_registry: Mapping[str, Trait] | None = None,
        mendelian_calculator: MendelianCalculator | None = None,
        polygenic_calculator: PolygenicCalculator | None = None,
    ) -> None:
        self.trait_registry: Dict[str, Trait] = dict(
            trait_registry
            or {
                "eye_color": EYE_COLOR,
                "blood_type": BLOOD_TYPE,
                "hair_color": HAIR_COLOR,
            }
        )
        self.mendelian = mendelian_calculator or MendelianCalculator()
        self.polygenic = polygenic_calculator or PolygenicCalculator()

    def simulate_mendelian_traits(
        self,
        parent1_genotypes: Mapping[str, str],
        parent2_genotypes: Mapping[str, str],
        as_percentages: bool = False,
    ) -> Dict[str, Dict[str, float]]:
        """Generate phenotype probability distributions for Mendelian traits."""

        results: Dict[str, Dict[str, float]] = {}
        for trait_key, trait in self.trait_registry.items():
            if trait_key not in parent1_genotypes or trait_key not in parent2_genotypes:
                continue
            genotype_distribution = self.mendelian.calculate_offspring_probabilities(
                parent1_genotypes[trait_key],
                parent2_genotypes[trait_key],
                trait,
            )
            phenotype_distribution = trait.phenotype_distribution(genotype_distribution)
            phenotype_distribution = (
                to_percentage_distribution(phenotype_distribution)
                if as_percentages
                else normalize_probabilities(phenotype_distribution)
            )
            results[trait_key] = phenotype_distribution
        return results

    def simulate_polygenic_trait(
        self,
        parent1_genotype: Mapping[str, float],
        parent2_genotype: Mapping[str, float],
        weights: Mapping[str, float],
    ) -> float:
        """Return the expected polygenic score for an offspring."""

        return self.polygenic.calculate_polygenic_score(
            parent1_genotype, parent2_genotype, weights
        )


__all__ = ["Simulator"]
