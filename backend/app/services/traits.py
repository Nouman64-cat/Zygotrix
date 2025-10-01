import json
import os
from datetime import datetime, timezone
from typing import (
    Any,
    Dict,
    Mapping,
    Optional,
    Tuple,
    List,
    Dict as DictType,
    Union,
    Iterable,
)
from bson import ObjectId
from fastapi import HTTPException
from pymongo.errors import PyMongoError, DuplicateKeyError
from pymongo.collection import Collection
import itertools
import re
from packaging import version as pkg_version

from zygotrix_engine import Trait, Simulator, PolygenicCalculator
from ..config import get_settings
from ..schema.traits import (
    TraitInfo,
    TraitCreatePayload,
    TraitUpdatePayload,
    TraitFilters,
    TraitStatus,
    TraitVisibility,
    GeneInfo,
    ValidationRules,
)
from .common import get_traits_collection, ensure_utc

# Legacy trait loading and registry for backward compatibility


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


# MongoDB Trait Management Functions


def _serialize_trait_document(document: Dict[str, Any]) -> TraitInfo:
    """Convert MongoDB document to TraitInfo model."""

    # Handle ObjectId conversion
    if "_id" in document:
        document.pop("_id")

    # Handle datetime fields
    created_at = ensure_utc(document.get("created_at")) or datetime.now(timezone.utc)
    updated_at = ensure_utc(document.get("updated_at")) or datetime.now(timezone.utc)

    # Handle gene_info conversion
    gene_info = document.get("gene_info")
    if isinstance(gene_info, dict):
        gene_info = GeneInfo(**gene_info)
    elif gene_info is None and document.get("gene"):
        # Backward compatibility: convert legacy gene field
        gene_info = GeneInfo(
            gene=document.get("gene", ""),
            chromosome=str(document.get("chromosome", "")),
            locus=None,
        )

    # Handle validation_rules
    validation_rules = document.get("validation_rules", {})
    if isinstance(validation_rules, dict):
        validation_rules = ValidationRules(**validation_rules)
    else:
        validation_rules = ValidationRules()

    # Create TraitInfo with all fields
    trait_data = {
        "key": document.get("key", ""),
        "name": document.get("name", ""),
        "alleles": document.get("alleles", []),
        "phenotype_map": document.get("phenotype_map", {}),
        "inheritance_pattern": document.get("inheritance_pattern"),
        "verification_status": document.get("verification_status"),
        "category": document.get("category"),
        "gene_info": gene_info,
        "allele_freq": document.get("allele_freq", {}),
        "epistasis_hint": document.get("epistasis_hint"),
        "education_note": document.get("education_note"),
        "references": document.get("references", []),
        "version": document.get("version", "1.0.0"),
        "status": TraitStatus(document.get("status", "draft")),
        "owner_id": document.get("owner_id", ""),
        "visibility": TraitVisibility(document.get("visibility", "private")),
        "tags": document.get("tags", []),
        "validation_rules": validation_rules,
        "test_case_seed": document.get("test_case_seed"),
        "created_at": created_at,
        "updated_at": updated_at,
        "created_by": document.get("created_by", ""),
        "updated_by": document.get("updated_by", ""),
        # Legacy fields
        "description": document.get("description"),
        "metadata": document.get("metadata", {}),
        "gene": document.get("gene"),
        "chromosome": document.get("chromosome"),
    }

    return TraitInfo(**trait_data)


def _canonicalize_genotype(genotype: str) -> str:
    """Canonicalize genotype by sorting alleles alphabetically."""
    return "".join(sorted(genotype))


def _validate_phenotype_coverage(
    alleles: List[str], phenotype_map: Dict[str, str]
) -> List[str]:
    """
    Validate that phenotype map covers all possible genotypes.

    Returns:
        List[str]: List of validation errors, empty if valid
    """
    if not alleles:
        return ["Alleles list cannot be empty"]

    errors = []

    # Generate all possible genotypes
    expected_genotypes = set()
    for allele1, allele2 in itertools.product(alleles, repeat=2):
        canonical = _canonicalize_genotype(allele1 + allele2)
        expected_genotypes.add(canonical)

    # Check coverage
    provided_genotypes = {_canonicalize_genotype(g) for g in phenotype_map.keys()}

    missing = expected_genotypes - provided_genotypes
    if missing:
        errors.append(f"Missing genotype phenotypes: {', '.join(sorted(missing))}")

    extra = provided_genotypes - expected_genotypes
    if extra:
        errors.append(
            f"Unexpected genotypes in phenotype map: {', '.join(sorted(extra))}"
        )

    return errors


