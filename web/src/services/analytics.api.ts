import API from "./api";
import { API_ROUTES } from "./apiConstants";

/**
 * Analytics API response types
 */

export interface MetricTrend {
  current_value: number;
  previous_value: number;
  percentage_change: number;
  is_positive: boolean;
}

export interface SimulationMetrics {
  total_simulations: MetricTrend;
  data_points_analyzed: MetricTrend;
  accuracy_rate: MetricTrend;
  avg_processing_time: MetricTrend;
}

export interface UserActivityMetrics {
  active_users: number;
  new_users: number;
  total_sessions: number;
  avg_session_duration: number;
}

export interface PopularTraitsData {
  trait_key: string;
  trait_name: string;
  usage_count: number;
  percentage: number;
}

export interface TimeSeriesDataPoint {
  timestamp: string;
  value: number;
}

export interface TimeSeriesData {
  simulations_over_time: TimeSeriesDataPoint[];
  accuracy_over_time: TimeSeriesDataPoint[];
  processing_time_over_time: TimeSeriesDataPoint[];
}

export interface SystemPerformanceMetrics {
  avg_response_time: number;
  error_rate: number;
  uptime_percentage: number;
  memory_usage: number;
  cpu_usage: number;
}

export interface AnalyticsResponse {
  simulation_metrics: SimulationMetrics;
  user_activity: UserActivityMetrics;
  popular_traits: PopularTraitsData[];
  time_series: TimeSeriesData;
  system_performance: SystemPerformanceMetrics;
  generated_at: string;
  time_range: TimeRange;
}

export const TimeRange = {
  LAST_7_DAYS: "7d",
  LAST_30_DAYS: "30d",
  LAST_90_DAYS: "90d",
  LAST_YEAR: "1y",
  ALL_TIME: "all",
} as const;

export type TimeRange = (typeof TimeRange)[keyof typeof TimeRange];

export interface AnalyticsFilters {
  time_range?: TimeRange;
  include_time_series?: boolean;
  include_popular_traits?: boolean;
}

/**
 * Fetch user-specific analytics data
 */
export const fetchUserAnalytics = async (
  filters?: AnalyticsFilters,
  signal?: AbortSignal
): Promise<AnalyticsResponse> => {
  const params = new URLSearchParams();

  if (filters?.time_range) {
    params.append("time_range", filters.time_range);
  }
  if (filters?.include_time_series !== undefined) {
    params.append(
      "include_time_series",
      filters.include_time_series.toString()
    );
  }
  if (filters?.include_popular_traits !== undefined) {
    params.append(
      "include_popular_traits",
      filters.include_popular_traits.toString()
    );
  }

  const response = await API.get<AnalyticsResponse>(
    `${API_ROUTES.analytics.root}?${params.toString()}`,
    { signal }
  );

  return response.data;
};

/**
 * Fetch global analytics data (all users)
 */
export const fetchGlobalAnalytics = async (
  filters?: AnalyticsFilters,
  signal?: AbortSignal
): Promise<AnalyticsResponse> => {
  const params = new URLSearchParams();

  if (filters?.time_range) {
    params.append("time_range", filters.time_range);
  }
  if (filters?.include_time_series !== undefined) {
    params.append(
      "include_time_series",
      filters.include_time_series.toString()
    );
  }
  if (filters?.include_popular_traits !== undefined) {
    params.append(
      "include_popular_traits",
      filters.include_popular_traits.toString()
    );
  }

  const response = await API.get<AnalyticsResponse>(
    `${API_ROUTES.analytics.global}?${params.toString()}`,
    { signal }
  );

  return response.data;
};

/**
 * Check analytics service health
 */
export const checkAnalyticsHealth = async (
  signal?: AbortSignal
): Promise<{
  status: string;
  service: string;
  timestamp: string;
}> => {
  const response = await API.get<{
    status: string;
    service: string;
    timestamp: string;
  }>(API_ROUTES.analytics.health, { signal });

  return response.data;
};

/**
 * Format metric trend for display
 */
export const formatMetricTrend = (
  trend: MetricTrend
): {
  value: string;
  change: string;
  isPositive: boolean;
} => {
  const formatValue = (value: number, isTime: boolean = false): string => {
    if (isTime) {
      return `${value.toFixed(1)}s`;
    }
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toFixed(value < 10 ? 1 : 0);
  };

  const formatChange = (percentage: number): string => {
    const sign = percentage >= 0 ? "+" : "";
    return `${sign}${percentage.toFixed(1)}%`;
  };

  return {
    value: formatValue(trend.current_value),
    change: formatChange(trend.percentage_change),
    isPositive: trend.is_positive,
  };
};

/**
 * Format large numbers for display
 */
export const formatLargeNumber = (value: number): string => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}K`;
  }
  return value.toString();
};

/**
 * Format percentage for display
 */
export const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

/**
 * Format duration in seconds to human readable format
 */
export const formatDuration = (seconds: number): string => {
  if (seconds < 1) {
    return `${(seconds * 1000).toFixed(0)}ms`;
  }
  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds.toFixed(0)}s`;
};

/**
 * Get time range display label
 */
export const getTimeRangeLabel = (timeRange: TimeRange): string => {
  switch (timeRange) {
    case TimeRange.LAST_7_DAYS:
      return "Last 7 days";
    case TimeRange.LAST_30_DAYS:
      return "Last 30 days";
    case TimeRange.LAST_90_DAYS:
      return "Last 90 days";
    case TimeRange.LAST_YEAR:
      return "Last year";
    case TimeRange.ALL_TIME:
      return "All time";
    default:
      return "Unknown";
  }
};

/**
 * Convert time series data for chart libraries
 */
export const convertTimeSeriesForChart = (
  data: TimeSeriesDataPoint[]
): Array<{ x: Date; y: number }> => {
  return data.map((point) => ({
    x: new Date(point.timestamp),
    y: point.value,
  }));
};
