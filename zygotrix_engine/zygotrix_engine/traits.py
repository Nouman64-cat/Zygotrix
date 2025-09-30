"""Trait definitions and utilities for the Zygotrix genetics engine."""

from __future__ import annotations

from dataclasses import dataclass, field
from itertools import combinations_with_replacement
from typing import Dict, Iterable, Mapping

from .utils import normalize_probabilities


@dataclass(frozen=True)
class Trait:
    """Represents a genetic trait with allele definitions and phenotype logic."""

    name: str
    alleles: tuple[str, ...]
    phenotype_map: Mapping[str, str]
    description: str = ""
    metadata: Mapping[str, str] = field(default_factory=dict)

    def canonical_genotype(self, genotype: str) -> str:
        """Return a canonical representation of a genotype for the trait, supporting multi-character alleles."""

        cleaned = genotype.replace(" ", "")
        # Try to split cleaned into two alleles from self.alleles
        found = None
        for i in range(1, len(cleaned)):
            allele1 = cleaned[:i]
            allele2 = cleaned[i:]
            if allele1 in self.alleles and allele2 in self.alleles:
                found = (allele1, allele2)
                break
        if not found:
            raise ValueError(
                f"Trait '{self.name}' expects a diploid genotype composed of two valid alleles (got '{genotype}'). Allowed: {self.alleles}."
            )
        alleles = list(found)
        order = {symbol: index for index, symbol in enumerate(self.alleles)}
        alleles.sort(key=lambda value: order[value])
        return "".join(alleles)

    def phenotype_for(self, genotype: str) -> str:
        """Map a genotype to its resulting phenotype."""

        canonical = self.canonical_genotype(genotype)
        if canonical in self.phenotype_map:
            return self.phenotype_map[canonical]
        return canonical

    def all_genotypes(self) -> Iterable[str]:
        """Enumerate all possible diploid genotypes for the defined alleles."""

        order = {symbol: index for index, symbol in enumerate(self.alleles)}
        for allele_a, allele_b in combinations_with_replacement(self.alleles, 2):
            genotype = sorted((allele_a, allele_b), key=lambda value: order[value])
            yield "".join(genotype)

    def phenotype_distribution(
        self, genotype_probabilities: Mapping[str, float]
    ) -> Dict[str, float]:
        """Aggregate genotype probabilities into phenotype probabilities."""

        phenotype_probs: Dict[str, float] = {}
        for genotype, probability in genotype_probabilities.items():
            phenotype = self.phenotype_for(genotype)
            phenotype_probs[phenotype] = (
                phenotype_probs.get(phenotype, 0.0) + probability
            )
        return normalize_probabilities(phenotype_probs)


EYE_COLOR = Trait(
    name="Eye Color",
    alleles=("B", "G", "b"),
    phenotype_map={
        "BB": "Brown",
        "BG": "Brown",
        "Bb": "Brown",
        "GG": "Green",
        "Gb": "Green",
        "bb": "Blue",
    },
    description="Simplified eye color model with Brown dominant, Green intermediate, and Blue recessive.",
)

BLOOD_TYPE = Trait(
    name="Blood Type",
    alleles=("A", "B", "O"),
    phenotype_map={
        "AA": "A",
        "AO": "A",
        "BB": "B",
        "BO": "B",
        "AB": "AB",
        "OO": "O",
    },
    description="ABO blood group system with codominant A/B alleles and recessive O.",
)

HAIR_COLOR = Trait(
    name="Hair Color",
    alleles=("H", "h"),
    phenotype_map={
        "HH": "Brown",
        "Hh": "Brown",
        "hh": "Blonde",
    },
    description="Simplified hair color model with Brown dominant over Blonde.",
)

__all__ = ["Trait", "EYE_COLOR", "BLOOD_TYPE", "HAIR_COLOR"]
