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

import type { PGSDemoResponse } from "../../types/api";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface PGSPanelProps {
  result: PGSDemoResponse | null;
  className?: string;
}

const generateReferenceDistribution = () => {
  const bins: number[] = [];
  const labels: string[] = [];
  const step = 0.4;
  for (let i = -3; i <= 3; i += step) {
    const z = i + step / 2;
    const probability = (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-(z ** 2) / 2);
    bins.push(probability);
    labels.push(z.toFixed(1));
  }
  const max = Math.max(...bins);
  return {
    labels,
    values: bins.map((value) => value / max),
  };
};

const referenceDistribution = generateReferenceDistribution();

const PGSPanel: React.FC<PGSPanelProps> = ({ result, className = "" }) => {
  const chartData = useMemo(() => {
    const baselineDataset = {
      label: "Reference",
      data: referenceDistribution.values,
      backgroundColor: "rgba(156, 163, 175, 0.4)",
      borderColor: "rgba(107, 114, 128, 0.8)",
      borderWidth: 1,
      borderRadius: 4,
      barPercentage: 1.0,
    };

    if (!result) {
      return {
        labels: referenceDistribution.labels,
        datasets: [baselineDataset],
      };
    }

    const nearestIndex = referenceDistribution.labels.reduce((best, label, index) => {
      const distance = Math.abs(parseFloat(label) - result.z_score);
      const bestDistance = Math.abs(parseFloat(referenceDistribution.labels[best]) - result.z_score);
      return distance < bestDistance ? index : best;
    }, 0);

    const highlight = referenceDistribution.labels.map((_, index) =>
      index === nearestIndex ? 1 : 0,
    );

    return {
      labels: referenceDistribution.labels,
      datasets: [
        baselineDataset,
        {
          label: "Your score",
          data: highlight,
          backgroundColor: "rgba(59, 130, 246, 0.8)",
          borderColor: "rgb(59, 130, 246)",
          borderWidth: 1,
          borderRadius: 4,
          barPercentage: 1.0,
        },
      ],
    };
  }, [result]);

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: "Reference distribution (z-score)",
          font: { size: 14, weight: "bold" as const },
          color: "#1f2937",
        },
        tooltip: {
          callbacks: {
            title: (items: any[]) => `z = ${items[0].label}`,
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { display: false },
          grid: { display: false },
        },
        x: {
          ticks: { color: "#6B7280" },
          grid: { display: false },
        },
      },
    }),
    [result],
  );

  if (!result) {
    return (
      <div className={`rounded-lg border border-slate-200 bg-white p-4 shadow-sm ${className}`}>
        <p className="text-sm text-slate-600">
          Upload SNP weights and genotype information to compute a polygenic score.
        </p>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border border-slate-200 bg-white p-4 shadow-sm ${className}`}>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3 text-sm text-slate-700">
          <div className="rounded border border-blue-200 bg-blue-50 px-3 py-2">
            <div className="text-xs uppercase tracking-wide text-blue-700">Raw score</div>
            <div className="text-xl font-semibold text-blue-800">
              {result.raw_score.toFixed(4)}
            </div>
          </div>
          <div className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2">
            <div className="text-xs uppercase tracking-wide text-emerald-700">Z-score</div>
            <div className="text-xl font-semibold text-emerald-800">
              {result.z_score.toFixed(2)}
            </div>
          </div>
          <div className="rounded border border-amber-200 bg-amber-50 px-3 py-2">
            <div className="text-xs uppercase tracking-wide text-amber-700">Percentile</div>
            <div className="text-xl font-semibold text-amber-800">
              {result.percentile.toFixed(1)}%
            </div>
          </div>
          <div className="text-xs text-slate-500">
            Used SNPs: {result.used_snps.length} • Missing: {result.missing_snps.length}
          </div>
          {result.warnings.map((warning) => (
            <div key={warning} className="rounded border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-700">
              ⚠️ {warning}
            </div>
          ))}
        </div>
        <div className="h-64">
          <Bar data={chartData} options={chartOptions} />
        </div>
      </div>
      {result.missing_snps.length > 0 && (
        <div className="mt-4 rounded border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
          Missing markers ({result.missing_snps.length}): {result.missing_snps.slice(0, 10).join(", ")}
          {result.missing_snps.length > 10 && "…"}
        </div>
      )}
      <div className="mt-3 text-[11px] text-slate-500">
        This GWAS-lite demonstration is an educational approximation and should not be
        interpreted as medical guidance.
      </div>
    </div>
  );
};

export default PGSPanel;

