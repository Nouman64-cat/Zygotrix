from __future__ import annotations

import logging
from typing import (
    Dict,
    Optional,
    List,
    Tuple,
    Iterable,
)
from functools import lru_cache

from zygotrix_engine import Trait, Simulator, PolygenicCalculator
from ..schema.traits import (
    TraitInfo,
    TraitFilters,
)

from ..services.trait_loader import TraitLoader

logger = logging.getLogger(__name__)


class TraitService:

    def __init__(
        self,
        loader: TraitLoader,
    ):
        self.loader = loader

    def get_traits(
        self, filters: TraitFilters, owner_id: Optional[str] = None
    ) -> List[TraitInfo]:
        return self.loader.get_json_traits(filters)

    def get_trait_by_key(
        self, key: str, owner_id: Optional[str] = None
    ) -> Optional[TraitInfo]:
        return self.loader.get_json_trait_by_key(key)

    def get_trait_registry(self) -> Dict[str, Trait]:
        return self.loader.get_json_engine_traits()

    def filter_engine_traits(
        self, trait_filter: Iterable[str] | None
    ) -> Tuple[Dict[str, Trait], List[str]]:
        registry = self.get_trait_registry()
        if trait_filter is None:
            return registry, []

        trait_keys = set(trait_filter)
        available_keys = set(registry.keys())
        missing = list(trait_keys - available_keys)

        filtered_registry = {
            key: registry[key] for key in trait_keys if key in available_keys
        }
        return filtered_registry, missing

    @lru_cache(maxsize=1)
    def get_simulator(self) -> Simulator:
        return Simulator(trait_registry=self.get_trait_registry())

    @lru_cache(maxsize=1)
    def get_polygenic_calculator(self) -> PolygenicCalculator:
        return PolygenicCalculator()
