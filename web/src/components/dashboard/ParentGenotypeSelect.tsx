import { getAboGenotypeMap } from "./helpers";
import React from "react";

interface ParentGenotypeSelectProps {
  label: string;
  value: string;
  options: string[];
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  phenotypeMap: Record<string, string>;
}

const ParentGenotypeSelect: React.FC<ParentGenotypeSelectProps> = ({
  value,
  options,
  onChange,
  phenotypeMap,
}) => (
  <select
    value={value}
    onChange={onChange}
    className="w-full rounded-lg border-2 border-gray-200 focus:border-purple-400 focus:ring-2 cursor-pointer focus:ring-purple-200 bg-white py-4 px-1 text-gray-700 font-semibold shadow-sm transition-all duration-200"
  >
    <option value="">Select genotype</option>
    {options.map((opt) => {
      // Detect ABO trait by genotype format
      let displayOpt = opt;
      let displayPheno = phenotypeMap[opt] || "";
      // If ABO genotype (A, B, O alleles)
      const isAbo = [
        "AA",
        "AO",
        "OA",
        "BB",
        "BO",
        "OB",
        "AB",
        "BA",
        "OO",
      ].includes(opt);
      if (isAbo) {
        const aboMap = getAboGenotypeMap();
        // Try all permutations for mapping
        displayOpt =
          aboMap[opt] || aboMap[opt.split("").sort().join("")] || opt;
      }
      return (
        <option key={opt} value={opt}>
          {displayOpt}
          {displayPheno ? ` → ${displayPheno}` : ""}
        </option>
      );
    })}
  </select>
);

export default ParentGenotypeSelect;
