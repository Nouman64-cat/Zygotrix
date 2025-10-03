export interface TimeSeriesDataPoint {
  timestamp: string;
  value: number;
}

export interface TimeSeriesData {
  simulations_over_time: TimeSeriesDataPoint[];
  accuracy_over_time: TimeSeriesDataPoint[];
  processing_time_over_time: TimeSeriesDataPoint[];
}

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

export interface SystemPerformanceMetrics {
  avg_response_time: number;
  error_rate: number;
  uptime_percentage: number;
  memory_usage: number;
  cpu_usage: number;
}

export type TimeRange = "7d" | "30d" | "90d" | "1y" | "all";

export interface AnalyticsResponse {
  simulation_metrics: SimulationMetrics;
  user_activity: UserActivityMetrics;
  popular_traits: PopularTraitsData[];
  time_series: TimeSeriesData;
  system_performance: SystemPerformanceMetrics;
  generated_at: string;
  time_range: TimeRange;
}

export interface AnalyticsFilters {
  time_range?: TimeRange;
  user_id?: string;
  trait_keys?: string[];
  include_time_series?: boolean;
  include_popular_traits?: boolean;
}
