"""
Simulator model - replaces zygotrix_engine.Simulator for backward compatibility.
Provides minimal implementation for utility functions.
"""
from typing import Dict, List
from .trait import Trait


class Simulator:
    """
    Simple Simulator class for trait-related utility functions.
    Replaces the zygotrix_engine.Simulator class that was removed.

    Note: Main simulations now use C++ engine. This is only for utility functions.
    """

    def __init__(self, trait_registry: Dict[str, Trait]):
        self.trait_registry = trait_registry

    def get_possible_genotypes_for_traits(
        self,
        trait_keys: List[str]
    ) -> Dict[str, List[str]]:
        """
        Get all possible genotypes for given traits.
        Used by utility functions.
        """
        result = {}
        for trait_key in trait_keys:
            trait = self.trait_registry.get(trait_key)
            if trait:
                result[trait_key] = trait.all_genotypes()
            else:
                result[trait_key] = []
        return result
