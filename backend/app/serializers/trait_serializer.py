"""
Serializers for converting Trait data between formats
(Mongo Docs <-> Pydantic Schemas <-> Engine Objects)
"""

from __future__ import annotations
from typing import Any, Dict, Mapping, Optional
from datetime import datetime, timezone
from packaging import version as pkg_version

from app.schema.traits import (
    TraitInfo,
    GeneInfo,
    ValidationRules,
    TraitStatus,
    TraitVisibility,
    TraitCreatePayload,
    TraitUpdatePayload,
)
from app.services.common import ensure_utc

# --- Helper function moved from traits.py (and validator) ---


def _canonicalize_genotype(genotype: str) -> str:
    """Canonicalize genotype by sorting alleles alphabetically."""
    return "".join(sorted(genotype))


# --- Public Serializers ---


def serialize_mongo_doc_to_trait_info(document: Dict[str, Any]) -> TraitInfo:
    """Convert MongoDB document to TraitInfo model."""
    trait_id = None
    if "_id" in document:
        trait_id = str(document["_id"])
        document.pop("_id")  # Ensure _id is not passed to model

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


def build_document_for_create(
    payload: TraitCreatePayload,
    owner_id: str,
    created_by: str,
    validation_rules: ValidationRules,
) -> Dict[str, Any]:
    """Builds the MongoDB document for a new trait from a create payload."""
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
        "gene_info": payload.gene_info.model_dump() if payload.gene_info else None,
        "allele_freq": payload.allele_freq or {},
        "epistasis_hint": payload.epistasis_hint,
        "education_note": payload.education_note,
        "references": payload.references,
        "version": "1.0.0",
        "status": TraitStatus.DRAFT.value,
        "owner_id": owner_id,
        "visibility": payload.visibility.value,
        "tags": payload.tags,
        "validation_rules": validation_rules.model_dump(),
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

    return document


def _calculate_new_version(current_version: str) -> str:
    """Calculate new version by bumping patch number."""
    try:
        version_obj = pkg_version.Version(current_version)
        return f"{version_obj.major}.{version_obj.minor}.{version_obj.micro + 1}"
    except pkg_version.InvalidVersion:
        return "1.0.1"


def build_document_for_update(
    payload: TraitUpdatePayload,
    existing_doc: Mapping[str, Any],
    updated_by: str,
    validation_rules: ValidationRules,
) -> Dict[str, Any]:
    """Builds the MongoDB $set update document from an update payload."""
    update_doc = {
        "updated_at": datetime.now(timezone.utc),
        "updated_by": updated_by,
        "validation_rules": validation_rules.model_dump(),
    }

    # Apply basic updates
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

    # Apply extended updates
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

    # Apply gene info update
    if payload.gene_info is not None:
        update_doc["gene_info"] = payload.gene_info.model_dump()
        update_doc["gene"] = payload.gene_info.gene
        try:
            update_doc["chromosome"] = int(payload.gene_info.chromosome)
        except (ValueError, TypeError):
            update_doc["chromosome"] = payload.gene_info.chromosome

    # Version bump
    current_version = existing_doc.get("version", "1.0.0")
    update_doc["version"] = _calculate_new_version(current_version)
    update_doc["previous_version"] = {
        "version": current_version,
        "updated_at": existing_doc.get("updated_at"),
        "updated_by": existing_doc.get("updated_by"),
    }

    return update_doc
