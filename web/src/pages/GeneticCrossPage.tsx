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

type NumericField = number | "";

interface AlleleEffectForm extends AlleleEffectPayload {
  id: string;
}

interface AlleleForm extends Omit<AlleleDefinitionPayload, "effects"> {
  id: string;
  dominance_rank: number;
  effects: AlleleEffectForm[];
}

interface GeneForm {
  uid: string;
  id: string;
  chromosome: ChromosomeType;
  dominance: DominancePattern;
  defaultAlleleId: string;
  alleles: AlleleForm[];
  linkageGroup: NumericField;
  recombinationProbability: NumericField;
  incompleteBlendWeight: NumericField;
}

type ParentGenotypeState = Record<string, string[]>;

const DEFAULT_GENES: GeneForm[] = [
  {
    uid: "gene-1",
    id: "fur_color",
    chromosome: "autosomal",
    dominance: "complete",
    defaultAlleleId: "B",
    linkageGroup: "",
    recombinationProbability: "",
    incompleteBlendWeight: "",
    alleles: [
      {
        id: "B",
        dominance_rank: 2,
        effects: [
          {
            id: "B-effect-0",
            trait_id: "coat_color",
            magnitude: 1.0,
            description: "black pigment",
          },
        ],
      },
      {
        id: "b",
        dominance_rank: 1,
        effects: [
          {
            id: "b-effect-0",
            trait_id: "coat_color",
            magnitude: 0.6,
            description: "brown pigment",
          },
        ],
      },
    ],
  },
  {
    uid: "gene-2",
    id: "pigment_gate",
    chromosome: "autosomal",
    dominance: "complete",
    defaultAlleleId: "E",
    linkageGroup: "",
    recombinationProbability: "",
    incompleteBlendWeight: "",
    alleles: [
      {
        id: "E",
        dominance_rank: 1,
        effects: [
          {
            id: "E-effect-0",
            trait_id: "coat_color",
            magnitude: 0.1,
            description: "pigment enabled",
          },
        ],
      },
      {
        id: "e",
        dominance_rank: 0,
        effects: [
          {
            id: "e-effect-0",
            trait_id: "coat_color",
            magnitude: 0,
            description: "pigment disabled",
          },
        ],
      },
    ],
  },
  {
    uid: "gene-3",
    id: "vision",
    chromosome: "x",
    dominance: "complete",
    defaultAlleleId: "C",
    linkageGroup: "",
    recombinationProbability: "",
    incompleteBlendWeight: "",
    alleles: [
      {
        id: "C",
        dominance_rank: 1,
        effects: [
          {
            id: "C-effect-0",
            trait_id: "vision",
            magnitude: 1,
            description: "normal color vision",
          },
        ],
      },
      {
        id: "c",
        dominance_rank: 0,
        effects: [
          {
            id: "c-effect-0",
            trait_id: "vision",
            magnitude: 0,
            description: "colorblind",
          },
        ],
      },
    ],
  },
];

const generateUid = () => Math.random().toString(36).slice(2);

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

