import React, { useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import type { PopularTraitsData } from "../../types/analytics";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface PopularTraitsChartProps {
  data: PopularTraitsData[];
  loading?: boolean;
  error?: string | null;
}

const PopularTraitsChart: React.FC<PopularTraitsChartProps> = ({
  data,
  loading,
  error,
}) => {
  // Generate a vibrant color palette
  const getTraitColor = (index: number) => {
    const colors = [
      "#3B82F6", // Blue
      "#10B981", // Emerald
      "#F59E0B", // Amber
      "#EF4444", // Red
      "#8B5CF6", // Violet
      "#F97316", // Orange
      "#06B6D4", // Cyan
      "#84CC16", // Lime
      "#EC4899", // Pink
      "#6B7280", // Gray
    ];
    return colors[index % colors.length];
  };

  const totalUsage = useMemo(() => {
    return data?.reduce((sum, trait) => sum + trait.usage_count, 0) || 0;
  }, [data]);

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return null;

    // Take top 6 traits for better visibility
    const topTraits = data.slice(0, 6);

    return {
      labels: topTraits.map((trait) => trait.trait_name),
      datasets: [
        {
          label: "Usage Count",
          data: topTraits.map((trait) => trait.usage_count),
          borderColor: "#3B82F6",
          backgroundColor: "rgba(59, 130, 246, 0.1)",
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: topTraits.map((_, index) =>
            getTraitColor(index)
          ),
          pointBorderColor: topTraits.map((_, index) => getTraitColor(index)),
          pointBorderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8,
        },
      ],
    };
  }, [data]);

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          titleColor: "white",
          bodyColor: "white",
          borderColor: "rgba(255, 255, 255, 0.1)",
          borderWidth: 1,
          cornerRadius: 8,
          displayColors: true,
          callbacks: {
            label: function (context: any) {
              return `${context.parsed.y} uses (${(
                (context.parsed.y / totalUsage) *
                100
              ).toFixed(1)}%)`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: {
            display: false,
          },
          ticks: {
            font: {
              size: 11,
            },
            color: "#6b7280",
            maxRotation: 45,
          },
        },
        y: {
          beginAtZero: true,
          grid: {
            color: "rgba(0, 0, 0, 0.05)",
          },
          ticks: {
            font: {
              size: 11,
            },
            color: "#6b7280",
            callback: function (value: any) {
              return Number.isInteger(value) ? value : "";
            },
          },
        },
      },
      interaction: {
        intersect: false,
        mode: "index" as const,
      },
    }),
    [totalUsage]
  );

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center bg-slate-50 dark:bg-slate-700/30 rounded-lg animate-pulse">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-slate-300 dark:bg-slate-600 rounded-full animate-bounce"></div>
          <div
            className="w-4 h-4 bg-slate-300 dark:bg-slate-600 rounded-full animate-bounce"
            style={{ animationDelay: "0.1s" }}
          ></div>
          <div
            className="w-4 h-4 bg-slate-300 dark:bg-slate-600 rounded-full animate-bounce"
            style={{ animationDelay: "0.2s" }}
          ></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 bg-red-50 dark:bg-red-900/20 rounded-lg">
        <div className="text-center">
          <svg
            className="w-12 h-12 text-red-400 dark:text-red-500 mx-auto mb-3"
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
          <p className="text-red-600 dark:text-red-400 font-medium">Failed to load traits</p>
          <p className="text-red-500 dark:text-red-400 text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-slate-50 dark:bg-slate-700/30 rounded-lg">
        <div className="text-center">
          <svg
            className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-3"
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
          <p className="text-slate-500 dark:text-slate-400 font-medium">No trait data available</p>
          <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">
            Start running simulations to see trait usage patterns
          </p>
        </div>
      </div>
    );
  }

  if (!chartData) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Popular Traits
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Usage frequency trends</p>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{totalUsage}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">total uses</div>
        </div>
      </div>

      {/* Line Chart */}
      <div className="h-96">
        <Line data={chartData} options={chartOptions} />
      </div>

      {/* Additional trait stats */}
      {data.length > 6 && (
        <div className="text-center">
          <span className="text-sm text-slate-500 dark:text-slate-400">
            Showing top 6 of {data.length} traits
          </span>
        </div>
      )}
    </div>
  );
};

export default PopularTraitsChart;
