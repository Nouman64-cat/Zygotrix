import React, { useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { useAnalytics, useFormattedMetrics } from "../hooks/useAnalytics";
import { TimeRange } from "../services/analytics.api";
import SimulationTrendsChart from "../components/charts/SimulationTrendsChart";
import PopularTraitsChart from "../components/charts/PopularTraitsChart";

const AnalyticsPage: React.FC = () => {
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
          className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 animate-pulse"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="h-4 bg-slate-200 rounded w-24 mb-2"></div>
              <div className="h-8 bg-slate-200 rounded w-16"></div>
            </div>
            <div className="w-6 h-6 bg-slate-200 rounded"></div>
          </div>
          <div className="mt-4 flex items-center">
            <div className="h-4 bg-slate-200 rounded w-12"></div>
            <div className="h-4 bg-slate-200 rounded w-20 ml-2"></div>
          </div>
        </div>
      ));
    }

    if (error) {
      return (
        <div className="col-span-full bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 text-red-400 mr-2"
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
            <span className="text-red-800 font-medium">
              Failed to load analytics data
            </span>
          </div>
          <p className="text-red-600 mt-1">{error}</p>
          <button
            onClick={refetch}
            className="mt-2 text-red-700 hover:text-red-800 font-medium text-sm"
          >
            Try again
          </button>
        </div>
      );
    }

    return metrics.map((metric, index) => {
      const gradientClasses = [
        "from-blue-50 to-blue-100 border-blue-200",
        "from-emerald-50 to-emerald-100 border-emerald-200",
        "from-amber-50 to-amber-100 border-amber-200",
        "from-purple-50 to-purple-100 border-purple-200",
      ];

      const iconColors = [
        "text-blue-500",
        "text-emerald-500",
        "text-amber-500",
        "text-purple-500",
      ];

      return (
        <div
          key={`metric-${metric.title}`}
          className={`bg-gradient-to-br ${gradientClasses[index]} rounded-xl shadow-sm border-2 p-6 hover:shadow-md transition-all duration-200 group`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                {metric.title}
              </p>
              <p className="text-3xl font-bold text-slate-900 mt-2">
                {metric.value}
              </p>
            </div>
            <div
              className={`${iconColors[index]} bg-white/60 backdrop-blur-sm rounded-lg p-2 group-hover:scale-110 transition-transform duration-200`}
            >
              {metric.icon}
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <div
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                metric.changeType === "positive"
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              <span className="mr-1">
                {metric.changeType === "positive" ? "↗" : "↘"}
              </span>
              {metric.change}
            </div>
            <span className="text-xs text-slate-600 ml-2 font-medium">
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
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Analytics & Reports
              </h1>
              <p className="text-slate-600 mt-1">
                Monitor performance metrics and generate detailed reports for
                your genetic analysis platform.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as TimeRange)}
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
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
