"""Mendelian inheritance calculations for Zygotrix."""

from __future__ import annotations

from collections import Counter
from typing import Dict, Mapping

from .traits import Trait
from .utils import normalize_probabilities


class MendelianCalculator:
    """Compute genotype probabilities using Mendelian inheritance principles."""

    def calculate_offspring_probabilities(
        self, parent1: str, parent2: str, trait: Trait
    ) -> Dict[str, float]:
        """Return genotype probabilities for offspring given two parental genotypes."""

        gametes_parent1 = self._gamete_distribution(parent1, trait)
        gametes_parent2 = self._gamete_distribution(parent2, trait)

        genotype_probs: Dict[str, float] = {}
        for allele1, prob1 in gametes_parent1.items():
            for allele2, prob2 in gametes_parent2.items():
                genotype = trait.canonical_genotype(allele1 + allele2)
                genotype_probs[genotype] = (
                    genotype_probs.get(genotype, 0.0) + prob1 * prob2
                )
        return normalize_probabilities(genotype_probs)

    def calculate_joint_phenotype_probabilities(
        self,
        parent1_genotypes: Mapping[str, str],
        parent2_genotypes: Mapping[str, str],
        traits: Mapping[str, Trait],
    ) -> Dict[str, float]:
        """Calculate joint phenotype probabilities across multiple traits.

        This method implements Mendel's law of independent assortment by:
        1. Computing genotype probabilities for each trait independently
        2. Creating Cartesian product of all trait outcomes
        3. Multiplying probabilities (independent assortment)
        4. Aggregating by combined phenotype

        Args:
            parent1_genotypes: Mapping of trait keys to parent 1 genotypes
            parent2_genotypes: Mapping of trait keys to parent 2 genotypes
            traits: Mapping of trait keys to Trait objects

        Returns:
            Dictionary mapping combined phenotype strings to their probabilities

        Example:
            Input: Eye color (Bb × Bb), Hair texture (Cc × Cc)
            Output: {"Brown + Curly": 0.5625, "Brown + Straight": 0.1875, ...}
        """
        # Step 1: Calculate genotype probabilities for each trait
        trait_genotype_probs = {}
        for trait_key in traits:
            if trait_key in parent1_genotypes and trait_key in parent2_genotypes:
                trait_genotype_probs[trait_key] = (
                    self.calculate_offspring_probabilities(
                        parent1_genotypes[trait_key],
                        parent2_genotypes[trait_key],
                        traits[trait_key],
                    )
                )

        if not trait_genotype_probs:
            return {}

        # Step 2: Create Cartesian product of all trait outcomes
        # Convert genotypes to phenotypes for each trait
        trait_phenotype_probs = {}
        for trait_key, genotype_probs in trait_genotype_probs.items():
            trait = traits[trait_key]
            phenotype_probs = trait.phenotype_distribution(genotype_probs)
            trait_phenotype_probs[trait_key] = phenotype_probs

        # Step 3: Generate all combinations and multiply probabilities
        joint_phenotype_probs: Dict[str, float] = {}
        trait_keys = sorted(
            trait_phenotype_probs.keys()
        )  # Sort for consistent ordering

        def generate_combinations(
            index: int, current_phenotypes: list, current_prob: float
        ):
            if index == len(trait_keys):
                # We've chosen phenotypes for all traits
                combined_phenotype = " + ".join(current_phenotypes)
                joint_phenotype_probs[combined_phenotype] = (
                    joint_phenotype_probs.get(combined_phenotype, 0.0) + current_prob
                )
                return

            trait_key = trait_keys[index]
            for phenotype, prob in trait_phenotype_probs[trait_key].items():
                generate_combinations(
                    index + 1, current_phenotypes + [phenotype], current_prob * prob
                )

        generate_combinations(0, [], 1.0)

        # Step 4: Normalize probabilities to ensure they sum to 1.0
        return normalize_probabilities(joint_phenotype_probs)

    @staticmethod
    def _gamete_distribution(genotype: str, trait: Trait) -> Dict[str, float]:
        """Probabilities for each allele contributed by a parent genotype."""

        canonical = trait.canonical_genotype(genotype)
        allele_counts = Counter(canonical)
        total = sum(allele_counts.values())
        distribution = {
            allele: count / total for allele, count in allele_counts.items()
        }
        return normalize_probabilities(distribution)


__all__ = ["MendelianCalculator"]
