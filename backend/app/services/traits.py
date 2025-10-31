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
    Union,
    Iterable,
    cast,
)
from fastapi import HTTPException
from bson import ObjectId
from pymongo.errors import PyMongoError, DuplicateKeyError
from pymongo.collection import Collection
import itertools
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


def _load_real_gene_traits() -> Dict[str, Trait]:
    current_dir = os.path.dirname(os.path.abspath(__file__))
    traits_file_path = os.path.join(
        current_dir, "..", "..", "data", "traits_dataset.json"
    )

    traits_file_path = os.path.normpath(traits_file_path)

    if not os.path.exists(traits_file_path):
        print(f"❌ Traits dataset file not found at: {traits_file_path}")
        return {}

    real_gene_traits: Dict[str, Trait] = {}
    try:
        with open(traits_file_path, "r", encoding="utf-8") as f:
            traits_data = json.load(f)
    except (json.JSONDecodeError, FileNotFoundError) as e:
        return {}

    for idx, trait_data in enumerate(traits_data):
        try:
            name = trait_data.get("trait")
            alleles = trait_data.get("alleles")
            phenotypes = trait_data.get("phenotypes")
            if (
                not name
                or not isinstance(alleles, (list, tuple))
                or not isinstance(phenotypes, dict)
            ):
                raise ValueError("Missing required fields: trait, alleles, phenotypes")

            trait_key = str(name).lower().replace(" ", "_").replace("-", "_")

            genes = trait_data.get("gene", [])
            chromosomes = trait_data.get("chromosome", [])
            trait_type = trait_data.get("type", "unknown")
            inheritance = trait_data.get("inheritance")

            if not isinstance(genes, list):
                genes = [genes] if genes is not None else []
            if not isinstance(chromosomes, list):
                chromosomes = [chromosomes] if chromosomes is not None else []

            is_real_gene = len(genes) > 0 and len(chromosomes) > 0

            metadata = {
                "inheritance_pattern": inheritance,
                "category": "real_gene" if is_real_gene else "simple_trait",
                "verification_status": "verified" if is_real_gene else "simplified",
                "trait_type": trait_type,
            }

            if genes:
                metadata["genes"] = ",".join(str(g) for g in genes)
                metadata["gene"] = str(genes[0])
            if chromosomes:
                metadata["chromosomes"] = ",".join(str(c) for c in chromosomes)
                metadata["chromosome"] = str(chromosomes[0])

            if is_real_gene:
                if trait_type == "polygenic":
                    gene_list = ", ".join(genes)
                    chr_list = ", ".join(str(c) for c in chromosomes)
                    description = f"Polygenic trait - genes: {gene_list} on chromosomes: {chr_list}"
                else:
                    description = f"Monogenic trait - {genes[0]} gene on chromosome {chromosomes[0]}"
            else:
                description = trait_data.get("description", "")

            trait = Trait(
                name=name,
                alleles=tuple(str(a) for a in alleles),
                phenotype_map={str(k): str(v) for k, v in phenotypes.items()},
                description=description,
                metadata=metadata,
            )
            real_gene_traits[trait_key] = trait
        except Exception as e:
            print(f"⚠️ Warning: Skipping trait at index {idx}: {e}")
            continue
    return real_gene_traits


REAL_GENE_TRAITS = _load_real_gene_traits()
ALL_TRAITS = dict(REAL_GENE_TRAITS)


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
    settings = get_settings()
    registry = dict(ALL_TRAITS)
    if settings.traits_json_only:

        return registry
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


