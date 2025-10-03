import { useState, useEffect } from "react";
import { fetchUserAnalytics, TimeRange } from "../services/analytics.api";
import type {
  AnalyticsResponse,
  AnalyticsFilters,
} from "../services/analytics.api";

export interface UseAnalyticsResult {
  analytics: AnalyticsResponse | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Custom hook for fetching and managing analytics data
 */
export const useAnalytics = (
  filters?: AnalyticsFilters,
  autoFetch: boolean = true
): UseAnalyticsResult => {
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    if (!autoFetch && !loading) return;

    setLoading(true);
    setError(null);

    try {
      const controller = new AbortController();
      const data = await fetchUserAnalytics(
        filters || { time_range: TimeRange.LAST_30_DAYS },
        controller.signal
      );
      setAnalytics(data);
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        setError(err.message || "Failed to fetch analytics data");
      }
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    fetchAnalytics();
  };

  useEffect(() => {
    if (autoFetch) {
      fetchAnalytics();
    }
  }, [filters?.time_range, autoFetch]);

  return {
    analytics,
    loading,
    error,
    refetch,
  };
};

/**
 * Hook for formatting analytics metrics for display
 */
export const useFormattedMetrics = (analytics: AnalyticsResponse | null) => {
  if (!analytics) return null;

  const formatValue = (value: number, suffix: string = ""): string => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M${suffix}`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K${suffix}`;
    }
    if (suffix === "s" && value < 1) {
      return `${(value * 1000).toFixed(0)}ms`;
    }
    return `${value.toFixed(value < 10 && suffix !== "" ? 1 : 0)}${suffix}`;
  };

  const formatChange = (percentage: number): string => {
    const sign = percentage >= 0 ? "+" : "";
    return `${sign}${percentage.toFixed(1)}%`;
  };

  return {
    totalSimulations: {
      title: "Total Simulations Run",
      value: formatValue(
        analytics.simulation_metrics.total_simulations.current_value
      ),
      change: formatChange(
        analytics.simulation_metrics.total_simulations.percentage_change
      ),
      changeType: analytics.simulation_metrics.total_simulations.is_positive
        ? "positive"
        : "negative",
    },
    dataPointsAnalyzed: {
      title: "Data Points Analyzed",
      value: formatValue(
        analytics.simulation_metrics.data_points_analyzed.current_value
      ),
      change: formatChange(
        analytics.simulation_metrics.data_points_analyzed.percentage_change
      ),
      changeType: analytics.simulation_metrics.data_points_analyzed.is_positive
        ? "positive"
        : "negative",
    },
    accuracyRate: {
      title: "Accuracy Rate",
      value: formatValue(
        analytics.simulation_metrics.accuracy_rate.current_value,
        "%"
      ),
      change: formatChange(
        analytics.simulation_metrics.accuracy_rate.percentage_change
      ),
      changeType: analytics.simulation_metrics.accuracy_rate.is_positive
        ? "positive"
        : "negative",
    },
    processingTime: {
      title: "Processing Time",
      value: formatValue(
        analytics.simulation_metrics.avg_processing_time.current_value,
        "s"
      ),
      change: formatChange(
        analytics.simulation_metrics.avg_processing_time.percentage_change
      ),
      changeType: analytics.simulation_metrics.avg_processing_time.is_positive
        ? "positive"
        : "negative",
    },
  };
};
