import React, { useEffect, useMemo, useState } from "react";
import {
  FaDna,
  FaFemale,
  FaMale,
  FaPlusCircle,
  FaTrashAlt,
  FaInfoCircle,
} from "react-icons/fa";
import { HiOutlineSparkles } from "react-icons/hi";
import { RiLoader5Line } from "react-icons/ri";
import DashboardLayout from "../layouts/DashboardLayout";
import {
  computeGeneticCross,
  type AlleleDefinitionPayload,
  type AlleleEffectPayload,
  type ChromosomeType,
  type DominancePattern,
  type GeneticCrossResponsePayload,
} from "../services/cppEngine.api";
import { fetchTraits } from "../services/traits.api";
import type { TraitInfo } from "../types/api";

type NumericField = number | "";

interface AlleleEffectForm extends AlleleEffectPayload {
  id: string;
  intermediate_descriptor?: string;
}

interface AlleleForm extends Omit<AlleleDefinitionPayload, "effects"> {
  id: string;
  dominance_rank: number;
  effects: AlleleEffectForm[];
}

interface GeneForm {
  uid: string;
  id: string;
  displayName: string;
  traitKey?: string;
  chromosome: ChromosomeType;
  dominance: DominancePattern;
  defaultAlleleId: string;
  alleles: AlleleForm[];
  linkageGroup: NumericField;
  recombinationProbability: NumericField;
  incompleteBlendWeight: NumericField;
}

type ParentGenotypeState = Record<string, string[]>;

const generateUid = () => Math.random().toString(36).slice(2);

const sanitizeGeneId = (value: string): string => {
  const sanitized = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
  return sanitized || `gene_${generateUid()}`;
};

const inferDominancePattern = (trait: TraitInfo): DominancePattern => {
  const pattern = (trait.inheritance_pattern || "").toLowerCase();
  if (pattern.includes("codominant")) {
    return "codominant";
  }
  if (pattern.includes("incomplete")) {
    return "incomplete";
  }
  return "complete";
};

const inferChromosomeType = (trait: TraitInfo): ChromosomeType => {
  const pattern = (trait.inheritance_pattern || "").toLowerCase();
  if (pattern.includes("x-linked")) {
    return "x";
  }
  if (pattern.includes("y-linked")) {
    return "y";
  }

  const chromosomeValues =
    trait.chromosomes ?? trait.gene_info?.chromosomes ?? [];
  if (
    chromosomeValues.some((value) => String(value).trim().toLowerCase() === "x")
  ) {
    return "x";
  }
  if (
    chromosomeValues.some((value) => String(value).trim().toLowerCase() === "y")
  ) {
    return "y";
  }
  return "autosomal";
};

const candidateGenotypeKeys = (alleleA: string, alleleB: string): string[] => {
  const permutations = [
    `${alleleA}${alleleB}`,
    `${alleleB}${alleleA}`,
    `${alleleA}/${alleleB}`,
    `${alleleB}/${alleleA}`,
    `${alleleA}-${alleleB}`,
    `${alleleB}-${alleleA}`,
    `${alleleA} ${alleleB}`,
    `${alleleB} ${alleleA}`,
  ];
  if (alleleA !== alleleB) {
    permutations.push(`${alleleA}|${alleleB}`, `${alleleB}|${alleleA}`);
  }
  return permutations;
};

const findPhenotypeLabel = (
  phenotypeMap: Record<string, string>,
  alleleA: string,
  alleleB: string
): string | undefined => {
  const possibleKeys = candidateGenotypeKeys(alleleA, alleleB);
  for (const key of possibleKeys) {
    if (phenotypeMap[key] !== undefined) {
      return phenotypeMap[key];
    }
  }
  return undefined;
};

const determineDominanceRank = (
  trait: TraitInfo,
  dominance: DominancePattern,
  alleleIndex: number
): number => {
  if (dominance === "codominant") {
    if (trait.alleles.length > 2) {
      return alleleIndex <= 1 ? 2 : 1;
    }
    return 2;
  }
  return alleleIndex === 0 ? 2 : 1;
};

const determineMagnitude = (dominanceRank: number): number =>
  dominanceRank > 1 ? 1 : 0;

