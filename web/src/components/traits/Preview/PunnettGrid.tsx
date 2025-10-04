import React from "react";

import type { GameteProbability, PunnettCell } from "../../../types/api";

type PunnettGridProps = {
  p1Gametes: GameteProbability[];
  p2Gametes: GameteProbability[];
  grid: PunnettCell[][];
  asPercentages: boolean;
};

const formatProbability = (value: number, asPercentages: boolean) =>
  asPercentages ? `${value.toFixed(2)}%` : value.toFixed(3);

const toProbability = (value: number, asPercentages: boolean) =>
  asPercentages ? value / 100 : value;

const PunnettGrid: React.FC<PunnettGridProps> = ({
  p1Gametes,
  p2Gametes,
  grid,
  asPercentages,
}) => {
  if (!p1Gametes.length || !p2Gametes.length || !grid.length) {
    return null;
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="w-20" />
            {p2Gametes.map((gamete) => (
              <th
                key={`p2-${gamete.allele}`}
                className="px-3 py-2 text-sm font-medium text-gray-600 text-center"
              >
                <div className="font-mono text-base">{gamete.allele}</div>
                <div className="text-xs text-gray-500">
                  {formatProbability(gamete.probability, asPercentages)}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {grid.map((row, rowIndex) => {
            const p1Gamete = p1Gametes[rowIndex];
            return (
              <tr key={`row-${rowIndex}`} className="hover:bg-green-50/40">
                <th className="px-3 py-2 text-sm font-medium text-gray-600 text-center bg-gray-50">
                  <div className="font-mono text-base">{p1Gamete?.allele}</div>
                  <div className="text-xs text-gray-500">
                    {p1Gamete
                      ? formatProbability(p1Gamete.probability, asPercentages)
                      : ""}
                  </div>
                </th>
                {row.map((cell, columnIndex) => {
                  const parent1Prob = p1Gamete
                    ? toProbability(p1Gamete.probability, asPercentages)
                    : 0;
                  const parent2Prob = p2Gametes[columnIndex]
                    ? toProbability(p2Gametes[columnIndex].probability, asPercentages)
                    : 0;
                  const product = parent1Prob * parent2Prob;

                  return (
                    <td
                      key={`cell-${rowIndex}-${columnIndex}`}
                      className="px-3 py-2 text-center border-l border-gray-100 align-middle"
                      title={`Gametes ${cell.parent1_allele} × ${cell.parent2_allele}\n${formatProbability(
                        p1Gamete?.probability ?? 0,
                        asPercentages,
                      )} × ${formatProbability(
                        p2Gametes[columnIndex]?.probability ?? 0,
                        asPercentages,
                      )} = ${formatProbability(
                        asPercentages ? product * 100 : product,
                        asPercentages,
                      )}`}
                    >
                      <div className="font-mono text-base text-gray-800">
                        {cell.genotype}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatProbability(cell.probability, asPercentages)}
                      </div>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default PunnettGrid;

