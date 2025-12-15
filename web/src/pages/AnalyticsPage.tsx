import React, { useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { useAnalytics, useFormattedMetrics } from "../hooks/useAnalytics";
import { TimeRange } from "../services/analytics.api";
import SimulationTrendsChart from "../components/charts/SimulationTrendsChart";
import PopularTraitsChart from "../components/charts/PopularTraitsChart";
import useDocumentTitle from "../hooks/useDocumentTitle";

const AnalyticsPage: React.FC = () => {
  useDocumentTitle("Analytics");

  const [timeRange, setTimeRange] = useState<TimeRange>(TimeRange.LAST_7_DAYS);
  const { analytics, loading, error, refetch } = useAnalytics({
    time_range: timeRange,
    include_time_series: true,
    include_popular_traits: true,
  });

  const formattedMetrics = useFormattedMetrics(analytics);

  const renderMetricsCards = () => {
    if (loading) {
      return Array.from(
        { length: 4 },
        (_, i) => `skeleton-${Date.now()}-${i}`
      ).map((skeletonKey) => (
        <div
          key={skeletonKey}
          className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6 animate-pulse"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="h-4 bg-slate-200 dark:bg-slate-600 rounded w-24 mb-2"></div>
              <div className="h-8 bg-slate-200 dark:bg-slate-600 rounded w-16"></div>
            </div>
            <div className="w-6 h-6 bg-slate-200 dark:bg-slate-600 rounded"></div>
          </div>
          <div className="mt-4 flex items-center">
            <div className="h-4 bg-slate-200 dark:bg-slate-600 rounded w-12"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-600 rounded w-20 ml-2"></div>
          </div>
        </div>
      ));
    }

    if (error) {
      return (
        <div className="col-span-full bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 text-red-400 dark:text-red-500 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-red-800 dark:text-red-300 font-medium">
              Failed to load analytics data
            </span>
          </div>
          <p className="text-red-600 dark:text-red-400 mt-1">{error}</p>
          <button
            onClick={refetch}
            className="mt-2 text-red-700 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-medium text-sm"
          >
            Try again
          </button>
        </div>
      );
    }

    return metrics.map((metric, index) => {
      const gradientClasses = [
        "from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-700",
        "from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 border-emerald-200 dark:border-emerald-700",
        "from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border-amber-200 dark:border-amber-700",
        "from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-700",
      ];

      const iconColors = [
        "text-blue-500 dark:text-blue-400",
        "text-emerald-500 dark:text-emerald-400",
        "text-amber-500 dark:text-amber-400",
        "text-purple-500 dark:text-purple-400",
      ];

      return (
        <div
          key={`metric-${metric.title}`}
          className={`bg-gradient-to-br ${gradientClasses[index]} rounded-xl shadow-sm border-2 p-6 hover:shadow-md transition-all duration-200 group`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                {metric.title}
              </p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                {metric.value}
              </p>
            </div>
            <div
              className={`${iconColors[index]} bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-lg p-2 group-hover:scale-110 transition-transform duration-200`}
            >
              {metric.icon}
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <div
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                metric.changeType === "positive"
                  ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                  : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300"
              }`}
            >
              <span className="mr-1">
                {metric.changeType === "positive" ? "↗" : "↘"}
              </span>
              {metric.change}
            </div>
            <span className="text-xs text-slate-600 dark:text-slate-400 ml-2 font-medium">
              from last month
            </span>
          </div>
        </div>
      );
    });
  };

  const getMetricIcon = (type: string) => {
    switch (type) {
      case "simulations":
        return (
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        );
      case "datapoints":
        return (
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        );
      case "accuracy":
        return (
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      case "time":
        return (
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  const metrics = formattedMetrics
    ? [
        {
          ...formattedMetrics.totalSimulations,
          icon: getMetricIcon("simulations"),
        },
        {
          ...formattedMetrics.dataPointsAnalyzed,
          icon: getMetricIcon("datapoints"),
        },
        {
          ...formattedMetrics.accuracyRate,
          icon: getMetricIcon("accuracy"),
        },
        {
          ...formattedMetrics.processingTime,
          icon: getMetricIcon("time"),
        },
      ]
    : [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                Analytics & Reports
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Monitor performance metrics and generate detailed reports for
                your genetic analysis platform.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as TimeRange)}
                className="border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
              >
                <option value={TimeRange.LAST_7_DAYS}>Last 7 days</option>
                <option value={TimeRange.LAST_30_DAYS}>Last 30 days</option>
                <option value={TimeRange.LAST_90_DAYS}>Last 90 days</option>
                <option value={TimeRange.LAST_YEAR}>Last year</option>
                <option value={TimeRange.ALL_TIME}>All time</option>
              </select>
            </div>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {renderMetricsCards()}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Simulation Trends Chart */}
          <SimulationTrendsChart
            timeSeriesData={analytics?.time_series}
            loading={loading}
            error={error}
          />

          {/* Popular Traits */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <PopularTraitsChart
              data={analytics?.popular_traits || []}
              loading={loading}
              error={error}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AnalyticsPage;
