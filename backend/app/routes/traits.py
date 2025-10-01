from fastapi import APIRouter, HTTPException, Response
from typing import Optional
from .. import services
from ..schemas import (
    TraitListResponse,
    TraitMutationResponse,
    TraitMutationPayload,
    TraitInfo,
)
from zygotrix_engine import Trait
from ..utils import trait_to_info

router = APIRouter(prefix="/api/traits", tags=["Traits"])


@router.get("/", response_model=TraitListResponse, tags=["Traits"])
def list_traits(
    inheritance_pattern: Optional[str] = None,
    verification_status: Optional[str] = None,
    category: Optional[str] = None,
    gene_info: Optional[str] = None,
) -> TraitListResponse:
    traits = [
        trait_to_info(key, trait)
        for key, trait in services.get_trait_registry(
            inheritance_pattern=inheritance_pattern,
            verification_status=verification_status,
            category=category,
            gene_info=gene_info,
        ).items()
    ]
    return TraitListResponse(traits=traits)


@router.post(
    "/",
    response_model=TraitMutationResponse,
    tags=["Traits"],
    status_code=201,
)
def create_trait(payload: TraitMutationPayload) -> TraitMutationResponse:
    trait_definition = {
        "name": payload.name,
        "alleles": payload.alleles,
        "phenotype_map": dict(payload.phenotype_map),
        "description": payload.description or "",
        "metadata": dict(payload.metadata),
    }

    # Add new Mendelian trait fields if provided
    if payload.inheritance_pattern:
        trait_definition["inheritance_pattern"] = payload.inheritance_pattern
    if payload.verification_status:
        trait_definition["verification_status"] = payload.verification_status
    if payload.gene_info:
        trait_definition["gene_info"] = payload.gene_info
    if payload.category:
        trait_definition["category"] = payload.category

    trait = services.save_trait(payload.key, trait_definition)
    return TraitMutationResponse(trait=trait_to_info(payload.key, trait))


@router.put("/{key}", response_model=TraitMutationResponse, tags=["Traits"])
def update_trait(key: str, payload: TraitMutationPayload) -> TraitMutationResponse:
    if key != payload.key:
        raise HTTPException(
            status_code=400, detail="Trait key mismatch between path and payload."
        )

    trait_definition = {
        "name": payload.name,
        "alleles": payload.alleles,
        "phenotype_map": dict(payload.phenotype_map),
        "description": payload.description or "",
        "metadata": dict(payload.metadata),
    }

    # Add new Mendelian trait fields if provided
    if payload.inheritance_pattern:
        trait_definition["inheritance_pattern"] = payload.inheritance_pattern
    if payload.verification_status:
        trait_definition["verification_status"] = payload.verification_status
    if payload.gene_info:
        trait_definition["gene_info"] = payload.gene_info
    if payload.category:
        trait_definition["category"] = payload.category

    trait = services.save_trait(payload.key, trait_definition)
    return TraitMutationResponse(trait=trait_to_info(payload.key, trait))


@router.delete("/{key}", status_code=204, tags=["Traits"])
def remove_trait(key: str) -> Response:
    services.delete_trait(key)
    return Response(status_code=204)
