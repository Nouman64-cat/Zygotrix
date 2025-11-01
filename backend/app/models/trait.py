"""
Trait model - replaces zygotrix_engine.Trait for backward compatibility.
This is a minimal implementation to hold trait data from JSON files.
"""
from typing import Dict, List, Any, Optional


class Trait:
    """
    Simple Trait class for storing genetic trait information.
    Replaces the zygotrix_engine.Trait class that was removed.
    """

    def __init__(
        self,
        name: str,
        alleles: List[str],
        phenotype_map: Dict[str, str],
        description: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ):
        self.name = name
        self.alleles = alleles
        self.phenotype_map = phenotype_map
        self.description = description
        self.metadata = metadata or {}

    def __repr__(self) -> str:
        return f"Trait(name={self.name}, alleles={self.alleles})"
