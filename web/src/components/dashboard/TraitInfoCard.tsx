import React from "react";
import type { TraitInfo } from "../../types/api";

interface TraitInfoCardProps {
  traitInfo: TraitInfo;
}

const TraitInfoCard: React.FC<TraitInfoCardProps> = ({ traitInfo }) => (
  <div className="mt-2 p-3 bg-slate-50 rounded-md">
    <div className="flex items-center gap-2 mb-2">
      <span className="text-sm font-medium text-slate-700">
        {traitInfo.name}
      </span>
      {traitInfo.verification_status && (
        <span
          className={`text-xs px-2 py-1 rounded-full ${
            traitInfo.verification_status === "verified"
              ? "bg-green-100 text-green-700"
              : "bg-amber-100 text-amber-700"
          }`}
        >
          {traitInfo.verification_status}
        </span>
      )}
      {traitInfo.inheritance_pattern && (
        <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
          {traitInfo.inheritance_pattern.replace("_", " ")}
        </span>
      )}
    </div>
    <p className="text-xs text-slate-600">{traitInfo.description}</p>
    <div className="mt-2 flex gap-2">
      <span className="text-xs text-slate-500">Alleles:</span>
      {traitInfo.alleles.map((allele) => (
        <span
          key={allele}
          className="text-xs bg-slate-200 px-2 py-1 rounded font-mono"
        >
          {allele}
        </span>
      ))}
    </div>
  </div>
);

export default TraitInfoCard;
