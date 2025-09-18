import React, { useCallback, useEffect, useMemo, useState } from "react";

import { simulateMendelianTrait } from "../services/zygotrixApi";
import { TraitInfo } from "../types/api";
import { deriveDefaultGenotypes, sanitizeDiploidGenotype } from "../utils/genetics";

type LiveSandboxProps = {
  traits: TraitInfo[];
  loading: boolean;
  error: string | null;
  reload: () => void;
};

const LiveSandbox: React.FC<LiveSandboxProps> = ({ traits, loading, error, reload }) => {
  const [selectedTraitKey, setSelectedTraitKey] = useState<string>("");
  const [parent1, setParent1] = useState<string>("");
  const [parent2, setParent2] = useState<string>("");
  const [asPercentages, setAsPercentages] = useState<boolean>(true);

  const [simulationResult, setSimulationResult] = useState<Record<string, number> | null>(null);
  const [simulationLoading, setSimulationLoading] = useState(false);
  const [simulationError, setSimulationError] = useState<string | null>(null);
  const [missingTraits, setMissingTraits] = useState<string[]>([]);

  const traitMap = useMemo(() => {
    return Object.fromEntries(traits.map((trait) => [trait.key, trait] as const));
  }, [traits]);

  useEffect(() => {
    if (traits.length === 0) {
      setSelectedTraitKey("");
      return;
    }
    setSelectedTraitKey((current) => (current && traitMap[current] ? current : traits[0].key));
  }, [traits, traitMap]);

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
  const canSimulate = Boolean(selectedTraitKey) && parent1.length === 2 && parent2.length === 2;

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
          asPercentages,
        );
        const distribution = payload.results[selectedTraitKey];
        if (!distribution) {
          throw new Error("No distribution returned for the selected trait.");
        }
        setSimulationResult(distribution);
        setMissingTraits(payload.missing_traits);
      } catch (err) {
        setSimulationResult(null);
        setSimulationError(err instanceof Error ? err.message : "Simulation failed.");
      } finally {
        setSimulationLoading(false);
      }
    },
    [asPercentages, canSimulate, parent1, parent2, selectedTraitKey],
  );

  return (
    <section id="live-api" className="bg-slate-900 py-24 text-slate-100">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-12 lg:grid-cols-[2fr,3fr]">
          <div className="space-y-8">
            <div>
              <span className="inline-block rounded-full bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white/80">
                Live data
              </span>
              <h2 className="mt-4 text-3xl font-semibold">Explore the trait registry in real time.</h2>
              <p className="mt-3 text-sm text-slate-300">
                This list is fetched directly from the FastAPI backend so you always see the currently registered traits and allele definitions.
              </p>
            </div>
            <div className="space-y-4">
              {loading && (
                <div className="space-y-3">
                  <div className="h-20 animate-pulse rounded-2xl bg-white/5" />
                  <div className="h-20 animate-pulse rounded-2xl bg-white/5" />
                  <div className="h-20 animate-pulse rounded-2xl bg-white/5" />
                </div>
              )}
              {error && (
                <div className="rounded-2xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  <div className="flex items-start justify-between gap-4">
                    <span>{error}</span>
                    <button
                      type="button"
                      className="rounded-full border border-red-200/40 px-3 py-1 text-xs font-semibold text-red-100 transition hover:border-red-100/60"
                      onClick={reload}
                    >
                      Retry
                    </button>
                  </div>
                </div>
              )}
              {!loading && !error && traits.length === 0 && (
                <p className="text-sm text-slate-300">No traits registered yet.</p>
              )}
              <div className="space-y-3">
                {traits.map((trait) => (
                  <button
                    key={trait.key}
                    type="button"
                    onClick={() => setSelectedTraitKey(trait.key)}
                    className={`w-full rounded-2xl border px-5 py-4 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
                      trait.key === selectedTraitKey
                        ? "border-[#10B981]/60 bg-[#10B981]/10"
                        : "border-white/10 bg-white/5 hover:border-white/30"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.3em] text-white/80">
                          {trait.key}
                        </span>
                        <p className="text-lg font-semibold text-white">{trait.name}</p>
                      </div>
                      <p className="text-xs text-white/60">Alleles: {trait.alleles.join(", ")}</p>
                    </div>
                    {trait.description ? (
                      <p className="mt-3 text-sm text-slate-300">{trait.description}</p>
                    ) : (
                      <p className="mt-3 text-sm text-slate-400">No description provided.</p>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/30 backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/70">Mendelian sandbox</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">
                  Simulate an offspring phenotype distribution
                </h3>
              </div>
              <div className="rounded-full bg-[#10B981]/20 px-4 py-1 text-xs font-semibold text-[#A7F3D0]">
                Real API
              </div>
            </div>

            <form className="mt-8 space-y-6" onSubmit={handleSimulate}>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-white" htmlFor="trait-select">
                  Trait
                </label>
                <select
                  id="trait-select"
                  value={selectedTraitKey}
                  onChange={(event) => setSelectedTraitKey(event.target.value)}
                  className="w-full rounded-2xl border border-white/20 bg-slate-900/40 px-4 py-3 text-sm text-white transition focus:border-[#10B981] focus:outline-none"
                >
                  <option value="" disabled>
                    {traits.length === 0 ? "No traits available" : "Select a trait"}
                  </option>
                  {traits.map((trait) => (
                    <option key={trait.key} value={trait.key}>
                      {trait.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-white" htmlFor="parent-a">
                    Parent A genotype
                  </label>
                  <input
                    id="parent-a"
                    value={parent1}
                    maxLength={2}
                    onChange={(event) => setParent1(sanitizeDiploidGenotype(event.target.value))}
                    placeholder="e.g. Bb"
                    className="w-full rounded-2xl border border-white/20 bg-slate-900/40 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-[#10B981] focus:outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-white" htmlFor="parent-b">
                    Parent B genotype
                  </label>
                  <input
                    id="parent-b"
                    value={parent2}
                    maxLength={2}
                    onChange={(event) => setParent2(sanitizeDiploidGenotype(event.target.value))}
                    placeholder="e.g. bb"
                    className="w-full rounded-2xl border border-white/20 bg-slate-900/40 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-[#10B981] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-3 text-sm font-medium text-white/80">
                  <input
                    type="checkbox"
                    checked={asPercentages}
                    onChange={(event) => setAsPercentages(event.target.checked)}
                    className="h-4 w-4 rounded border-white/40 bg-slate-900"
                  />
                  Return percentages (0-100)
                </label>
                {activeTrait && (
                  <p className="text-xs text-white/60">Alleles: {activeTrait.alleles.join(", ")}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={!canSimulate || simulationLoading}
                className="inline-flex w-full items-center justify-center rounded-full bg-[#10B981] px-6 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-[#10B981]/30 transition hover:bg-[#0d946d] disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-white/50"
              >
                {simulationLoading ? "Simulating..." : "Run simulation"}
              </button>
            </form>

            {simulationError && (
              <div className="mt-6 rounded-2xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {simulationError}
              </div>
            )}

            {simulationResult && (
              <div className="mt-6 space-y-3">
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-white/70">
                  Result distribution
                </p>
                <div className="space-y-3">
                  {Object.entries(simulationResult)
                    .sort(([, a], [, b]) => b - a)
                    .map(([phenotype, probability]) => (
                      <div
                        key={phenotype}
                        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/90"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{phenotype}</span>
                          <span>
                            {asPercentages
                              ? `${probability.toFixed(1)}%`
                              : probability.toFixed(3)}
                          </span>
                        </div>
                        <div className="mt-2 h-2 w-full rounded-full bg-white/10">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#3B82F6] to-[#10B981]"
                            style={{
                              width: `${Math.min(
                                100,
                                asPercentages ? probability : probability * 100,
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
              <p className="mt-4 text-xs text-[#FBBF24]">
                Missing traits: {missingTraits.join(", ")}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default LiveSandbox;