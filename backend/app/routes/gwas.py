"""Routes for querying the local GWAS dataset."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Path, Query

from ..services import gwas_dataset

router = APIRouter(tags=["GWAS"])


@router.get("/api/search-traits", response_model=list[str])
def search_traits(q: str = Query(..., min_length=1, description="Search text")) -> list[str]:
    """Return distinct mapped trait names that contain the query text."""
    try:
        return gwas_dataset.search_traits(q)
    except gwas_dataset.DatasetLoadError as exc:  # pragma: no cover - runtime guard
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/api/trait/{trait_name:path}")
def trait_details(
    trait_name: str = Path(..., description="Full mapped trait name"),
    limit: int = Query(50, ge=1, le=200, description="Maximum number of study rows"),
) -> dict[str, list]:
    """Return study records for the given GWAS trait."""
    try:
        records = gwas_dataset.trait_records(trait_name, limit=limit)
        columns = gwas_dataset.dataset_columns()
    except gwas_dataset.DatasetLoadError as exc:  # pragma: no cover - runtime guard
        raise HTTPException(status_code=500, detail=str(exc))

    return {"columns": columns, "records": records}
