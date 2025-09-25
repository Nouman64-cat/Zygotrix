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
        max_traits: int = 5,
    ) -> Dict[str, Dict[str, Dict[str, float]]]:
        """Generate genotypic and phenotypic probability distributions for Mendelian traits.

        Args:
            parent1_genotypes: Mapping of trait keys to genotypes for parent 1
            parent2_genotypes: Mapping of trait keys to genotypes for parent 2
            as_percentages: Whether to return results as percentages
            max_traits: Maximum number of traits allowed (default: 5)

        Returns:
            Dictionary mapping trait keys to both genotypic and phenotypic probability distributions
            Format: {trait_key: {"genotypic_ratios": {...}, "phenotypic_ratios": {...}}}

        Raises:
            ValueError: If more than max_traits are provided
        """

        # Validate trait count
        trait_keys = set(parent1_genotypes.keys()) & set(parent2_genotypes.keys())
        if len(trait_keys) > max_traits:
            raise ValueError(
                f"Maximum {max_traits} traits allowed, got {len(trait_keys)}"
            )

        results: Dict[str, Dict[str, Dict[str, float]]] = {}
        for trait_key in trait_keys:
            if trait_key not in self.trait_registry:
                continue
            trait = self.trait_registry[trait_key]
            genotype_distribution = self.mendelian.calculate_offspring_probabilities(
                parent1_genotypes[trait_key],
                parent2_genotypes[trait_key],
                trait,
            )
            
            # Calculate both genotypic and phenotypic distributions
            genotype_probs = (
                to_percentage_distribution(genotype_distribution)
                if as_percentages
                else normalize_probabilities(genotype_distribution)
            )
            
            phenotype_distribution = trait.phenotype_distribution(genotype_distribution)
            phenotype_probs = (
                to_percentage_distribution(phenotype_distribution)
                if as_percentages
                else normalize_probabilities(phenotype_distribution)
            )
            
            # Return both genotypic and phenotypic ratios
            results[trait_key] = {
                "genotypic_ratios": genotype_probs,
                "phenotypic_ratios": phenotype_probs
            }
        return results

    def simulate_joint_phenotypes(
        self,
        parent1_genotypes: Mapping[str, str],
        parent2_genotypes: Mapping[str, str],
        as_percentages: bool = False,
        max_traits: int = 5,
    ) -> Dict[str, float]:
        """Generate joint phenotype probability distributions for multiple Mendelian traits.

        This method calculates combined phenotype probabilities across multiple traits
        using Mendel's law of independent assortment. Instead of returning separate
        distributions for each trait, it returns a single distribution of combined
        phenotypes (e.g., "Brown + Curly", "Blue + Straight").

        Args:
            parent1_genotypes: Mapping of trait keys to genotypes for parent 1
            parent2_genotypes: Mapping of trait keys to genotypes for parent 2
            as_percentages: Whether to return results as percentages
            max_traits: Maximum number of traits allowed (default: 5)

        Returns:
            Dictionary mapping combined phenotype strings to their probabilities

        Raises:
            ValueError: If more than max_traits are provided

        Example:
            Input: {"eye_color": "Bb", "hair_texture": "Cc"} × {"eye_color": "Bb", "hair_texture": "Cc"}
            Output: {"Brown + Curly": 56.25, "Brown + Straight": 18.75, "Blue + Curly": 18.75, "Blue + Straight": 6.25}
        """
        # Validate trait count
        trait_keys = set(parent1_genotypes.keys()) & set(parent2_genotypes.keys())
        if len(trait_keys) > max_traits:
            raise ValueError(
                f"Maximum {max_traits} traits allowed, got {len(trait_keys)}"
            )

        # Filter to only include traits that exist in registry
        valid_trait_keys = {key for key in trait_keys if key in self.trait_registry}
        if not valid_trait_keys:
            return {}

        # Build traits mapping for the calculation
        traits_mapping = {key: self.trait_registry[key] for key in valid_trait_keys}

        # Filter parent genotypes to only include valid traits
        parent1_filtered = {key: parent1_genotypes[key] for key in valid_trait_keys}
        parent2_filtered = {key: parent2_genotypes[key] for key in valid_trait_keys}

        # Calculate joint phenotype probabilities
        joint_probs = self.mendelian.calculate_joint_phenotype_probabilities(
            parent1_filtered, parent2_filtered, traits_mapping
        )

        # Convert to percentages if requested
        if as_percentages:
            joint_probs = to_percentage_distribution(joint_probs)
        else:
            joint_probs = normalize_probabilities(joint_probs)

        return joint_probs

    def get_possible_genotypes_for_traits(
        self, trait_keys: list[str]
    ) -> Dict[str, list[str]]:
        """Get all possible genotypes for given trait keys.

        Args:
            trait_keys: List of trait keys to get genotypes for

        Returns:
            Dictionary mapping trait keys to lists of possible genotypes

        Raises:
            ValueError: If more than 5 traits are provided or trait not found
        """
        if len(trait_keys) > 5:
            raise ValueError(f"Maximum 5 traits allowed, got {len(trait_keys)}")

        result = {}
        for trait_key in trait_keys:
            if trait_key not in self.trait_registry:
                raise ValueError(f"Trait '{trait_key}' not found in registry")

            trait = self.trait_registry[trait_key]
            # Generate all possible genotypes from alleles
            alleles = trait.alleles
            genotypes = []

            # Generate all combinations (including homozygous and heterozygous)
            for i, allele1 in enumerate(alleles):
                for j, allele2 in enumerate(alleles[i:], start=i):
                    genotype = trait.canonical_genotype(allele1 + allele2)
                    if genotype not in genotypes:
                        genotypes.append(genotype)

            result[trait_key] = sorted(genotypes)

        return result

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
