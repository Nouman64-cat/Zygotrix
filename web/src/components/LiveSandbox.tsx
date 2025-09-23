import React, { useCallback, useEffect, useMemo, useState } from "react";

import { simulateMendelianTrait } from "../services/zygotrixApi";
import type { TraitInfo } from "../types/api";
import {
  deriveDefaultGenotypes,
  sanitizeDiploidGenotype,
} from "../utils/genetics";

type LiveSandboxProps = {
  traits: TraitInfo[];
  loading: boolean;
  error: string | null;
  reload: () => void;
  applyFilters: (filters: {
    inheritance_pattern?: string;
    verification_status?: string;
    category?: string;
    gene_info?: string;
  }) => void;
};

const LiveSandbox: React.FC<LiveSandboxProps> = ({
  traits,
  loading,
  error,
  reload,
  applyFilters,
}) => {
  const [selectedTraitKey, setSelectedTraitKey] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [parent1, setParent1] = useState<string>("");
  const [parent2, setParent2] = useState<string>("");
  const [asPercentages, setAsPercentages] = useState<boolean>(true);

  // Filter state
  const [inheritanceFilter, setInheritanceFilter] = useState<string>("");
  const [verificationFilter, setVerificationFilter] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");

  const [simulationResult, setSimulationResult] = useState<Record<
    string,
    number
  > | null>(null);
  const [simulationLoading, setSimulationLoading] = useState(false);
  const [simulationError, setSimulationError] = useState<string | null>(null);
  const [missingTraits, setMissingTraits] = useState<string[]>([]);

  const traitMap = useMemo(
    () =>
      Object.fromEntries(traits.map((trait) => [trait.key, trait] as const)),
    [traits]
  );

  const filteredTraits = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) {
      return traits;
    }
    return traits.filter((trait) => {
      const name = trait.name.toLowerCase();
      const key = trait.key.toLowerCase();
      const description = (trait.description ?? "").toLowerCase();
      return (
        name.includes(query) ||
        key.includes(query) ||
        description.includes(query)
      );
    });
  }, [searchTerm, traits]);

  const phenotypeTone = useCallback(
    (traitKey: string, phenotype: string): string => {
      const normalized = phenotype.toLowerCase();
      if (traitKey === "blood_type") {
        switch (phenotype.toUpperCase()) {
          case "A":
            return "bg-rose-100 text-rose-700 border-rose-200";
          case "B":
            return "bg-amber-100 text-amber-700 border-amber-200";
          case "AB":
            return "bg-purple-100 text-purple-700 border-purple-200";
          case "O":
            return "bg-slate-100 text-slate-700 border-slate-200";
          default:
            return "bg-white text-slate-700 border-slate-200";
        }
      }
      if (normalized.includes("brown")) {
        return "bg-amber-100/80 text-amber-800 border-amber-200";
      }
      if (normalized.includes("green")) {
        return "bg-emerald-100/80 text-emerald-800 border-emerald-200";
      }
      if (normalized.includes("blue")) {
        return "bg-sky-100/80 text-sky-800 border-sky-200";
      }
      if (normalized.includes("red")) {
        return "bg-rose-100/80 text-rose-800 border-rose-200";
      }
      if (normalized.includes("black")) {
        return "bg-slate-800/80 text-white border-slate-700";
      }
      if (normalized.includes("white")) {
        return "bg-slate-100 text-slate-700 border-slate-200";
      }
      return "bg-white text-slate-700 border-slate-200";
    },
    []
  );

  useEffect(() => {
    if (filteredTraits.length === 0) {
      setSelectedTraitKey("");
      return;
    }
    setSelectedTraitKey((current) => {
      if (current && filteredTraits.some((trait) => trait.key === current)) {
        return current;
      }
      return filteredTraits[0]?.key ?? "";
    });
  }, [filteredTraits]);

  useEffect(() => {
    const trait = traitMap[selectedTraitKey];
    const defaults = deriveDefaultGenotypes(trait);
    setParent1(defaults.parent1);
    setParent2(defaults.parent2);
    setSimulationResult(null);
    setSimulationError(null);
    setMissingTraits([]);
  }, [selectedTraitKey, traitMap]);

  const activeTrait = selectedTraitKey ? traitMap[selectedTraitKey] : undefined;
  const canSimulate =
    Boolean(selectedTraitKey) && parent1.length === 2 && parent2.length === 2;

  const handleSimulate = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!selectedTraitKey || !canSimulate) {
        return;
      }

      setSimulationLoading(true);
      setSimulationError(null);
      setMissingTraits([]);

      try {
        const payload = await simulateMendelianTrait(
          selectedTraitKey,
          parent1,
          parent2,
          asPercentages
        );
        const distribution = payload.results[selectedTraitKey];
        if (!distribution) {
          throw new Error("No distribution returned for the selected trait.");
        }
        setSimulationResult(distribution);
        setMissingTraits(payload.missing_traits);
      } catch (err) {
        setSimulationResult(null);
        setSimulationError(
          err instanceof Error ? err.message : "Simulation failed."
        );
      } finally {
        setSimulationLoading(false);
      }
    },
    [asPercentages, canSimulate, parent1, parent2, selectedTraitKey]
  );

  return (
    <section id="live-api" className="relative py-24">
      <div
        className="absolute inset-0 bg-gradient-to-b from-white via-white to-slate-100"
        aria-hidden
      />
      <div className="relative mx-auto max-w-7xl px-6 text-gray">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,420px),1fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-[#1E3A8A]/70">
                  Trait catalogue
                </p>
                <h2 className="mt-1 text-lg font-semibold text-[#1E3A8A]">
                  Explore the registry in real time
                </h2>
                <p className="mt-1 text-sm text-gray/80">
                  Monitor bundled traits and custom additions without leaving
                  the sandbox.
                </p>
              </div>
              <button
                type="button"
                onClick={reload}
                className="self-end rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-[#1E3A8A] transition hover:bg-[#1E3A8A] hover:text-white"
              >
                Reload
              </button>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
              <div className="space-y-3">
                <div className="relative">
                  <input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search traits"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm placeholder:text-slate-400 focus:border-[#10B981] focus:outline-none"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-slate-400 hover:text-slate-600"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Filter Controls */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">
                      FILTERS
                    </span>
                    {(inheritanceFilter ||
                      verificationFilter ||
                      categoryFilter) && (
                      <button
                        type="button"
                        onClick={() => {
                          setInheritanceFilter("");
                          setVerificationFilter("");
                          setCategoryFilter("");
                          applyFilters({});
                        }}
                        className="text-xs text-slate-400 hover:text-slate-600"
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                    <select
                      value={inheritanceFilter}
                      onChange={(e) => {
                        setInheritanceFilter(e.target.value);
                        applyFilters({
                          inheritance_pattern: e.target.value || undefined,
                          verification_status: verificationFilter || undefined,
                          category: categoryFilter || undefined,
                        });
                      }}
                      className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs focus:border-[#10B981] focus:outline-none"
                    >
                      <option value="">All Inheritance</option>
                      <option value="autosomal_dominant">Dominant</option>
                      <option value="autosomal_recessive">Recessive</option>
                      <option value="autosomal">Autosomal</option>
                    </select>

                    <select
                      value={verificationFilter}
                      onChange={(e) => {
                        setVerificationFilter(e.target.value);
                        applyFilters({
                          inheritance_pattern: inheritanceFilter || undefined,
                          verification_status: e.target.value || undefined,
                          category: categoryFilter || undefined,
                        });
                      }}
                      className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs focus:border-[#10B981] focus:outline-none"
                    >
                      <option value="">All Status</option>
                      <option value="verified">Verified</option>
                      <option value="simplified">Simplified</option>
                    </select>

                    <select
                      value={categoryFilter}
                      onChange={(e) => {
                        setCategoryFilter(e.target.value);
                        applyFilters({
                          inheritance_pattern: inheritanceFilter || undefined,
                          verification_status: verificationFilter || undefined,
                          category: e.target.value || undefined,
                        });
                      }}
                      className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs focus:border-[#10B981] focus:outline-none"
                    >
                      <option value="">All Categories</option>
                      <option value="physical_traits">Physical</option>
                      <option value="sensory_traits">Sensory</option>
                      <option value="behavioral_traits">Behavioral</option>
                    </select>
                  </div>
                </div>

                {loading && (
                  <div className="space-y-2">
                    <div className="h-14 animate-pulse rounded-2xl bg-slate-100" />
                    <div className="h-14 animate-pulse rounded-2xl bg-slate-100" />
                    <div className="h-14 animate-pulse rounded-2xl bg-slate-100" />
                  </div>
                )}

                {error && (
                  <div className="rounded-2xl border border-red-300 bg-red-50 px-4 py-2 text-xs text-red-700">
                    {error}
                  </div>
                )}

                {!loading && !error && filteredTraits.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-5 text-xs text-slate-500">
                    No traits match your filter. Reset or add a new trait below.
                  </div>
                )}

                <div className="max-h-[320px] overflow-y-auto pr-1">
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                    {filteredTraits.map((trait) => (
                      <button
                        key={trait.key}
                        type="button"
                        onClick={() => setSelectedTraitKey(trait.key)}
                        className={`group flex h-full flex-col rounded-2xl border px-4 py-3 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1E3A8A] ${
                          trait.key === selectedTraitKey
                            ? "border-[#1E3A8A] bg-[#1E3A8A]/5 shadow"
                            : "border-slate-200 bg-white hover:border-[#10B981]/40"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="inline-flex rounded-full bg-[#1E3A8A]/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.35em] text-[#1E3A8A]">
                            {trait.key}
                          </span>
                          <div className="flex gap-1">
                            {trait.verification_status && (
                              <span
                                className={`rounded-full px-2 py-1 text-[9px] font-semibold ${
                                  trait.verification_status === "verified"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-amber-100 text-amber-700"
                                }`}
                              >
                                {trait.verification_status === "verified"
                                  ? "Verified"
                                  : "Simplified"}
                              </span>
                            )}
                            <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">
                              {trait.alleles.join(" / ")}
                            </span>
                          </div>
                        </div>
                        <p className="mt-2 text-sm font-semibold text-[#1E3A8A]">
                          {trait.name}
                        </p>
                        {trait.description && (
                          <p className="mt-1 text-xs text-slate-600">
                            {trait.description}
                          </p>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <aside className="flex h-full flex-col rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                {activeTrait ? (
                  <>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-[#1E3A8A]/70">
                      Selected trait
                    </p>
                    <p className="mt-2 text-base font-semibold text-[#1E3A8A]">
                      {activeTrait.name}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {activeTrait.description || "No description provided."}
                    </p>

                    {/* Mendelian Trait Metadata */}
                    {(activeTrait.inheritance_pattern ||
                      activeTrait.gene_info ||
                      activeTrait.category) && (
                      <div className="mt-3 space-y-1">
                        {activeTrait.inheritance_pattern && (
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-semibold text-slate-500">
                              INHERITANCE:
                            </span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ${
                                activeTrait.inheritance_pattern.includes(
                                  "dominant"
                                )
                                  ? "bg-blue-100 text-blue-700"
                                  : activeTrait.inheritance_pattern.includes(
                                      "recessive"
                                    )
                                  ? "bg-purple-100 text-purple-700"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {activeTrait.inheritance_pattern
                                .replace("_", " ")
                                .toUpperCase()}
                            </span>
                          </div>
                        )}
                        {activeTrait.gene_info && (
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-semibold text-slate-500">
                              GENE:
                            </span>
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-semibold text-emerald-700">
                              {activeTrait.gene_info}
                            </span>
                          </div>
                        )}
                        {activeTrait.category && (
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-semibold text-slate-500">
                              CATEGORY:
                            </span>
                            <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[9px] font-semibold text-orange-700">
                              {activeTrait.category
                                .replace("_", " ")
                                .toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="mt-3 space-y-2">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-slate-500">
                        Phenotypes
                      </p>
                      <div className="space-y-2 overflow-y-auto">
                        {Object.entries(activeTrait.phenotype_map).map(
                          ([genotype, phenotype]) => (
                            <div
                              key={genotype}
                              className={`flex items-center justify-between rounded-2xl border px-3 py-2 text-xs font-medium shadow-sm ${phenotypeTone(
                                selectedTraitKey,
                                phenotype
                              )}`}
                            >
                              <span className="font-mono opacity-80">
                                {genotype}
                              </span>
                              <span className="font-semibold">{phenotype}</span>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-slate-500">
                    Select a trait to review phenotype mappings here.
                  </div>
                )}
              </aside>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/60">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#1E3A8A]/70">
                  Mendelian sandbox
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-[#1E3A8A]">
                  Simulate offspring outcomes instantly
                </h3>
              </div>
              <div className="rounded-full bg-[#10B981]/15 px-4 py-1 text-xs font-semibold text-[#10B981]">
                Real API
              </div>
            </div>

            <form className="mt-8 space-y-6" onSubmit={handleSimulate}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label
                    className="text-sm font-semibold text-slate-700"
                    htmlFor="trait-select"
                  >
                    Trait
                  </label>
                  <select
                    id="trait-select"
                    value={selectedTraitKey}
                    onChange={(event) =>
                      setSelectedTraitKey(event.target.value)
                    }
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-[#10B981] focus:outline-none"
                  >
                    <option value="" disabled>
                      {traits.length === 0
                        ? "No traits available"
                        : "Select a trait"}
                    </option>
                    {traits.map((trait) => (
                      <option key={trait.key} value={trait.key}>
                        {trait.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label
                    className="text-sm font-semibold text-slate-700"
                    htmlFor="mode-toggle"
                  >
                    Output format
                  </label>
                  <div
                    id="mode-toggle"
                    className="inline-flex w-full items-center justify-between rounded-full border border-slate-200 bg-slate-100 p-1 text-xs font-semibold text-slate-600"
                  >
                    <button
                      type="button"
                      onClick={() => setAsPercentages(false)}
                      className={`flex-1 rounded-full px-3 py-2 transition ${
                        !asPercentages
                          ? "bg-white text-[#1E3A8A] shadow"
                          : "hover:text-slate-800"
                      }`}
                    >
                      Probabilities
                    </button>
                    <button
                      type="button"
                      onClick={() => setAsPercentages(true)}
                      className={`flex-1 rounded-full px-3 py-2 transition ${
                        asPercentages
                          ? "bg-white text-[#1E3A8A] shadow"
                          : "hover:text-slate-800"
                      }`}
                    >
                      Percentages
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label
                    className="text-sm font-semibold text-slate-700"
                    htmlFor="parent-a"
                  >
                    Parent A genotype
                  </label>
                  <input
                    id="parent-a"
                    value={parent1}
                    maxLength={2}
                    onChange={(event) =>
                      setParent1(sanitizeDiploidGenotype(event.target.value))
                    }
                    placeholder="e.g. Bb"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-[#10B981] focus:outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label
                    className="text-sm font-semibold text-slate-700"
                    htmlFor="parent-b"
                  >
                    Parent B genotype
                  </label>
                  <input
                    id="parent-b"
                    value={parent2}
                    maxLength={2}
                    onChange={(event) =>
                      setParent2(sanitizeDiploidGenotype(event.target.value))
                    }
                    placeholder="e.g. bb"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-[#10B981] focus:outline-none"
                  />
                </div>
              </div>

              {activeTrait && (
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span>Alleles:</span>
                  {activeTrait.alleles.map((allele) => (
                    <span
                      key={allele}
                      className="inline-flex items-center rounded-full bg-slate-100 px-2 py-1 font-semibold text-slate-600"
                    >
                      {allele}
                    </span>
                  ))}
                </div>
              )}

              <button
                type="submit"
                disabled={!canSimulate || simulationLoading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#1E3A8A] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#1E3A8A]/40 transition hover:bg-[#162b63] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
              >
                {simulationLoading ? "Simulating" : "Run simulation"}
              </button>
            </form>

            {!simulationResult && !simulationError && (
              <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                Enter genotypes for both parents and run a simulation to see
                phenotype distributions visualised below.
              </div>
            )}

            {simulationError && (
              <div className="mt-6 rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                {simulationError}
              </div>
            )}

            {simulationResult && (
              <div className="mt-8 space-y-4">
                <div className="flex items-center gap-3">
                  <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
                    Result distribution
                  </p>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600">
                    Sorted by likelihood
                  </span>
                </div>
                <div className="space-y-3">
                  {Object.entries(simulationResult)
                    .sort(([, a], [, b]) => b - a)
                    .map(([phenotype, probability]) => (
                      <div
                        key={phenotype}
                        className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-[#1E3A8A]">
                            {phenotype}
                          </span>
                          <span className="font-mono text-slate-600">
                            {asPercentages
                              ? `${probability.toFixed(1)}%`
                              : probability.toFixed(3)}
                          </span>
                        </div>
                        <div className="mt-2 h-2 w-full rounded-full bg-white">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#3B82F6] to-[#10B981]"
                            style={{
                              width: `${Math.min(
                                100,
                                asPercentages ? probability : probability * 100
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {missingTraits.length > 0 && (
              <div className="mt-6 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-xs text-amber-600">
                Missing traits: {missingTraits.join(", ")}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default LiveSandbox;
