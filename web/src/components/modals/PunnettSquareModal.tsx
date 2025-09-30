import React from "react";
import { getAboGenotypeMap, getRhGenotypeMap } from "../dashboard/helpers";

interface PunnettSquareModalProps {
  open: boolean;
  onClose: () => void;
  parent1Genotype: string;
  parent2Genotype: string;
  alleles: string[];
  traitName: string;
}

// Utility to generate Punnett square grid
// Helper to split a diploid genotype string into two alleles, given the list of possible alleles
function splitGenotype(
  genotype: string,
  alleles: string[]
): [string, string] | null {
  for (let i = 1; i < genotype.length; ++i) {
    const a1 = genotype.slice(0, i);
    const a2 = genotype.slice(i);
    if (alleles.includes(a1) && alleles.includes(a2)) {
      return [a1, a2];
    }
  }
  return null;
}

function getPunnettSquare(parent1: string, parent2: string, alleles: string[]) {
  const p1 = splitGenotype(parent1, alleles);
  const p2 = splitGenotype(parent2, alleles);
  if (!p1 || !p2) return [];
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
  const grid = getPunnettSquare(parent1Genotype, parent2Genotype, alleles);
  const p1Split = splitGenotype(parent1Genotype, alleles) || ["", ""];
  const p2Split = splitGenotype(parent2Genotype, alleles) || ["", ""];
  const isAbo = traitName.toLowerCase().includes("abo");
  const isRh = traitName.toLowerCase().includes("rh");
  const aboMap = getAboGenotypeMap();
  const rhMap = getRhGenotypeMap();
  // Helper to format genotype in I notation if ABO, or standardized if Rh
  function formatGenotype(genotype: string) {
    if (!genotype) return "";
    // For Rh, always put Rh+ first
    if (isRh) {
      let alleles = genotype.match(/Rh\+|Rh\-/g);
      if (alleles) {
        alleles.sort((a) => (a === "Rh+" ? -1 : 1));
        const norm = alleles.join("");
        if (rhMap[norm]) return rhMap[norm].display;
        if (rhMap[alleles.slice().reverse().join("")])
          return rhMap[alleles.slice().reverse().join("")].display;
        return norm;
      }
      // fallback
      if (rhMap[genotype]) return rhMap[genotype].display;
      if (rhMap[genotype.split("").reverse().join("")])
        return rhMap[genotype.split("").reverse().join("")].display;
      return genotype;
    }
    // For other traits, put capital or + first
    if (genotype.length === 2) {
      let a1 = genotype[0],
        a2 = genotype[1];
      // Capital letter or + is dominant
      const isDominant = (a: string) => /[A-Z]/.test(a) || a.includes("+");
      if (!isDominant(a1) && isDominant(a2)) {
        [a1, a2] = [a2, a1];
      }
      genotype = a1 + a2;
    }
    if (isAbo) {
      const sorted = genotype.split("").sort().join("");
      if (aboMap[genotype]) return aboMap[genotype];
      if (aboMap[sorted]) return aboMap[sorted];
      if (["AO", "OA"].includes(genotype)) return aboMap["AO"];
      if (["BO", "OB"].includes(genotype)) return aboMap["BO"];
      if (["AB", "BA"].includes(genotype)) return aboMap["AB"];
      if (["AA"].includes(genotype)) return aboMap["AA"];
      if (["BB"].includes(genotype)) return aboMap["BB"];
      if (["OO"].includes(genotype)) return aboMap["OO"];
      return genotype;
    }
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
                {isAbo ? (
                  p2Split[0] === "O" ? (
                    <span>i</span>
                  ) : (
                    <span>
                      I<sup>{p2Split[0]}</sup>
                    </span>
                  )
                ) : (
                  formatGenotype(p2Split[0])
                )}
              </div>
              <div className="bg-blue-100 font-semibold flex items-center justify-center min-w-[60px] min-h-[40px]">
                {isAbo ? (
                  p2Split[1] === "O" ? (
                    <span>i</span>
                  ) : (
                    <span>
                      I<sup>{p2Split[1]}</sup>
                    </span>
                  )
                ) : (
                  formatGenotype(p2Split[1])
                )}
              </div>
              <div className="bg-blue-100 font-semibold flex items-center justify-center min-w-[60px] min-h-[40px]">
                {isAbo ? (
                  p1Split[0] === "O" ? (
                    <span>i</span>
                  ) : (
                    <span>
                      I<sup>{p1Split[0]}</sup>
                    </span>
                  )
                ) : (
                  formatGenotype(p1Split[0])
                )}
              </div>
              <div className="bg-white flex items-center justify-center min-w-[60px] min-h-[40px]">
                {formatGenotype(grid[0]?.[0])}
              </div>
              <div className="bg-white flex items-center justify-center min-w-[60px] min-h-[40px]">
                {formatGenotype(grid[0]?.[1])}
              </div>
              <div className="bg-blue-100 font-semibold flex items-center justify-center min-w-[60px] min-h-[40px]">
                {isAbo ? (
                  p1Split[1] === "O" ? (
                    <span>i</span>
                  ) : (
                    <span>
                      I<sup>{p1Split[1]}</sup>
                    </span>
                  )
                ) : (
                  formatGenotype(p1Split[1])
                )}
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
