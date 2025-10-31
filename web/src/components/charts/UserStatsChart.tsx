import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { Bar } from "react-chartjs-2";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface UserStatsChartProps {
  projectsCount: number | null;
  loading?: boolean;
  error?: string | null;
  className?: string;
}

const UserStatsChart: React.FC<UserStatsChartProps> = ({
  projectsCount,
  loading = false,
  error = null,
  className = "",
}) => {
  // Prepare chart data
  const chartData = {
    labels: ["Your Projects"],
    datasets: [
      {
        label: "Count",
        data: [projectsCount || 0],
        backgroundColor: [
          "rgba(59, 130, 246, 0.8)", // Blue for user traits
          "rgba(16, 185, 129, 0.8)", // Green for projects
        ],
        borderColor: [
          "rgb(59, 130, 246)", // Blue border
          "rgb(16, 185, 129)", // Green border
        ],
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false, // Hide legend since we have clear labels
      },
      title: {
        display: true,
        text: "Your Activity Summary",
        font: {
          size: 16,
          weight: "bold" as const,
        },
        color: "#374151", // gray-700
        padding: {
          bottom: 20,
        },
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleColor: "#ffffff",
        bodyColor: "#ffffff",
        borderColor: "#374151",
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function (context: any) {
            const label = context.dataset.label || "";
            const value = context.parsed.y;
            return `${label}: ${value}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          color: "#6B7280", // gray-500
        },
        grid: {
          color: "rgba(107, 114, 128, 0.1)", // light gray grid
        },
      },
      x: {
        ticks: {
          color: "#6B7280", // gray-500
          font: {
            weight: 500,
          },
        },
        grid: {
          display: false, // Hide vertical grid lines
        },
      },
    },
    interaction: {
      intersect: false,
      mode: "index" as const,
    },
    animation: {
      duration: 1000,
      easing: "easeInOutQuart" as const,
    },
  };

  if (loading) {
    return (
      <div
        className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}
      >
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-3">
            <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full"></div>
            <span className="text-gray-600 font-medium">Loading chart...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <svg
              className="mx-auto h-12 w-12 text-red-400 mb-4"
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
            <h3 className="text-sm font-medium text-gray-900 mb-1">
              Chart Error
            </h3>
            <p className="text-sm text-gray-500">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}
    >
      <div className="h-64 relative">
        <Bar data={chartData} options={chartOptions} />
      </div>
    </div>
  );
};

export default UserStatsChart;