def _serialize_trait_document(document: Dict[str, Any]) -> TraitInfo:

    trait_id = None
    if "_id" in document:
        trait_id = str(document["_id"])
        document.pop("_id")

    created_at = ensure_utc(document.get("created_at")) or datetime.now(timezone.utc)
    updated_at = ensure_utc(document.get("updated_at")) or datetime.now(timezone.utc)

    gene_info = document.get("gene_info")

    if isinstance(gene_info, str):
        gene_info = GeneInfo(
            genes=[gene_info],
            chromosomes=[str(document.get("chromosome", ""))],
            gene=gene_info,
            chromosome=str(document.get("chromosome", "")),
            locus=None,
        )
    elif isinstance(gene_info, dict):

        if "genes" in gene_info and "chromosomes" in gene_info:
            gene_info = GeneInfo(**gene_info)
        elif "gene" in gene_info and "chromosome" in gene_info:

            gene_info = GeneInfo(
                genes=[gene_info["gene"]] if gene_info["gene"] else [],
                chromosomes=(
                    [str(gene_info["chromosome"])] if gene_info["chromosome"] else []
                ),
                gene=gene_info["gene"],
                chromosome=str(gene_info["chromosome"]),
                locus=gene_info.get("locus"),
            )
        else:
            gene_info = GeneInfo(**gene_info)
    elif gene_info is None and document.get("gene"):

        gene_info = GeneInfo(
            genes=[document.get("gene", "")],
            chromosomes=[str(document.get("chromosome", ""))],
            gene=document.get("gene", ""),
            chromosome=str(document.get("chromosome", "")),
            locus=None,
        )

    validation_rules = document.get("validation_rules", {})
    if isinstance(validation_rules, dict):
        validation_rules = ValidationRules(**validation_rules)
    else:
        validation_rules = ValidationRules()

    trait_data: Dict[str, Any] = {
        "id": trait_id,
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
        "visibility": TraitVisibility(
            document.get("visibility", TraitVisibility.PUBLIC.value)
        ),
        "tags": document.get("tags", []),
        "validation_rules": validation_rules,
        "test_case_seed": document.get("test_case_seed"),
        "created_at": created_at,
        "updated_at": updated_at,
        "created_by": document.get("created_by", ""),
        "updated_by": document.get("updated_by", ""),
        "description": document.get("description"),
        "metadata": document.get("metadata", {}),
        "gene": document.get("gene"),
        "chromosome": document.get("chromosome"),
    }

    return TraitInfo(**trait_data)


def _canonicalize_genotype(genotype: str) -> str:

    return "".join(sorted(genotype))


def _validate_phenotype_coverage(
    alleles: List[str], phenotype_map: Dict[str, str]
) -> List[str]:

    if not alleles:
        return ["Alleles list cannot be empty"]

    errors = []

    expected_genotypes = set()
    for allele1, allele2 in itertools.product(alleles, repeat=2):
        canonical = _canonicalize_genotype(allele1 + allele2)
        expected_genotypes.add(canonical)

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

    if isinstance(payload, TraitCreatePayload):
        return payload.alleles, dict(payload.phenotype_map)

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

    errors = []

    payload_any: Any = payload
    version_value = getattr(payload_any, "version", None)
    if version_value:
        try:
            pkg_version.Version(str(version_value))
        except pkg_version.InvalidVersion:
            errors.append("Invalid version format (use semantic versioning)")
    return errors


def _validate_trait_data(
    payload: Union[TraitCreatePayload, TraitUpdatePayload],
    existing_trait: Optional[Dict] = None,
) -> ValidationRules:

    errors = []

    alleles, phenotype_map = _get_alleles_and_phenotype_map(payload, existing_trait)

    if alleles and phenotype_map:
        coverage_errors = _validate_phenotype_coverage(alleles, phenotype_map)
        errors.extend(coverage_errors)

    if isinstance(payload, TraitCreatePayload):
        create_errors = _validate_create_payload(payload)
        errors.extend(create_errors)

    version_errors = _validate_version_format(payload)
    errors.extend(version_errors)

    return ValidationRules(passed=len(errors) == 0, errors=errors)


def create_trait(
    payload: TraitCreatePayload, owner_id: str, created_by: str
) -> TraitInfo:
    try:
        collection = cast(Collection, get_traits_collection(required=True))

        validation_rules = _validate_trait_data(payload)
        if not validation_rules.passed:
            raise HTTPException(
                status_code=400,
                detail=f"Validation failed: {'; '.join(validation_rules.errors)}",
            )

        now = datetime.now(timezone.utc)

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
            "description": payload.description,
            "metadata": dict(payload.metadata) if payload.metadata else {},
        }

        if payload.gene_info:
            document["gene"] = payload.gene_info.gene
            try:
                document["chromosome"] = int(payload.gene_info.chromosome)
            except (ValueError, TypeError):
                document["chromosome"] = payload.gene_info.chromosome

        result = collection.insert_one(document)

        created_doc = collection.find_one({"_id": result.inserted_id})
        if not created_doc:
            raise HTTPException(
                status_code=500, detail="Failed to retrieve created trait"
            )
        return _serialize_trait_document(created_doc)

    except DuplicateKeyError:
        raise HTTPException(
            status_code=409,
            detail=f"Trait with key '{payload.key}' already exists for this owner",
        )
    except PyMongoError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


def _build_access_control_query(owner_id: Optional[str]) -> Dict[str, Any]:

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


