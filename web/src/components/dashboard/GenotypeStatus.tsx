import React from "react";

interface GenotypeStatusProps {
  parent1Genotype: string;
  parent2Genotype: string;
}

const GenotypeStatus: React.FC<GenotypeStatusProps> = ({
  parent1Genotype,
  parent2Genotype,
}) => {
  const ready = !!parent1Genotype && !!parent2Genotype;
  return ready ? (
    <div className="mt-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
      <div className="flex items-center justify-center space-x-2">
        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
          <span className="text-white text-xs font-bold">✓</span>
        </div>
        <span className="text-sm font-semibold text-green-800">
          Ready for simulation: {parent1Genotype} × {parent2Genotype}
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
