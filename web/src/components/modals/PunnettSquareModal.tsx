import React from "react";
import { getAboGenotypeMap } from "../dashboard/helpers";

interface PunnettSquareModalProps {
  open: boolean;
  onClose: () => void;
  parent1Genotype: string;
  parent2Genotype: string;
  alleles: string[];
  traitName: string;
}

// Utility to generate Punnett square grid
function getPunnettSquare(parent1: string, parent2: string) {
  if (parent1.length !== 2 || parent2.length !== 2) return [];
  const p1 = [parent1[0], parent1[1]];
  const p2 = [parent2[0], parent2[1]];
  return [
    [p1[0] + p2[0], p1[0] + p2[1]],
    [p1[1] + p2[0], p1[1] + p2[1]],
  ];
}

const PunnettSquareModal: React.FC<PunnettSquareModalProps> = ({
  open,
  onClose,
  parent1Genotype,
  parent2Genotype,
  alleles,
  traitName,
}) => {
  if (!open) return null;
  const grid = getPunnettSquare(parent1Genotype, parent2Genotype);
  const isAbo = traitName.toLowerCase().includes("abo");
  const genotypeMap = getAboGenotypeMap();
  // Helper to format genotype in I notation if ABO
  function formatGenotype(genotype: string) {
    if (!isAbo) return genotype;
    // Try all permutations for mapping
    const sorted = genotype.split("").sort().join("");
    // Map to backend keys
    if (genotypeMap[genotype]) return genotypeMap[genotype];
    if (genotypeMap[sorted]) return genotypeMap[sorted];
    // Try to match AO, OA, BO, OB, etc.
    if (["AO", "OA"].includes(genotype)) return genotypeMap["AO"];
    if (["BO", "OB"].includes(genotype)) return genotypeMap["BO"];
    if (["AB", "BA"].includes(genotype)) return genotypeMap["AB"];
    if (["AA"].includes(genotype)) return genotypeMap["AA"];
    if (["BB"].includes(genotype)) return genotypeMap["BB"];
    if (["OO"].includes(genotype)) return genotypeMap["OO"];
    return genotype;
  }
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      style={{ fontFamily: "Axiforma, sans-serif" }}
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <h2 className="text-xl font-bold text-gray-900">
            How these results? — {traitName}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 cursor-pointer hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="mb-4 text-sm text-gray-700">
            This Punnett square shows all possible genotype combinations for the
            selected cross.
          </div>
          <div className="flex flex-col items-center">
            <div className="grid grid-cols-3 grid-rows-3 gap-0 border border-blue-200 rounded overflow-hidden">
              <div className="bg-blue-50"></div>
              <div className="bg-blue-100 font-semibold flex items-center justify-center min-w-[60px] min-h-[40px]">
                {formatGenotype(parent2Genotype[0])}
              </div>
              <div className="bg-blue-100 font-semibold flex items-center justify-center min-w-[60px] min-h-[40px]">
                {formatGenotype(parent2Genotype[1])}
              </div>
              <div className="bg-blue-100 font-semibold flex items-center justify-center min-w-[60px] min-h-[40px]">
                {formatGenotype(parent1Genotype[0])}
              </div>
              <div className="bg-white flex items-center justify-center min-w-[60px] min-h-[40px]">
                {formatGenotype(grid[0]?.[0])}
              </div>
              <div className="bg-white flex items-center justify-center min-w-[60px] min-h-[40px]">
                {formatGenotype(grid[0]?.[1])}
              </div>
              <div className="bg-blue-100 font-semibold flex items-center justify-center min-w-[60px] min-h-[40px]">
                {formatGenotype(parent1Genotype[1])}
              </div>
              <div className="bg-white flex items-center justify-center min-w-[60px] min-h-[40px]">
                {formatGenotype(grid[1]?.[0])}
              </div>
              <div className="bg-white flex items-center justify-center min-w-[60px] min-h-[40px]">
                {formatGenotype(grid[1]?.[1])}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PunnettSquareModal;
