from fastapi import APIRouter

router = APIRouter(prefix="/api/portal", tags=["Portal"])


@router.get("/status")
def portal_status():
    return {"status": "ok"}
