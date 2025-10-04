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
  colorScheme: "genotype" | "phenotype"
) => {
  const entries = Object.entries(distribution);
  const maxValue = Math.max(...entries.map(([, value]) => value));

  const getColorClasses = (index: number) => {
    if (colorScheme === "genotype") {
      const colors = [
        "from-blue-400 to-blue-600",
        "from-indigo-400 to-indigo-600",
        "from-purple-400 to-purple-600",
        "from-pink-400 to-pink-600",
        "from-rose-400 to-rose-600",
      ];
      return colors[index % colors.length];
    } else {
      const colors = [
        "from-emerald-400 to-emerald-600",
        "from-teal-400 to-teal-600",
        "from-cyan-400 to-cyan-600",
        "from-sky-400 to-sky-600",
        "from-amber-400 to-amber-600",
      ];
      return colors[index % colors.length];
    }
  };

  const iconForType =
    colorScheme === "genotype" ? (
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
        />
      </svg>
    ) : (
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
        />
      </svg>
    );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div
          className={`p-1.5 rounded-lg ${
            colorScheme === "genotype"
              ? "bg-blue-100 text-blue-600"
              : "bg-emerald-100 text-emerald-600"
          }`}
        >
          {iconForType}
        </div>
        <h4 className="text-sm font-semibold text-gray-700">{label}</h4>
        <span className="text-xs text-gray-500">
          ({entries.length} {entries.length === 1 ? "type" : "types"})
        </span>
      </div>
      <div className="space-y-3">
        {entries.map(([key, value], index) => {
          const isMaxValue = value === maxValue && maxValue > 0;
          return (
            <div key={key} className="group">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-mono font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
                  {key}
                </span>
                <div className="flex items-center gap-2">
                  {isMaxValue && (
                    <div className="flex items-center gap-1 px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded text-[10px] font-medium">
                      <svg
                        className="w-3 h-3"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      Most likely
                    </div>
                  )}
                  <span className="text-sm font-semibold text-gray-600 min-w-[3rem] text-right">
                    {formatProbability(value, asPercentages)}
                  </span>
                </div>
              </div>
              <div className="relative">
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${getColorClasses(
                      index
                    )} transition-all duration-500 ease-out group-hover:shadow-md`}
                    style={{ width: computeWidth(value, asPercentages) }}
                  />
                </div>
                {isMaxValue && (
                  <div className="absolute -top-1 right-0 w-2 h-2 bg-yellow-400 rounded-full border border-yellow-500 animate-pulse" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const DistributionBars: React.FC<DistributionBarsProps> = ({
  genotype,
  phenotype,
  asPercentages,
}) => (
  <div className="border border-gray-200 rounded-xl p-6 bg-white shadow-sm">
    <div className="flex items-center gap-3 mb-6">
      <div className="p-2 bg-gradient-to-br from-purple-100 to-blue-100 rounded-xl">
        <svg
          className="w-5 h-5 text-purple-600"
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
      </div>
      <div>
        <h3 className="text-lg font-semibold text-gray-800">
          Outcome Distributions
        </h3>
        <p className="text-sm text-gray-600">
          Probability breakdown for offspring traits
        </p>
      </div>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {renderBars(genotype, "Genotypes", asPercentages, "genotype")}
      {renderBars(phenotype, "Phenotypes", asPercentages, "phenotype")}
    </div>
  </div>
);

export default DistributionBars;
