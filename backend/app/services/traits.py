import json
import os
from typing import Any, Dict, Mapping, Optional, Tuple, List, Iterable
from zygotrix_engine import Trait, Simulator, PolygenicCalculator
from fastapi import HTTPException
from pymongo.errors import PyMongoError
from ..config import get_settings

# Trait loading and registry


def _load_real_gene_traits() -> Dict[str, Trait]:
    current_dir = os.path.dirname(os.path.abspath(__file__))
    traits_file_path = os.path.join(
        current_dir, "..", "..", "data", "traits_dataset.json"
    )
    if not os.path.exists(traits_file_path):
        return {}
    try:
        with open(traits_file_path, "r", encoding="utf-8") as f:
            traits_data = json.load(f)
        real_gene_traits = {}
        for trait_data in traits_data:
            trait_key = trait_data["trait"].lower().replace(" ", "_").replace("-", "_")
            metadata = {
                "gene": trait_data["gene"],
                "chromosome": str(trait_data["chromosome"]),
                "inheritance_pattern": trait_data["inheritance"],
                "category": "real_gene",
                "verification_status": "verified",
            }
            trait = Trait(
                name=trait_data["trait"],
                alleles=tuple(trait_data["alleles"]),
                phenotype_map=trait_data["phenotypes"],
                description=f"Real gene trait - {trait_data['gene']} gene on chromosome {trait_data['chromosome']}",
                metadata=metadata,
            )
            real_gene_traits[trait_key] = trait
        return real_gene_traits
    except (json.JSONDecodeError, KeyError, FileNotFoundError) as e:
        print(f"Warning: Could not load real gene traits: {e}")
        return {}


REAL_GENE_TRAITS = _load_real_gene_traits()
ALL_TRAITS = dict(REAL_GENE_TRAITS)

# Trait document builder


def _build_trait_from_document(document: Mapping[str, object]) -> Trait:
    base_metadata: Dict[str, str] = {}
    metadata_obj = document.get("metadata", {})
    if isinstance(metadata_obj, dict):
        base_metadata.update({str(k): str(v) for k, v in metadata_obj.items()})
    if "inheritance_pattern" in document and document["inheritance_pattern"]:
        base_metadata["inheritance_pattern"] = str(document["inheritance_pattern"])
    if "verification_status" in document and document["verification_status"]:
        base_metadata["verification_status"] = str(document["verification_status"])
    if "gene_info" in document and document["gene_info"]:
        base_metadata["gene_info"] = str(document["gene_info"])
    if "category" in document and document["category"]:
        base_metadata["category"] = str(document["category"])
    alleles_obj = document.get("alleles", [])
    alleles_list = []
    if isinstance(alleles_obj, (list, tuple)):
        alleles_list = [str(allele) for allele in alleles_obj]
    phenotype_obj = document.get("phenotype_map", {})
    phenotype_dict: Dict[str, str] = {}
    if isinstance(phenotype_obj, dict):
        phenotype_dict = {str(k): str(v) for k, v in phenotype_obj.items()}
    return Trait(
        name=str(document.get("name", "")),
        alleles=tuple(alleles_list),
        phenotype_map=phenotype_dict,
        description=str(document.get("description", "")),
        metadata=base_metadata,
    )


# Trait persistence and filtering


def fetch_persistent_traits() -> Dict[str, Trait]:
    from .common import get_traits_collection

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


def fetch_filtered_traits(
    inheritance_pattern: Optional[str] = None,
    verification_status: Optional[str] = None,
    category: Optional[str] = None,
    gene_info: Optional[str] = None,
) -> Dict[str, Trait]:
    from .common import get_traits_collection

    collection = get_traits_collection()
    if collection is None:
        return {}
    query_filter = {}
    if inheritance_pattern:
        query_filter["inheritance_pattern"] = inheritance_pattern
    if verification_status:
        query_filter["verification_status"] = verification_status
    if category:
        query_filter["category"] = category
    if gene_info:
        query_filter["gene_info"] = gene_info
    filtered_traits: Dict[str, Trait] = {}
    try:
        documents = collection.find(query_filter)
        for document in documents:
            key = str(document.get("key"))
            if not key:
                continue
            try:
                filtered_traits[key] = _build_trait_from_document(document)
            except Exception:
                continue
    except PyMongoError:
        pass
    return filtered_traits


def get_trait_registry(
    inheritance_pattern: Optional[str] = None,
    verification_status: Optional[str] = None,
    category: Optional[str] = None,
    gene_info: Optional[str] = None,
) -> Dict[str, Trait]:
    registry = dict(ALL_TRAITS)
    if not any([inheritance_pattern, verification_status, category, gene_info]):
        registry.update(fetch_persistent_traits())
    else:
        registry.update(
            fetch_filtered_traits(
                inheritance_pattern=inheritance_pattern,
                verification_status=verification_status,
                category=category,
                gene_info=gene_info,
            )
        )
    return registry


def get_simulator() -> Simulator:
    return Simulator(trait_registry=get_trait_registry())


from functools import lru_cache


@lru_cache(maxsize=1)
def get_polygenic_calculator() -> PolygenicCalculator:
    return PolygenicCalculator()


def filter_traits(
    trait_filter: Iterable[str] | None,
) -> Tuple[Dict[str, Trait], List[str]]:
    """Filter traits by keys and return registry and missing keys."""
    registry = get_trait_registry()

    if trait_filter is None:
        return registry, []

    trait_keys = set(trait_filter)
    available_keys = set(registry.keys())

    # Find missing traits
    missing = list(trait_keys - available_keys)

    # Filter registry to only include requested traits that exist
    filtered_registry = {
        key: registry[key] for key in trait_keys if key in available_keys
    }

    return filtered_registry, missing
