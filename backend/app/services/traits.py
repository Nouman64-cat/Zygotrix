from __future__ import annotations

import logging
from typing import (
    Any,
    Dict,
    Optional,
    List,
    Tuple,
    Iterable,
)
from fastapi import HTTPException
from functools import lru_cache

from zygotrix_engine import Trait, Simulator, PolygenicCalculator
from ..config import get_settings
from ..schema.traits import (
    TraitInfo,
    TraitCreatePayload,
    TraitUpdatePayload,
    TraitFilters,
)

from ..repositories.trait_repository import TraitRepository
from ..services.trait_loader import TraitLoader
from ..validators import trait_validator
from ..serializers import trait_serializer

logger = logging.getLogger(__name__)


class TraitService:

    def __init__(
        self,
        repository: TraitRepository,
        loader: TraitLoader,
    ):
        self.repo = repository
        self.loader = loader
        self.settings = get_settings()

    def get_traits(
        self, filters: TraitFilters, owner_id: Optional[str] = None
    ) -> List[TraitInfo]:

        all_traits: List[TraitInfo] = []

        if self.settings.traits_json_only:
            logger.info("📂 TraitService: Using JSON-only mode")
            return self.loader.get_json_traits(filters)

        if not filters.owned_only:
            all_traits.extend(self.loader.get_json_traits(filters))
        elif not owner_id:
            return []

        try:
            db_docs = self.repo.find_many(filters, owner_id)
            for doc in db_docs:
                try:
                    all_traits.append(
                        trait_serializer.serialize_mongo_doc_to_trait_info(doc)
                    )
                except Exception as e:
                    logger.warning(
                        f"Failed to serialize trait doc {doc.get('key')}: {e}"
                    )

        except Exception as e:
            logger.error(f"Error accessing database in get_traits: {e}")

        return all_traits

    def get_trait_by_key(
        self, key: str, owner_id: Optional[str] = None
    ) -> Optional[TraitInfo]:

        if self.settings.traits_json_only:
            return self.loader.get_json_trait_by_key(key)

        try:
            doc = self.repo.find_one_by_key(key, owner_id)
            if doc:
                return trait_serializer.serialize_mongo_doc_to_trait_info(doc)
        except Exception as e:
            logger.error(f"Error finding trait by key in DB: {e}")

        json_trait = self.loader.get_json_trait_by_key(key)
        if json_trait:
            return json_trait

        return None

    def get_trait_by_id(
        self, trait_id: str, owner_id: Optional[str]
    ) -> Optional[TraitInfo]:

        if self.settings.traits_json_only or not owner_id:
            return None

        try:
            doc = self.repo.find_one_by_id(trait_id, owner_id)
            return (
                trait_serializer.serialize_mongo_doc_to_trait_info(doc) if doc else None
            )
        except Exception as e:
            logger.error(f"Error finding trait by ID in DB: {e}")
            return None

    def create_trait(
        self, payload: TraitCreatePayload, owner_id: str, created_by: str
    ) -> TraitInfo:

        if self.settings.traits_json_only:
            raise HTTPException(
                status_code=405, detail="Trait creation disabled in JSON-only mode"
            )

        validation_rules = trait_validator.validate_trait_data(payload)
        if not validation_rules.passed:
            raise HTTPException(
                status_code=400,
                detail=f"Validation failed: {'; '.join(validation_rules.errors)}",
            )

        document = trait_serializer.build_document_for_create(
            payload, owner_id, created_by, validation_rules
        )

        created_doc = self.repo.create(document)

        return trait_serializer.serialize_mongo_doc_to_trait_info(created_doc)

    def update_trait(
        self, key: str, payload: TraitUpdatePayload, owner_id: str, updated_by: str
    ) -> TraitInfo:

        if self.settings.traits_json_only:
            raise HTTPException(
                status_code=405, detail="Trait updates disabled in JSON-only mode"
            )

        existing_doc = self.repo.find_one_by_key(key, owner_id)
        if not existing_doc:
            raise HTTPException(
                status_code=404, detail=f"Trait '{key}' not found or access denied"
            )

        validation_rules = trait_validator.validate_trait_data(payload, existing_doc)
        if not validation_rules.passed:
            raise HTTPException(
                status_code=400,
                detail=f"Validation failed: {'; '.join(validation_rules.errors)}",
            )

        update_doc = trait_serializer.build_document_for_update(
            payload, existing_doc, updated_by, validation_rules
        )

        updated_doc = self.repo.update(key, owner_id, update_doc)
        if not updated_doc:
            raise HTTPException(
                status_code=404, detail=f"Trait '{key}' not found or access denied"
            )

        return trait_serializer.serialize_mongo_doc_to_trait_info(updated_doc)

    def delete_trait(self, key: str, owner_id: str) -> bool:

        if self.settings.traits_json_only:
            raise HTTPException(
                status_code=405, detail="Trait deletion disabled in JSON-only mode"
            )

        success = self.repo.delete(key, owner_id)
        if not success:
            raise HTTPException(
                status_code=404, detail=f"Trait '{key}' not found or access denied"
            )
        return True

    def get_trait_registry(self) -> Dict[str, Trait]:

        registry = self.loader.get_json_engine_traits()

        if not self.settings.traits_json_only:
            try:
                db_engine_traits = self.repo.get_all_engine_traits()
                registry.update(db_engine_traits)
            except Exception as e:
                logger.error(f"Failed to load DB traits for engine: {e}")

        return registry

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
