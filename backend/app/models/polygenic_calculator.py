"""
PolygenicCalculator - replaces zygotrix_engine.PolygenicCalculator
Provides polygenic risk score calculations.
"""
from typing import Dict


class PolygenicCalculator:
    """
    Calculator for polygenic trait predictions.
    Calculates weighted genetic risk scores.
    """

    def calculate_polygenic_score(
        self,
        parent1_genotype: Dict[str, float],
        parent2_genotype: Dict[str, float],
        weights: Dict[str, float],
    ) -> float:
        """
        Calculate combined polygenic risk score from two parents.

        Args:
            parent1_genotype: SNP -> allele count mapping for parent 1
            parent2_genotype: SNP -> allele count mapping for parent 2
            weights: SNP -> weight mapping (effect sizes)

        Returns:
            Combined polygenic score
        """
        # Average the parents' scores
        score1 = sum(parent1_genotype.get(snp, 0) * weight
                     for snp, weight in weights.items())
        score2 = sum(parent2_genotype.get(snp, 0) * weight
                     for snp, weight in weights.items())

        return (score1 + score2) / 2.0
