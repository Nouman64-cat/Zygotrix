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
  };

  const scrollToTraitLibrary = () => {
    if (typeof document === "undefined") {
      return;
    }
    const element = document.getElementById("trait-library");
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
    const validationError = validateGenes();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setIsComputing(true);
      const payload = payloadBuilder();
      const data = await computeGeneticCross(payload);
      setResult(data);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to compute genetic cross. Please try again.";
      setError(message);
    } finally {
      setIsComputing(false);
    }
  };

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

  const headlineMetrics = useMemo(
    () => [
      {
        id: "gene-count",
        label: "Genes Configured",
        value: genes.length.toString(),
        accent: "from-fuchsia-400/80 to-purple-500/80",
        icon: <FaDna className="h-5 w-5" />,
      },
      {
        id: "simulation-depth",
        label: "Simulation Depth",
        value: simulations.toLocaleString(),
        accent: "from-sky-400/80 to-cyan-500/80",
        icon: <HiOutlineSparkles className="h-5 w-5" />,
      },
      {
        id: "trait-insights",
        label: "Traits Measured",
        value: result
          ? Object.keys(result.trait_summaries).length.toString()
          : "--",
        accent: "from-emerald-400/80 to-teal-500/80",
        icon: <FaPlusCircle className="h-5 w-5" />,
      },
    ],
    [genes.length, result, simulations]
  );

  const activeGeneDetail = useMemo(() => {
    if (!genes.length) {
      return null;
    }
    return genes.find((gene) => gene.uid === activeGene) ?? genes[0];
  }, [activeGene, genes]);

  return (
    <DashboardLayout>
      <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-white via-slate-50 to-blue-50 px-4 pb-20 pt-10 text-slate-900">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -right-32 h-80 w-80 rounded-full bg-blue-200/40 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-purple-200/40 blur-3xl" />
        </div>

        <div className="relative mx-auto flex max-w-8xl flex-col gap-12">
          <header className="flex flex-col gap-4">
            <div className="inline-flex items-center gap-2 self-start rounded-full border border-slate-200 bg-white px-4 py-1 text-xs uppercase tracking-[0.3em] text-slate-500 shadow-sm">
              <HiOutlineSparkles className="h-4 w-4 text-sky-500" />
              Simulation Studio
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl lg:text-5xl">
              Simulation Studio
            </h1>
            <p className="max-w-3xl text-sm leading-relaxed text-slate-600 md:text-base">
              Assemble traits, configure parent genotypes, and launch genetic
              simulations without endless scrolling. Everything you need to test
              inheritance scenarios now lives in one streamlined workspace.
            </p>
          </header>

          <div className="grid gap-4 md:grid-cols-3">
            {headlineMetrics.map((metric) => (
              <div
                key={metric.id}
                className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-lg shadow-slate-200/60"
              >
                <div
                  className={`pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full bg-gradient-to-br ${metric.accent} opacity-60 blur-2xl`}
                />
                <div className="relative flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                      {metric.label}
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">
                      {metric.value}
                    </p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                    {metric.icon}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            {/* Parent A */}
            <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-200/60">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-pink-400 via-fuchsia-400 to-purple-400" />
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
                  <HiSwitchHorizontal className="h-4 w-4" />
                  {motherSex === "female" ? "Female" : "Male"}
                </button>
              </div>
              <p className="px-6 text-xs font-medium uppercase tracking-[0.3em] text-pink-400">
                genotype designer
              </p>
              <div className="mt-5 max-h-[320px] overflow-y-auto px-6 pb-6 pr-7">
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

            {/* Control center */}
            <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-sky-50 via-white to-indigo-50 shadow-2xl shadow-slate-200/60">
              <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.2),_transparent_70%)] opacity-70" />
              <div className="relative flex h-full flex-col gap-8 px-8 py-10">
                <div className="w-full space-y-4 text-left">
                  <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-3 py-1 text-[11px] uppercase tracking-[0.3em] text-slate-500 shadow-sm backdrop-blur">
                    <FaDna className="h-4 w-4 text-sky-500" />
                    Trait Library
                  </div>
                  <div
                    id="trait-library"
                    className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-lg shadow-slate-200/50 backdrop-blur"
                  >
                    <div className="flex flex-col gap-5">
                      <div className="flex flex-col gap-2">
                        <h3 className="text-lg font-semibold text-slate-900">
                          Build your gene lineup
                        </h3>
                        <p className="text-sm text-slate-600">
                          Pick traits to instantly generate gene definitions for
                          both parents.
                        </p>
                      </div>
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <select
                          value={selectedTraitKey}
                          onChange={(event) =>
                            setSelectedTraitKey(event.target.value)
                          }
                          disabled={isLoadingTraits || !traitOptions.length}
                          className="w-full flex-1 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-200 disabled:cursor-not-allowed disabled:bg-slate-100"
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
                            isLoadingTraits ||
                            !selectedTrait ||
                            !traitOptions.length
                          }
                          className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <FaPlusCircle className="h-4 w-4" />
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
                              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
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
                                    {gene.displayName ||
                                      gene.id ||
                                      "Unnamed gene"}
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
                                  <FaTrashAlt className="h-3 w-3" />
                                </button>
                              </div>
                            );
                          })
                        ) : (
                          <span className="text-xs text-slate-500">
                            No genes yet. Add a trait to generate your first
                            gene.
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="relative flex flex-col items-center text-center">
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] uppercase tracking-[0.3em] text-slate-500">
                    Run Simulation
                  </span>
                  <FaDna className="mt-6 h-12 w-12 text-sky-500" />
                  <p className="mt-4 text-sm leading-relaxed text-slate-600">
                    Adjust simulation fidelity and compute cross-over outcomes.
                    We'll run{" "}
                    <span className="font-semibold text-slate-700">
                      {simulations.toLocaleString()}
                    </span>{" "}
                    stochastic matings using the C++ engine.
                  </p>
                  <div className="mt-6 w-full space-y-3">
                    <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-slate-500">
                      <span>Simulations</span>
                      <span>{simulations.toLocaleString()}</span>
                    </div>
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
                    <div className="flex justify-between text-[11px] uppercase tracking-[0.3em] text-slate-400">
                      <span>quick</span>
                      <span>precise</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleCompute}
                    disabled={isComputing}
                    className="group relative mt-8 inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 px-10 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white shadow-lg transition hover:scale-105 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isComputing ? (
                      <>
                        <RiLoader5Line className="h-5 w-5 animate-spin" />
                        Running...
                      </>
                    ) : (
                      <>
                        Run Simulation
                        <HiOutlineSparkles className="h-5 w-5" />
                      </>
                    )}
                    <span className="absolute inset-0 -z-10 bg-white/40 opacity-0 blur transition duration-300 group-hover:opacity-100" />
                  </button>

                  {error && (
                    <p className="mt-4 text-xs text-rose-500">{error}</p>
                  )}
                  {result && !error && !isComputing && (
                    <p className="mt-4 text-xs text-emerald-500">
                      Simulation complete! Scroll down to review phenotype
                      insights.
                    </p>
                  )}
                </div>
              </div>
            </div>
            {/* Parent B */}
            <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-200/60">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-400 via-cyan-400 to-blue-400" />
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
                  <HiSwitchHorizontal className="h-4 w-4" />
                  {fatherSex === "male" ? "Male" : "Female"}
                </button>
              </div>
              <p className="px-6 text-xs font-medium uppercase tracking-[0.3em] text-sky-400">
                genotype designer
              </p>
              <div className="mt-5 max-h-[320px] overflow-y-auto px-6 pb-6 pr-7">
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
                  <HiOutlineSparkles className="h-5 w-5 text-emerald-500" />
                  Offspring Projection
                </span>
                {result && (
                  <span className="text-xs text-slate-600">
                    {result.simulations.toLocaleString()} iterations
                  </span>
                )}
              </header>
              <div className="custom-scroll flex max-h-[320px] flex-col gap-6 overflow-y-auto pr-2">
                {!result && (
                  <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-slate-300 bg-white/70 p-8 text-center text-slate-500">
                    <FaDna className="h-12 w-12 text-slate-400" />
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
                            <span className="w-16 text-xs uppercase tracking-[0.2em] text-slate-600">
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
                            <span className="w-16 text-right text-xs text-slate-600">
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
      </div>
    </DashboardLayout>
  );
};

export default SimulationStudioPage;