def _apply_basic_filters(query: Dict[str, Any], filters: TraitFilters) -> None:

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
    query: Dict[str, Any], visibility: TraitVisibility, owner_id: Optional[str]
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
        access_control = {
            "$or": [
                {"owner_id": owner_id},
                {"visibility": TraitVisibility.PUBLIC.value},
                {"visibility": {"$exists": False}},
                {"is_public": True},
            ]
        }
        query["$and"] = [access_control, vis_condition]
    else:

        query.update(vis_condition)


def _convert_json_trait_to_trait_info(key: str, trait: Trait) -> TraitInfo:

    from app.utils.trait_helpers import trait_to_info

    return trait_to_info(key, trait)


def _filter_json_traits(filters: TraitFilters) -> List[TraitInfo]:

    json_traits = []

    for key, trait in REAL_GENE_TRAITS.items():

        trait_info = _convert_json_trait_to_trait_info(key, trait)

        if (
            filters.inheritance_pattern
            and trait_info.inheritance_pattern != filters.inheritance_pattern
        ):
            continue

        if (
            filters.verification_status
            and trait_info.verification_status != filters.verification_status
        ):
            continue

        if filters.category and trait_info.category != filters.category:
            continue

        if filters.gene and trait_info.gene_info:
            if filters.gene.lower() not in trait_info.gene_info.gene.lower():
                continue

        if filters.tags and not any(tag in trait_info.tags for tag in filters.tags):
            continue

        if filters.status and trait_info.status != filters.status:
            continue

        if filters.visibility and trait_info.visibility != filters.visibility:
            continue

        if filters.search:
            search_text = filters.search.lower()
            searchable_text = f"{trait_info.name} {trait_info.gene_info.gene if trait_info.gene_info else ''} {trait_info.category or ''} {' '.join(trait_info.tags)}".lower()
            if search_text not in searchable_text:
                continue

        json_traits.append(trait_info)

    return json_traits


def get_traits(
    filters: TraitFilters, owner_id: Optional[str] = None
) -> List[TraitInfo]:
    all_traits: List[TraitInfo] = []
    settings = get_settings()

    print(f"🔍 get_traits called:")
    print(f"   - traits_json_only: {settings.traits_json_only}")
    print(f"   - REAL_GENE_TRAITS count: {len(REAL_GENE_TRAITS)}")
    print(f"   - filters.owned_only: {filters.owned_only}")
    print(f"   - owner_id: {owner_id}")

    try:

        if settings.traits_json_only:
            print("📂 Using JSON-only mode")
            json_traits = _filter_json_traits(filters)
            print(f"✅ Returning {len(json_traits)} JSON traits")
            return json_traits

        if not filters.owned_only:

            json_traits = _filter_json_traits(filters)
            all_traits.extend(json_traits)
        elif not owner_id:

            return []

        try:
            if settings.traits_json_only:

                return all_traits
            collection = get_traits_collection(required=False)
            if collection is None:
                return all_traits

            if filters.owned_only and owner_id:

                query: Dict[str, Any] = {"owner_id": owner_id}
            else:

                query = _build_access_control_query(owner_id)

            _apply_basic_filters(query, filters)

            if filters.gene:
                _apply_gene_filter(query, filters.gene)

            if filters.visibility and not filters.owned_only:
                _apply_visibility_filter(query, filters.visibility, owner_id)

            if filters.search:
                search_term = str(filters.search)

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
                        query["$and"] = [
                            {"$or": query["$or"]},
                            {"$or": search_conditions},
                        ]
                        del query["$or"]
                    else:
                        query["$or"] = search_conditions

            cursor = collection.find(query).sort("updated_at", -1)

            db_trait_count = 0
            for doc in cursor:
                try:
                    trait = _serialize_trait_document(doc)
                    all_traits.append(trait)
                    db_trait_count += 1
                except Exception as e:

                    print(f"Error serializing trait {doc.get('key', 'unknown')}: {e}")
                    continue

        except Exception as e:
            print(f"DEBUG: Error accessing database: {e}")

        return all_traits

    except Exception as e:
        return all_traits if all_traits else []