def _get_alleles_and_phenotype_map(
    payload: Union[TraitCreatePayload, TraitUpdatePayload],
    existing_trait: Optional[Dict] = None,
) -> Tuple[List[str], Dict[str, str]]:
    """Extract alleles and phenotype_map from payload or existing data."""
    if isinstance(payload, TraitCreatePayload):
        return payload.alleles, dict(payload.phenotype_map)

    # For updates, use payload values or fall back to existing
    existing_alleles = existing_trait.get("alleles", []) if existing_trait else []
    existing_phenotype = (
        existing_trait.get("phenotype_map", {}) if existing_trait else {}
    )

    alleles = payload.alleles if payload.alleles is not None else existing_alleles
    phenotype_map = (
        dict(payload.phenotype_map)
        if payload.phenotype_map is not None
        else existing_phenotype
    )

    return alleles, phenotype_map


def _validate_create_payload(payload: TraitCreatePayload) -> List[str]:
    """Validate creation-specific fields."""
    errors = []
    if not payload.key.strip():
        errors.append("Trait key cannot be empty")
    if not payload.name.strip():
        errors.append("Trait name cannot be empty")
    if not payload.alleles:
        errors.append("At least one allele must be provided")
    return errors


def _validate_version_format(
    payload: Union[TraitCreatePayload, TraitUpdatePayload],
) -> List[str]:
    """Validate version format if provided."""
    errors = []
    if hasattr(payload, "version") and payload.version:
        try:
            pkg_version.Version(payload.version)
        except pkg_version.InvalidVersion:
            errors.append("Invalid version format (use semantic versioning)")
    return errors


def _validate_trait_data(
    payload: Union[TraitCreatePayload, TraitUpdatePayload],
    existing_trait: Optional[Dict] = None,
) -> ValidationRules:
    """
    Validate trait data and return validation results.

    Args:
        payload: The trait data to validate
        existing_trait: Existing trait data for updates

    Returns:
        ValidationRules: Validation results
    """
    errors = []

    # Get alleles and phenotype_map
    alleles, phenotype_map = _get_alleles_and_phenotype_map(payload, existing_trait)

    # Validate phenotype coverage if we have both alleles and phenotype_map
    if alleles and phenotype_map:
        coverage_errors = _validate_phenotype_coverage(alleles, phenotype_map)
        errors.extend(coverage_errors)

    # Creation-specific validations
    if isinstance(payload, TraitCreatePayload):
        create_errors = _validate_create_payload(payload)
        errors.extend(create_errors)

    # Version format validation
    version_errors = _validate_version_format(payload)
    errors.extend(version_errors)

    return ValidationRules(passed=len(errors) == 0, errors=errors)


def create_trait(
    payload: TraitCreatePayload, owner_id: str, created_by: str
) -> TraitInfo:
    """
    Create a new trait in MongoDB.

    Args:
        payload: Trait creation data
        owner_id: ID of the owner user
        created_by: ID of the user creating the trait

    Returns:
        TraitInfo: The created trait

    Raises:
        HTTPException: If creation fails or validation errors occur
    """
    try:
        collection = get_traits_collection(required=True)

        # Validate trait data
        validation_rules = _validate_trait_data(payload)
        if not validation_rules.passed:
            raise HTTPException(
                status_code=400,
                detail=f"Validation failed: {'; '.join(validation_rules.errors)}",
            )

        now = datetime.now(timezone.utc)

        # Prepare document
        document = {
            "key": payload.key.strip(),
            "name": payload.name.strip(),
            "alleles": payload.alleles,
            "phenotype_map": {
                _canonicalize_genotype(k): v for k, v in payload.phenotype_map.items()
            },
            "inheritance_pattern": payload.inheritance_pattern,
            "verification_status": payload.verification_status,
            "category": payload.category,
            "gene_info": payload.gene_info.dict() if payload.gene_info else None,
            "allele_freq": payload.allele_freq or {},
            "epistasis_hint": payload.epistasis_hint,
            "education_note": payload.education_note,
            "references": payload.references,
            "version": "1.0.0",
            "status": TraitStatus.DRAFT.value,
            "owner_id": owner_id,
            "visibility": payload.visibility.value,
            "tags": payload.tags,
            "validation_rules": validation_rules.dict(),
            "test_case_seed": payload.test_case_seed,
            "created_at": now,
            "updated_at": now,
            "created_by": created_by,
            "updated_by": created_by,
            # Legacy fields for backward compatibility
            "description": payload.description,
            "metadata": dict(payload.metadata) if payload.metadata else {},
        }

        # Add legacy gene info if gene_info is provided
        if payload.gene_info:
            document["gene"] = payload.gene_info.gene
            try:
                document["chromosome"] = int(payload.gene_info.chromosome)
            except (ValueError, TypeError):
                document["chromosome"] = payload.gene_info.chromosome

        # Insert document
        result = collection.insert_one(document)

        # Retrieve and return created trait
        created_doc = collection.find_one({"_id": result.inserted_id})
        return _serialize_trait_document(created_doc)

    except DuplicateKeyError:
        raise HTTPException(
            status_code=409,
            detail=f"Trait with key '{payload.key}' already exists for this owner",
        )
    except PyMongoError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


