import React from "react";
import { getAboGenotypeMap, getRhGenotypeMap } from "./helpers";

interface PunnettSquareProps {
  parent1Genotype: string;
  parent2Genotype: string;
  phenotypeMap: Record<string, string>;
  className?: string;
}

const PunnettSquare: React.FC<PunnettSquareProps> = ({
  parent1Genotype,
  parent2Genotype,
  phenotypeMap,
  className = "",
}) => {
  // Helper: detect if trait is Rh
  const isRh =
    parent1Genotype.startsWith("Rh") || parent2Genotype.startsWith("Rh");

  // Extract alleles from genotypes
  const parent1Alleles = isRh
    ? [parent1Genotype.slice(0, 3), parent1Genotype.slice(3)]
    : parent1Genotype.split("");
  const parent2Alleles = isRh
    ? [parent2Genotype.slice(0, 3), parent2Genotype.slice(3)]
    : parent2Genotype.split("");

  // Generate all possible offspring combinations
  const generateOffspring = () => {
    const offspring = [];
    for (const allele1 of parent1Alleles) {
      for (const allele2 of parent2Alleles) {
        let genotype = isRh
          ? allele1 + allele2
          : [allele1, allele2].sort().join("");
        let phenotype = phenotypeMap[genotype] || "Unknown";
        if (isRh) {
          const rhMap = getRhGenotypeMap();
          if (rhMap[genotype]) {
            phenotype = rhMap[genotype].phenotype;
            genotype = rhMap[genotype].display;
          }
        }
        offspring.push({
          genotype,
          phenotype,
        });
      }
    }
    return offspring;
  };

  const offspring = generateOffspring();

  // Calculate phenotype frequencies
  const phenotypeFreq: Record<string, number> = {};
  offspring.forEach(({ phenotype }) => {
    phenotypeFreq[phenotype] = (phenotypeFreq[phenotype] || 0) + 1;
  });

  const totalOffspring = offspring.length;
  const phenotypePercentages = Object.entries(phenotypeFreq).map(
    ([phenotype, count]) => ({
      phenotype,
      count,
      percentage: (count / totalOffspring) * 100,
    })
  );

  const getPhenotypeBadgeColor = (phenotype: string) => {
    const normalized = phenotype.toLowerCase();
    if (normalized.includes("brown")) return "bg-amber-100 text-amber-800";
    if (normalized.includes("blue")) return "bg-blue-100 text-blue-800";
    if (normalized.includes("green")) return "bg-green-100 text-green-800";
    if (normalized.includes("red")) return "bg-red-100 text-red-800";
    if (normalized.includes("dimples")) return "bg-purple-100 text-purple-800";
    if (normalized.includes("no dimples")) return "bg-gray-100 text-gray-800";
    return "bg-slate-100 text-slate-800";
  };

  return (
    <div
      className={`bg-white rounded-lg shadow-sm border border-slate-200 p-6 ${className}`}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h3 className="text-lg font-semibold text-slate-900">
            Punnett Square
          </h3>
          <p className="text-sm text-slate-600">
            {parent1Genotype} × {parent2Genotype}
          </p>
        </div>

        {/* Punnett Square Grid */}
        <div className="flex justify-center">
          <div className="grid grid-cols-3 gap-1 border-2 border-slate-300 rounded-lg overflow-hidden">
            {/* Empty top-left cell */}
            <div className="w-16 h-16 bg-slate-100 border border-slate-300 flex items-center justify-center">
              <span className="text-xs text-slate-500">×</span>
            </div>

            {/* Parent 2 alleles header */}
            {parent2Alleles.map((allele, index) => (
              <div
                key={index}
                className="w-16 h-16 bg-blue-100 border border-slate-300 flex items-center justify-center"
              >
                <span className="font-mono font-semibold text-blue-800">
                  {isRh ? allele : allele}
                </span>
              </div>
            ))}

            {/* Parent 1 alleles and offspring cells */}
            {parent1Alleles.map((allele1, i) => (
              <React.Fragment key={i}>
                {/* Parent 1 allele */}
                <div className="w-16 h-16 bg-green-100 border border-slate-300 flex items-center justify-center">
                  <span className="font-mono font-semibold text-green-800">
                    {isRh ? allele1 : allele1}
                  </span>
                </div>

                {/* Offspring combinations */}
                {parent2Alleles.map((allele2, j) => {
                  let genotype = isRh
                    ? allele1 + allele2
                    : [allele1, allele2].sort().join("");
                  let phenotype = phenotypeMap[genotype] || "Unknown";
                  if (isRh) {
                    const rhMap = getRhGenotypeMap();
                    if (rhMap[genotype]) {
                      phenotype = rhMap[genotype].phenotype;
                      genotype = rhMap[genotype].display;
                    }
                  }
                  return (
                    <div
                      key={j}
                      className="w-16 h-16 bg-white border border-slate-300 flex flex-col items-center justify-center p-1"
                    >
                      <span className="font-mono text-xs font-medium text-slate-800">
                        {genotype}
                      </span>
                      <span className="text-[10px] text-slate-600 text-center leading-tight">
                        {phenotype.length > 8
                          ? phenotype.substring(0, 8) + "..."
                          : phenotype}
                      </span>
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Phenotype Summary */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-slate-700">
            Expected Offspring Ratios:
          </h4>
          <div className="space-y-2">
            {phenotypePercentages.map(({ phenotype, count, percentage }) => (
              <div
                key={phenotype}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getPhenotypeBadgeColor(
                      phenotype
                    )}`}
                  >
                    {phenotype}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-slate-600">
                    {count}/{totalOffspring}
                  </span>
                  <span className="font-mono font-medium text-slate-800">
                    {percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ratio Summary */}
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <p className="text-sm font-medium text-blue-800">
            Phenotype Ratio:{" "}
            {phenotypePercentages.map((p) => p.count).join(":")}
          </p>
          <p className="text-xs text-blue-600 mt-1">
            Based on {totalOffspring} possible offspring combinations
          </p>
        </div>
      </div>
    </div>
  );
};

export default PunnettSquare;
