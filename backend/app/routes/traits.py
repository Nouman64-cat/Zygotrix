"""
API routes for managing Traits.
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from typing import Optional, List
from bson import ObjectId

# Import the service factory
from ..services.service_factory import get_service_factory

from ..schema.traits import (
    TraitListResponse,
    TraitCreateResponse,
    TraitUpdateResponse,
    TraitCreatePayload,
    TraitUpdatePayload,
    TraitFilters,
    TraitInfo,
    TraitStatus,
    TraitVisibility,
    # Remove old/unused aliases if they cause errors
    # TraitMutationResponse,
    # TraitMutationPayload,
)
from ..services import auth as auth_services

# We no longer import from `traits as trait_services`

router = APIRouter(prefix="/api/traits", tags=["Traits"])
security = HTTPBearer(auto_error=False)

# Constants
INVALID_TOKEN_MESSAGE = "Invalid authentication token"

# Get the single TraitService instance from the factory
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
    owned_only: Optional[bool] = Query(False),  # Changed default to False
) -> TraitListResponse:
    """
    List traits with filtering and access control.
    """
    current_user_id = None
    if credentials and credentials.credentials:
        try:
            current_user = auth_services.resolve_user_from_token(
                credentials.credentials
            )
            current_user_id = current_user.get("id")
        except HTTPException:
            pass  # Continue as anonymous

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

    # Use the new service
    traits = trait_service.get_traits(filters, current_user_id)
    return TraitListResponse(traits=traits)


@router.post(
    "/",
    response_model=TraitCreateResponse,
    tags=["Traits"],
    status_code=201,
)
def create_trait(
    payload: TraitCreatePayload,
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> TraitCreateResponse:
    """Create a new trait (requires authentication)."""
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=401, detail="Authentication required to create traits"
        )

    current_user = auth_services.resolve_user_from_token(credentials.credentials)
    user_id = current_user.get("id")

    if not user_id:
        raise HTTPException(status_code=401, detail=INVALID_TOKEN_MESSAGE)

    # Use the new service
    trait = trait_service.create_trait(payload, user_id, user_id)
    return TraitCreateResponse(trait=trait)


@router.get("/by-key/{key}", response_model=TraitInfo, tags=["Traits"])
def get_trait_by_key_public(
    key: str,
    visibility: Optional[TraitVisibility] = Query(None),
) -> TraitInfo:
    """Fetch a trait by key for public consumption (e.g., baselines)."""
    # Use the new service
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
    """
    Get a specific trait either by ObjectId (owner-only) or by key.
    """
    current_user_id = None
    if credentials and credentials.credentials:
        try:
            current_user = auth_services.resolve_user_from_token(
                credentials.credentials
            )
            current_user_id = current_user.get("id")
        except HTTPException:
            pass

    if ObjectId.is_valid(identifier):
        if not current_user_id:
            raise HTTPException(status_code=404, detail="Trait not found")

        # Use the new service
        trait = trait_service.get_trait_by_id(identifier, current_user_id)
        if not trait:
            raise HTTPException(status_code=404, detail="Trait not found")

        # This validation logic is app-level, so it stays here
        if trait.visibility != TraitVisibility.PUBLIC:
            validation_errors = list(trait.validation_rules.errors or [])
            if not trait.validation_rules.passed and not validation_errors:
                validation_errors.append(
                    "Trait validation failed; please resolve issues."
                )
            if validation_errors:
                raise HTTPException(
                    status_code=422, detail={"errors": validation_errors}
                )
        return trait

    # Fallback to key-based lookup
    trait = trait_service.get_trait_by_key(identifier, current_user_id)
    if not trait:
        raise HTTPException(
            status_code=404, detail=f"Trait '{identifier}' not found or access denied"
        )

    return trait


@router.put("/{key}", response_model=TraitUpdateResponse, tags=["Traits"])
def update_trait(
    key: str,
    payload: TraitUpdatePayload,
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> TraitUpdateResponse:
    """Update an existing trait (requires ownership)."""
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=401, detail="Authentication required to update traits"
        )

    current_user = auth_services.resolve_user_from_token(credentials.credentials)
    user_id = current_user.get("id")

    if not user_id:
        raise HTTPException(status_code=401, detail=INVALID_TOKEN_MESSAGE)

    # Use the new service
    trait = trait_service.update_trait(key, payload, user_id, user_id)
    return TraitUpdateResponse(trait=trait)


@router.delete("/{key}", status_code=204, tags=["Traits"])
def delete_trait(
    key: str, credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Soft delete a trait (set status to deprecated)."""
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=401, detail="Authentication required to delete traits"
        )

    current_user = auth_services.resolve_user_from_token(credentials.credentials)
    user_id = current_user.get("id")

    if not user_id:
        raise HTTPException(status_code=401, detail=INVALID_TOKEN_MESSAGE)

    # Use the new service
    trait_service.delete_trait(key, user_id)

    # No response body for 204
    return
