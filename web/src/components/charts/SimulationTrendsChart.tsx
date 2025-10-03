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
import type { TimeSeriesData } from "../../types/analytics";

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

interface SimulationTrendsChartProps {
  timeSeriesData?: TimeSeriesData;
  loading?: boolean;
  error?: string | null;
  className?: string;
}

const SimulationTrendsChart: React.FC<SimulationTrendsChartProps> = ({
  timeSeriesData,
  loading = false,
  error = null,
  className = "",
}) => {
  const chartData = useMemo(() => {
    if (!timeSeriesData || timeSeriesData.simulations_over_time.length === 0) {
      return null;
    }

    const simulationsData = timeSeriesData.simulations_over_time;
    const accuracyData = timeSeriesData.accuracy_over_time;
    const processingTimeData = timeSeriesData.processing_time_over_time;

    // Extract labels (dates) from the first dataset
    const labels = simulationsData.map((point: any) => {
      const date = new Date(point.timestamp);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    });

    return {
      labels,
      datasets: [
        {
          label: "Simulations Run",
          data: simulationsData.map((point: any) => point.value),
          borderColor: "rgb(59, 130, 246)", // blue-500
          backgroundColor: "rgba(59, 130, 246, 0.1)",
          tension: 0.4,
          fill: true,
          yAxisID: "y",
        },
        {
          label: "Accuracy Rate (%)",
          data: accuracyData.map((point: any) => point.value),
          borderColor: "rgb(34, 197, 94)", // green-500
          backgroundColor: "rgba(34, 197, 94, 0.1)",
          tension: 0.4,
          fill: true,
          yAxisID: "y1",
        },
        {
          label: "Processing Time (s)",
          data: processingTimeData.map((point: any) => point.value),
          borderColor: "rgb(239, 68, 68)", // red-500
          backgroundColor: "rgba(239, 68, 68, 0.1)",
          tension: 0.4,
          fill: true,
          yAxisID: "y2",
        },
      ],
    };
  }, [timeSeriesData]);

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "top" as const,
          labels: {
            usePointStyle: true,
            padding: 20,
            font: {
              size: 12,
            },
          },
        },
        title: {
          display: false,
        },
        tooltip: {
          mode: "index" as const,
          intersect: false,
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          titleColor: "white",
          bodyColor: "white",
          borderColor: "rgba(255, 255, 255, 0.1)",
          borderWidth: 1,
          cornerRadius: 8,
          displayColors: true,
          callbacks: {
            label: function (context: any) {
              const label = context.dataset.label || "";
              const value = context.parsed.y;

              if (label.includes("Accuracy")) {
                return `${label}: ${value.toFixed(1)}%`;
              } else if (label.includes("Processing Time")) {
                return `${label}: ${value.toFixed(2)}s`;
              } else {
                return `${label}: ${value.toLocaleString()}`;
              }
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
            color: "#6b7280", // gray-500
          },
        },
        y: {
          type: "linear" as const,
          display: true,
          position: "left" as const,
          title: {
            display: true,
            text: "Simulations",
            color: "#6b7280",
            font: {
              size: 12,
            },
          },
          grid: {
            color: "rgba(0, 0, 0, 0.05)",
          },
          ticks: {
            font: {
              size: 11,
            },
            color: "#6b7280",
            callback: function (value: any) {
              return value.toLocaleString();
            },
          },
        },
        y1: {
          type: "linear" as const,
          display: true,
          position: "right" as const,
          title: {
            display: true,
            text: "Accuracy (%)",
            color: "#6b7280",
            font: {
              size: 12,
            },
          },
          grid: {
            drawOnChartArea: false,
          },
          ticks: {
            font: {
              size: 11,
            },
            color: "#6b7280",
            callback: function (value: any) {
              return `${value}%`;
            },
          },
          min: 0,
          max: 100,
        },
        y2: {
          type: "linear" as const,
          display: false,
          position: "right" as const,
          ticks: {
            callback: function (value: any) {
              return `${value}s`;
            },
          },
        },
      },
      interaction: {
        mode: "nearest" as const,
        axis: "x" as const,
        intersect: false,
      },
    }),
    []
  );

  if (loading) {
    return (
      <div
        className={`bg-white rounded-lg shadow-sm border border-slate-200 p-6 ${className}`}
      >
        <div className="flex items-center justify-center h-96">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-slate-600">Loading chart data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`bg-white rounded-lg shadow-sm border border-slate-200 p-6 ${className}`}
      >
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="text-red-500 mb-2">
              <svg
                className="w-12 h-12 mx-auto"
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
            </div>
            <p className="text-slate-600 mb-2">Failed to load chart data</p>
            <p className="text-sm text-slate-500">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!chartData) {
    return (
      <div
        className={`bg-white rounded-lg shadow-sm border border-slate-200 p-6 ${className}`}
      >
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="text-slate-400 mb-4">
              <svg
                className="w-16 h-16 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <p className="text-slate-600 mb-2">No trend data available</p>
            <p className="text-sm text-slate-500">
              Run some simulations to see trends and patterns over time
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white rounded-lg shadow-sm border border-slate-200 p-6 ${className}`}
    >
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-900">
          Simulation Trends
        </h3>
        <p className="text-sm text-slate-600">
          Track simulation performance, accuracy, and processing time over time
        </p>
      </div>
      <div className="h-96">
        <Line data={chartData} options={chartOptions} />
      </div>
    </div>
  );
};

export default SimulationTrendsChart;
