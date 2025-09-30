import React from "react";
import { getAboGenotypeMap } from "./helpers";

interface GenotypeStatusProps {
  parent1Genotype: string;
  parent2Genotype: string;
  traitKey?: string;
}

const GenotypeStatus: React.FC<GenotypeStatusProps> = ({
  parent1Genotype,
  parent2Genotype,
  traitKey,
}) => {
  const ready = !!parent1Genotype && !!parent2Genotype;
  let displayParent1 = parent1Genotype;
  let displayParent2 = parent2Genotype;
  if (traitKey === "abo_blood_group") {
    const aboMap = getAboGenotypeMap();
    displayParent1 = aboMap[parent1Genotype] || parent1Genotype;
    displayParent2 = aboMap[parent2Genotype] || parent2Genotype;
  }
  return ready ? (
    <div className="mt-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
      <div className="flex items-center justify-center space-x-2">
        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
          <span className="text-white text-xs font-bold">✓</span>
        </div>
        <span className="text-sm font-semibold text-green-800">
          Ready for simulation: {displayParent1} × {displayParent2}
        </span>
      </div>
    </div>
  ) : (
    <div className="mt-4 p-3 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl">
      <div className="flex items-center justify-center space-x-2">
        <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center">
          <span className="text-white text-xs font-bold">!</span>
        </div>
        <span className="text-sm font-medium text-amber-800">
          Please select both parent genotypes to continue
        </span>
      </div>
    </div>
  );
};

export default GenotypeStatus;