def _build_access_control_query(owner_id: Optional[str]) -> Dict[str, Any]:
    """Build access control part of MongoDB query."""
    if owner_id:
        return {
            "$or": [
                {"owner_id": owner_id},
                {"visibility": TraitVisibility.PUBLIC.value},
            ]
        }
    return {"visibility": TraitVisibility.PUBLIC.value}


def _apply_basic_filters(query: Dict[str, Any], filters: TraitFilters) -> None:
    """Apply basic field filters to MongoDB query."""
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


def _apply_gene_filter(query: Dict[str, Any], gene_filter: str) -> None:
    """Apply gene search filter to MongoDB query."""
    gene_conditions = [
        {"gene_info.gene": {"$regex": gene_filter, "$options": "i"}},
        {"gene": {"$regex": gene_filter, "$options": "i"}},  # Legacy support
    ]

    if "$or" in query:
        # Combine with existing $or conditions using $and
        query["$and"] = [{"$or": query["$or"]}, {"$or": gene_conditions}]
        del query["$or"]
    else:
        query["$or"] = gene_conditions


def _apply_visibility_filter(
    query: Dict[str, Any], visibility: TraitVisibility, owner_id: Optional[str]
) -> None:
    """Apply visibility filter to MongoDB query."""
    if owner_id:
        access_control = {
            "$or": [
                {"owner_id": owner_id},
                {"visibility": TraitVisibility.PUBLIC.value},
            ]
        }
        visibility_filter = {"visibility": visibility.value}

        query["$and"] = [access_control, visibility_filter]
    else:
        query["visibility"] = visibility.value


def get_traits(
    filters: TraitFilters, owner_id: Optional[str] = None
) -> List[TraitInfo]:
    """
    Get traits with filtering.

    Args:
        filters: Filtering criteria
        owner_id: Current user's ID (for access control)

    Returns:
        List[TraitInfo]: Filtered traits
    """
    try:
        collection = get_traits_collection(required=True)

        # Build query with access control
        query = _build_access_control_query(owner_id)

        # Apply basic filters
        _apply_basic_filters(query, filters)

        # Apply gene filter
        if filters.gene:
            _apply_gene_filter(query, filters.gene)

        # Apply visibility filter (overrides access control)
        if filters.visibility:
            _apply_visibility_filter(query, filters.visibility, owner_id)

        # Text search
        if filters.search:
            query["$text"] = {"$search": filters.search}

        # Execute query
        cursor = collection.find(query).sort("updated_at", -1)

        # Convert to TraitInfo objects
        traits = []
        for doc in cursor:
            try:
                trait = _serialize_trait_document(doc)
                traits.append(trait)
            except Exception as e:
                # Log error but continue with other traits
                print(f"Error serializing trait {doc.get('key', 'unknown')}: {e}")
                continue

        return traits

    except PyMongoError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


def get_trait_by_key(key: str, owner_id: Optional[str] = None) -> Optional[TraitInfo]:
    """
    Get a specific trait by key.

    Args:
        key: Trait key
        owner_id: Current user's ID (for access control)

    Returns:
        Optional[TraitInfo]: The trait if found and accessible
    """
    try:
        collection = get_traits_collection(required=True)

        # Build query with access control
        query = {"key": key}
        if owner_id:
            query["$or"] = [
                {"owner_id": owner_id},
                {"visibility": TraitVisibility.PUBLIC.value},
            ]
        else:
            query["visibility"] = TraitVisibility.PUBLIC.value

        doc = collection.find_one(query)
        return _serialize_trait_document(doc) if doc else None

    except PyMongoError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


def _build_update_document_base(
    updated_by: str, validation_rules: ValidationRules
) -> Dict[str, Any]:
    """Build base update document with common fields."""
    return {
        "updated_at": datetime.now(timezone.utc),
        "updated_by": updated_by,
        "validation_rules": validation_rules.dict(),
    }


def _apply_basic_updates(
    update_doc: Dict[str, Any], payload: TraitUpdatePayload
) -> None:
    """Apply basic field updates to update document."""
    if payload.name is not None:
        update_doc["name"] = payload.name.strip()
    if payload.alleles is not None:
        update_doc["alleles"] = payload.alleles
    if payload.phenotype_map is not None:
        update_doc["phenotype_map"] = {
            _canonicalize_genotype(k): v for k, v in payload.phenotype_map.items()
        }
    if payload.inheritance_pattern is not None:
        update_doc["inheritance_pattern"] = payload.inheritance_pattern
    if payload.verification_status is not None:
        update_doc["verification_status"] = payload.verification_status
    if payload.category is not None:
        update_doc["category"] = payload.category


