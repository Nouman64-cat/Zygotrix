from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from typing import Optional, List
from bson import ObjectId
from ..services import traits as trait_services
from ..config import get_settings
from ..services import auth as auth_services
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
    # Legacy aliases
    TraitMutationResponse,
    TraitMutationPayload,
)
from zygotrix_engine import Trait
from ..utils import trait_to_info

router = APIRouter(prefix="/api/traits", tags=["Traits"])
security = HTTPBearer(auto_error=False)

# Constants
INVALID_TOKEN_MESSAGE = "Invalid authentication token"


@router.get("/", response_model=TraitListResponse, tags=["Traits"])
def list_traits(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    inheritance_pattern: Optional[str] = Query(
        None, description="Filter by inheritance pattern"
    ),
    verification_status: Optional[str] = Query(
        None, description="Filter by verification status"
    ),
    category: Optional[str] = Query(None, description="Filter by category"),
    gene: Optional[str] = Query(None, description="Filter by gene name"),
    tags: Optional[List[str]] = Query(None, description="Filter by tags"),
    search: Optional[str] = Query(
        None, description="Text search in name, gene, category, tags"
    ),
    status: Optional[TraitStatus] = Query(None, description="Filter by status"),
    visibility: Optional[TraitVisibility] = Query(
        None, description="Filter by visibility"
    ),
    owned_only: Optional[bool] = Query(
        None,
        description="If true, only return traits owned by the authenticated user",
    ),
) -> TraitListResponse:
    """
    List traits with filtering and access control.

    - Public traits are visible to everyone
    - Private/team traits are only visible to the owner
    - Authentication is optional but provides access to user's private traits
    """
    # Get current user ID if authenticated
    current_user_id = None
    if credentials and credentials.credentials:
        try:
            current_user = auth_services.resolve_user_from_token(
                credentials.credentials
            )
            current_user_id = current_user.get("id")
        except HTTPException:
            # Invalid token, continue as anonymous user
            pass

    # Build filters
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

    # Get traits with access control
    settings = get_settings()
    if settings.traits_json_only:
        # Serve only JSON traits; ignore DB and access control
        traits = trait_services.get_traits(filters, None)
    else:
        traits = trait_services.get_traits(filters, current_user_id)

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
    """
    Create a new trait (requires authentication).

    - Validates alleles are non-empty
    - Canonicalizes genotypes in phenotype_map
    - Ensures full coverage in phenotype_map
    - Sets owner_id from JWT token
    - Defaults to private visibility and draft status
    """
    # JSON-only mode: disable writes
    settings = get_settings()
    if settings.traits_json_only:
        raise HTTPException(
            status_code=405, detail="Trait creation disabled in JSON-only mode"
        )
    # Authenticate user
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=401, detail="Authentication required to create traits"
        )

    current_user = auth_services.resolve_user_from_token(credentials.credentials)
    user_id = current_user.get("id")

    if not user_id:
        raise HTTPException(status_code=401, detail=INVALID_TOKEN_MESSAGE)

    # Create trait
    trait = trait_services.create_trait(payload, user_id, user_id)

    return TraitCreateResponse(trait=trait)


@router.get("/by-key/{key}", response_model=TraitInfo, tags=["Traits"])
def get_trait_by_key_public(
    key: str,
    visibility: Optional[TraitVisibility] = Query(None),
) -> TraitInfo:
    """Fetch a trait by key for public consumption (e.g., baselines)."""

    if visibility == TraitVisibility.PUBLIC:
        trait = trait_services.get_public_trait_by_key(key)
    else:
        trait = trait_services.get_trait_by_key(key, None)
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
    identifier: str, credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> TraitInfo:
    """
    Get a specific trait either by ObjectId (owner-only) or by key.

    - When identifier is a valid ObjectId, the trait must be owned by the requester
    - Otherwise falls back to key-based lookup preserving existing behaviour
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
        trait = trait_services.get_trait_by_id(identifier, current_user_id)
        if not trait:
            raise HTTPException(status_code=404, detail="Trait not found")
        if trait.visibility != TraitVisibility.PUBLIC:
            validation_errors = list(trait.validation_rules.errors or [])
            if not trait.validation_rules.passed and not validation_errors:
                validation_errors.append(
                    "Trait validation failed; please resolve issues before running simulations."
                )
            if validation_errors:
                raise HTTPException(status_code=422, detail={"errors": validation_errors})
        return trait

    trait = trait_services.get_trait_by_key(identifier, current_user_id)
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
    """
    Update an existing trait (requires ownership).

    - Only the trait owner can update
    - Bumps version automatically
    - Keeps audit trail of changes
    """
    # JSON-only mode: disable writes
    settings = get_settings()
    if settings.traits_json_only:
        raise HTTPException(
            status_code=405, detail="Trait updates disabled in JSON-only mode"
        )
    # Authenticate user
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=401, detail="Authentication required to update traits"
        )

    current_user = auth_services.resolve_user_from_token(credentials.credentials)
    user_id = current_user.get("id")

    if not user_id:
        raise HTTPException(status_code=401, detail=INVALID_TOKEN_MESSAGE)

    # Update trait
    trait = trait_services.update_trait(key, payload, user_id, user_id)

    return TraitUpdateResponse(trait=trait)


@router.delete("/{key}", status_code=204, tags=["Traits"])
def delete_trait(
    key: str, credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Soft delete a trait (set status to deprecated).

    - Only the trait owner can delete
    - Performs soft delete by setting status to 'deprecated'
    """
    # JSON-only mode: disable writes
    settings = get_settings()
    if settings.traits_json_only:
        raise HTTPException(
            status_code=405, detail="Trait deletion disabled in JSON-only mode"
        )
    # Authenticate user
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=401, detail="Authentication required to delete traits"
        )

    current_user = auth_services.resolve_user_from_token(credentials.credentials)
    user_id = current_user.get("id")

    if not user_id:
        raise HTTPException(status_code=401, detail=INVALID_TOKEN_MESSAGE)

    # Delete trait
    trait_services.delete_trait(key, user_id)
