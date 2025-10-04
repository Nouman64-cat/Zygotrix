import React, { useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

import type { PopulationTraitResult } from "../../types/api";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface CohortChartProps {
  result: PopulationTraitResult;
  className?: string;
}

const CohortChart: React.FC<CohortChartProps> = ({ result, className = "" }) => {
  const chartData = useMemo(() => {
    const phenotypes = Object.keys(result.phenotype_counts);
    return {
      labels: phenotypes,
      datasets: [
        {
          label: "Individuals",
          data: phenotypes.map((key) => result.phenotype_counts[key] || 0),
          backgroundColor: "rgba(59, 130, 246, 0.7)",
          borderColor: "rgb(59, 130, 246)",
          borderWidth: 1,
          borderRadius: 8,
          borderSkipped: false,
        },
      ],
    };
  }, [result]);

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: `${result.trait_key.replace(/_/g, " ")} – ${result.population}`,
          color: "#1f2937",
          font: { size: 14, weight: "bold" as const },
        },
        tooltip: {
          callbacks: {
            label: (context: any) => {
              const count = context.parsed.y;
              const n = result.sample_size;
              const percentage = n ? ((count / n) * 100).toFixed(2) : "0.00";
              return `${count} individuals (${percentage}%)`;
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            color: "#6B7280",
          },
          grid: {
            color: "rgba(209, 213, 219, 0.4)",
          },
        },
        x: {
          ticks: {
            color: "#6B7280",
          },
          grid: { display: false },
        },
      },
    }),
    [result],
  );

  return (
    <div className={`rounded-lg border border-slate-200 bg-white p-4 shadow-sm ${className}`}>
      <div className="h-64">
        <Bar data={chartData} options={options} />
      </div>
      <div className="mt-4 space-y-2 text-xs text-slate-600">
        <div>Sample size: {result.sample_size.toLocaleString()}</div>
        {Object.entries(result.phenotype_ci).map(([phenotype, ci]) => (
          <div key={phenotype}>
            {phenotype}: CI [{(ci.lower * 100).toFixed(1)}%, {(ci.upper * 100).toFixed(1)}%]
          </div>
        ))}
        {result.warnings.map((warning) => (
          <div key={warning} className="text-amber-600">
            ⚠️ {warning}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CohortChart;

