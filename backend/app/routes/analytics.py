from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from typing import Optional

from ..services import auth as auth_services
from ..services.analytics import analytics_service
from ..schema.analytics import (
    AnalyticsResponse,
    AnalyticsFilters,
    AnalyticsError,
    TimeRange,
)

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])
security = HTTPBearer(auto_error=False)

INVALID_TOKEN_MESSAGE = "Invalid authentication token"
AUTH_REQUIRED_MESSAGE = "Authentication required to access analytics"


@router.get("/", response_model=AnalyticsResponse, tags=["Analytics"])
def get_analytics(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    time_range: TimeRange = Query(
        default=TimeRange.LAST_30_DAYS, description="Time range for analytics data"
    ),
    include_time_series: bool = Query(
        default=True, description="Include time series data for charts"
    ),
    include_popular_traits: bool = Query(
        default=True, description="Include popular traits data"
    ),
) -> AnalyticsResponse:

    current_user_id = None
    if credentials and credentials.credentials:
        try:
            current_user = auth_services.resolve_user_from_token(
                credentials.credentials
            )
            current_user_id = current_user.get("id")
        except HTTPException:
            raise HTTPException(status_code=401, detail=AUTH_REQUIRED_MESSAGE)
    else:
        raise HTTPException(status_code=401, detail=AUTH_REQUIRED_MESSAGE)

    if not current_user_id:
        raise HTTPException(status_code=401, detail=INVALID_TOKEN_MESSAGE)

    try:
        filters = AnalyticsFilters(
            time_range=time_range,
            include_time_series=include_time_series,
            include_popular_traits=include_popular_traits,
        )

        analytics_data = analytics_service.get_analytics(
            user_id=current_user_id, filters=filters
        )

        return analytics_data

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to retrieve analytics data: {str(e)}"
        )


@router.get("/global", response_model=AnalyticsResponse, tags=["Analytics"])
def get_global_analytics(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    time_range: TimeRange = Query(
        default=TimeRange.LAST_30_DAYS, description="Time range for analytics data"
    ),
    include_time_series: bool = Query(
        default=True, description="Include time series data for charts"
    ),
    include_popular_traits: bool = Query(
        default=True, description="Include popular traits data"
    ),
) -> AnalyticsResponse:

    if credentials and credentials.credentials:
        try:
            current_user = auth_services.resolve_user_from_token(
                credentials.credentials
            )
            if not current_user.get("id"):
                raise HTTPException(status_code=401, detail=INVALID_TOKEN_MESSAGE)
        except HTTPException:
            raise HTTPException(status_code=401, detail=AUTH_REQUIRED_MESSAGE)
    else:
        raise HTTPException(status_code=401, detail=AUTH_REQUIRED_MESSAGE)

    try:
        filters = AnalyticsFilters(
            time_range=time_range,
            include_time_series=include_time_series,
            include_popular_traits=include_popular_traits,
        )

        analytics_data = analytics_service.get_analytics(user_id=None, filters=filters)

        return analytics_data

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve global analytics data: {str(e)}",
        )


@router.get("/health", tags=["Analytics"])
def get_analytics_health():

    try:
        test_filters = AnalyticsFilters(
            time_range=TimeRange.LAST_7_DAYS,
            include_time_series=False,
            include_popular_traits=False,
        )

        analytics_service.get_analytics(filters=test_filters)

        return {
            "status": "healthy",
            "service": "analytics",
            "timestamp": "2025-10-03T00:00:00Z",
        }
    except Exception as e:
        raise HTTPException(
            status_code=503, detail=f"Analytics service unhealthy: {str(e)}"
        )
