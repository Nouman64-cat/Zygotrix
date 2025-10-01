from datetime import datetime
from pydantic import BaseModel


class HealthResponse(BaseModel):
    """Simple health check result."""

    status: str = "ok"


class PortalStatusResponse(BaseModel):
    """Simple payload to confirm portal access."""

    message: str
    accessed_at: datetime
