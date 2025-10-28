import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Doughnut, Bar, Line } from "react-chartjs-2";
import type { CourseProgress } from "../../../types";

// Register Chart.js components
ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface LearningProgressChartProps {
  courses: CourseProgress[];
}

export const CourseCompletionChart = ({
  courses,
}: LearningProgressChartProps) => {
  const notStarted = courses.filter((c) => c.progress === 0).length;
  const inProgress = courses.filter(
    (c) => c.progress > 0 && c.progress < 100
  ).length;
  const completed = courses.filter((c) => c.progress >= 100).length;

  const data = {
    labels: ["Not Started", "In Progress", "Completed"],
    datasets: [
      {
        data: [notStarted, inProgress, completed],
        backgroundColor: [
          "rgba(148, 163, 184, 0.6)", // gray
          "rgba(59, 130, 246, 0.6)", // blue
          "rgba(16, 185, 129, 0.6)", // emerald
        ],
        borderColor: [
          "rgba(148, 163, 184, 1)",
          "rgba(59, 130, 246, 1)",
          "rgba(16, 185, 129, 1)",
        ],
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          color: "#94a3b8",
          padding: 15,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        backgroundColor: "rgba(15, 23, 42, 0.9)",
        titleColor: "#f1f5f9",
        bodyColor: "#cbd5e1",
        borderColor: "rgba(59, 130, 246, 0.5)",
        borderWidth: 1,
        padding: 12,
        displayColors: true,
      },
    },
  };

  return (
    <div className="h-64">
      <Doughnut data={data} options={options} />
    </div>
  );
};

interface ModuleProgressChartProps {
  courses: CourseProgress[];
}

export const ModuleProgressChart = ({ courses }: ModuleProgressChartProps) => {
  const courseData = courses.slice(0, 5).map((course) => {
    const completed = course.modules.filter(
      (m) => m.status === "completed"
    ).length;
    const total = course.modules.length;
    return {
      name:
        course.title.length > 20
          ? course.title.substring(0, 20) + "..."
          : course.title,
      completed,
      total,
      percentage: total > 0 ? (completed / total) * 100 : 0,
    };
  });

  const data = {
    labels: courseData.map((c) => c.name),
    datasets: [
      {
        label: "Completed Modules",
        data: courseData.map((c) => c.completed),
        backgroundColor: "rgba(59, 130, 246, 0.7)",
        borderColor: "rgba(59, 130, 246, 1)",
        borderWidth: 2,
      },
      {
        label: "Total Modules",
        data: courseData.map((c) => c.total),
        backgroundColor: "rgba(148, 163, 184, 0.3)",
        borderColor: "rgba(148, 163, 184, 0.5)",
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: {
          color: "rgba(148, 163, 184, 0.1)",
        },
        ticks: {
          color: "#94a3b8",
          font: {
            size: 11,
          },
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(148, 163, 184, 0.1)",
        },
        ticks: {
          color: "#94a3b8",
          stepSize: 1,
        },
      },
    },
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          color: "#94a3b8",
          padding: 15,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        backgroundColor: "rgba(15, 23, 42, 0.9)",
        titleColor: "#f1f5f9",
        bodyColor: "#cbd5e1",
        borderColor: "rgba(59, 130, 246, 0.5)",
        borderWidth: 1,
        padding: 12,
      },
    },
  };

  return (
    <div className="h-64">
      <Bar data={data} options={options} />
    </div>
  );
};

interface LearningTrendChartProps {
  courses: CourseProgress[];
}

export const LearningTrendChart = ({ courses }: LearningTrendChartProps) => {
  // Simulate weekly progress data (in production, this would come from backend)
  const weeks = ["Week 1", "Week 2", "Week 3", "Week 4", "Current"];
  const progressData = [
    15,
    32,
    48,
    65,
    courses.reduce((sum, c) => sum + c.progress, 0) / courses.length,
  ];

  const data = {
    labels: weeks,
    datasets: [
      {
        label: "Average Progress %",
        data: progressData,
        fill: true,
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        borderColor: "rgba(59, 130, 246, 1)",
        borderWidth: 3,
        tension: 0.4,
        pointBackgroundColor: "rgba(59, 130, 246, 1)",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: {
          color: "rgba(148, 163, 184, 0.1)",
        },
        ticks: {
          color: "#94a3b8",
        },
      },
      y: {
        beginAtZero: true,
        max: 100,
        grid: {
          color: "rgba(148, 163, 184, 0.1)",
        },
        ticks: {
          color: "#94a3b8",
          callback: function (value: any) {
            return value + "%";
          },
        },
      },
    },
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          color: "#94a3b8",
          padding: 15,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        backgroundColor: "rgba(15, 23, 42, 0.9)",
        titleColor: "#f1f5f9",
        bodyColor: "#cbd5e1",
        borderColor: "rgba(59, 130, 246, 0.5)",
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label: function (context: any) {
            return (
              context.dataset.label + ": " + context.parsed.y.toFixed(1) + "%"
            );
          },
        },
      },
    },
  };

  return (
    <div className="h-64">
      <Line data={data} options={options} />
    </div>
  );
};
