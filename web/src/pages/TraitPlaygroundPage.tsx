import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";

import ComparePanel from "../components/playground/ComparePanel";
import PunnettGrid from "../components/traits/Preview/PunnettGrid";
import DistributionBars from "../components/traits/Preview/DistributionBars";
import HowComputed from "../components/traits/Preview/HowComputed";
import DashboardLayout from "../layouts/DashboardLayout";
import type {
  TraitInfo,
  MendelianPreviewResponse,
  TraitPreviewPayload,
} from "../types/api";
import {
  fetchPrivateTraitById,
  fetchBaselineTrait,
  fetchTraits,
} from "../services/traits.api";
import { fetchMendelianPreview } from "../services/preview.api";

type PlaygroundState = {
  traitId?: string;
  parent1?: string;
  parent2?: string;
  baselineKey?: string;
  asPct?: boolean;
  seed?: string | number;
};

type TraitPreviewCardProps = {
  title: string;
  trait: TraitInfo | null;
  loading: boolean;
  preview: MendelianPreviewResponse | null;
  error?: string | null;
  asPercentages: boolean;
};

const TraitPreviewCard: React.FC<TraitPreviewCardProps> = ({
  title,
  trait,
  loading,
  preview,
  error,
  asPercentages,
}) => {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-700">{title}</h2>
          {trait ? (
            <div className="mt-1 text-xs text-slate-500">
              <div className="font-medium text-slate-700">{trait.name}</div>
              <div className="font-mono text-slate-500">Key: {trait.key}</div>
            </div>
          ) : (
            <p className="mt-1 text-xs text-slate-500">Trait details unavailable.</p>
          )}
        </div>
        {trait && trait.alleles.length > 0 && (
          <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600">
            Alleles: {trait.alleles.join(", ")}
          </span>
        )}
      </div>

      {loading ? (
        <div className="mt-6 flex items-center gap-2 text-sm text-slate-500">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-transparent" />
          Loading preview…
        </div>
      ) : error ? (
        <div className="mt-4 rounded border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-600">
          {error}
        </div>
      ) : preview ? (
        <div className="mt-4 space-y-4">
          <PunnettGrid
            p1Gametes={preview.gametes.p1}
            p2Gametes={preview.gametes.p2}
            grid={preview.punnett}
            asPercentages={asPercentages}
          />
          <DistributionBars
            genotype={preview.genotype_dist}
            phenotype={preview.phenotype_dist}
            asPercentages={asPercentages}
          />
          <HowComputed steps={preview.steps} />
        </div>
      ) : (
        <p className="mt-4 text-xs text-slate-500">
          Provide valid parent genotypes to see live outcomes.
        </p>
      )}
    </div>
  );
};

const canonicalize = (value: string) => value.replace(/\s+/g, "");

const TraitPlaygroundPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const state = (location.state ?? {}) as PlaygroundState;

  const initialTraitId =
    state.traitId || searchParams.get("traitId") || "";
  const initialParent1 =
    canonicalize(state.parent1 || searchParams.get("p1") || "");
  const initialParent2 =
    canonicalize(state.parent2 || searchParams.get("p2") || "");
  const initialBaselineKey = state.baselineKey || searchParams.get("baselineKey") || "";
  const initialAsPctParam = state.asPct ?? undefined;
  const initialAsPercentages =
    initialAsPctParam !== undefined
      ? initialAsPctParam
      : searchParams.get("asPct") !== "false";
  const initialSeedValue =
    state.seed?.toString() || searchParams.get("seed") || "";

  const [traitId, setTraitId] = useState(initialTraitId);
  const [parent1, setParent1] = useState(initialParent1);
  const [parent2, setParent2] = useState(initialParent2);
  const [seed, setSeed] = useState(initialSeedValue);
  const [asPercentages, setAsPercentages] = useState<boolean>(initialAsPercentages);

  const [baselineKey, setBaselineKey] = useState(initialBaselineKey);
  const [baselineInput, setBaselineInput] = useState(initialBaselineKey);

  const [primaryTrait, setPrimaryTrait] = useState<TraitInfo | null>(null);
  const [primaryLoading, setPrimaryLoading] = useState(false);
  const [primaryError, setPrimaryError] = useState<string | null>(null);

  const [baselineTrait, setBaselineTrait] = useState<TraitInfo | null>(null);
  const [baselineLoading, setBaselineLoading] = useState(false);
  const [baselineError, setBaselineError] = useState<string | null>(null);

  const [primaryPreview, setPrimaryPreview] = useState<MendelianPreviewResponse | null>(null);
  const [primaryPreviewLoading, setPrimaryPreviewLoading] = useState(false);
  const [primaryPreviewError, setPrimaryPreviewError] = useState<string | null>(null);

  const [baselinePreview, setBaselinePreview] = useState<MendelianPreviewResponse | null>(null);
  const [baselinePreviewLoading, setBaselinePreviewLoading] = useState(false);
  const [baselinePreviewError, setBaselinePreviewError] = useState<string | null>(null);
  const [userTraits, setUserTraits] = useState<TraitInfo[]>([]);
  const [traitSearch, setTraitSearch] = useState("");
  const [traitSidebarOpen, setTraitSidebarOpen] = useState(true);
  const [traitsLoading, setTraitsLoading] = useState(false);

  const filteredTraits = useMemo(() => {
    if (!traitSearch.trim()) {
      return userTraits;
    }
    const query = traitSearch.trim().toLowerCase();
    return userTraits.filter((trait) => {
      const name = trait.name?.toLowerCase() ?? "";
      const key = trait.key?.toLowerCase() ?? "";
      return name.includes(query) || key.includes(query);
    });
  }, [traitSearch, userTraits]);

  useEffect(() => {
    const controller = new AbortController();
    setTraitsLoading(true);
    fetchTraits(controller.signal, { owned_only: true })
      .then((list) => {
        setUserTraits(list);
      })
      .catch(() => {
        setUserTraits([]);
      })
      .finally(() => setTraitsLoading(false));
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (traitId) params.set("traitId", traitId);
    if (parent1) params.set("p1", parent1);
    if (parent2) params.set("p2", parent2);
    if (baselineKey) params.set("baselineKey", baselineKey);
    params.set("asPct", asPercentages ? "true" : "false");
    if (seed) params.set("seed", seed);
    setSearchParams(params, { replace: true });
  }, [traitId, parent1, parent2, baselineKey, asPercentages, seed, setSearchParams]);

  useEffect(() => {
    if (!traitId) {
      setPrimaryTrait(null);
      setPrimaryError("Missing trait identifier. Launch from Trait Management to continue.");
      return;
    }

    const controller = new AbortController();
    setPrimaryLoading(true);
    setPrimaryError(null);

    fetchPrivateTraitById(traitId, controller.signal)
      .then((trait) => {
        setPrimaryTrait(trait);
        if (!parent1 && trait.alleles.length >= 1) {
          setParent1(trait.alleles[0] + (trait.alleles[0] || ""));
        }
        if (!parent2 && trait.alleles.length >= 1) {
          const fallback =
            trait.alleles.length >= 2
              ? trait.alleles[0] + trait.alleles[1]
              : trait.alleles[0] + (trait.alleles[0] || "");
          setParent2(fallback);
        }
      })
      .catch((error) => {
        if (axios.isCancel(error)) return;
        setPrimaryTrait(null);
        if (axios.isAxiosError(error)) {
          const detail = error.response?.data?.detail;
          if (detail && typeof detail === "object" && Array.isArray(detail.errors)) {
            setPrimaryError(detail.errors.join("; "));
            return;
          }
          if (typeof detail === "string") {
            setPrimaryError(detail);
            return;
          }
        }
        setPrimaryError("Unable to load private trait. Please try again.");
      })
      .finally(() => setPrimaryLoading(false));

    return () => controller.abort();
  }, [traitId, parent1, parent2]);

  useEffect(() => {
    if (!baselineKey) {
      setBaselineTrait(null);
      setBaselineError(null);
      return;
    }

    const controller = new AbortController();
    setBaselineLoading(true);
    setBaselineError(null);

    fetchBaselineTrait(baselineKey, controller.signal)
      .then((trait) => {
        setBaselineTrait(trait);
      })
      .catch((error) => {
        if (axios.isCancel(error)) return;
        if (axios.isAxiosError(error)) {
          const status = error.response?.status;
          if (status === 404) {
            setBaselineError(`Baseline trait '${baselineKey}' not found.`);
            return;
          }
        }
        setBaselineError("Unable to load baseline trait.");
      })
      .finally(() => setBaselineLoading(false));

    return () => controller.abort();
  }, [baselineKey]);

  const numericSeed = useMemo(() => {
    if (!seed) return undefined;
    const parsed = Number(seed);
    return Number.isFinite(parsed) ? parsed : undefined;
  }, [seed]);

  const buildPreviewPayload = useCallback(
    (trait: TraitInfo): TraitPreviewPayload => ({
      alleles: trait.alleles,
      phenotype_map: { ...trait.phenotype_map },
      inheritance_pattern: trait.inheritance_pattern,
    }),
    [],
  );

  useEffect(() => {
    if (!primaryTrait || !parent1 || !parent2) {
      setPrimaryPreview(null);
      setPrimaryPreviewError(null);
      return;
    }

    const controller = new AbortController();
    setPrimaryPreviewLoading(true);
    setPrimaryPreviewError(null);

    fetchMendelianPreview(
      {
        trait: buildPreviewPayload(primaryTrait),
        parent1,
        parent2,
        as_percentages: asPercentages,
        seed: numericSeed,
      },
      controller.signal,
    )
      .then((preview) => {
        setPrimaryPreview(preview);
      })
      .catch((error) => {
        if (axios.isCancel(error)) return;
        let message = "Unable to compute preview.";
        if (axios.isAxiosError(error)) {
          const detail = error.response?.data?.detail;
          if (detail && typeof detail === "object" && Array.isArray(detail.errors)) {
            message = detail.errors.join("; ");
          } else if (typeof detail === "string") {
            message = detail;
          }
        }
        setPrimaryPreview(null);
        setPrimaryPreviewError(message);
      })
      .finally(() => setPrimaryPreviewLoading(false));

    return () => controller.abort();
  }, [
    primaryTrait,
    parent1,
    parent2,
    asPercentages,
    numericSeed,
    buildPreviewPayload,
  ]);

  useEffect(() => {
    if (!baselineTrait || !parent1 || !parent2) {
      setBaselinePreview(null);
      setBaselinePreviewError(null);
      return;
    }

    const controller = new AbortController();
    setBaselinePreviewLoading(true);
    setBaselinePreviewError(null);

    fetchMendelianPreview(
      {
        trait: buildPreviewPayload(baselineTrait),
        parent1,
        parent2,
        as_percentages: asPercentages,
        seed: numericSeed,
      },
      controller.signal,
    )
      .then((preview) => {
        setBaselinePreview(preview);
      })
      .catch((error) => {
        if (axios.isCancel(error)) return;
        let message = "Unable to compute baseline preview.";
        if (axios.isAxiosError(error)) {
          const detail = error.response?.data?.detail;
          if (detail && typeof detail === "object" && Array.isArray(detail.errors)) {
            message = detail.errors.join("; ");
          } else if (typeof detail === "string") {
            message = detail;
          }
        }
        setBaselinePreview(null);
        setBaselinePreviewError(message);
      })
      .finally(() => setBaselinePreviewLoading(false));

    return () => controller.abort();
  }, [
    baselineTrait,
    parent1,
    parent2,
    asPercentages,
    numericSeed,
    buildPreviewPayload,
  ]);

  const handleParentChange = useCallback(
    (which: "parent1" | "parent2", value: string) => {
      const normalized = canonicalize(value);
      if (which === "parent1") {
        setParent1(normalized);
      } else {
        setParent2(normalized);
      }
    },
    [],
  );

  const togglePercentages = () => setAsPercentages((prev) => !prev);

  const applyBaseline = (event: React.FormEvent) => {
    event.preventDefault();
    setBaselineKey(baselineInput.trim());
  };

  const clearBaseline = () => {
    setBaselineKey("");
    setBaselineInput("");
  };

  const traitUnavailable = !traitId;

  const handleSelectTrait = useCallback(
    (trait: TraitInfo) => {
      const identifier = trait.id || trait.key;
      if (!identifier) {
        return;
      }
      setTraitId(identifier);
      setParent1("");
      setParent2("");
      if (window.matchMedia("(max-width: 1023px)").matches) {
        setTraitSidebarOpen(false);
      }
    },
    [],
  );

  return (
    <DashboardLayout>
      <main className="min-h-screen bg-slate-50 pb-12">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-xl font-semibold text-slate-800">Trait Playground</h1>
              <p className="text-sm text-slate-500">
                Explore outcomes for your private trait and compare against a curated baseline.
              </p>
            </div>
            <div className="flex items-center gap-2 self-end">
              <button
                type="button"
                onClick={() => setTraitSidebarOpen((prev) => !prev)}
                className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-600 transition hover:border-slate-300 hover:text-slate-700 lg:hidden"
              >
                {traitSidebarOpen ? "Hide traits" : "Show traits"}
              </button>
              <button
                type="button"
                onClick={() => navigate("/portal/traits")}
                className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-600 transition hover:border-slate-300 hover:text-slate-700"
              >
                Back
              </button>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-6 lg:flex-row">
            <div className="flex-1">
              <div className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-4">
                <div className="space-y-1">
                  <label htmlFor="parent-1" className="text-xs font-medium text-slate-600">
                    Parent 1 genotype
                  </label>
                  <input
                    id="parent-1"
                    value={parent1}
                    onChange={(event) => handleParentChange("parent1", event.target.value)}
                    placeholder="Ww"
                    className="w-full rounded border border-slate-300 px-2 py-1 text-sm font-mono focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    autoComplete="off"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="parent-2" className="text-xs font-medium text-slate-600">
                    Parent 2 genotype
                  </label>
                  <input
                    id="parent-2"
                    value={parent2}
                    onChange={(event) => handleParentChange("parent2", event.target.value)}
                    placeholder="Ww"
                    className="w-full rounded border border-slate-300 px-2 py-1 text-sm font-mono focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    autoComplete="off"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="seed" className="text-xs font-medium text-slate-600">
                    Seed (optional)
                  </label>
                  <input
                    id="seed"
                    value={seed}
                    onChange={(event) => setSeed(canonicalize(event.target.value))}
                    placeholder="1234"
                    className="w-full rounded border border-slate-300 px-2 py-1 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-medium text-slate-600">Display mode</span>
                  <button
                    type="button"
                    onClick={togglePercentages}
                    className="w-full rounded border border-emerald-200 px-2 py-1 text-sm font-medium text-emerald-600 transition hover:bg-emerald-50"
                  >
                    {asPercentages ? "Showing percentages" : "Showing probabilities"}
                  </button>
                </div>
                <div className="lg:col-span-4">
                  <form
                    onSubmit={applyBaseline}
                    className="flex flex-wrap items-center gap-2 border-t border-slate-200 pt-3"
                  >
                    <label htmlFor="baseline-key" className="text-xs font-medium text-slate-600">
                      Baseline trait key
                    </label>
                    <input
                      id="baseline-key"
                      value={baselineInput}
                      onChange={(event) => setBaselineInput(event.target.value)}
                      placeholder="abo_blood_group"
                      className="w-48 rounded border border-slate-300 px-2 py-1 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                    <button
                      type="submit"
                      className="rounded border border-slate-300 px-2 py-1 text-xs font-medium text-slate-600 transition hover:border-emerald-400 hover:text-emerald-600"
                    >
                      Apply
                    </button>
                    {baselineKey && (
                      <button
                        type="button"
                        onClick={clearBaseline}
                        className="rounded border border-rose-200 px-2 py-1 text-xs font-medium text-rose-600 transition hover:bg-rose-50"
                      >
                        Clear
                      </button>
                    )}
                    {baselineLoading && (
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <span className="h-3 w-3 animate-spin rounded-full border border-slate-300 border-t-transparent" />
                        Loading baseline…
                      </span>
                    )}
                    {baselineError && (
                      <span className="text-xs text-rose-600">{baselineError}</span>
                    )}
                  </form>
                </div>
              </div>

              {traitUnavailable && (
                <div className="mt-6 rounded border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                  Provide a trait identifier via the Trait Management preview to start a playground session.
                </div>
              )}

              {primaryError && (
                <div className="mt-6 rounded border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                  {primaryError}
                </div>
              )}

              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <TraitPreviewCard
                  title="Your trait"
                  trait={primaryTrait}
                  loading={primaryPreviewLoading || primaryLoading}
                  preview={primaryPreview}
                  error={primaryPreviewError}
                  asPercentages={asPercentages}
                />
                <TraitPreviewCard
                  title="Baseline trait"
                  trait={baselineTrait}
                  loading={baselinePreviewLoading || baselineLoading}
                  preview={baselinePreview}
                  error={baselinePreviewError || (!baselineKey ? "Select a baseline to compare." : null)}
                  asPercentages={asPercentages}
                />
              </div>

              <div className="mt-6">
                <ComparePanel
                  primaryLabel="Your trait"
                  baselineLabel={baselineTrait ? baselineTrait.name : undefined}
                  primary={primaryPreview}
                  baseline={baselinePreview}
                  asPercentages={asPercentages}
                />
              </div>
            </div>

            <aside
              className={`${traitSidebarOpen ? "block" : "hidden"} lg:block lg:w-72 flex-shrink-0`}
            >
              <div className="sticky top-24 rounded-lg border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-4 py-3">
                  <h2 className="text-sm font-semibold text-slate-700">Your traits</h2>
                  <p className="text-xs text-slate-500">
                    Select a trait to load it into the playground.
                  </p>
                </div>
                <div className="border-b border-slate-100 px-4 py-3">
                  <input
                    type="text"
                    value={traitSearch}
                    onChange={(event) => setTraitSearch(event.target.value)}
                    placeholder="Search traits"
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div className="max-h-[60vh] overflow-y-auto px-2 py-3 space-y-2">
                  {traitsLoading ? (
                    <div className="px-2 py-4 text-sm text-slate-500">Loading traits…</div>
                  ) : filteredTraits.length === 0 ? (
                    <div className="px-2 py-4 text-sm text-slate-500">No traits found.</div>
                  ) : (
                    filteredTraits.map((trait) => {
                      const identifier = trait.id || trait.key;
                      const isActive = identifier === traitId;
                      return (
                        <button
                          key={identifier}
                          type="button"
                          onClick={() => handleSelectTrait(trait)}
                          className={`w-full text-left rounded-md border px-3 py-2 transition focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            isActive
                              ? "border-blue-300 bg-blue-50 text-blue-700"
                              : "border-transparent bg-white text-slate-700 hover:border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          <div className="text-sm font-medium truncate">{trait.name}</div>
                          <div className="flex items-center justify-between text-[11px] text-slate-500">
                            <span className="font-mono truncate">{trait.key}</span>
                            <span className="capitalize">{trait.status}</span>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </DashboardLayout>
  );
};

export default TraitPlaygroundPage;
