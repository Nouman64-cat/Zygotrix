import React from "react";
import { SparklesIcon, TrashIcon } from "@heroicons/react/24/outline";
import type { SelectedTraitHeaderProps } from "./types";

const SelectedTraitHeader: React.FC<SelectedTraitHeaderProps> = ({
  selectedTrait,
  traits,
  onRemove,
}) => {
  const traitInfo = traits.find((t) => t.key === selectedTrait.key);
  return (
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
          <SparklesIcon className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <h4 className="font-bold text-gray-900 text-base">
              {selectedTrait.name}
            </h4>
            {traitInfo?.gene && traitInfo?.chromosome && (
              <div className="flex items-center space-x-1">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                  {traitInfo.gene}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                  Chr {traitInfo.chromosome}
                </span>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500">
            <span className="font-medium">Alleles:</span>{" "}
            {selectedTrait.key === "abo_blood_group"
              ? (() => {
                  const alleleMap: Record<string, string> = {
                    A: "Iᴬ",
                    B: "Iᴮ",
                    O: "i",
                  };
                  return selectedTrait.alleles
                    .map((a: string) => alleleMap[a] || a)
                    .join(", ");
                })()
              : selectedTrait.alleles.join(", ")}
            {traitInfo?.inheritance_pattern && (
              <span className="ml-2">
                | <span className="font-medium">Inheritance:</span>{" "}
                <span className="capitalize">
                  {selectedTrait.key === "rh_factor"
                    ? "Rh+ is dominant over Rh-"
                    : traitInfo.inheritance_pattern}
                </span>
              </span>
            )}
          </p>
        </div>
      </div>
      <button
        onClick={() => onRemove(selectedTrait.key)}
        className="p-2.5 text-red-400 cursor-pointer hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 hover:scale-105"
      >
        <TrashIcon className="h-5 w-5" />
      </button>
    </div>
  );
};

export default SelectedTraitHeader;
