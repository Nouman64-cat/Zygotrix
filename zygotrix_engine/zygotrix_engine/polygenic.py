"""Polygenic risk score calculations."""

from __future__ import annotations

from typing import Dict, Mapping


class PolygenicCalculator:
    """Calculate polygenic risk scores (PRS) using additive SNP weights."""

    def calculate_polygenic_score(
        self,
        parent1_genotype: Mapping[str, float],
        parent2_genotype: Mapping[str, float],
        weights: Mapping[str, float],
    ) -> float:
        """Return the expected offspring polygenic score based on parental genotypes."""

        score = 0.0
        for snp, weight in weights.items():
            dosage1 = parent1_genotype.get(snp, 0.0)
            dosage2 = parent2_genotype.get(snp, 0.0)
            expected_offspring_dosage = (dosage1 + dosage2) / 2.0
            score += expected_offspring_dosage * weight
        return score


__all__ = ["PolygenicCalculator"]
