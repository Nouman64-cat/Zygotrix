import React, { useEffect, useMemo, useState } from "react";

import type { TraitInfo, TraitPreviewPayload } from "../../types/api";
import PunnettPreview from "../traits/Preview/PunnettPreview";

interface TraitPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  trait: TraitInfo | null;
  onEdit?: () => void;
}

const deriveAlleles = (trait: TraitInfo | null): string[] => {
  if (!trait) return [];
  if (trait.alleles && trait.alleles.length > 0) {
    return trait.alleles;
  }
  const alleleSet = new Set<string>();
  Object.keys(trait.phenotype_map || {}).forEach((genotype) => {
    if (genotype.length === 0) return;
    if (trait.alleles && trait.alleles.length > 0) return;
    for (const char of genotype) {
      if (/[A-Za-z]/.test(char)) {
        alleleSet.add(char);
      }
    }
  });
  return Array.from(alleleSet);
};

const buildDefaultGenotypes = (alleles: string[]) => {
  if (alleles.length === 0) {
    return { parent1: "", parent2: "" };
  }
  if (alleles.length === 1) {
    const genotype = `${alleles[0]}${alleles[0]}`;
    return { parent1: genotype, parent2: genotype };
  }
  const defaultOne = `${alleles[0]}${alleles[0]}`;
  const defaultTwo = `${alleles[0]}${alleles[1]}`;
  return { parent1: defaultOne, parent2: defaultTwo };
};

const TraitPreviewModal: React.FC<TraitPreviewModalProps> = ({
  isOpen,
  onClose,
  trait,
  onEdit,
}) => {
  const [parent1, setParent1] = useState("");
  const [parent2, setParent2] = useState("");

  useEffect(() => {
    if (isOpen && trait) {
      const alleles = deriveAlleles(trait);
      const defaults = buildDefaultGenotypes(alleles);
      setParent1(defaults.parent1);
      setParent2(defaults.parent2);
    } else if (!isOpen) {
      setParent1("");
      setParent2("");
    }
  }, [isOpen, trait]);

  const draftTrait = useMemo<TraitPreviewPayload>(() => {
    if (!trait) {
      return { alleles: [], phenotype_map: {} };
    }
    const alleles = deriveAlleles(trait);
    return {
      alleles,
      phenotype_map: { ...trait.phenotype_map },
      inheritance_pattern: trait.inheritance_pattern,
    };
  }, [trait]);

  if (!isOpen || !trait) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        className="fixed inset-0 bg-black/50 cursor-pointer"
        onClick={onClose}
        aria-label="Close preview"
      />

      <div className="relative w-full max-w-5xl max-h-[92vh] rounded-xl bg-white shadow-2xl flex flex-col overflow-hidden">
        <header className="border-b border-slate-200 px-6 py-4 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold flex items-center justify-center">
                {trait.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {trait.name}
                </h2>
                <div className="text-xs text-slate-500 flex flex-wrap gap-2">
                  <span className="bg-slate-100 px-2 py-0.5 rounded-full">
                    Key: <span className="font-mono">{trait.key}</span>
                  </span>
                  {trait.gene_info?.genes?.[0] && (
                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                      Gene: {trait.gene_info.genes[0]}
                    </span>
                  )}
                  {trait.gene_info?.chromosomes?.[0] && (
                    <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                      Chr {trait.gene_info.chromosomes[0]}
                    </span>
                  )}
                  <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full capitalize">
                    {trait.inheritance_pattern?.replace(/_/g, " ") || "Inheritance"}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                onClick={() => {
                  onEdit();
                  onClose();
                }}
                className="cursor-pointer inline-flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-600 transition hover:bg-blue-100"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                Edit Trait
              </button>
            )}
            <button
              onClick={onClose}
              className="cursor-pointer rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
            >
              Close
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-4 bg-slate-50">
          <PunnettPreview
            draftTrait={draftTrait}
            parent1={parent1}
            parent2={parent2}
            onParentChange={(which, value) => {
              if (which === "parent1") {
                setParent1(value);
              } else {
                setParent2(value);
              }
            }}
            traitId={trait.id}
          />
        </div>
      </div>
    </div>
  );
};

export default TraitPreviewModal;