const extractIntermediateDescriptor = (
  trait: TraitInfo,
  dominance: DominancePattern,
  phenotypeMap: Record<string, string>
): string | undefined => {
  if (dominance !== "incomplete" || trait.alleles.length < 2) {
    return undefined;
  }
  const [first, second] = trait.alleles;
  return findPhenotypeLabel(phenotypeMap, first, second);
};

const buildGeneFromTrait = (trait: TraitInfo): GeneForm => {
  const uid = `gene-${generateUid()}`;
  const baseId = sanitizeGeneId(trait.key || trait.name || uid);
  const dominance = inferDominancePattern(trait);
  const chromosome = inferChromosomeType(trait);
  const phenotypeMap = trait.phenotype_map || {};
  const intermediateDescriptor = extractIntermediateDescriptor(
    trait,
    dominance,
    phenotypeMap
  );
  const traitId = sanitizeGeneId(trait.key || trait.name || uid);
  const alleles: AlleleForm[] = (trait.alleles || []).map((allele, index) => {
    const dominanceRank = determineDominanceRank(trait, dominance, index);
    const homozygousPhenotype =
      findPhenotypeLabel(phenotypeMap, allele, allele) || allele;
    return {
      id: allele,
      dominance_rank: dominanceRank,
      effects: [
        {
          id: `${baseId}-${allele}-effect-${index}`,
          trait_id: traitId,
          magnitude: determineMagnitude(dominanceRank),
          description: homozygousPhenotype,
          intermediate_descriptor: intermediateDescriptor,
        },
      ],
    };
  });

  return {
    uid,
    id: baseId,
    displayName: trait.name || baseId,
    traitKey: trait.key,
    chromosome,
    dominance,
    defaultAlleleId: alleles[0]?.id || "",
    alleles,
    linkageGroup: "",
    recombinationProbability: "",
    incompleteBlendWeight: dominance === "incomplete" ? 0.5 : "",
  };
};

const dominancePalette: Record<
  DominancePattern,
  {
    label: string;
    badge: string;
    dot: string;
    text: string;
  }
> = {
  complete: {
    label: "Complete",
    badge: "border border-emerald-300 bg-emerald-100 text-emerald-800",
    dot: "bg-emerald-500",
    text: "text-emerald-600",
  },
  codominant: {
    label: "Codominant",
    badge: "border border-amber-300 bg-amber-100 text-amber-800",
    dot: "bg-amber-500",
    text: "text-amber-600",
  },
  incomplete: {
    label: "Incomplete",
    badge: "border border-violet-300 bg-violet-100 text-violet-800",
    dot: "bg-violet-500",
    text: "text-violet-600",
  },
};

interface DominanceIndicatorProps {
  pattern: DominancePattern;
  variant?: "pill" | "dot";
  showLabel?: boolean;
  className?: string;
}

const DominanceIndicator: React.FC<DominanceIndicatorProps> = ({
  pattern,
  variant = "pill",
  showLabel = false,
  className = "",
}) => {
  const palette = dominancePalette[pattern];
  if (!palette) {
    return null;
  }

  if (variant === "dot") {
    return (
      <span
        className={`inline-flex items-center gap-1 ${palette.text} ${className}`}
        title={`${pattern.charAt(0).toUpperCase() + pattern.slice(1)} Dominance`}
      >
        <span
          className={`h-2 w-2 rounded-full ${palette.dot}`}
          aria-hidden="true"
        />
        {showLabel ? (
          <span className="text-[9px] font-medium">{palette.label}</span>
        ) : (
          <span className="sr-only">{palette.label}</span>
        )}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-bold ${palette.badge} ${className}`}
      title={`${pattern.charAt(0).toUpperCase() + pattern.slice(1)} Dominance`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${palette.dot}`}
        aria-hidden="true"
      />
      {showLabel ? (
        <span>{palette.label}</span>
      ) : (
        <span className="sr-only">{palette.label}</span>
      )}
    </span>
  );
};

