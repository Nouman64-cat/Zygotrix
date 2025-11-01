"""
Trait model - replaces zygotrix_engine.Trait for backward compatibility.
This is a minimal implementation to hold trait data from JSON files.
"""
from typing import Dict, List, Any, Optional, Tuple
import itertools


class Trait:
    """
    Simple Trait class for storing genetic trait information.
    Replaces the zygotrix_engine.Trait class that was removed.
    """

    def __init__(
        self,
        name: str,
        alleles: List[str] | Tuple[str, ...],
        phenotype_map: Dict[str, str],
        description: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ):
        self.name = name
        self.alleles = tuple(alleles) if isinstance(alleles, list) else alleles
        self.phenotype_map = phenotype_map
        self.description = description
        self.metadata = metadata or {}

    def canonical_genotype(self, genotype: str) -> str:
        """
        Convert a genotype to canonical form (sorted alleles).
        Example: "BA" -> "AB", "oA" -> "Ao"
        """
        # Split genotype into individual alleles (handles multi-char alleles like Rh+)
        alleles = self._parse_genotype(genotype)

        if len(alleles) != 2:
            raise ValueError(
                f"Genotype must have exactly 2 alleles, got: {genotype}")

        # Validate alleles exist in trait
        for allele in alleles:
            if allele not in self.alleles:
                raise ValueError(
                    f"Allele '{allele}' not in trait alleles: {self.alleles}")

        # Sort alphabetically for canonical form
        return "".join(sorted(alleles))

    def _parse_genotype(self, genotype: str) -> List[str]:
        """
        Parse genotype string into alleles.
        Handles both single-character (A, B) and multi-character (Rh+, Rh-) alleles.
        """
        # Try to match known alleles from the trait
        matched_alleles = []
        remaining = genotype

        # Sort alleles by length (longest first) to match multi-char alleles first
        sorted_alleles = sorted(self.alleles, key=len, reverse=True)

        while remaining:
            found = False
            for allele in sorted_alleles:
                if remaining.startswith(allele):
                    matched_alleles.append(allele)
                    remaining = remaining[len(allele):]
                    found = True
                    break
            if not found:
                # Fallback: treat as single character
                matched_alleles.append(remaining[0])
                remaining = remaining[1:]

        return matched_alleles

    def all_genotypes(self) -> List[str]:
        """
        Generate all possible genotypes from the trait's alleles.
        Returns canonical form (sorted).
        """
        genotypes = []
        for a1, a2 in itertools.combinations_with_replacement(self.alleles, 2):
            genotypes.append("".join(sorted([a1, a2])))
        return genotypes

    def __repr__(self) -> str:
        return f"Trait(name={self.name}, alleles={self.alleles})"
