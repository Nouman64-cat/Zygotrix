import React from "react";

interface GenotypicRatiosProps {
  genotypicRatios: Record<string, number>;
  traitKey?: string;
}

const GenotypicRatios: React.FC<GenotypicRatiosProps> = ({
  genotypicRatios,
  traitKey,
}) => {
  if (traitKey === "abo_blood_group") {
    const genotypeMap: Record<string, string> = {
      AB: "IᴬIᴮ",
      AO: "Iᴬi",
      BO: "Iᴮi",
      OO: "ii",
    };
    const order = ["AB", "AO", "BO", "OO"];
    return (
      <div className="grid grid-cols-2 gap-2 bg-blue-50/30 rounded-lg p-3 border border-blue-100 mb-4">
        {order.map((backendGenotype) => (
          <div
            key={backendGenotype}
            className="flex flex-col items-center justify-center p-2"
          >
            <span
              style={{ fontSize: "1.25em", fontWeight: 600, color: "#1e293b" }}
            >
              {genotypeMap[backendGenotype]}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="space-y-2 bg-blue-50/30 rounded-lg p-3 border border-blue-100">
      {Object.entries(genotypicRatios).map(([genotype, percentage]) => (
        <div key={genotype} className="flex items-center gap-3">
          <div className="w-24 text-xs">
            <div className="font-medium text-gray-800">{genotype}</div>
          </div>
          <div className="flex-1 h-3 bg-white rounded-full overflow-hidden border border-blue-100">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all"
              style={{ width: `${Math.max(percentage, 2)}%` }}
            />
          </div>
          <div className="w-12 text-right text-xs font-semibold text-blue-600">
            {`${percentage.toFixed(1)}%`}
          </div>
        </div>
      ))}
    </div>
  );
};

export default GenotypicRatios;
