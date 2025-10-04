import React from "react";

type DistributionBarsProps = {
  genotype: Record<string, number>;
  phenotype: Record<string, number>;
  asPercentages: boolean;
};

const formatProbability = (value: number, asPercentages: boolean) =>
  asPercentages ? `${value.toFixed(2)}%` : value.toFixed(3);

const computeWidth = (value: number, asPercentages: boolean) =>
  `${(asPercentages ? value : value * 100).toFixed(2)}%`;

const renderBars = (
  distribution: Record<string, number>,
  label: string,
  asPercentages: boolean,
) => (
  <div className="space-y-2">
    <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
      {label}
    </h4>
    <div className="space-y-2">
      {Object.entries(distribution).map(([key, value]) => (
        <div key={key} className="flex items-center gap-3">
          <span className="w-20 text-xs font-mono text-gray-600">{key}</span>
          <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-400 to-purple-600"
              style={{ width: computeWidth(value, asPercentages) }}
            />
          </div>
          <span className="w-16 text-xs text-gray-600 text-right">
            {formatProbability(value, asPercentages)}
          </span>
        </div>
      ))}
    </div>
  </div>
);

const DistributionBars: React.FC<DistributionBarsProps> = ({
  genotype,
  phenotype,
  asPercentages,
}) => (
  <div className="border border-gray-200 rounded-lg p-4 bg-white">
    <h3 className="text-sm font-semibold text-gray-700 mb-3">
      Outcome Distributions
    </h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {renderBars(genotype, "Genotypes", asPercentages)}
      {renderBars(phenotype, "Phenotypes", asPercentages)}
    </div>
  </div>
);

export default DistributionBars;

