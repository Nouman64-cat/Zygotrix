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
    return (
      <div className="border border-gray-200 rounded-lg p-8 bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-200 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
          </div>
          <p className="text-sm text-gray-500">
            Punnett square will appear here once parents are configured
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 border-b border-gray-200">
        <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
          <svg
            className="w-4 h-4 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
          Punnett Square
        </h4>
        <p className="text-xs text-gray-600 mt-1">
          Cross offspring probabilities
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="relative w-20 h-16">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50"></div>
                <div className="relative z-10 flex items-center justify-center h-full">
                  <span className="text-xs font-medium text-gray-500">×</span>
                </div>
              </th>
              {p2Gametes.map((gamete) => (
                <th
                  key={`p2-${gamete.allele}`}
                  className="relative px-4 py-3 bg-gradient-to-b from-emerald-50 to-emerald-100 border-r border-emerald-200 last:border-r-0"
                >
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-10 h-10 mb-2 bg-white rounded-full border-2 border-emerald-300 shadow-sm">
                      <span className="font-mono text-lg font-bold text-emerald-700">
                        {gamete.allele}
                      </span>
                    </div>
                    <div className="text-xs font-medium text-emerald-600">
                      {formatProbability(gamete.probability, asPercentages)}
                    </div>
                    <div className="text-[10px] text-emerald-500 mt-1">
                      Parent 2
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grid.map((row, rowIndex) => {
              const p1Gamete = p1Gametes[rowIndex];
              return (
                <tr
                  key={`row-${rowIndex}`}
                  className="group hover:bg-blue-50/30 transition-colors duration-200"
                >
                  <th className="relative px-4 py-3 bg-gradient-to-r from-purple-50 to-purple-100 border-b border-purple-200">
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-10 h-10 mb-2 bg-white rounded-full border-2 border-purple-300 shadow-sm">
                        <span className="font-mono text-lg font-bold text-purple-700">
                          {p1Gamete?.allele}
                        </span>
                      </div>
                      <div className="text-xs font-medium text-purple-600">
                        {p1Gamete
                          ? formatProbability(
                              p1Gamete.probability,
                              asPercentages
                            )
                          : ""}
                      </div>
                      <div className="text-[10px] text-purple-500 mt-1">
                        Parent 1
                      </div>
                    </div>
                  </th>
                  {row.map((cell, columnIndex) => {
                    const parent1Prob = p1Gamete
                      ? toProbability(p1Gamete.probability, asPercentages)
                      : 0;
                    const parent2Prob = p2Gametes[columnIndex]
                      ? toProbability(
                          p2Gametes[columnIndex].probability,
                          asPercentages
                        )
                      : 0;
                    const product = parent1Prob * parent2Prob;
                    const probabilityValue = asPercentages
                      ? cell.probability
                      : cell.probability / 100;

                    return (
                      <td
                        key={`cell-${rowIndex}-${columnIndex}`}
                        className="relative px-4 py-4 text-center border-r border-b border-gray-100 last:border-r-0 group-hover:bg-white/50 transition-all duration-200 cursor-help"
                        title={`Cross: ${cell.parent1_allele} × ${
                          cell.parent2_allele
                        }\nProbability: ${formatProbability(
                          p1Gamete?.probability ?? 0,
                          asPercentages
                        )} × ${formatProbability(
                          p2Gametes[columnIndex]?.probability ?? 0,
                          asPercentages
                        )} = ${formatProbability(
                          asPercentages ? product * 100 : product,
                          asPercentages
                        )}`}
                      >
                        <div className="space-y-2">
                          <div className="inline-flex items-center justify-center min-w-[3rem] h-8 px-2 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200 group-hover:from-blue-50 group-hover:to-blue-100 group-hover:border-blue-200 transition-all duration-200">
                            <span className="font-mono text-sm font-bold text-gray-800 group-hover:text-blue-800">
                              {cell.genotype}
                            </span>
                          </div>
                          <div className="space-y-1">
                            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-300"
                                style={{
                                  width: `${Math.min(
                                    100,
                                    probabilityValue * 100
                                  )}%`,
                                }}
                              />
                            </div>
                            <div className="text-xs font-medium text-gray-600">
                              {formatProbability(
                                cell.probability,
                                asPercentages
                              )}
                            </div>
                          </div>
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
    </div>
  );
};

export default PunnettGrid;
