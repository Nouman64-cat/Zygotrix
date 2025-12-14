import React, { useEffect, useMemo, useState, useRef } from "react";
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
  type DominancePattern,
  type GeneticCrossResponsePayload,
} from "../services/cppEngine.api";
import { fetchTraits } from "../services/traits.api";
import type { TraitInfo } from "../types/api";
import { useSimulationTool } from "../context/SimulationToolContext";
import SimulationStudioUtils from "../utils/SimulationStudioUtils";
import type {
  GeneForm,
  ParentGenotypeState,
} from "../types/simulationStudio.types";
import DominanceIndicator, { dominancePalette } from "../components/simulation/DominanceIndicator";

const utils = new SimulationStudioUtils();



const SimulationStudioPage: React.FC = () => {
  // Get simulation tool context for agent integration
  const toolContext = useSimulationTool();

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

  // Refs to track latest state for agent handlers (avoids stale closures)
  const genesRef = useRef(genes);
  const motherGenotypeRef = useRef(motherGenotype);
  const fatherGenotypeRef = useRef(fatherGenotype);
  const simulationsRef = useRef(simulations);
  const availableTraitsRef = useRef(availableTraits);

  // Keep refs in sync with state
  useEffect(() => {
    genesRef.current = genes;
  }, [genes]);
  useEffect(() => {
    motherGenotypeRef.current = motherGenotype;
  }, [motherGenotype]);
  useEffect(() => {
    fatherGenotypeRef.current = fatherGenotype;
  }, [fatherGenotype]);
  useEffect(() => {
    simulationsRef.current = simulations;
  }, [simulations]);
  useEffect(() => {
    availableTraitsRef.current = availableTraits;
  }, [availableTraits]);

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

  // Sync state with tool context for agent control
  useEffect(() => {
    const activeTraits = genes
      .map((gene) =>
        availableTraits.find((trait) => trait.key === gene.traitKey)
      )
      .filter((trait): trait is TraitInfo => trait !== undefined);
    toolContext.setActiveTraits(activeTraits);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [genes, availableTraits]);

  useEffect(() => {
    toolContext.setMotherGenotypeState(motherGenotype);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [motherGenotype]);

  useEffect(() => {
    toolContext.setFatherGenotypeState(fatherGenotype);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fatherGenotype]);

  useEffect(() => {
    toolContext.setSimulationCountState(simulations);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [simulations]);

  useEffect(() => {
    toolContext.setResults(result);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  useEffect(() => {
    toolContext.setIsRunning(isComputing);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isComputing]);

  // Register action handlers for agent control
  useEffect(() => {
    toolContext.registerHandlers({
      onAddTrait: async (traitKey: string) => {
        // Use refs to access current state
        const currentTraits = availableTraitsRef.current;
        const currentGenes = genesRef.current;

        // Smart trait matching: try exact, case-insensitive, partial match
        const normalizedKey = traitKey.toLowerCase().replace(/[_-]/g, "");

        let trait = currentTraits.find((item) => item.key === traitKey);

        // Try case-insensitive exact match
        if (!trait) {
          trait = currentTraits.find(
            (item) => item.key.toLowerCase() === traitKey.toLowerCase()
          );
        }

        // Try partial match on key
        if (!trait) {
          trait = currentTraits.find(
            (item) =>
              item.key.toLowerCase().includes(normalizedKey) ||
              normalizedKey.includes(
                item.key.toLowerCase().replace(/[_-]/g, "")
              )
          );
        }

        // Try partial match on name
        if (!trait) {
          trait = currentTraits.find(
            (item) =>
              item.name.toLowerCase().includes(normalizedKey) ||
              normalizedKey.includes(
                item.name.toLowerCase().replace(/\s+/g, "")
              )
          );
        }

        if (!trait) {
          const availableKeys = currentTraits
            .slice(0, 10)
            .map((t) => t.key)
            .join(", ");
          throw new Error(
            `Trait "${traitKey}" not found. Available traits include: ${availableKeys}...`
          );
        }

        // Check if trait is already added
        if (currentGenes.some((gene) => gene.traitKey === trait.key)) {
          // Trait already exists, skip silently
          return;
        }

        const newGene = utils.buildGeneFromTrait(trait);
        let uniqueId = newGene.id;
        let counter = 1;
        while (currentGenes.some((existing) => existing.id === uniqueId)) {
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
        const updated = [...currentGenes, newGene];
        setGenes(updated);
        genesRef.current = updated; // Update ref immediately for subsequent commands
        setActiveGene(newGene.uid);
        setResult(null);
      },
      onAddAllTraits: async () => {
        // Add all available traits
        const currentTraits = availableTraitsRef.current;
        const currentGenes = genesRef.current;

        let updatedGenes = [...currentGenes];

        for (const trait of currentTraits) {
          // Skip if trait already added
          if (updatedGenes.some((gene) => gene.traitKey === trait.key)) {
            continue;
          }

          const newGene = utils.buildGeneFromTrait(trait);
          let uniqueId = newGene.id;
          let counter = 1;
          while (updatedGenes.some((existing) => existing.id === uniqueId)) {
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
          updatedGenes.push(newGene);
        }

        setGenes(updatedGenes);
        genesRef.current = updatedGenes; // Update ref immediately
        if (updatedGenes.length > 0) {
          setActiveGene(updatedGenes[0].uid);
        }
        setResult(null);
      },
      onRemoveTrait: async (traitKey: string) => {
        const currentGenes = genesRef.current;
        const geneToRemove = currentGenes.find(
          (gene) => gene.traitKey === traitKey
        );
        if (geneToRemove) {
          const updated = currentGenes.filter(
            (gene) => gene.uid !== geneToRemove.uid
          );
          setGenes(updated);
          genesRef.current = updated; // Update ref immediately
          setActiveGene(updated[0]?.uid ?? "");
          setResult(null);
        }
      },
      onSetMotherGenotype: async (geneId: string, alleles: string[]) => {
        const newGenotype = { ...motherGenotypeRef.current, [geneId]: alleles };
        setMotherGenotype(newGenotype);
        motherGenotypeRef.current = newGenotype; // Update ref immediately
      },
      onSetFatherGenotype: async (geneId: string, alleles: string[]) => {
        const newGenotype = { ...fatherGenotypeRef.current, [geneId]: alleles };
        setFatherGenotype(newGenotype);
        fatherGenotypeRef.current = newGenotype; // Update ref immediately
      },
      onRandomizeAlleles: async (parent: "mother" | "father" | "both") => {
        const currentGenes = genesRef.current;
        const randomizeForParent = (sex: "female" | "male") => {
          const newGenotype: ParentGenotypeState = {};
          currentGenes.forEach((gene) => {
            const alleleOptions = gene.alleles.map((a) => a.id);
            if (alleleOptions.length === 0) return;

            const slots =
              gene.chromosome === "autosomal"
                ? 2
                : gene.chromosome === "x" && sex === "male"
                  ? 1
                  : gene.chromosome === "y" && sex === "female"
                    ? 0
                    : 2;

            const randomAlleles: string[] = [];
            for (let i = 0; i < slots; i++) {
              randomAlleles.push(
                alleleOptions[Math.floor(Math.random() * alleleOptions.length)]
              );
            }
            newGenotype[gene.id] = randomAlleles;
          });
          return newGenotype;
        };

        if (parent === "mother" || parent === "both") {
          const motherGeno = randomizeForParent("female");
          setMotherGenotype(motherGeno);
          motherGenotypeRef.current = motherGeno; // Update ref immediately
        }
        if (parent === "father" || parent === "both") {
          const fatherGeno = randomizeForParent("male");
          setFatherGenotype(fatherGeno);
          fatherGenotypeRef.current = fatherGeno; // Update ref immediately
        }
      },
      onSetSimulationCount: async (count: number) => {
        setSimulations(count);
        simulationsRef.current = count; // Update ref immediately
      },
      onRunSimulation: async () => {
        // Access current state through refs
        const currentGenes = genesRef.current;
        const currentMotherGenotype = motherGenotypeRef.current;
        const currentFatherGenotype = fatherGenotypeRef.current;
        const currentSimulations = simulationsRef.current;

        // Trigger the computation
        setError(null);
        setShowErrorToast(false);
        setShowSuccessToast(false);

        // Validation
        if (!currentGenes.length) {
          throw new Error("Please add at least one trait to begin simulation.");
        }
        for (const gene of currentGenes) {
          if (!gene.id.trim()) {
            throw new Error("Every gene requires an identifier.");
          }
          if (!gene.alleles.length) {
            throw new Error(
              `Gene "${gene.displayName || gene.id}" needs at least one allele.`
            );
          }
        }

        setIsComputing(true);
        try {
          // Build payload with current state from refs
          const payload = {
            genes: currentGenes.map((gene) => ({
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
                gene.linkageGroup === ""
                  ? undefined
                  : Number(gene.linkageGroup),
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
              genotype: currentMotherGenotype,
            },
            father: {
              sex: fatherSex,
              genotype: currentFatherGenotype,
            },
            epistasis: [],
            simulations: currentSimulations,
          };

          const data = await computeGeneticCross(payload);
          setResult(data);
          setShowSuccessToast(true);
        } catch (err) {
          const message =
            err instanceof Error
              ? err.message
              : "Unable to compute genetic cross.";
          setError(message);
          setShowErrorToast(true);
          throw err;
        } finally {
          setIsComputing(false);
        }
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [motherSex, fatherSex]);

  const ensureGenotypes = (
    updatedGenes: GeneForm[],
    currentMotherSex: "female" | "male",
    currentFatherSex: "female" | "male"
  ) => {
    setMotherGenotype((prev) =>
      utils.syncGenotype(updatedGenes, currentMotherSex, prev)
    );
    setFatherGenotype((prev) =>
      utils.syncGenotype(updatedGenes, currentFatherSex, prev)
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
    const newGene = utils.buildGeneFromTrait(trait);
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
    setMotherGenotype((prev) => utils.syncGenotype(updated, motherSex, prev));
    setFatherGenotype((prev) => utils.syncGenotype(updated, fatherSex, prev));
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
          className="w-full rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1.5 text-xs font-medium text-slate-800 dark:text-slate-200 outline-none transition-all focus:border-blue-400 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30"
        >
          {options}
        </select>
      );
    }

    const slotCount =
      gene.chromosome === "autosomal" || sex === "female" ? 2 : 1;

    return (
      <div
        className={`grid gap-2 ${slotCount === 2 ? "grid-cols-2" : "grid-cols-1"
          }`}
      >
        {Array.from({ length: slotCount }).map((_, index) => (
          <select
            key={index}
            value={genotype?.[index] ?? gene.defaultAlleleId}
            onChange={(event) =>
              updateParentAllele(parent, gene.id, index, event.target.value)
            }
            className="w-full rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1.5 text-xs font-medium text-slate-800 dark:text-slate-200 outline-none transition-all focus:border-blue-400 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30"
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
      <div className="absolute inset-0 flex overflow-hidden bg-slate-50 dark:bg-slate-950">
        {/* Left Sidebar - Controls */}
        <aside className="flex w-80 flex-shrink-0 flex-col border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          {/* Header */}
          <div className="flex-shrink-0 border-b border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 p-2">
                <FaDna className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900 dark:text-white">
                  Genetics Studio
                </h1>
                <p className="text-[10px] text-slate-600 dark:text-slate-400">
                  Predict offspring traits
                </p>
              </div>
            </div>
          </div>

          {/* Trait Selection */}
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              <div>
                <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-700 dark:text-slate-300">
                  Add Traits
                </h2>
                <div className="space-y-2">
                  <select
                    value={selectedTraitKey}
                    onChange={(event) =>
                      setSelectedTraitKey(event.target.value)
                    }
                    disabled={isLoadingTraits || !traitOptions.length}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-200 outline-none transition-all focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 disabled:cursor-not-allowed disabled:bg-slate-100 dark:disabled:bg-slate-700"
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
                    disabled={
                      isLoadingTraits || !selectedTrait || !traitOptions.length
                    }
                    className="w-full rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md transition-all hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <FaPlusCircle className="mr-2 inline h-3 w-3" />
                    Add Trait
                  </button>
                </div>
                {traitsError && (
                  <p className="mt-2 text-[10px] text-rose-600 dark:text-rose-400">
                    {traitsError}
                  </p>
                )}
              </div>

              {/* Active Traits */}
              {genes.length > 0 && (
                <div>
                  <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-700 dark:text-slate-300">
                    Active Traits ({genes.length})
                  </h3>
                  <div className="space-y-2">
                    {genes.map((gene) => {
                      const isActive = activeGene === gene.uid;
                      return (
                        <div
                          key={gene.uid}
                          className={`group flex items-center justify-between rounded-lg border p-2 transition-all ${isActive
                            ? "border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/30"
                            : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600"
                            }`}
                        >
                          <button
                            type="button"
                            onClick={() => setActiveGene(gene.uid)}
                            className="flex flex-1 items-center gap-2 text-left focus:outline-none"
                          >
                            <span className="text-xs font-semibold text-slate-800 dark:text-white">
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
              <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3">
                <div className="mb-2 flex items-center gap-1.5">
                  <FaInfoCircle className="h-3 w-3 text-slate-500 dark:text-slate-400" />
                  <span className="text-[10px] font-bold uppercase text-slate-700 dark:text-slate-300">
                    Dominance
                  </span>
                </div>
                <div className="space-y-1.5">
                  {(Object.keys(dominancePalette) as DominancePattern[]).map(
                    (pattern) => {
                      const palette = dominancePalette[pattern];
                      return (
                        <div key={pattern} className="flex items-center gap-2">
                          <span
                            className={`h-2 w-2 rounded-full ${palette.dot}`}
                          />
                          <span className="text-[10px] text-slate-600 dark:text-slate-400">
                            {palette.label}
                          </span>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Simulation Controls */}
          <div className="flex-shrink-0 border-t border-slate-200 dark:border-slate-700 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="simSlider"
                  className="text-xs font-bold text-slate-700 dark:text-slate-300"
                >
                  Simulations
                </label>
                <span className="rounded-full bg-emerald-100 dark:bg-emerald-900/50 px-2 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
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
            <div className="flex w-1/2 min-w-0 flex-col overflow-hidden border-r border-slate-200 dark:border-slate-700 bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-950 dark:to-purple-950">
              <div className="flex-shrink-0 border-b border-pink-200 dark:border-pink-900 bg-white/80 dark:bg-slate-900/80 px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-gradient-to-br from-pink-500 to-pink-600 p-2">
                    <FaFemale className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Parent A
                    </h3>
                    <p className="text-[10px] text-slate-600 dark:text-slate-400">
                      Female genotype
                    </p>
                  </div>
                </div>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto p-4">
                {genes.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                    <FaDna className="h-16 w-16 text-slate-300" />
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
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
                          className={`cursor-pointer rounded-lg border-2 bg-white dark:bg-slate-800 p-3 shadow-sm transition-all ${isActive
                            ? "border-pink-400 dark:border-pink-500 ring-2 ring-pink-200 dark:ring-pink-900/50"
                            : "border-slate-200 dark:border-slate-700 hover:border-pink-300 dark:hover:border-pink-600"
                            }`}
                        >
                          <div className="mb-2 flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-800 dark:text-white">
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
            <div className="flex w-1/2 min-w-0 flex-col overflow-hidden bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950">
              <div className="flex-shrink-0 border-b border-blue-200 dark:border-blue-900 bg-white/80 dark:bg-slate-900/80 px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-gradient-to-br from-blue-500 to-blue-600 p-2">
                    <FaMale className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Parent B
                    </h3>
                    <p className="text-[10px] text-slate-600 dark:text-slate-400">
                      Male genotype
                    </p>
                  </div>
                </div>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto p-4">
                {genes.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                    <FaDna className="h-16 w-16 text-slate-300" />
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
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
                          className={`cursor-pointer rounded-lg border-2 bg-white dark:bg-slate-800 p-3 shadow-sm transition-all ${isActive
                            ? "border-blue-400 dark:border-blue-500 ring-2 ring-blue-200 dark:ring-blue-900/50"
                            : "border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600"
                            }`}
                        >
                          <div className="mb-2 flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-800 dark:text-white">
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
          <aside className="flex w-96 flex-shrink-0 flex-col overflow-hidden border-l border-slate-200 dark:border-slate-700 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950 dark:to-indigo-950">
            <div className="flex-shrink-0 border-b border-purple-200 dark:border-purple-900 bg-white/90 dark:bg-slate-900/90 px-4 py-3 backdrop-blur">
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 p-2">
                  <HiOutlineSparkles className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Results
                  </h3>
                  {result && (
                    <p className="text-[10px] text-slate-600 dark:text-slate-400">
                      {result.simulations.toLocaleString()} runs
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              {!result ? (
                <div className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 bg-white/50 dark:bg-slate-800/50 p-8 text-center">
                  <FaDna className="h-12 w-12 text-slate-300 dark:text-slate-600" />
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    Run simulation to see results
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Sex Distribution */}
                  <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 shadow-sm">
                    <h4 className="mb-3 text-xs font-bold text-slate-800 dark:text-white">
                      Sex Distribution
                    </h4>
                    <div className="space-y-2">
                      {sexBreakdown.map((entry) => (
                        <div
                          key={entry.sex}
                          className="flex items-center gap-2"
                        >
                          <span className="w-12 text-[10px] font-semibold uppercase text-slate-700 dark:text-slate-300">
                            {entry.sex}
                          </span>
                          <div className="h-5 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                            <div
                              className="flex h-full items-center justify-center rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 text-[9px] font-bold text-white"
                              style={{ width: `${entry.share}%` }}
                            >
                              {entry.share}%
                            </div>
                          </div>
                          <span className="w-8 text-right text-[10px] font-bold text-slate-700 dark:text-slate-300">
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
                      className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 shadow-sm"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-800 dark:text-white">
                          {summary.label}
                        </h4>
                        <span className="rounded-full bg-purple-100 dark:bg-purple-900/50 px-2 py-0.5 text-[9px] font-bold text-purple-700 dark:text-purple-300">
                          μ {summary.mean.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {summary.descriptors.map(([label, value]) => (
                          <span
                            key={label || "unspecified"}
                            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700 px-2 py-1 text-[10px] font-semibold text-slate-700 dark:text-slate-300"
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