def _apply_extended_updates(
    update_doc: Dict[str, Any], payload: TraitUpdatePayload
) -> None:
    """Apply extended field updates to update document."""
    if payload.allele_freq is not None:
        update_doc["allele_freq"] = payload.allele_freq
    if payload.epistasis_hint is not None:
        update_doc["epistasis_hint"] = payload.epistasis_hint
    if payload.education_note is not None:
        update_doc["education_note"] = payload.education_note
    if payload.references is not None:
        update_doc["references"] = payload.references
    if payload.visibility is not None:
        update_doc["visibility"] = payload.visibility.value
    if payload.tags is not None:
        update_doc["tags"] = payload.tags
    if payload.test_case_seed is not None:
        update_doc["test_case_seed"] = payload.test_case_seed
    if payload.description is not None:
        update_doc["description"] = payload.description
    if payload.metadata is not None:
        update_doc["metadata"] = dict(payload.metadata)


def _apply_gene_info_update(update_doc: Dict[str, Any], gene_info: GeneInfo) -> None:
    """Apply gene info updates including legacy fields."""
    update_doc["gene_info"] = gene_info.dict()
    # Update legacy fields
    update_doc["gene"] = gene_info.gene
    try:
        update_doc["chromosome"] = int(gene_info.chromosome)
    except (ValueError, TypeError):
        update_doc["chromosome"] = gene_info.chromosome


def _calculate_new_version(current_version: str) -> str:
    """Calculate new version by bumping patch number."""
    try:
        version_obj = pkg_version.Version(current_version)
        return f"{version_obj.major}.{version_obj.minor}.{version_obj.micro + 1}"
    except pkg_version.InvalidVersion:
        return "1.0.1"


def update_trait(
    key: str, payload: TraitUpdatePayload, owner_id: str, updated_by: str
) -> TraitInfo:
    """
    Update an existing trait.

    Args:
        key: Trait key to update
        payload: Update data
        owner_id: Owner's user ID
        updated_by: ID of user performing update

    Returns:
        TraitInfo: Updated trait

    Raises:
        HTTPException: If trait not found, access denied, or validation fails
    """
    try:
        collection = get_traits_collection(required=True)

        # Find existing trait (only owner can update)
        existing_doc = collection.find_one({"key": key, "owner_id": owner_id})
        if not existing_doc:
            raise HTTPException(
                status_code=404, detail=f"Trait '{key}' not found or access denied"
            )

        # Validate updated data
        validation_rules = _validate_trait_data(payload, existing_doc)
        if not validation_rules.passed:
            raise HTTPException(
                status_code=400,
                detail=f"Validation failed: {'; '.join(validation_rules.errors)}",
            )

        # Build update document
        update_doc = _build_update_document_base(updated_by, validation_rules)

        # Apply field updates
        _apply_basic_updates(update_doc, payload)
        _apply_extended_updates(update_doc, payload)

        # Handle gene info separately
        if payload.gene_info is not None:
            _apply_gene_info_update(update_doc, payload.gene_info)

        # Version bump and audit trail
        current_version = existing_doc.get("version", "1.0.0")
        update_doc["version"] = _calculate_new_version(current_version)
        update_doc["previous_version"] = {
            "version": current_version,
            "updated_at": existing_doc.get("updated_at"),
            "updated_by": existing_doc.get("updated_by"),
        }

        # Update document
        result = collection.update_one(
            {"key": key, "owner_id": owner_id}, {"$set": update_doc}
        )

        if result.matched_count == 0:
            raise HTTPException(
                status_code=404, detail=f"Trait '{key}' not found or access denied"
            )

        # Return updated trait
        updated_doc = collection.find_one({"key": key, "owner_id": owner_id})
        return _serialize_trait_document(updated_doc)

    except PyMongoError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


def delete_trait(key: str, owner_id: str) -> bool:
    """
    Soft delete a trait (set status to deprecated).

    Args:
        key: Trait key to delete
        owner_id: Owner's user ID

    Returns:
        bool: True if deleted successfully

    Raises:
        HTTPException: If trait not found or access denied
    """
    try:
        collection = get_traits_collection(required=True)

        # Soft delete: set status to deprecated
        result = collection.update_one(
            {"key": key, "owner_id": owner_id},
            {
                "$set": {
                    "status": TraitStatus.DEPRECATED.value,
                    "updated_at": datetime.now(timezone.utc),
                }
            },
        )

        if result.matched_count == 0:
            raise HTTPException(
                status_code=404, detail=f"Trait '{key}' not found or access denied"
            )

        return True

    except PyMongoError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


# Legacy compatibility functions


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
