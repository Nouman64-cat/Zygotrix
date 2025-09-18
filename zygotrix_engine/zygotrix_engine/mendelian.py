"""Mendelian inheritance calculations for Zygotrix."""

from __future__ import annotations

from collections import Counter
from typing import Dict

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
                genotype_probs[genotype] = genotype_probs.get(genotype, 0.0) + prob1 * prob2
        return normalize_probabilities(genotype_probs)

    @staticmethod
    def _gamete_distribution(genotype: str, trait: Trait) -> Dict[str, float]:
        """Probabilities for each allele contributed by a parent genotype."""

        canonical = trait.canonical_genotype(genotype)
        allele_counts = Counter(canonical)
        total = sum(allele_counts.values())
        distribution = {allele: count / total for allele, count in allele_counts.items()}
        return normalize_probabilities(distribution)


__all__ = ["MendelianCalculator"]
