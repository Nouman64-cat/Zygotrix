from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional, cast
from datetime import datetime, timezone

from bson import ObjectId
from fastapi import HTTPException
from pymongo.collection import Collection
from pymongo.errors import PyMongoError, DuplicateKeyError

from app.services.common import get_traits_collection
from app.schema.traits import TraitFilters, TraitStatus, TraitVisibility

logger = logging.getLogger(__name__)


class TraitRepository:

    def __init__(self):
        try:
            self.collection = cast(Collection, get_traits_collection(required=True))
            logger.info("TraitRepository initialized with MongoDB collection.")
        except Exception as e:
            logger.error(
                f"Failed to get traits collection on TraitRepository init: {e}"
            )
            self.collection = None

    def _build_access_control_query(self, owner_id: Optional[str]) -> Dict[str, Any]:

        if owner_id:
            return {
                "$or": [
                    {"owner_id": owner_id},
                    {"visibility": TraitVisibility.PUBLIC.value},
                    {"visibility": {"$exists": False}},
                    {"is_public": True},
                ]
            }
        return {
            "$or": [
                {"visibility": TraitVisibility.PUBLIC.value},
                {"visibility": {"$exists": False}},
                {"is_public": True},
            ]
        }

    def _apply_basic_filters(
        self, query: Dict[str, Any], filters: TraitFilters
    ) -> None:

        if filters.inheritance_pattern:
            query["inheritance_pattern"] = filters.inheritance_pattern
        if filters.verification_status:
            query["verification_status"] = filters.verification_status
        if filters.category:
            query["category"] = filters.category
        if filters.tags:
            query["tags"] = {"$in": filters.tags}
        if filters.status:
            query["status"] = filters.status.value

    def _apply_gene_filter(self, query: Dict[str, Any], gene_filter: str) -> None:

        gene_conditions = [
            {"gene_info.gene": {"$regex": gene_filter, "$options": "i"}},
            {"gene": {"$regex": gene_filter, "$options": "i"}},
        ]
        if "$or" in query:
            query["$and"] = [{"$or": query["$or"]}, {"$or": gene_conditions}]
            del query["$or"]
        else:
            query["$or"] = gene_conditions

    def _apply_visibility_filter(
        self,
        query: Dict[str, Any],
        visibility: TraitVisibility,
        owner_id: Optional[str],
    ) -> None:

        if visibility == TraitVisibility.PUBLIC:
            vis_condition: Dict[str, Any] = {
                "$or": [
                    {"visibility": TraitVisibility.PUBLIC.value},
                    {"visibility": {"$exists": False}},
                    {"is_public": True},
                ]
            }
        else:
            vis_condition = {"visibility": visibility.value}

        if owner_id:
            access_control = self._build_access_control_query(owner_id)
            query["$and"] = [access_control["$or"], vis_condition]
        else:
            query.update(vis_condition)

    def _apply_search_filter(self, query: Dict[str, Any], search: str) -> None:

        search_term = str(search)
        if len(search_term) >= 3:
            query["$text"] = {"$search": search_term}
        else:
            regex = {"$regex": search_term, "$options": "i"}
            search_conditions = [
                {"name": regex},
                {"key": regex},
                {"tags": regex},
                {"gene_info.gene": regex},
                {"gene": regex},
            ]
            if "$or" in query:
                if "$and" not in query:
                    query["$and"] = []
                query["$and"].append({"$or": query.pop("$or")})
                query["$and"].append({"$or": search_conditions})
            else:
                query["$or"] = search_conditions

    def find_many(
        self, filters: TraitFilters, owner_id: Optional[str]
    ) -> List[Dict[str, Any]]:

        if self.collection is None:
            logger.error("TraitRepository collection is not initialized.")
            return []

        try:
            if filters.owned_only and owner_id:
                query: Dict[str, Any] = {"owner_id": owner_id}
            else:
                query = self._build_access_control_query(owner_id)

            self._apply_basic_filters(query, filters)
            if filters.gene:
                self._apply_gene_filter(query, filters.gene)
            if filters.visibility and not filters.owned_only:
                self._apply_visibility_filter(query, filters.visibility, owner_id)
            if filters.search:
                self._apply_search_filter(query, filters.search)

            cursor = self.collection.find(query).sort("updated_at", -1)
            return list(cursor)
        except PyMongoError as e:
            logger.error(f"Error finding traits in repository: {e}")
            return []

    def find_one_by_key(
        self, key: str, owner_id: Optional[str]
    ) -> Optional[Dict[str, Any]]:

        if self.collection is None:
            return None

        try:
            query = {"key": key, **self._build_access_control_query(owner_id)}
            return self.collection.find_one(query)
        except PyMongoError as e:
            logger.error(f"Error finding trait by key '{key}': {e}")
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

    def find_one_by_id(self, trait_id: str, owner_id: str) -> Optional[Dict[str, Any]]:

        if self.collection is None:
            return None

        if not ObjectId.is_valid(trait_id):
            return None

        try:
            query = {"_id": ObjectId(trait_id), "owner_id": owner_id}
            return self.collection.find_one(query)
        except PyMongoError as e:
            logger.error(f"Error finding trait by id '{trait_id}': {e}")
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

    def create(self, document: Dict[str, Any]) -> Dict[str, Any]:

        if self.collection is None:
            raise HTTPException(status_code=503, detail="Database not available")

        try:
            result = self.collection.insert_one(document)
            created_doc = self.collection.find_one({"_id": result.inserted_id})
            if not created_doc:
                raise HTTPException(
                    status_code=500, detail="Failed to retrieve created trait"
                )
            return created_doc
        except DuplicateKeyError:
            raise HTTPException(
                status_code=409,
                detail=f"Trait with key '{document.get('key')}' already exists.",
            )
        except PyMongoError as e:
            logger.error(f"Error creating trait: {e}")
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

    def update(
        self, key: str, owner_id: str, update_doc: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:

        if self.collection is None:
            return None

        try:
            result = self.collection.update_one(
                {"key": key, "owner_id": owner_id}, {"$set": update_doc}
            )
            if result.matched_count == 0:
                return None

            updated_doc = self.collection.find_one({"key": key, "owner_id": owner_id})
            return updated_doc
        except PyMongoError as e:
            logger.error(f"Error updating trait '{key}': {e}")
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

    def delete(self, key: str, owner_id: str) -> bool:

        if self.collection is None:
            return False

        try:
            result = self.collection.update_one(
                {"key": key, "owner_id": owner_id},
                {
                    "$set": {
                        "status": TraitStatus.DEPRECATED.value,
                        "updated_at": datetime.now(timezone.utc),
                    }
                },
            )
            return result.matched_count > 0
        except PyMongoError as e:
            logger.error(f"Error deleting trait '{key}': {e}")
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

    def _build_trait_from_document(self, document: Mapping[str, object]) -> Trait:

        from zygotrix_engine import Trait

        base_metadata: Dict[str, str] = {}
        metadata_obj = document.get("metadata", {})
        if isinstance(metadata_obj, dict):
            base_metadata.update({str(k): str(v) for k, v in metadata_obj.items()})
        alleles_obj = document.get("alleles", [])
        alleles_list = [
            str(a) for a in alleles_obj if isinstance(alleles_obj, (list, tuple))
        ]
        phenotype_obj = document.get("phenotype_map", {})
        phenotype_dict = {
            str(k): str(v)
            for k, v in phenotype_obj.items()
            if isinstance(phenotype_obj, dict)
        }

        return Trait(
            name=str(document.get("name", "")),
            alleles=tuple(alleles_list),
            phenotype_map=phenotype_dict,
            description=str(document.get("description", "")),
            metadata=base_metadata,
        )

    def get_all_engine_traits(self) -> Dict[str, Trait]:

        if self.collection is None:
            return {}
        persistent: Dict[str, Trait] = {}
        try:
            documents = self.collection.find()
            for document in documents:
                key = str(document.get("key"))
                if not key:
                    continue
                try:
                    persistent[key] = self._build_trait_from_document(document)
                except Exception:
                    continue
        except PyMongoError:
            pass
        return persistent
