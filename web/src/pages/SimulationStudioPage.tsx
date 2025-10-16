import React, { useEffect, useMemo, useState } from "react";
import {
  FaDna,
  FaFemale,
  FaMale,
  FaPlusCircle,
  FaTrashAlt,
} from "react-icons/fa";
import { HiOutlineSparkles, HiSwitchHorizontal } from "react-icons/hi";
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

type SimulationCSSVariables = React.CSSProperties &
  Record<
    | "--blob-size"
    | "--panel-scroll-height"
    | "--primary-action-size"
    | "--primary-action-icon-size"
    | "--icon-lg"
    | "--icon-md"
    | "--icon-sm"
    | "--icon-xs"
    | "--icon-xxs"
    | "--panel-label-width"
    | "--trait-panel-min-width"
    | "--trait-panel-max-width"
    | "--trait-panel-offset"
    | "--trait-panel-height"
    | "--trait-panel-width"
    | "--accent-divider-thickness",
    string
  >;

const getInitialViewportSize = () => {
  if (typeof window === "undefined") {
    return { width: 1440, height: 900 };
  }
  return { width: window.innerWidth, height: window.innerHeight };
};

const clampValue = (value: number, min: number, max: number): number => {
  if (Number.isNaN(value)) {
    return min;
  }
  return Math.min(Math.max(value, min), max);
};

const useViewportSize = () => {
  const [viewport, setViewport] = useState(getInitialViewportSize);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const handleResize = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return viewport;
};

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

const chromoLabel: Record<ChromosomeType, string> = {
  autosomal: "Autosomal",
  x: "X-Linked",
  y: "Y-Linked",
};