const getDefaultAllelesForGene = (
  gene: GeneForm,
  sex: "female" | "male"
): string[] => {
  const primary = gene.defaultAlleleId || gene.alleles[0]?.id || "";
  const safeAllele = primary || (gene.alleles[0]?.id ?? "");
  if (!safeAllele) {
    return [];
  }

  if (gene.chromosome === "autosomal") {
    return [safeAllele, safeAllele];
  }
  if (gene.chromosome === "x") {
    return sex === "male" ? [safeAllele] : [safeAllele, safeAllele];
  }
  if (gene.chromosome === "y") {
    return sex === "male" ? [safeAllele] : [];
  }
  return [safeAllele, safeAllele];
};

const normaliseAlleles = (
  gene: GeneForm,
  current: string[] | undefined,
  sex: "female" | "male"
) => {
  const allowed = new Set(gene.alleles.map((allele) => allele.id));
  const defaults = getDefaultAllelesForGene(gene, sex);

  const sanitize = (value: string | undefined) => {
    if (!value || !allowed.has(value)) {
      return defaults[0] ?? "";
    }
    return value;
  };

  if (gene.chromosome === "autosomal") {
    return [
      sanitize(current?.[0] ?? defaults[0]),
      sanitize(current?.[1] ?? current?.[0] ?? defaults[1]),
    ];
  }

  if (gene.chromosome === "x") {
    if (sex === "male") {
      return [sanitize(current?.[0] ?? defaults[0])];
    }
    return [
      sanitize(current?.[0] ?? defaults[0]),
      sanitize(current?.[1] ?? current?.[0] ?? defaults[0]),
    ];
  }

  if (gene.chromosome === "y") {
    return sex === "male" ? [sanitize(current?.[0] ?? defaults[0])] : [];
  }

  return defaults;
};

const syncGenotype = (
  genes: GeneForm[],
  sex: "female" | "male",
  previous: ParentGenotypeState
): ParentGenotypeState => {
  const next: ParentGenotypeState = {};
  genes.forEach((gene) => {
    next[gene.id || gene.uid] = normaliseAlleles(
      gene,
      previous[gene.id] ?? previous[gene.uid],
      sex
    );
  });
  return next;
};

