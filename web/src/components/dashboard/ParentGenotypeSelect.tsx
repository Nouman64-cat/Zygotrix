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
    className="w-full rounded-lg border-2 border-gray-200 dark:border-slate-600 focus:border-purple-400 dark:focus:border-purple-500 focus:ring-2 cursor-pointer focus:ring-purple-200 dark:focus:ring-purple-800 bg-white dark:bg-slate-800 py-3 px-1 text-gray-700 dark:text-slate-200 font-semibold shadow-sm transition-all duration-200 text-xs"
  >
    <option value="" className="text-xs dark:bg-slate-800">
      Select genotype
    </option>
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
        <option key={opt} value={opt} className="text-xs dark:bg-slate-800">
          {displayOpt}
          {displayPheno ? ` → ${displayPheno}` : ""}
        </option>
      );
    })}
  </select>
);

export default ParentGenotypeSelect;