const dominanceLabel: Record<DominancePattern, string> = {
  complete: "Complete Dominance",
  codominant: "Codominance",
  incomplete: "Incomplete Dominance",
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
  const { width: viewportWidth, height: viewportHeight } = useViewportSize();
  const [genes, setGenes] = useState<GeneForm[]>([]);
  const [motherSex, setMotherSex] = useState<"female" | "male">("female");
  const [fatherSex, setFatherSex] = useState<"female" | "male">("male");
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
  const [isTraitPanelOpen, setIsTraitPanelOpen] = useState<boolean>(true);

  const dynamicStyles = useMemo<SimulationCSSVariables>(() => {
    const width = viewportWidth ?? 1440;
    const height = viewportHeight ?? 900;

    const toPx = (value: number) => `${Math.round(value)}px`;

    const blobSize = clampValue(width * 0.24, 280, 320);
    const panelScrollHeight = clampValue(height * 0.45, 260, 320);
    const primaryActionSize = clampValue(width * 0.033, 48, 56);
    const primaryActionIconSize = clampValue(primaryActionSize * 0.58, 26, 32);
    const iconLg = clampValue(width * 0.033, 44, 52);
    const iconMd = clampValue(width * 0.017, 20, 28);
    const iconSm = clampValue(width * 0.014, 18, 22);
    const iconXs = clampValue(width * 0.011, 16, 18);
    const iconXxs = clampValue(width * 0.008, 12, 14);
    const labelWidth = clampValue(width * 0.0445, 56, 72);
    const traitPanelMinWidth = clampValue(width * 0.26, 280, 320);
    const traitPanelMaxWidth = clampValue(width * 0.32, 340, 400);
    const traitPanelOffset = clampValue(height * 0.0889, 72, 96);
    const traitPanelWidth = clampValue(
      width * 0.28,
      traitPanelMinWidth,
      traitPanelMaxWidth
    );
    const accentDividerThickness = clampValue(width * 0.0025, 3, 4);

    return {
      "--blob-size": toPx(blobSize),
      "--panel-scroll-height": toPx(panelScrollHeight),
      "--primary-action-size": toPx(primaryActionSize),
      "--primary-action-icon-size": toPx(primaryActionIconSize),
      "--icon-lg": toPx(iconLg),
      "--icon-md": toPx(iconMd),
      "--icon-sm": toPx(iconSm),
      "--icon-xs": toPx(iconXs),
      "--icon-xxs": toPx(iconXxs),
      "--panel-label-width": toPx(labelWidth),
      "--trait-panel-min-width": toPx(traitPanelMinWidth),
      "--trait-panel-max-width": toPx(traitPanelMaxWidth),
      "--trait-panel-offset": toPx(traitPanelOffset),
      "--trait-panel-height": `calc(100vh - ${toPx(traitPanelOffset)})`,
      "--trait-panel-width": toPx(traitPanelWidth),
      "--accent-divider-thickness": toPx(accentDividerThickness),
    };
  }, [viewportWidth, viewportHeight]);

  const traitPanelStyle = useMemo<React.CSSProperties>(() => {
    const shouldApplyExpandedLayout = (viewportWidth ?? 0) >= 1024;
    const style: React.CSSProperties = {
      top: "var(--trait-panel-offset)",
    };

    if (shouldApplyExpandedLayout) {
      style.minWidth = "var(--trait-panel-min-width)";
      style.maxWidth = "var(--trait-panel-max-width)";
      style.width = "var(--trait-panel-width)";
      style.height = "var(--trait-panel-height)";
      style.maxHeight = "var(--trait-panel-height)";
    }

    return style;
  }, [viewportWidth]);

  const traitOptions = useMemo(() => {
    const options = availableTraits.filter(
      (trait) => !genes.some((gene) => gene.traitKey === trait.key)
    );
    return options.sort((a, b) => a.name.localeCompare(b.name));
  }, [availableTraits, genes]);

  const quickPickTraits = useMemo(
    () => traitOptions.slice(0, 12),
    [traitOptions]
  );

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

  const openTraitPanel = () => {
    setIsTraitPanelOpen(true);
    if (typeof document === "undefined") {
      return;
    }
    const element = document.getElementById("trait-library-panel");
    element?.scrollIntoView({ behavior: "smooth", block: "start" });
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
      return "Please configure at least one gene before computing the cross.";
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

// Auto-dismiss error toast after 5 seconds
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
        <p className="text-xs text-slate-400">
          Y-linked gene not expressed in this parent.
        </p>
      );
    }

    if (gene.chromosome === "x" && sex === "male") {
      return (
        <div className="grid grid-cols-1 gap-2">
          <select
            value={genotype?.[0] ?? gene.defaultAlleleId}
            onChange={(event) =>
              updateParentAllele(parent, gene.id, 0, event.target.value)
            }
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-200/60"
          >
            {options}
          </select>
        </div>
      );
    }

    const slotCount =
      gene.chromosome === "autosomal" || sex === "female" ? 2 : 1;

    return (
      <div
        className={`grid gap-2 ${
          slotCount === 2 ? "grid-cols-2" : "grid-cols-1"
        }`}
      >
        {Array.from({ length: slotCount }).map((_, index) => (
          <select
            key={index}
            value={genotype?.[index] ?? gene.defaultAlleleId}
            onChange={(event) =>
              updateParentAllele(parent, gene.id, index, event.target.value)
            }
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-200/60"
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
          return labels.join(" x ");
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
      <div
        className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-white via-slate-50 to-blue-50 px-6 pb-20 pt-10 text-slate-900 md:px-8 lg:px-12"
        style={{
          ...dynamicStyles,
        }}
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="absolute -top-32 -right-32 rounded-full bg-blue-200/40 blur-3xl"
            style={{
              width: "var(--blob-size)",
              height: "var(--blob-size)",
            }}
          />
          <div
            className="absolute -bottom-24 -left-24 rounded-full bg-purple-200/40 blur-3xl"
            style={{
              width: "var(--blob-size)",
              height: "var(--blob-size)",
            }}
          />
        </div>

        <div className="relative mx-auto flex w-full max-w-8xl flex-col gap-12 lg:flex-row lg:items-start lg:gap-8 xl:gap-12">
          <div className="flex w-full flex-1 flex-col gap-12">
            <header className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex w-full max-w-3xl flex-col gap-4 lg:max-w-xl">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl lg:text-4xl">
                Simulation Studio
              </h1>
              <p className="text-gray-600 text-sm">
                Configure the parents above and run a simulation to reveal
                predicted phenotype distributions.
              </p>
            </div>

            <div className="flex w-full flex-1 flex-col gap-5 rounded-3xl border border-slate-200 bg-gradient-to-br from-sky-50 via-white to-indigo-50 p-6 text-center shadow-2xl shadow-slate-200/60">
              <div className="space-y-3 text-left">
                <div className="flex items-center justify-between text-sm text-slate-500">
                  <span>Simulations</span>
                  <span>{simulations.toLocaleString()}</span>
                </div>
                <div className="flex w-full items-center gap-4">
                  <div className="flex flex-1 flex-col justify-center">
                    <input
                      id="simulationSlider"
                      type="range"
                      min={50}
                      max={5000}
                      step={50}
                      value={simulations}
                      onChange={(event) =>
                        setSimulations(Number(event.target.value))
                      }
                      className="w-full accent-sky-500"
                    />
                    <div className="flex justify-between text-sm text-slate-400 mt-1">
                      <span>Quick</span>
                      <span>Precise</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleCompute}
                    disabled={isComputing}
                    className="group relative flex cursor-pointer items-center justify-center self-center rounded-lg bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 text-white shadow-lg transition hover:scale-105 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
                    aria-label="Run Simulation"
                    style={{
                      width: "var(--primary-action-size)",
                      height: "var(--primary-action-size)",
                    }}
                  >
                    {isComputing ? (
                      <RiLoader5Line
                        className="animate-spin text-white"
                        style={{
                          width: "var(--primary-action-icon-size)",
                          height: "var(--primary-action-icon-size)",
                        }}
                      />
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        className="text-white"
                        style={{
                          width: "var(--primary-action-icon-size)",
                          height: "var(--primary-action-icon-size)",
                        }}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 3v18l15-9-15-9z"
                        />
                      </svg>
                    )}
                    <span className="absolute inset-0 -z-10 bg-white/40 opacity-0 blur transition duration-300 group-hover:opacity-100" />
                  </button>
                </div>
              </div>
              {/* Toast notifications for error and success */}
              {showErrorToast && error && (
                <div className="fixed top-8 left-1/2 z-50 -translate-x-1/2 flex items-center gap-3 rounded-xl px-6 py-3 text-white shadow-lg animate-fade-in bg-rose-500">
                  <span className="font-semibold flex-1">{error}</span>
                  <button
                    type="button"
                    className="ml-3 text-white/80 hover:text-white text-lg font-bold"
                    aria-label="Close error toast"
                    onClick={() => {
                      setShowErrorToast(false);
                      setError(null);
                    }}
                  >
                    &times;
                  </button>
                </div>
              )}
              {result && showSuccessToast && !isComputing && !error && (
                <div className="fixed top-8 left-1/2 z-50 -translate-x-1/2 flex items-center gap-3 rounded-xl px-6 py-3 text-white shadow-lg animate-fade-in bg-emerald-500">
                  <HiOutlineSparkles
                    className="text-white"
                    style={{
                      width: "var(--icon-sm)",
                      height: "var(--icon-sm)",
                    }}
                  />
                  <span className="flex-1">
                    Simulation complete! Scroll down to review phenotype
                    insights.
                  </span>
                  <button
                    type="button"
                    className="text-white/80 transition hover:text-white"
                    aria-label="Close success toast"
                    onClick={() => {
                      setShowSuccessToast(false);
                    }}
                  >
                    &times;
                  </button>
                </div>
              )}
            </div>
          </header>

            <div className="grid gap-6 lg:grid-cols-2">
            {/* Parent A */}
            <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-200/60">
              <div
                className="absolute inset-x-0 top-0 bg-gradient-to-r from-pink-400 via-fuchsia-400 to-purple-400"
                style={{ height: "var(--accent-divider-thickness)" }}
              />
              <div className="flex items-center justify-between px-6 pt-6 text-sm uppercase tracking-[0.2em] text-slate-600">
                <span className="inline-flex items-center gap-2 text-slate-700">
                  <FaFemale />
                  Parent A
                </span>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-1 text-xs text-slate-600 transition hover:border-pink-300 hover:bg-pink-50"
                  onClick={() =>
                    setMotherSex((prev) =>
                      prev === "female" ? "male" : "female"
                    )
                  }
                >
                  <HiSwitchHorizontal
                    style={{
                      width: "var(--icon-xs)",
                      height: "var(--icon-xs)",
                    }}
                  />
                  {motherSex === "female" ? "Female" : "Male"}
                </button>
              </div>
              <p className="px-6 text-xs font-medium uppercase tracking-[0.3em] text-pink-400">
                genotype designer
              </p>
              <div
                className="mt-5 overflow-y-auto px-6 pb-6 pr-7"
                style={{ maxHeight: "var(--panel-scroll-height)" }}
              >
                <div className="custom-scroll space-y-4">
                  {genes.map((gene) => {
                    const isActive = activeGene === gene.uid;
                    return (
                      <div
                        key={`mother-${gene.uid}`}
                        role="button"
                        tabIndex={0}
                        onMouseEnter={() => setActiveGene(gene.uid)}
                        onClick={() => setActiveGene(gene.uid)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            setActiveGene(gene.uid);
                          }
                        }}
                        className={`rounded-2xl border bg-slate-50/80 p-4 shadow-sm transition-all duration-300 ${
                          isActive
                            ? "border-pink-300 ring-2 ring-pink-200/60"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-600">
                          <span className="font-semibold text-slate-700">
                            {gene.displayName || gene.id || "New Gene"}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {dominanceLabel[gene.dominance]}
                          </span>
                        </div>
                        <div className="mt-3">
                          {renderAlleleSelects("mother", gene)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            {/* Parent B */}
            <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-200/60">
              <div
                className="absolute inset-x-0 top-0 bg-gradient-to-r from-sky-400 via-cyan-400 to-blue-400"
                style={{ height: "var(--accent-divider-thickness)" }}
              />
              <div className="flex items-center justify-between px-6 pt-6 text-sm uppercase tracking-[0.2em] text-slate-600">
                <span className="inline-flex items-center gap-2 text-slate-700">
                  <FaMale />
                  Parent B
                </span>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-1 text-xs text-slate-600 transition hover:border-sky-300 hover:bg-sky-50"
                  onClick={() =>
                    setFatherSex((prev) =>
                      prev === "male" ? "female" : "male"
                    )
                  }
                >
                  <HiSwitchHorizontal
                    style={{
                      width: "var(--icon-xs)",
                      height: "var(--icon-xs)",
                    }}
                  />
                  {fatherSex === "male" ? "Male" : "Female"}
                </button>
              </div>
              <p className="px-6 text-xs font-medium uppercase tracking-[0.3em] text-sky-400">
                genotype designer
              </p>
              <div
                className="mt-5 overflow-y-auto px-6 pb-6 pr-7"
                style={{ maxHeight: "var(--panel-scroll-height)" }}
              >
                <div className="custom-scroll space-y-4">
                  {genes.map((gene) => {
                    const isActive = activeGene === gene.uid;
                    return (
                      <div
                        key={`father-${gene.uid}`}
                        role="button"
                        tabIndex={0}
                        onMouseEnter={() => setActiveGene(gene.uid)}
                        onClick={() => setActiveGene(gene.uid)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            setActiveGene(gene.uid);
                          }
                        }}
                        className={`rounded-2xl border bg-slate-50/80 p-4 shadow-sm transition-all duration-300 ${
                          isActive
                            ? "border-sky-300 ring-2 ring-sky-200/60"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-600">
                          <span className="font-semibold text-slate-700">
                            {gene.displayName || gene.id || "New Gene"}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {dominanceLabel[gene.dominance]}
                          </span>
                        </div>
                        <div className="mt-3">
                          {renderAlleleSelects("father", gene)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

            <section className="relative rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-blue-50 p-6 shadow-2xl shadow-slate-200/60">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_70%)]" />
            <div className="relative mx-auto flex max-w-5xl flex-col gap-6">
              <header className="flex flex-wrap items-center justify-between gap-4 text-sm uppercase tracking-[0.3em] text-slate-600">
                <span className="inline-flex items-center gap-2 text-slate-700">
                  <HiOutlineSparkles
                    className="text-emerald-500"
                    style={{
                      width: "var(--icon-sm)",
                      height: "var(--icon-sm)",
                    }}
                  />
                  Offspring Projection
                </span>
                {result && (
                  <span className="text-xs text-slate-600">
                    {result.simulations.toLocaleString()} iterations
                  </span>
                )}
              </header>
              <div
                className="custom-scroll flex flex-col gap-6 overflow-y-auto pr-2"
                style={{ maxHeight: "var(--panel-scroll-height)" }}
              >
                {!result && (
                  <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-slate-300 bg-white/70 p-8 text-center text-slate-500">
                    <FaDna
                      className="text-slate-400"
                      style={{
                        width: "var(--icon-lg)",
                        height: "var(--icon-lg)",
                      }}
                    />
                    <p className="text-sm text-slate-600">
                      Configure the parents above and run a simulation to reveal
                      predicted phenotype distributions.
                    </p>
                  </div>
                )}
                {result && (
                  <>
                    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow">
                      <h3 className="text-xs uppercase tracking-[0.3em] text-slate-600">
                        Sex distribution
                      </h3>
                      <div className="mt-4 space-y-3">
                        {sexBreakdown.map((entry) => (
                          <div
                            key={entry.sex}
                            className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 shadow-sm"
                          >
                            <span
                              className="text-xs uppercase tracking-[0.2em] text-slate-600"
                              style={{ minWidth: "var(--panel-label-width)" }}
                            >
                              {entry.sex}
                            </span>
                            <div className="flex-1 rounded-full bg-slate-200">
                              <div
                                className="rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 py-1 text-[10px] text-center text-white"
                                style={{ width: `${entry.share}%` }}
                              >
                                {entry.share}%
                              </div>
                            </div>
                            <span
                              className="text-right text-xs text-slate-600"
                              style={{ minWidth: "var(--panel-label-width)" }}
                            >
                              {entry.count}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      {traitSummaries.map((summary) => (
                        <div
                          key={summary.id}
                          className="rounded-3xl border border-slate-200 bg-white p-4 shadow"
                        >
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-700">
                              {summary.label}
                            </h4>
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-emerald-600 shadow-sm">
                              mean {summary.mean.toFixed(2)}
                            </span>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {summary.descriptors.map(([label, value]) => (
                              <span
                                key={label || "unspecified"}
                                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] text-slate-700 shadow-sm"
                              >
                                {label || "unspecified"}
                                <span className="rounded-full bg-white px-2 py-0.5 text-[10px] text-slate-600">
                                  {value}
                                </span>
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </section>
          </div>

          <aside
            id="trait-library-panel"
            aria-hidden={!isTraitPanelOpen}
            className={`mt-10 w-full lg:mt-0 lg:w-auto lg:flex-shrink-0 lg:self-start lg:sticky ${
              isTraitPanelOpen ? "" : "hidden lg:block"
            }`}
            style={traitPanelStyle}
          >
            <div className="flex h-full w-full flex-col gap-4 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-xl shadow-slate-200/60 backdrop-blur lg:h-full lg:overflow-y-auto">
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] uppercase tracking-[0.3em] text-slate-500 shadow-sm">
                  <FaDna
                    className="text-sky-500"
                    style={{
                      width: "var(--icon-xs)",
                      height: "var(--icon-xs)",
                    }}
                  />
                  Trait Library
                </div>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Build your gene lineup
                  </h3>
                  <p className="text-sm text-slate-600">
                    Pick traits to instantly generate gene definitions for both
                    parents.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <select
                    value={selectedTraitKey}
                    onChange={(event) =>
                      setSelectedTraitKey(event.target.value)
                    }
                    disabled={isLoadingTraits || !traitOptions.length}
                    className="w-full flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-200 disabled:cursor-not-allowed disabled:bg-slate-100"
                  >
                    {isLoadingTraits && (
                      <option value="">Loading traits...</option>
                    )}
                    {!isLoadingTraits && !traitOptions.length && (
                      <option value="">All available traits added</option>
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
                    disabled={
                      isLoadingTraits || !selectedTrait || !traitOptions.length
                    }
                    className="inline-flex items-center cursor-pointer justify-center gap-2 rounded-lg bg-gradient-to-r from-emerald-400 to-teal-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <FaPlusCircle
                      style={{
                        width: "var(--icon-xs)",
                        height: "var(--icon-xs)",
                      }}
                    />
                    Add Trait
                  </button>
                </div>

                {traitsError && (
                  <p className="text-xs text-rose-500">{traitsError}</p>
                )}

                {!!quickPickTraits.length && (
                  <div className="flex flex-wrap gap-2">
                    {quickPickTraits.map((trait) => (
                      <button
                        key={`quick-${trait.key}`}
                        type="button"
                        onClick={() => setSelectedTraitKey(trait.key)}
                        className={`rounded-full cursor-pointer border px-3 py-1 text-xs font-medium transition ${
                          selectedTraitKey === trait.key
                            ? "border-sky-400 bg-sky-500 text-white shadow"
                            : "border-slate-200 bg-slate-100 text-slate-600 hover:border-sky-300 hover:bg-sky-50"
                        }`}
                      >
                        {trait.name}
                      </button>
                    ))}
                  </div>
                )}

                <div className="space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                    Active genes
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {genes.length ? (
                      genes.map((gene) => {
                        const isActive = activeGene === gene.uid;
                        return (
                          <div
                            key={`gene-pill-${gene.uid}`}
                            className={`group inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition ${
                              isActive
                                ? "border-sky-400 bg-sky-500 text-white shadow"
                                : "border-slate-200 bg-slate-100 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => setActiveGene(gene.uid)}
                              className="flex items-center gap-2 focus:outline-none"
                            >
                              <span>
                                {gene.displayName || gene.id || "Unnamed gene"}
                              </span>
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] uppercase ${
                                  isActive
                                    ? "bg-white/20 text-white"
                                    : "bg-white text-slate-500"
                                }`}
                              >
                                {dominanceLabel[gene.dominance]}
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveGene(gene.uid)}
                              className={`ml-2 rounded-full p-1 transition ${
                                isActive
                                  ? "text-white/80 hover:text-white"
                                  : "text-slate-400 hover:text-rose-500"
                              }`}
                              aria-label={`Remove ${
                                gene.displayName || gene.id || "gene"
                              }`}
                            >
                              <FaTrashAlt
                                style={{
                                  width: "var(--icon-xxs)",
                                  height: "var(--icon-xxs)",
                                }}
                              />
                            </button>
                          </div>
                        );
                      })
                    ) : (
                      <span className="text-xs text-slate-500">
                        No genes yet. Use the controls above to add your first
                        gene.
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SimulationStudioPage;
