from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from enum import Enum


class TimeRange(str, Enum):
    """Time range options for analytics queries."""

    LAST_7_DAYS = "7d"
    LAST_30_DAYS = "30d"
    LAST_90_DAYS = "90d"
    LAST_YEAR = "1y"
    ALL_TIME = "all"


class MetricTrend(BaseModel):
    """Represents trend data for a metric."""

    current_value: float = Field(..., description="Current metric value")
    previous_value: float = Field(..., description="Previous period metric value")
    percentage_change: float = Field(
        ..., description="Percentage change from previous period"
    )
    is_positive: bool = Field(
        ..., description="Whether the change is positive (improvement)"
    )


class SimulationMetrics(BaseModel):
    """Core simulation metrics for analytics."""

    total_simulations: MetricTrend = Field(
        ..., description="Total number of simulations run"
    )
    data_points_analyzed: MetricTrend = Field(
        ..., description="Total data points processed"
    )
    accuracy_rate: MetricTrend = Field(
        ..., description="Simulation accuracy percentage"
    )
    avg_processing_time: MetricTrend = Field(
        ..., description="Average processing time in seconds"
    )


class UserActivityMetrics(BaseModel):
    """User engagement and activity metrics."""

    active_users: int = Field(..., description="Number of active users in the period")
    new_users: int = Field(..., description="Number of new users in the period")
    total_sessions: int = Field(..., description="Total user sessions")
    avg_session_duration: float = Field(
        ..., description="Average session duration in minutes"
    )


class PopularTraitsData(BaseModel):
    """Data for most popular traits."""

    trait_key: str = Field(..., description="Trait identifier")
    trait_name: str = Field(..., description="Human-readable trait name")
    usage_count: int = Field(..., description="Number of times used in simulations")
    percentage: float = Field(..., description="Percentage of total usage")


class TimeSeriesDataPoint(BaseModel):
    """Single data point in time series."""

    timestamp: datetime = Field(..., description="Data point timestamp")
    value: float = Field(..., description="Metric value at this time")


class TimeSeriesData(BaseModel):
    """Time series data for charts."""

    simulations_over_time: List[TimeSeriesDataPoint] = Field(default_factory=list)
    accuracy_over_time: List[TimeSeriesDataPoint] = Field(default_factory=list)
    processing_time_over_time: List[TimeSeriesDataPoint] = Field(default_factory=list)


class SystemPerformanceMetrics(BaseModel):
    """System performance and health metrics."""

    avg_response_time: float = Field(..., description="Average API response time in ms")
    error_rate: float = Field(..., description="Error rate percentage")
    uptime_percentage: float = Field(..., description="System uptime percentage")
    memory_usage: float = Field(..., description="Memory usage percentage")
    cpu_usage: float = Field(..., description="CPU usage percentage")


class AnalyticsResponse(BaseModel):
    """Complete analytics response model."""

    simulation_metrics: SimulationMetrics = Field(
        ..., description="Core simulation metrics"
    )
    user_activity: UserActivityMetrics = Field(
        ..., description="User engagement metrics"
    )
    popular_traits: List[PopularTraitsData] = Field(
        default_factory=list, description="Most used traits"
    )
    time_series: TimeSeriesData = Field(..., description="Time series data for charts")
    system_performance: SystemPerformanceMetrics = Field(
        ..., description="System performance metrics"
    )
    generated_at: datetime = Field(
        default_factory=datetime.utcnow, description="Report generation timestamp"
    )
    time_range: TimeRange = Field(
        ..., description="Time range for this analytics report"
    )


class AnalyticsFilters(BaseModel):
    """Filters for analytics queries."""

    time_range: TimeRange = Field(
        default=TimeRange.LAST_30_DAYS, description="Time range for analytics"
    )
    user_id: Optional[str] = Field(None, description="Filter by specific user")
    trait_keys: Optional[List[str]] = Field(
        None, description="Filter by specific traits"
    )
    include_time_series: bool = Field(
        default=True, description="Include time series data"
    )
    include_popular_traits: bool = Field(
        default=True, description="Include popular traits data"
    )


class AnalyticsError(BaseModel):
    """Error response for analytics endpoints."""

    error: str = Field(..., description="Error message")
    code: str = Field(..., description="Error code")
    details: Optional[Dict[str, Any]] = Field(
        None, description="Additional error details"
    )
