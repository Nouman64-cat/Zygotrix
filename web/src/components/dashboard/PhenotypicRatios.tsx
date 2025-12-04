import React from "react";

interface PhenotypicRatiosProps {
  phenotypicRatios: Record<string, number>;
}

const PhenotypicRatios: React.FC<PhenotypicRatiosProps> = ({
  phenotypicRatios,
}) => (
  <div>
    <h5 className="text-sm font-semibold text-gray-800 dark:text-slate-200 mb-2 flex items-center">
      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
      <span>Phenotypic Ratios</span>
    </h5>
    <div className="space-y-2 bg-green-50/30 dark:bg-green-900/20 rounded-lg p-3 border border-green-100 dark:border-green-800/50">
      {Object.entries(phenotypicRatios).map(([phenotype, percentage]) => (
        <div key={phenotype} className="flex items-center gap-3">
          <div className="w-28 text-xs">
            <div className="font-semibold text-gray-800 dark:text-slate-200">
              {phenotype}
            </div>
          </div>
          <div className="flex-1 h-3 bg-white dark:bg-slate-700 rounded-full overflow-hidden border border-green-100 dark:border-green-800/50">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all"
              style={{ width: `${Math.max(percentage, 2)}%` }}
            />
          </div>
          <div className="w-12 text-right text-xs font-semibold text-green-600 dark:text-green-400">
            {`${percentage.toFixed(1)}%`}
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default PhenotypicRatios;