const GeneticCrossPage: React.FC = () => {
  const [genes, setGenes] = useState<GeneForm[]>(DEFAULT_GENES);
  const [motherSex, setMotherSex] = useState<"female" | "male">("female");
  const [fatherSex, setFatherSex] = useState<"female" | "male">("male");
  const [motherGenotype, setMotherGenotype] = useState<ParentGenotypeState>(
    () => syncGenotype(DEFAULT_GENES, "female", {})
  );
  const [fatherGenotype, setFatherGenotype] = useState<ParentGenotypeState>(
    () => syncGenotype(DEFAULT_GENES, "male", {})
  );
  const [simulations, setSimulations] = useState(500);
  const [result, setResult] = useState<GeneticCrossResponsePayload | null>(
    null
  );
  const [isComputing, setIsComputing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeGene, setActiveGene] = useState<string>(
    DEFAULT_GENES[0]?.uid ?? ""
  );

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

  const handleAddGene = () => {
    const uid = `gene-${generateUid()}`;
    const alleleId = `A${Math.floor(Math.random() * 90 + 10)}`;
    const newGene: GeneForm = {
      uid,
      id: "",
      chromosome: "autosomal",
      dominance: "complete",
      defaultAlleleId: "",
      linkageGroup: "",
      recombinationProbability: "",
      incompleteBlendWeight: "",
      alleles: [
        {
          id: alleleId,
          dominance_rank: 1,
          effects: [
            {
              id: `${alleleId}-effect-0`,
              trait_id: "",
              magnitude: 1,
              description: "",
            },
          ],
        },
      ],
    };
        const updated = [...genes, newGene];
        setGenes(updated);
        ensureGenotypes(updated, motherSex, fatherSex);
        setActiveGene(uid);
  };

  const handleRemoveGene = (uid: string) => {
    const geneToRemove = genes.find((gene) => gene.uid === uid);
    if (!geneToRemove) {
      return;
    }
    const updated = genes.filter((gene) => gene.uid !== uid);
    setGenes(updated);
    setMotherGenotype((prev) => {
      const next = { ...prev };
      delete next[geneToRemove.id];
      delete next[geneToRemove.uid];
      return next;
    });
    setFatherGenotype((prev) => {
      const next = { ...prev };
      delete next[geneToRemove.id];
      delete next[geneToRemove.uid];
      return next;
    });
  };

  const handleGeneFieldChange = <Key extends keyof GeneForm>(
    uid: string,
    field: Key,
    value: GeneForm[Key]
  ) => {
    setGenes((prev) =>
      prev.map((gene) => {
        if (gene.uid !== uid) return gene;
        const nextGene = { ...gene, [field]: value } as GeneForm;
        if (
          field === "defaultAlleleId" &&
          typeof value === "string" &&
          !gene.alleles.some((allele) => allele.id === value)
        ) {
          nextGene.defaultAlleleId = gene.alleles[0]?.id ?? "";
        }
        return nextGene;
      })
    );

    if (field === "id" && typeof value === "string") {
      const current = genes.find((gene) => gene.uid === uid);
      if (current && value.trim() && value.trim() !== current.id) {
        const newId = value.trim();
        setMotherGenotype((prev) => {
          const next = { ...prev };
          const existing = next[current.id] ?? next[current.uid];
          if (existing) {
            delete next[current.id];
            delete next[current.uid];
            next[newId] = existing;
          }
          return next;
        });
        setFatherGenotype((prev) => {
          const next = { ...prev };
          const existing = next[current.id] ?? next[current.uid];
          if (existing) {
            delete next[current.id];
            delete next[current.uid];
            next[newId] = existing;
          }
          return next;
        });
      }
    }
  };

  const updateAllele = (
    geneUid: string,
    alleleId: string,
    updater: (allele: AlleleForm) => AlleleForm
  ) => {
    setGenes((prev) =>
      prev.map((gene) => {
        if (gene.uid !== geneUid) return gene;
        const updatedAlleles = gene.alleles.map((allele) =>
          allele.id === alleleId ? updater(allele) : allele
        );
        let updatedDefault = gene.defaultAlleleId;
        if (!updatedAlleles.some((allele) => allele.id === updatedDefault)) {
          updatedDefault = updatedAlleles[0]?.id ?? "";
        }
        return {
          ...gene,
          alleles: updatedAlleles,
          defaultAlleleId: updatedDefault,
        };
      })
    );
  };

  const handleAlleleIdChange = (
    geneUid: string,
    oldId: string,
    nextId: string
  ) => {
    updateAllele(geneUid, oldId, (allele) => ({
      ...allele,
      id: nextId,
      effects: allele.effects.map((effect) => ({
        ...effect,
        id:
          effect.id.indexOf(oldId) === 0
            ? `${nextId}${effect.id.slice(oldId.length)}`
            : effect.id,
      })),
    }));

    const currentGene = genes.find((gene) => gene.uid === geneUid);
    if (currentGene) {
      const key = currentGene.id || currentGene.uid;
      setMotherGenotype((prev) => {
        const next = { ...prev };
        if (next[key]) {
          next[key] = next[key].map((allele) =>
            allele === oldId ? nextId : allele
          );
        }
        return next;
      });
      setFatherGenotype((prev) => {
        const next = { ...prev };
        if (next[key]) {
          next[key] = next[key].map((allele) =>
            allele === oldId ? nextId : allele
          );
        }
        return next;
      });
    }
  };

  const handleAddAllele = (geneUid: string) => {
    const alleleId = `allele-${generateUid().slice(0, 4)}`;
    setGenes((prev) =>
      prev.map((gene) => {
        if (gene.uid !== geneUid) return gene;
        const updatedAlleles = [
          ...gene.alleles,
          {
            id: alleleId,
            dominance_rank: 1,
            effects: [
              {
                id: `${alleleId}-effect-0`,
                trait_id: "",
                magnitude: 1,
                description: "",
              },
            ],
          },
        ];
        return {
          ...gene,
          alleles: updatedAlleles,
          defaultAlleleId: gene.defaultAlleleId || alleleId,
        };
      })
    );
  };

  const handleRemoveAllele = (geneUid: string, alleleId: string) => {
    setGenes((prev) =>
      prev.map((gene) => {
        if (gene.uid !== geneUid) return gene;
        const filtered = gene.alleles.filter(
          (allele) => allele.id !== alleleId
        );
        return {
          ...gene,
          alleles: filtered,
          defaultAlleleId: filtered[0]?.id ?? "",
        };
      })
    );
  };

  const handleEffectChange = (
    geneUid: string,
    alleleId: string,
    effectId: string,
    field: keyof AlleleEffectForm,
    value: string | number
  ) => {
    setGenes((prev) =>
      prev.map((gene) => {
        if (gene.uid !== geneUid) return gene;
        return {
          ...gene,
          alleles: gene.alleles.map((allele) => {
            if (allele.id !== alleleId) return allele;
            return {
              ...allele,
              effects: allele.effects.map((effect) =>
                effect.id === effectId ? { ...effect, [field]: value } : effect
              ),
            };
          }),
        };
      })
    );
  };

  const handleAddEffect = (geneUid: string, alleleId: string) => {
    const effectId = `effect-${generateUid().slice(0, 4)}`;
    setGenes((prev) =>
      prev.map((gene) => {
        if (gene.uid !== geneUid) return gene;
        return {
          ...gene,
          alleles: gene.alleles.map((allele) => {
            if (allele.id !== alleleId) return allele;
            return {
              ...allele,
              effects: [
                ...allele.effects,
                {
                  id: effectId,
                  trait_id: "",
                  magnitude: 0,
                  description: "",
                },
              ],
            };
          }),
        };
      })
    );
  };

  const handleRemoveEffect = (
    geneUid: string,
    alleleId: string,
    effectId: string
  ) => {
    setGenes((prev) =>
      prev.map((gene) => {
        if (gene.uid !== geneUid) return gene;
        return {
          ...gene,
          alleles: gene.alleles.map((allele) => {
            if (allele.id !== alleleId) return allele;
            return {
              ...allele,
              effects: allele.effects.filter(
                (effect) => effect.id !== effectId
              ),
            };
          }),
        };
      })
    );
  };

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
      if (!gene.alleles.length) {
        return `Gene "${gene.id || "Unnamed"}" needs at least one allele.`;
      }
      for (const allele of gene.alleles) {
        if (!allele.id.trim()) {
          return `All alleles require an identifier for gene "${gene.id}".`;
        }
        if (!allele.effects.length) {
          return `Allele "${allele.id}" in gene "${gene.id}" needs at least one trait effect.`;
        }
        for (const effect of allele.effects) {
          if (!effect.trait_id.trim()) {
            return `Please set a trait ID for allele "${allele.id}" in gene "${gene.id}".`;
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
      return {
        trait,
        mean: summary.mean_quantitative,
        descriptors,
      };
    });
  }, [result]);

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

        <div className="relative mx-auto flex max-w-7xl flex-col gap-12">
          <header className="flex flex-col gap-4">
            <div className="inline-flex items-center gap-2 self-start rounded-full border border-slate-200 bg-white px-4 py-1 text-xs uppercase tracking-[0.3em] text-slate-500 shadow-sm">
              <HiOutlineSparkles className="h-4 w-4 text-sky-500" />
              Cross Studio
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl lg:text-5xl">
              Compute Genetic Cross
            </h1>
            <p className="max-w-3xl text-sm leading-relaxed text-slate-600 md:text-base">
              Craft parent genotypes, define gene behavior, and simulate
              offspring outcomes with our high-fidelity C++ engine. Mix and
              match alleles, adjust dominance strategies, and visualize how
              traits flow into the next generation.
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
                    setMotherSex((prev) => (prev === "female" ? "male" : "female"))
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
                            {gene.id || "New Gene"}
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
              <div className="relative flex h-full flex-col items-center px-8 py-10 text-center">
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] uppercase tracking-[0.3em] text-slate-500">
                  Simulation Studio
                </span>
                <FaDna className="mt-6 h-12 w-12 text-sky-500" />
                <p className="mt-4 text-sm leading-relaxed text-slate-600">
                  Adjust simulation fidelity and compute cross-over outcomes. We’ll run{" "}
                  <span className="font-semibold text-slate-700">
                    {simulations.toLocaleString()}
                  </span>{" "}
                  stochastic matings using the C++ engine.
                </p>
                <div className="mt-8 w-full space-y-3">
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
                    onChange={(event) => setSimulations(Number(event.target.value))}
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
                      Computing...
                    </>
                  ) : (
                    <>
                      Compute
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
                    Simulation complete! Scroll down to review phenotype insights.
                  </p>
                )}
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
                    setFatherSex((prev) => (prev === "male" ? "female" : "male"))
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
                            {gene.id || "New Gene"}
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
                      Configure the parents above and run a simulation to reveal predicted phenotype distributions.
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
                          key={summary.trait}
                          className="rounded-3xl border border-slate-200 bg-white p-4 shadow"
                        >
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-700">
                              {summary.trait}
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

          <section className="relative rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl shadow-slate-300/50">
            <header className="flex flex-col gap-3 border-b border-slate-200 pb-6 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">Gene Studio</h2>
                <p className="text-sm text-slate-600">
                  Curate the genes participating in this cross. Tune dominance hierarchies, linkage, and trait effects for each allele.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleAddGene}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-blue-300 hover:bg-blue-50"
                >
                  <FaPlusCircle className="h-4 w-4 text-emerald-500" />
                  Add Gene
                </button>
                <span className="rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-xs uppercase tracking-[0.3em] text-slate-600">
                  {genes.length} Active
                </span>
              </div>
            </header>

            <div className="mt-8 grid gap-6 lg:grid-cols-[2fr,1.2fr]">
              <div className="space-y-4">
                {genes.map((gene) => {
                  const isActive = activeGeneDetail?.uid === gene.uid;
                  return (
                    <div
                      key={`studio-${gene.uid}`}
                      role="button"
                      tabIndex={0}
                      onClick={() => setActiveGene(gene.uid)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          setActiveGene(gene.uid);
                        }
                      }}
                      className={`rounded-2xl border bg-slate-50 p-5 shadow-xl shadow-slate-200/50 transition-all duration-300 ${
                        isActive
                          ? "border-emerald-300 ring-2 ring-emerald-200/60"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                            {gene.id || "Unnamed gene"}
                          </p>
                          <p className="text-sm text-slate-600">
                            {chromoLabel[gene.chromosome]} · {dominanceLabel[gene.dominance]}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-white px-3 py-1 text-[11px] text-slate-600 shadow-sm">
                            {gene.alleles.length} alleles
                          </span>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleRemoveGene(gene.uid);
                            }}
                            className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-rose-500 transition hover:border-rose-300 hover:bg-rose-100"
                          >
                            <FaTrashAlt className="h-3.5 w-3.5" />
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {!genes.length && (
                  <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-slate-300 bg-slate-100 p-12 text-center text-slate-600">
                    <FaDna className="h-10 w-10 text-slate-400" />
                    <p className="text-sm text-slate-600">
                      No genes configured yet. Add at least one gene to set up the cross.
                    </p>
                    <button
                      type="button"
                      onClick={handleAddGene}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-blue-300 hover:bg-blue-50"
                    >
                      <FaPlusCircle className="h-4 w-4 text-emerald-500" />
                      Add your first gene
                    </button>
                  </div>
                )}
              </div>

              <aside className="relative rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-lg">
                <div className="pointer-events-none absolute -top-10 -right-10 h-24 w-24 rounded-full bg-gradient-to-br from-emerald-300/50 to-sky-300/40 blur-2xl" />
                {activeGeneDetail ? (
                  <div className="relative space-y-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                        Selected Gene
                      </p>
                      <h3 className="mt-2 text-xl font-semibold text-slate-800">
                        {activeGeneDetail.id || "Unnamed gene"}
                      </h3>
                      <p className="text-sm text-slate-600">
                        {chromoLabel[activeGeneDetail.chromosome]} ·{" "}
                        {dominanceLabel[activeGeneDetail.dominance]}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-xs uppercase tracking-[0.3em] text-slate-500">
                        Allele catalogue
                      </h4>
                      <div className="space-y-3">
                        {activeGeneDetail.alleles.map((allele) => (
                          <div
                            key={`${activeGeneDetail.uid}-${allele.id}`}
                            className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-slate-700">
                                {allele.id}
                              </span>
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">
                                Dominance rank {allele.dominance_rank}
                              </span>
                            </div>
                            <ul className="mt-2 space-y-1 text-xs text-slate-600">
                              {allele.effects.map((effect) => (
                                <li key={effect.id} className="flex items-start gap-2">
                                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                  <div>
                                    <span className="font-medium text-slate-700">
                                      {effect.trait_id}
                                    </span>{" "}
                                    · magnitude {effect.magnitude}
                                    {effect.description && (
                                      <span className="text-slate-500">
                                        {" "}
                                        — {effect.description}
                                      </span>
                                    )}
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-slate-500">
                    <FaDna className="h-10 w-10 text-slate-400" />
                    <p className="text-sm">Select or create a gene to view its details.</p>
                  </div>
                )}
              </aside>
            </div>
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default GeneticCrossPage;
