import React from "react";

interface SelectedTraitCardProps {
  traitName: string;
  parent1Genotype: string;
  parent2Genotype: string;
  onRemove: () => void;
  children?: React.ReactNode;
}

const SelectedTraitCard: React.FC<SelectedTraitCardProps> = ({
  traitName,
  parent1Genotype,
  parent2Genotype,
  onRemove,
  children,
}) => (
  <div className="rounded-lg border border-gray-200 bg-white p-4 mb-4 shadow-sm">
    <div className="flex items-center justify-between mb-2">
      <span className="font-semibold text-gray-800">{traitName}</span>
      <button
        className="text-xs text-red-500 hover:underline"
        onClick={onRemove}
        title="Remove trait"
      >
        Remove
      </button>
    </div>
    <div className="flex gap-4 mb-2">
      <span className="text-xs text-gray-600">
        Parent 1: {parent1Genotype || "-"}
      </span>
      <span className="text-xs text-gray-600">
        Parent 2: {parent2Genotype || "-"}
      </span>
    </div>
    {children}
  </div>
);

export default SelectedTraitCard;
