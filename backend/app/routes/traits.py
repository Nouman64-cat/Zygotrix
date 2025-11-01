from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from typing import Optional, List

from ..services.service_factory import get_service_factory

from ..schema.traits import (
    TraitListResponse,
    TraitFilters,
    TraitInfo,
    TraitStatus,
    TraitVisibility,
)
from ..services import auth as auth_services


router = APIRouter(prefix="/api/traits", tags=["Traits"])
security = HTTPBearer(auto_error=False)


trait_service = get_service_factory().get_trait_service()


@router.get("/", response_model=TraitListResponse, tags=["Traits"])
def list_traits(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    inheritance_pattern: Optional[str] = Query(None),
    verification_status: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    gene: Optional[str] = Query(None),
    tags: Optional[List[str]] = Query(None),
    search: Optional[str] = Query(None),
    status: Optional[TraitStatus] = Query(None),
    visibility: Optional[TraitVisibility] = Query(None),
    owned_only: Optional[bool] = Query(False),
) -> TraitListResponse:
    current_user_id = None
    if credentials and credentials.credentials:
        try:
            current_user = auth_services.resolve_user_from_token(
                credentials.credentials
            )
            current_user_id = current_user.get("id")
        except HTTPException:
            pass

    filters = TraitFilters(
        inheritance_pattern=inheritance_pattern,
        verification_status=verification_status,
        category=category,
        gene=gene,
        tags=tags,
        search=search,
        status=status,
        visibility=visibility,
        owned_only=owned_only,
    )

    traits = trait_service.get_traits(filters, current_user_id)
    return TraitListResponse(traits=traits)


@router.get("/by-key/{key}", response_model=TraitInfo, tags=["Traits"])
def get_trait_by_key_public(
    key: str,
    visibility: Optional[TraitVisibility] = Query(None),
) -> TraitInfo:
    trait = trait_service.get_trait_by_key(key, None)

    if not trait:
        raise HTTPException(
            status_code=404, detail=f"Trait '{key}' not found or access denied"
        )
    if visibility and trait.visibility != visibility:
        raise HTTPException(
            status_code=404,
            detail=f"Trait '{key}' not found with visibility '{visibility.value}'",
        )
    return trait


@router.get("/{identifier}", response_model=TraitInfo, tags=["Traits"])
def get_trait(
    identifier: str,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> TraitInfo:
    current_user_id = None
    if credentials and credentials.credentials:
        try:
            current_user = auth_services.resolve_user_from_token(
                credentials.credentials
            )
            current_user_id = current_user.get("id")
        except HTTPException:
            pass

    trait = trait_service.get_trait_by_key(identifier, current_user_id)
    if not trait:
        raise HTTPException(
            status_code=404, detail=f"Trait '{identifier}' not found or access denied"
        )

    return trait
