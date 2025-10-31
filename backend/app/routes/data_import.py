from __future__ import annotations

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

from ..dependencies import get_current_user
from ..schema.auth import UserProfile
from ..schema.data_import import VCFParseResponse
from ..services.data_import import process_variant_payload


router = APIRouter(prefix="/api/data", tags=["Data Import"])


@router.post("/import", response_model=VCFParseResponse)
async def import_genome_file(
    file: UploadFile = File(..., description="VCF or CSV file with variant calls"),
    persist: bool = Form(False, description="Persist upload for this session"),
    current_user: UserProfile = Depends(get_current_user),
) -> VCFParseResponse:
    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=422, detail="Uploaded file is empty.")

    return process_variant_payload(
        user_id=current_user.id or "anonymous",
        filename=file.filename or "upload.dat",
        content=contents,
        persist=persist,
    )
