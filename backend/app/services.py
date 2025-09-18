"""Domain services wrapping zygotrix_engine for API consumption."""

from __future__ import annotations

from functools import lru_cache
from typing import Dict, Iterable, List, Mapping, Optional, Tuple

from fastapi import HTTPException
from pymongo import MongoClient
from pymongo.collection import Collection
from pymongo.errors import PyMongoError

from zygotrix_engine import (
    BLOOD_TYPE,
    EYE_COLOR,
    HAIR_COLOR,
    PolygenicCalculator,
    Simulator,
    Trait,
)

from .config import get_settings

DEFAULT_TRAITS: Dict[str, Trait] = {
    "eye_color": EYE_COLOR,
    "blood_type": BLOOD_TYPE,
    "hair_color": HAIR_COLOR,
}

_mongo_client: Optional[MongoClient] = None


def _build_trait_from_document(document: Mapping[str, object]) -> Trait:
    return Trait(
        name=str(document.get("name", "")),
        alleles=tuple(str(allele) for allele in document.get("alleles", [])),
        phenotype_map=dict(document.get("phenotype_map", {})),
        description=str(document.get("description", "")),
        metadata=dict(document.get("metadata", {})),
    )


def get_mongo_client() -> Optional[MongoClient]:
    settings = get_settings()
    global _mongo_client

    if not settings.mongodb_uri:
        return None

    if _mongo_client is not None:
        return _mongo_client

    try:
        if settings.mongodb_uri.startswith("mongomock://"):
            import mongomock  # type: ignore

            _mongo_client = mongomock.MongoClient()
        else:
            _mongo_client = MongoClient(settings.mongodb_uri)
    except PyMongoError as exc:  # pragma: no cover
        raise HTTPException(status_code=503, detail=f"Unable to connect to MongoDB: {exc}") from exc

    return _mongo_client


def get_traits_collection(required: bool = False) -> Optional[Collection]:
    client = get_mongo_client()
    if client is None:
        if required:
            raise HTTPException(status_code=503, detail="MongoDB connection is not configured.")
        return None

    settings = get_settings()
    database = client[settings.mongodb_db_name]
    return database[settings.mongodb_traits_collection]


def fetch_persistent_traits() -> Dict[str, Trait]:
    collection = get_traits_collection()
    if collection is None:
        return {}

    persistent: Dict[str, Trait] = {}
    try:
        documents = collection.find()
    except PyMongoError:
        return persistent

    for document in documents:
        key = str(document.get("key"))
        if not key:
            continue
        try:
            persistent[key] = _build_trait_from_document(document)
        except Exception:
            continue
    return persistent


def get_trait_registry() -> Dict[str, Trait]:
    registry = dict(DEFAULT_TRAITS)
    registry.update(fetch_persistent_traits())
    return registry


def get_simulator() -> Simulator:
    """Instantiate a simulator using the latest trait registry."""

    return Simulator(trait_registry=get_trait_registry())


@lru_cache(maxsize=1)
def get_polygenic_calculator() -> PolygenicCalculator:
    """Return a singleton polygenic calculator."""

    return PolygenicCalculator()


def filter_traits(requested: Iterable[str] | None) -> Tuple[Dict[str, Trait], List[str]]:
    """Return the traits subset if a filter is provided and track missing keys."""

    registry = get_trait_registry()
    if not requested:
        return registry, []

    subset: Dict[str, Trait] = {}
    missing: List[str] = []
    for key in requested:
        if key in registry:
            subset[key] = registry[key]
        else:
            missing.append(key)
    if not subset:
        raise HTTPException(status_code=404, detail="None of the requested traits are available.")
    return subset, missing


def simulate_mendelian_traits(
    parent1: Mapping[str, str],
    parent2: Mapping[str, str],
    trait_filter: Iterable[str] | None,
    as_percentages: bool,
) -> Tuple[Dict[str, Dict[str, float]], List[str]]:
    """Run Mendelian simulations and optionally filter trait outputs."""

    registry, missing = filter_traits(trait_filter)
    simulator = Simulator(trait_registry=registry)

    parent1_filtered = {key: parent1[key] for key in parent1 if key in registry}
    parent2_filtered = {key: parent2[key] for key in parent2 if key in registry}

    results = simulator.simulate_mendelian_traits(
        parent1_filtered,
        parent2_filtered,
        as_percentages=as_percentages,
    )
    ordered_results: Dict[str, Dict[str, float]] = {}
    for key in (registry.keys() if not trait_filter else trait_filter):
        if key in results:
            ordered_results[key] = results[key]

    return ordered_results, missing


def calculate_polygenic_score(
    parent1_genotype: Mapping[str, float],
    parent2_genotype: Mapping[str, float],
    weights: Mapping[str, float],
) -> float:
    """Forward the computation to the polygenic calculator with validation."""

    if not weights:
        raise HTTPException(status_code=400, detail="Weights mapping cannot be empty.")
    calculator = get_polygenic_calculator()
    return calculator.calculate_polygenic_score(parent1_genotype, parent2_genotype, weights)


def save_trait(key: str, definition: Mapping[str, object]) -> Trait:
    collection = get_traits_collection(required=True)
    trait = _build_trait_from_document({"key": key, **definition})

    try:
        collection.update_one(
            {"key": key},
            {
                "$set": {
                    "key": key,
                    "name": trait.name,
                    "alleles": list(trait.alleles),
                    "phenotype_map": dict(trait.phenotype_map),
                    "description": trait.description,
                    "metadata": dict(trait.metadata),
                }
            },
            upsert=True,
        )
    except PyMongoError as exc:
        raise HTTPException(status_code=500, detail=f"Failed to save trait: {exc}") from exc

    return trait


def delete_trait(key: str) -> None:
    collection = get_traits_collection(required=True)
    try:
        result = collection.delete_one({"key": key})
    except PyMongoError as exc:
        raise HTTPException(status_code=500, detail=f"Failed to delete trait: {exc}") from exc

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail=f"Trait '{key}' does not exist.")