const SimulationStudioPage: React.FC = () => {
  const [genes, setGenes] = useState<GeneForm[]>([]);
  const [motherSex] = useState<"female" | "male">("female");
  const [fatherSex] = useState<"female" | "male">("male");
  const [motherGenotype, setMotherGenotype] = useState<ParentGenotypeState>({});
  const [fatherGenotype, setFatherGenotype] = useState<ParentGenotypeState>({});
  const [simulations, setSimulations] = useState(500);
  const [result, setResult] = useState<GeneticCrossResponsePayload | null>(
    null
  );
  const [isComputing, setIsComputing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [activeGene, setActiveGene] = useState<string>("");
  const [availableTraits, setAvailableTraits] = useState<TraitInfo[]>([]);
  const [isLoadingTraits, setIsLoadingTraits] = useState<boolean>(false);
  const [traitsError, setTraitsError] = useState<string | null>(null);
  const [selectedTraitKey, setSelectedTraitKey] = useState<string>("");

  const traitOptions = useMemo(() => {
    const options = availableTraits.filter(
      (trait) => !genes.some((gene) => gene.traitKey === trait.key)
    );
    return options.sort((a, b) => a.name.localeCompare(b.name));
  }, [availableTraits, genes]);

  const selectedTrait = useMemo(
    () => availableTraits.find((trait) => trait.key === selectedTraitKey),
    [availableTraits, selectedTraitKey]
  );

  useEffect(() => {
    const controller = new AbortController();
    setIsLoadingTraits(true);
    setTraitsError(null);
    fetchTraits(controller.signal, { owned_only: false })
      .then((traits) => {
        if (controller.signal.aborted) {
          return;
        }
        const systemTraits = traits
          .filter((trait) => trait.owner_id === "system")
          .sort((a, b) => a.name.localeCompare(b.name));
        setAvailableTraits(systemTraits);
      })
      .catch((err) => {
        if (controller.signal.aborted) {
          return;
        }
        const message =
          err instanceof Error
            ? err.message
            : "Unable to load reference traits.";
        setTraitsError(message);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoadingTraits(false);
        }
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!traitOptions.length) {
      if (selectedTraitKey !== "") {
        setSelectedTraitKey("");
      }
      return;
    }
    const stillValid = traitOptions.some(
      (trait) => trait.key === selectedTraitKey
    );
    if (!stillValid) {
      setSelectedTraitKey(traitOptions[0].key);
    }
  }, [traitOptions, selectedTraitKey]);

  const ensureGenotypes = (
    updatedGenes: GeneForm[],
    currentMotherSex: "female" | "male",
    currentFatherSex: "female" | "male"
  ) => {
    setMotherGenotype((prev) =>
      syncGenotype(updatedGenes, currentMotherSex, prev)
    );
    setFatherGenotype((prev) =>
      syncGenotype(updatedGenes, currentFatherSex, prev)
    );
  };

  useEffect(() => {
    ensureGenotypes(genes, motherSex, fatherSex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [genes, motherSex, fatherSex]);

  useEffect(() => {
    if (!genes.length) {
      setActiveGene("");
      return;
    }
    if (!genes.some((gene) => gene.uid === activeGene)) {
      setActiveGene(genes[0].uid);
    }
  }, [genes, activeGene]);

  const handleAddTrait = () => {
    if (!selectedTraitKey) {
      return;
    }
    const trait = availableTraits.find((item) => item.key === selectedTraitKey);
    if (!trait) {
      return;
    }
    const newGene = buildGeneFromTrait(trait);
    let uniqueId = newGene.id;
    let counter = 1;
    while (genes.some((existing) => existing.id === uniqueId)) {
      uniqueId = `${newGene.id}_${counter++}`;
    }
    if (uniqueId !== newGene.id) {
      newGene.id = uniqueId;
      newGene.alleles = newGene.alleles.map((allele, alleleIndex) => ({
        ...allele,
        effects: allele.effects.map((effect, effectIndex) => ({
          ...effect,
          id: `${uniqueId}-${allele.id}-effect-${alleleIndex}-${effectIndex}`,
        })),
      }));
    }
    const updated = [...genes, newGene];
    setGenes(updated);
    ensureGenotypes(updated, motherSex, fatherSex);
    setActiveGene(newGene.uid);
    setResult(null);
    setShowSuccessToast(false);
  };

  const handleRemoveGene = (uid: string) => {
    const updated = genes.filter((gene) => gene.uid !== uid);
    if (updated.length === genes.length) {
      return;
    }
    setGenes(updated);
    setMotherGenotype((prev) => syncGenotype(updated, motherSex, prev));
    setFatherGenotype((prev) => syncGenotype(updated, fatherSex, prev));
    if (activeGene === uid) {
      setActiveGene(updated[0]?.uid ?? "");
    }
    setResult(null);
    setShowSuccessToast(false);
  };

  const traitLabelLookup = useMemo(() => {
    const map = new Map<string, string>();
    genes.forEach((gene) => {
      const traitId = gene.alleles[0]?.effects[0]?.trait_id;
      if (traitId) {
        map.set(traitId, gene.displayName || gene.id);
      }
    });
    return map;
  }, [genes]);

  const updateParentAllele = (
    parent: "mother" | "father",
    geneId: string,
    slot: number,
    newAllele: string
  ) => {
    if (parent === "mother") {
      setMotherGenotype((prev) => {
        const next = { ...prev };
        const alleles = [...(next[geneId] ?? [])];
        alleles[slot] = newAllele;
        next[geneId] = alleles;
        return next;
      });
    } else {
      setFatherGenotype((prev) => {
        const next = { ...prev };
        const alleles = [...(next[geneId] ?? [])];
        alleles[slot] = newAllele;
        next[geneId] = alleles;
        return next;
      });
    }
  };

  const validateGenes = (): string | null => {
    if (!genes.length) {
      return "Please add at least one trait to begin simulation.";
    }
    for (const gene of genes) {
      if (!gene.id.trim()) {
        return "Every gene requires an identifier.";
      }
      const geneLabel = gene.displayName || gene.id || "Unnamed";
      if (!gene.alleles.length) {
        return `Gene "${geneLabel}" needs at least one allele.`;
      }
      for (const allele of gene.alleles) {
        if (!allele.id.trim()) {
          return `All alleles require an identifier for gene "${geneLabel}".`;
        }
        if (!allele.effects.length) {
          return `Allele "${allele.id}" in gene "${geneLabel}" needs at least one trait effect.`;
        }
        for (const effect of allele.effects) {
          if (!effect.trait_id.trim()) {
            return `Please set a trait ID for allele "${allele.id}" in gene "${geneLabel}".`;
          }
        }
      }
    }
    return null;
  };

  const payloadBuilder = () => ({
    genes: genes.map((gene) => ({
      id: gene.id.trim() || gene.uid,
      chromosome: gene.chromosome,
      dominance: gene.dominance,
      default_allele_id:
        gene.defaultAlleleId.trim() || gene.alleles[0]?.id || "",
      alleles: gene.alleles.map((allele) => ({
        id: allele.id.trim(),
        dominance_rank: allele.dominance_rank,
        effects: allele.effects.map((effect) => ({
          trait_id: effect.trait_id.trim(),
          magnitude: Number(effect.magnitude),
          description: effect.description?.trim() || undefined,
          intermediate_descriptor:
            effect.intermediate_descriptor?.trim() || undefined,
        })),
      })),
      linkage_group:
        gene.linkageGroup === "" ? undefined : Number(gene.linkageGroup),
      recombination_probability:
        gene.recombinationProbability === ""
          ? undefined
          : Number(gene.recombinationProbability),
      incomplete_blend_weight:
        gene.incompleteBlendWeight === ""
          ? undefined
          : Number(gene.incompleteBlendWeight),
    })),
    mother: {
      sex: motherSex,
      genotype: motherGenotype,
    },
    father: {
      sex: fatherSex,
      genotype: fatherGenotype,
    },
    epistasis: [],
    simulations,
  });

  const handleCompute = async () => {
    setError(null);
    setShowErrorToast(false);
    setShowSuccessToast(false);
    const validationError = validateGenes();
    if (validationError) {
      setError(validationError);
      setShowErrorToast(true);
      setShowSuccessToast(false);
      return;
    }

    try {
      setIsComputing(true);
      const payload = payloadBuilder();
      const data = await computeGeneticCross(payload);
      setResult(data);
      setShowSuccessToast(true);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to compute genetic cross. Please try again.";
      setError(message);
      setShowErrorToast(true);
      setShowSuccessToast(false);
    } finally {
      setIsComputing(false);
    }
  };

  useEffect(() => {
    if (showErrorToast && error) {
      const timer = setTimeout(() => {
        setShowErrorToast(false);
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showErrorToast, error]);

  useEffect(() => {
    if (showSuccessToast && result) {
      const timer = setTimeout(() => {
        setShowSuccessToast(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessToast, result]);

  const renderAlleleSelects = (parent: "mother" | "father", gene: GeneForm) => {
    const sex = parent === "mother" ? motherSex : fatherSex;
    const genotype =
      parent === "mother" ? motherGenotype[gene.id] : fatherGenotype[gene.id];
    const options = gene.alleles.map((allele) => (
      <option key={allele.id} value={allele.id}>
        {allele.id || "Unnamed"}
      </option>
    ));

    if (gene.chromosome === "y" && sex === "female") {
      return (
        <p className="text-[10px] text-slate-400 italic">
          Y-linked (not expressed)
        </p>
      );
    }

    if (gene.chromosome === "x" && sex === "male") {
      return (
        <select
          value={genotype?.[0] ?? gene.defaultAlleleId}
          onChange={(event) =>
            updateParentAllele(parent, gene.id, 0, event.target.value)
          }
          className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-xs font-medium text-slate-800 outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        >
          {options}
        </select>
      );
    }

    const slotCount =
      gene.chromosome === "autosomal" || sex === "female" ? 2 : 1;

    return (
      <div className={`grid gap-2 ${slotCount === 2 ? "grid-cols-2" : "grid-cols-1"}`}>
        {Array.from({ length: slotCount }).map((_, index) => (
          <select
            key={index}
            value={genotype?.[index] ?? gene.defaultAlleleId}
            onChange={(event) =>
              updateParentAllele(parent, gene.id, index, event.target.value)
            }
            className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-xs font-medium text-slate-800 outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          >
            {options}
          </select>
        ))}
      </div>
    );
  };

  const traitSummaries = useMemo(() => {
    if (!result) return [];
    return Object.entries(result.trait_summaries).map(([trait, summary]) => {
      const descriptors = Object.entries(summary.descriptor_counts).sort(
        (a, b) => b[1] - a[1]
      );

      const prettyLabel = (() => {
        if (traitLabelLookup.has(trait)) {
          return traitLabelLookup.get(trait) as string;
        }
        const parts = trait.split("__");
        if (parts.length > 1) {
          const labels = parts.map(
            (part) => traitLabelLookup.get(part) || part.replace(/_/g, " ")
          );
          return labels.join(" × ");
        }
        return trait.replace(/_/g, " ");
      })();

      return {
        id: trait,
        label: prettyLabel,
        mean: summary.mean_quantitative,
        descriptors,
      };
    });
  }, [result, traitLabelLookup]);

  const sexBreakdown = useMemo(() => {
    if (!result) return [];
    const total = Object.values(result.sex_counts).reduce(
      (sum, value) => sum + value,
      0
    );
    return Object.entries(result.sex_counts).map(([sex, count]) => ({
      sex,
      count,
      share: total ? Math.round((count / total) * 100) : 0,
    }));
  }, [result]);

  return (
    <DashboardLayout>
      <div className="-m-4 flex overflow-hidden bg-slate-50 lg:-m-6" style={{ height: 'calc(100vh - 4rem)' }}>
        {/* Left Sidebar - Controls */}
        <aside className="flex w-80 flex-shrink-0 flex-col border-r border-slate-200 bg-white">
          {/* Header */}
          <div className="flex-shrink-0 border-b border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 p-2">
                <FaDna className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900">
                  Genetics Studio
                </h1>
                <p className="text-[10px] text-slate-600">
                  Predict offspring traits
                </p>
              </div>
            </div>
          </div>

          {/* Trait Selection */}
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              <div>
                <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-700">
                  Add Traits
                </h2>
                <div className="space-y-2">
                  <select
                    value={selectedTraitKey}
                    onChange={(event) => setSelectedTraitKey(event.target.value)}
                    disabled={isLoadingTraits || !traitOptions.length}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                  >
                    {isLoadingTraits && <option value="">Loading...</option>}
                    {!isLoadingTraits && !traitOptions.length && (
                      <option value="">All traits added</option>
                    )}
                    {!isLoadingTraits &&
                      traitOptions.map((trait) => (
                        <option key={trait.key} value={trait.key}>
                          {trait.name}
                        </option>
                      ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleAddTrait}
                    disabled={isLoadingTraits || !selectedTrait || !traitOptions.length}
                    className="w-full rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md transition-all hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <FaPlusCircle className="mr-2 inline h-3 w-3" />
                    Add Trait
                  </button>
                </div>
                {traitsError && (
                  <p className="mt-2 text-[10px] text-rose-600">{traitsError}</p>
                )}
              </div>

              {/* Active Traits */}
              {genes.length > 0 && (
                <div>
                  <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-700">
                    Active Traits ({genes.length})
                  </h3>
                  <div className="space-y-2">
                    {genes.map((gene) => {
                      const isActive = activeGene === gene.uid;
                      return (
                        <div
                          key={gene.uid}
                          className={`group flex items-center justify-between rounded-lg border p-2 transition-all ${
                            isActive
                              ? "border-blue-400 bg-blue-50"
                              : "border-slate-200 bg-white hover:border-slate-300"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => setActiveGene(gene.uid)}
                            className="flex flex-1 items-center gap-2 text-left focus:outline-none"
                          >
                            <span className="text-xs font-semibold text-slate-800">
                              {gene.displayName || gene.id}
                            </span>
                            <DominanceIndicator
                              pattern={gene.dominance}
                              variant="pill"
                              showLabel={false}
                            />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveGene(gene.uid)}
                            className="rounded p-1 text-slate-400 transition hover:bg-rose-100 hover:text-rose-600"
                            aria-label={`Remove ${gene.displayName || gene.id}`}
                          >
                            <FaTrashAlt className="h-3 w-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Legend */}
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="mb-2 flex items-center gap-1.5">
                  <FaInfoCircle className="h-3 w-3 text-slate-500" />
                  <span className="text-[10px] font-bold uppercase text-slate-700">
                    Dominance
                  </span>
                </div>
                <div className="space-y-1.5">
                  {(Object.keys(dominancePalette) as DominancePattern[]).map((pattern) => {
                    const palette = dominancePalette[pattern];
                    return (
                      <div key={pattern} className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${palette.dot}`} />
                        <span className="text-[10px] text-slate-600">{palette.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Simulation Controls */}
          <div className="flex-shrink-0 border-t border-slate-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label htmlFor="simSlider" className="text-xs font-bold text-slate-700">
                  Simulations
                </label>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">
                  {simulations.toLocaleString()}
                </span>
              </div>
              <input
                id="simSlider"
                type="range"
                min={50}
                max={5000}
                step={50}
                value={simulations}
                onChange={(e) => setSimulations(Number(e.target.value))}
                className="w-full accent-emerald-500"
              />
              <button
                type="button"
                onClick={handleCompute}
                disabled={isComputing || genes.length === 0}
                className="w-full rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-3 text-sm font-bold text-white shadow-lg transition-all hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isComputing ? (
                  <>
                    <RiLoader5Line className="mr-2 inline h-4 w-4 animate-spin" />
                    Computing...
                  </>
                ) : (
                  <>
                    <HiOutlineSparkles className="mr-2 inline h-4 w-4" />
                    Run Simulation
                  </>
                )}
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex min-w-0 flex-1 overflow-hidden">
          {/* Parents Section */}
          <div className="flex min-w-0 flex-1 overflow-hidden">
            {/* Parent A */}
            <div className="flex w-1/2 min-w-0 flex-col border-r border-slate-200 bg-gradient-to-br from-pink-50 to-purple-50">
              <div className="flex-shrink-0 border-b border-pink-200 bg-white/80 px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-gradient-to-br from-pink-500 to-pink-600 p-2">
                    <FaFemale className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Parent A</h3>
                    <p className="text-[10px] text-slate-600">Female genotype</p>
                  </div>
                </div>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto p-4">
                {genes.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                    <FaDna className="h-16 w-16 text-slate-300" />
                    <p className="text-sm font-medium text-slate-500">
                      Add traits to configure genotypes
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {genes.map((gene) => {
                      const isActive = activeGene === gene.uid;
                      return (
                        <div
                          key={`mother-${gene.uid}`}
                          role="button"
                          tabIndex={0}
                          onClick={() => setActiveGene(gene.uid)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              setActiveGene(gene.uid);
                            }
                          }}
                          className={`cursor-pointer rounded-lg border-2 bg-white p-3 shadow-sm transition-all ${
                            isActive
                              ? "border-pink-400 ring-2 ring-pink-200"
                              : "border-slate-200 hover:border-pink-300"
                          }`}
                        >
                          <div className="mb-2 flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-800">
                              {gene.displayName || gene.id}
                            </span>
                            <DominanceIndicator
                              pattern={gene.dominance}
                              variant="pill"
                              showLabel={false}
                            />
                          </div>
                          {renderAlleleSelects("mother", gene)}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Parent B */}
            <div className="flex w-1/2 min-w-0 flex-col bg-gradient-to-br from-blue-50 to-cyan-50">
              <div className="flex-shrink-0 border-b border-blue-200 bg-white/80 px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-gradient-to-br from-blue-500 to-blue-600 p-2">
                    <FaMale className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Parent B</h3>
                    <p className="text-[10px] text-slate-600">Male genotype</p>
                  </div>
                </div>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto p-4">
                {genes.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                    <FaDna className="h-16 w-16 text-slate-300" />
                    <p className="text-sm font-medium text-slate-500">
                      Add traits to configure genotypes
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {genes.map((gene) => {
                      const isActive = activeGene === gene.uid;
                      return (
                        <div
                          key={`father-${gene.uid}`}
                          role="button"
                          tabIndex={0}
                          onClick={() => setActiveGene(gene.uid)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              setActiveGene(gene.uid);
                            }
                          }}
                          className={`cursor-pointer rounded-lg border-2 bg-white p-3 shadow-sm transition-all ${
                            isActive
                              ? "border-blue-400 ring-2 ring-blue-200"
                              : "border-slate-200 hover:border-blue-300"
                          }`}
                        >
                          <div className="mb-2 flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-800">
                              {gene.displayName || gene.id}
                            </span>
                            <DominanceIndicator
                              pattern={gene.dominance}
                              variant="pill"
                              showLabel={false}
                            />
                          </div>
                          {renderAlleleSelects("father", gene)}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Results Panel */}
          <aside className="flex w-96 flex-shrink-0 flex-col border-l border-slate-200 bg-gradient-to-br from-purple-50 to-indigo-50">
            <div className="flex-shrink-0 border-b border-purple-200 bg-white/90 px-4 py-3 backdrop-blur">
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 p-2">
                  <HiOutlineSparkles className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Results</h3>
                  {result && (
                    <p className="text-[10px] text-slate-600">
                      {result.simulations.toLocaleString()} runs
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              {!result ? (
                <div className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-slate-300 bg-white/50 p-8 text-center">
                  <FaDna className="h-12 w-12 text-slate-300" />
                  <p className="text-xs font-medium text-slate-600">
                    Run simulation to see results
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Sex Distribution */}
                  <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                    <h4 className="mb-3 text-xs font-bold text-slate-800">Sex Distribution</h4>
                    <div className="space-y-2">
                      {sexBreakdown.map((entry) => (
                        <div key={entry.sex} className="flex items-center gap-2">
                          <span className="w-12 text-[10px] font-semibold uppercase text-slate-700">
                            {entry.sex}
                          </span>
                          <div className="h-5 flex-1 overflow-hidden rounded-full bg-slate-200">
                            <div
                              className="flex h-full items-center justify-center rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 text-[9px] font-bold text-white"
                              style={{ width: `${entry.share}%` }}
                            >
                              {entry.share}%
                            </div>
                          </div>
                          <span className="w-8 text-right text-[10px] font-bold text-slate-700">
                            {entry.count}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Trait Summaries */}
                  {traitSummaries.map((summary) => (
                    <div
                      key={summary.id}
                      className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-800">{summary.label}</h4>
                        <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[9px] font-bold text-purple-700">
                          μ {summary.mean.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {summary.descriptors.map(([label, value]) => (
                          <span
                            key={label || "unspecified"}
                            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-semibold text-slate-700"
                          >
                            {label || "unspecified"}
                            <span className="rounded-full bg-blue-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
                              {value}
                            </span>
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>
        </main>

        {/* Toast notifications */}
        {showErrorToast && error && (
          <div className="fixed left-1/2 top-4 z-50 flex max-w-md -translate-x-1/2 items-center gap-3 rounded-lg border-2 border-rose-400 bg-rose-500 px-4 py-3 text-white shadow-2xl">
            <FaInfoCircle className="h-4 w-4 flex-shrink-0" />
            <span className="flex-1 text-sm font-semibold">{error}</span>
            <button
              type="button"
              className="text-lg font-bold text-white/80 transition hover:text-white"
              onClick={() => {
                setShowErrorToast(false);
                setError(null);
              }}
            >
              ×
            </button>
          </div>
        )}
        {result && showSuccessToast && !isComputing && !error && (
          <div className="fixed left-1/2 top-4 z-50 flex max-w-md -translate-x-1/2 items-center gap-3 rounded-lg border-2 border-emerald-400 bg-emerald-500 px-4 py-3 text-white shadow-2xl">
            <HiOutlineSparkles className="h-4 w-4 flex-shrink-0" />
            <span className="flex-1 text-sm font-semibold">
              Simulation complete!
            </span>
            <button
              type="button"
              className="text-lg font-bold text-white/80 transition hover:text-white"
              onClick={() => setShowSuccessToast(false)}
            >
              ×
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default SimulationStudioPage;
