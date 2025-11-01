"""
MendelianCalculator - replaces zygotrix_engine.mendelian.MendelianCalculator
Provides Punnett square calculations for preview feature.
"""
from typing import Dict, List, Tuple
import itertools
from .trait import Trait


class MendelianCalculator:
    """
    Calculator for Mendelian genetics using Punnett squares.
    Used only for preview_mendelian() feature.

    Note: Main simulations use C++ engine for performance.
    """

    def calculate_cross(
        self,
        trait: Trait,
        parent1_genotype: str,
        parent2_genotype: str,
        as_percentages: bool = False
    ) -> Dict[str, object]:
        """
        Calculate Punnett square for a single-trait cross.
        Returns genotypic and phenotypic distributions with steps.
        """
        # Parse genotypes
        p1_alleles = self._parse_genotype(parent1_genotype, trait)
        p2_alleles = self._parse_genotype(parent2_genotype, trait)

        # Generate gametes (each parent contributes one allele)
        p1_gametes = list(p1_alleles)
        p2_gametes = list(p2_alleles)

        # Punnett square: all combinations
        offspring_genotypes: List[str] = []
        steps = []

        for g1 in p1_gametes:
            for g2 in p2_gametes:
                # Canonical form (sorted)
                genotype = "".join(sorted([g1, g2]))
                offspring_genotypes.append(genotype)
                steps.append({
                    "parent1_gamete": g1,
                    "parent2_gamete": g2,
                    "offspring_genotype": genotype,
                })

        # Count genotypes
        genotypic_counts: Dict[str, int] = {}
        for genotype in offspring_genotypes:
            genotypic_counts[genotype] = genotypic_counts.get(genotype, 0) + 1

        total = len(offspring_genotypes)

        # Convert to ratios/percentages
        genotypic_ratios = {}
        for genotype, count in genotypic_counts.items():
            value = (count / total) * 100 if as_percentages else count / total
            genotypic_ratios[genotype] = value

        # Map genotypes to phenotypes
        phenotypic_counts: Dict[str, int] = {}
        for genotype in offspring_genotypes:
            phenotype = trait.phenotype_map.get(
                genotype, f"Unknown ({genotype})")
            phenotypic_counts[phenotype] = phenotypic_counts.get(
                phenotype, 0) + 1

        phenotypic_ratios = {}
        for phenotype, count in phenotypic_counts.items():
            value = (count / total) * 100 if as_percentages else count / total
            phenotypic_ratios[phenotype] = value

        return {
            "genotypic_ratios": genotypic_ratios,
            "phenotypic_ratios": phenotypic_ratios,
            "punnett_square_steps": steps,
            "parent1_genotype": parent1_genotype,
            "parent2_genotype": parent2_genotype,
        }

    def _parse_genotype(self, genotype: str, trait: Trait) -> List[str]:
        """Parse genotype into alleles using trait's allele list."""
        return trait._parse_genotype(genotype)