def get_trait_by_key(key: str, owner_id: Optional[str] = None) -> Optional[TraitInfo]:

    settings = get_settings()

    if settings.traits_json_only:

        for k, t in REAL_GENE_TRAITS.items():
            if k == key:
                return _convert_json_trait_to_trait_info(k, t)
        return None

    try:
        collection = cast(Collection, get_traits_collection(required=True))

        query: Dict[str, Any] = {"key": key}
        if owner_id:
            query["$or"] = [
                {"owner_id": owner_id},
                {"visibility": TraitVisibility.PUBLIC.value},
                {"visibility": {"$exists": False}},
            ]
        else:
            query["$or"] = [
                {"visibility": TraitVisibility.PUBLIC.value},
                {"visibility": {"$exists": False}},
            ]

        doc = collection.find_one(query)
        return _serialize_trait_document(doc) if doc else None

    except PyMongoError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


def get_trait_by_id(trait_id: str, owner_id: Optional[str]) -> Optional[TraitInfo]:
    settings = get_settings()
    if settings.traits_json_only:
        return None
    if not owner_id or not ObjectId.is_valid(trait_id):
        return None
    try:
        collection = cast(Collection, get_traits_collection(required=True))
        doc = collection.find_one({"_id": ObjectId(trait_id), "owner_id": owner_id})
        if not doc:
            return None
        return _serialize_trait_document(doc)
    except PyMongoError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


def get_public_trait_by_key(key: str) -> Optional[TraitInfo]:
    trait = get_trait_by_key(key, None)
    if trait and trait.visibility == TraitVisibility.PUBLIC:
        return trait
    return None


def _build_update_document_base(
    updated_by: str, validation_rules: ValidationRules
) -> Dict[str, Any]:

    return {
        "updated_at": datetime.now(timezone.utc),
        "updated_by": updated_by,
        "validation_rules": validation_rules.dict(),
    }


def _apply_basic_updates(
    update_doc: Dict[str, Any], payload: TraitUpdatePayload
) -> None:

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

    update_doc["gene_info"] = gene_info.dict()

    update_doc["gene"] = gene_info.gene
    try:
        update_doc["chromosome"] = int(gene_info.chromosome)
    except (ValueError, TypeError):
        update_doc["chromosome"] = gene_info.chromosome


def _calculate_new_version(current_version: str) -> str:

    try:
        version_obj = pkg_version.Version(current_version)
        return f"{version_obj.major}.{version_obj.minor}.{version_obj.micro + 1}"
    except pkg_version.InvalidVersion:
        return "1.0.1"


def update_trait(
    key: str, payload: TraitUpdatePayload, owner_id: str, updated_by: str
) -> TraitInfo:

    try:
        collection = cast(Collection, get_traits_collection(required=True))

        existing_doc = collection.find_one({"key": key, "owner_id": owner_id})
        if not existing_doc:
            raise HTTPException(
                status_code=404, detail=f"Trait '{key}' not found or access denied"
            )

        validation_rules = _validate_trait_data(payload, existing_doc)
        if not validation_rules.passed:
            raise HTTPException(
                status_code=400,
                detail=f"Validation failed: {'; '.join(validation_rules.errors)}",
            )

        update_doc = _build_update_document_base(updated_by, validation_rules)

        _apply_basic_updates(update_doc, payload)
        _apply_extended_updates(update_doc, payload)

        if payload.gene_info is not None:
            _apply_gene_info_update(update_doc, payload.gene_info)

        current_version = existing_doc.get("version", "1.0.0")
        update_doc["version"] = _calculate_new_version(current_version)
        update_doc["previous_version"] = {
            "version": current_version,
            "updated_at": existing_doc.get("updated_at"),
            "updated_by": existing_doc.get("updated_by"),
        }

        result = collection.update_one(
            {"key": key, "owner_id": owner_id}, {"$set": update_doc}
        )

        if result.matched_count == 0:
            raise HTTPException(
                status_code=404, detail=f"Trait '{key}' not found or access denied"
            )

        updated_doc = collection.find_one({"key": key, "owner_id": owner_id})
        if not updated_doc:
            raise HTTPException(
                status_code=500, detail="Failed to retrieve updated trait"
            )
        return _serialize_trait_document(updated_doc)

    except PyMongoError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


def delete_trait(key: str, owner_id: str) -> bool:
    try:
        collection = cast(Collection, get_traits_collection(required=True))

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


def filter_traits(
    trait_filter: Iterable[str] | None,
) -> Tuple[Dict[str, Trait], List[str]]:

    registry = get_trait_registry()

    if trait_filter is None:
        return registry, []

    trait_keys = set(trait_filter)
    available_keys = set(registry.keys())

    missing = list(trait_keys - available_keys)

    filtered_registry = {
        key: registry[key] for key in trait_keys if key in available_keys
    }

    return filtered_registry, missing
