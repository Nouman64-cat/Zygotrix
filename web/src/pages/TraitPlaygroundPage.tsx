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
  const isYourTrait = title === "Your trait";

  return (
    <div
      className={`rounded-2xl border-2 ${
        isYourTrait
          ? "border-purple-200 bg-gradient-to-br from-purple-50 via-white to-purple-50"
          : "border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-emerald-50"
      } p-6 shadow-lg transition-all duration-300 hover:shadow-xl`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className={`p-3 rounded-xl ${
              isYourTrait ? "bg-purple-100" : "bg-emerald-100"
            }`}
          >
            <svg
              className={`w-6 h-6 ${
                isYourTrait ? "text-purple-600" : "text-emerald-600"
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isYourTrait ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              )}
            </svg>
          </div>
          <div>
            <h2
              className={`text-lg font-bold ${
                isYourTrait ? "text-purple-800" : "text-emerald-800"
              }`}
            >
              {title}
            </h2>
            {trait ? (
              <div className="space-y-1">
                <div className="font-semibold text-gray-800">{trait.name}</div>
                <div className="font-mono text-sm text-gray-600">
                  Key: {trait.key}
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Trait details unavailable</p>
            )}
          </div>
        </div>
        {trait && trait.alleles.length > 0 && (
          <div
            className={`px-3 py-2 rounded-xl ${
              isYourTrait
                ? "bg-purple-100 border border-purple-200"
                : "bg-emerald-100 border border-emerald-200"
            } shadow-sm`}
          >
            <div className="text-xs font-medium text-gray-600 mb-1">
              Alleles
            </div>
            <div
              className={`text-sm font-bold ${
                isYourTrait ? "text-purple-700" : "text-emerald-700"
              }`}
            >
              {trait.alleles.join(", ")}
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div
          className={`flex items-center justify-center gap-3 p-8 rounded-xl ${
            isYourTrait ? "bg-purple-100/50" : "bg-emerald-100/50"
          } border-2 border-dashed ${
            isYourTrait ? "border-purple-300" : "border-emerald-300"
          }`}
        >
          <div className="relative">
            <div
              className={`w-8 h-8 border-4 ${
                isYourTrait
                  ? "border-purple-200 border-t-purple-600"
                  : "border-emerald-200 border-t-emerald-600"
              } rounded-full animate-spin`}
            ></div>
            <div
              className={`absolute inset-0 w-8 h-8 border-4 border-transparent ${
                isYourTrait ? "border-r-purple-400" : "border-r-emerald-400"
              } rounded-full animate-spin`}
              style={{ animationDirection: "reverse", animationDuration: "1s" }}
            ></div>
          </div>
          <div>
            <p
              className={`text-sm font-semibold ${
                isYourTrait ? "text-purple-700" : "text-emerald-700"
              }`}
            >
              Loading preview...
            </p>
            <p
              className={`text-xs ${
                isYourTrait ? "text-purple-600" : "text-emerald-600"
              }`}
            >
              Computing genetic probabilities
            </p>
          </div>
        </div>
      ) : error ? (
        <div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-red-100 rounded-full">
              <svg
                className="w-5 h-5 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h4 className="text-sm font-bold text-red-800 mb-1">Error</h4>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      ) : preview ? (
        <div className="space-y-6">
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
        <div
          className={`text-center p-8 rounded-xl ${
            isYourTrait ? "bg-purple-50" : "bg-emerald-50"
          } border-2 border-dashed ${
            isYourTrait ? "border-purple-200" : "border-emerald-200"
          }`}
        >
          <div
            className={`w-16 h-16 mx-auto mb-4 rounded-full ${
              isYourTrait ? "bg-purple-100" : "bg-emerald-100"
            } flex items-center justify-center`}
          >
            <svg
              className={`w-8 h-8 ${
                isYourTrait ? "text-purple-400" : "text-emerald-400"
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
          </div>
          <p className="text-sm text-gray-600">
            Provide valid parent genotypes to see live outcomes
          </p>
        </div>
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

  const initialTraitId = state.traitId || searchParams.get("traitId") || "";
  const initialParent1 = canonicalize(
    state.parent1 || searchParams.get("p1") || ""
  );
  const initialParent2 = canonicalize(
    state.parent2 || searchParams.get("p2") || ""
  );
  const initialBaselineKey =
    state.baselineKey || searchParams.get("baselineKey") || "";
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
  const [asPercentages, setAsPercentages] =
    useState<boolean>(initialAsPercentages);

  const [baselineKey, setBaselineKey] = useState(initialBaselineKey);
  const [baselineInput, setBaselineInput] = useState(initialBaselineKey);

  const [primaryTrait, setPrimaryTrait] = useState<TraitInfo | null>(null);
  const [primaryLoading, setPrimaryLoading] = useState(false);
  const [primaryError, setPrimaryError] = useState<string | null>(null);

  const [baselineTrait, setBaselineTrait] = useState<TraitInfo | null>(null);
  const [baselineLoading, setBaselineLoading] = useState(false);
  const [baselineError, setBaselineError] = useState<string | null>(null);

  const [primaryPreview, setPrimaryPreview] =
    useState<MendelianPreviewResponse | null>(null);
  const [primaryPreviewLoading, setPrimaryPreviewLoading] = useState(false);
  const [primaryPreviewError, setPrimaryPreviewError] = useState<string | null>(
    null
  );

  const [baselinePreview, setBaselinePreview] =
    useState<MendelianPreviewResponse | null>(null);
  const [baselinePreviewLoading, setBaselinePreviewLoading] = useState(false);
  const [baselinePreviewError, setBaselinePreviewError] = useState<
    string | null
  >(null);
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
  }, [
    traitId,
    parent1,
    parent2,
    baselineKey,
    asPercentages,
    seed,
    setSearchParams,
  ]);

  useEffect(() => {
    if (!traitId) {
      setPrimaryTrait(null);
      setPrimaryError(
        "Missing trait identifier. Launch from Trait Management to continue."
      );
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
          if (
            detail &&
            typeof detail === "object" &&
            Array.isArray(detail.errors)
          ) {
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
    []
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
      controller.signal
    )
      .then((preview) => {
        setPrimaryPreview(preview);
      })
      .catch((error) => {
        if (axios.isCancel(error)) return;
        let message = "Unable to compute preview.";
        if (axios.isAxiosError(error)) {
          const detail = error.response?.data?.detail;
          if (
            detail &&
            typeof detail === "object" &&
            Array.isArray(detail.errors)
          ) {
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
      controller.signal
    )
      .then((preview) => {
        setBaselinePreview(preview);
      })
      .catch((error) => {
        if (axios.isCancel(error)) return;
        let message = "Unable to compute baseline preview.";
        if (axios.isAxiosError(error)) {
          const detail = error.response?.data?.detail;
          if (
            detail &&
            typeof detail === "object" &&
            Array.isArray(detail.errors)
          ) {
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
    []
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

  const handleSelectTrait = useCallback((trait: TraitInfo) => {
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
  }, []);

  return (
    <DashboardLayout>
      <main className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 pb-12">
        <div className="mx-auto max-w-8xl px-6 py-8">
          {/* Header Section */}
          <div className="mb-8">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl">
                    <svg
                      className="w-8 h-8 text-purple-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 7.172V5L8 4z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                      Trait Playground
                    </h1>
                    <p className="text-gray-600 mt-1">
                      Interactive genetics laboratory - explore inheritance
                      patterns and compare outcomes
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 self-end">
                  <button
                    type="button"
                    onClick={() => setTraitSidebarOpen((prev) => !prev)}
                    className="lg:hidden inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-200 rounded-xl text-gray-700 font-medium transition-all duration-200 hover:border-gray-300 hover:shadow-md"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 12h16M4 18h16"
                      />
                    </svg>
                    {traitSidebarOpen ? "Hide traits" : "Show traits"}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/portal/traits")}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl font-medium transition-all duration-200 hover:from-gray-700 hover:to-gray-800 hover:shadow-lg"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 19l-7-7m0 0l7-7m-7 7h18"
                      />
                    </svg>
                    Back to Traits
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-8 lg:flex-row">
            <div className="flex-1">
              {/* Control Panel */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6 mb-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl">
                    <svg
                      className="w-5 h-5 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
                      />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-800">
                      Simulation Controls
                    </h2>
                    <p className="text-sm text-gray-600">
                      Configure genetics parameters and display settings
                    </p>
                  </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-4">
                  <div className="space-y-2">
                    <label
                      htmlFor="parent-1"
                      className="text-sm font-semibold text-gray-700 flex items-center gap-2"
                    >
                      <div className="w-3 h-3 rounded-full bg-purple-400"></div>
                      Parent 1 Genotype
                    </label>
                    <div className="relative">
                      <input
                        id="parent-1"
                        value={parent1}
                        onChange={(event) =>
                          handleParentChange("parent1", event.target.value)
                        }
                        placeholder="Ww"
                        className="w-full px-4 py-3 text-lg font-mono text-center border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white shadow-sm transition-all duration-200"
                        autoComplete="off"
                      />
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-400 rounded-full"></div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="parent-2"
                      className="text-sm font-semibold text-gray-700 flex items-center gap-2"
                    >
                      <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                      Parent 2 Genotype
                    </label>
                    <div className="relative">
                      <input
                        id="parent-2"
                        value={parent2}
                        onChange={(event) =>
                          handleParentChange("parent2", event.target.value)
                        }
                        placeholder="Ww"
                        className="w-full px-4 py-3 text-lg font-mono text-center border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white shadow-sm transition-all duration-200"
                        autoComplete="off"
                      />
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full"></div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="seed"
                      className="text-sm font-semibold text-gray-700 flex items-center gap-2"
                    >
                      <svg
                        className="w-4 h-4 text-amber-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z"
                        />
                      </svg>
                      Random Seed
                    </label>
                    <input
                      id="seed"
                      value={seed}
                      onChange={(event) =>
                        setSeed(canonicalize(event.target.value))
                      }
                      placeholder="1234 (optional)"
                      className="w-full px-4 py-3 text-center border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white shadow-sm transition-all duration-200"
                    />
                  </div>

                  <div className="space-y-2">
                    <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <svg
                        className="w-4 h-4 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                        />
                      </svg>
                      Display Mode
                    </span>
                    <button
                      type="button"
                      onClick={togglePercentages}
                      className={`w-full px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                        asPercentages
                          ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg"
                          : "bg-gray-100 text-gray-700 border-2 border-gray-200 hover:bg-gray-200"
                      }`}
                    >
                      {asPercentages ? "📊 Percentages" : "🔢 Probabilities"}
                    </button>
                  </div>
                </div>

                {/* Baseline Configuration */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-gradient-to-br from-orange-100 to-yellow-100 rounded-xl">
                      <svg
                        className="w-5 h-5 text-orange-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-800">
                        Baseline Comparison
                      </h3>
                      <p className="text-xs text-gray-600">
                        Compare against reference traits
                      </p>
                    </div>
                  </div>

                  <form
                    onSubmit={applyBaseline}
                    className="flex flex-wrap items-center gap-3"
                  >
                    <div className="flex-1 min-w-[200px]">
                      <input
                        id="baseline-key"
                        value={baselineInput}
                        onChange={(event) =>
                          setBaselineInput(event.target.value)
                        }
                        placeholder="abo_blood_group"
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white shadow-sm transition-all duration-200"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-medium transition-all duration-200 hover:from-orange-600 hover:to-orange-700 hover:shadow-lg"
                    >
                      Apply
                    </button>
                    {baselineKey && (
                      <button
                        type="button"
                        onClick={clearBaseline}
                        className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-medium transition-all duration-200 hover:from-red-600 hover:to-red-700 hover:shadow-lg"
                      >
                        Clear
                      </button>
                    )}
                    {baselineLoading && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-xl">
                        <div className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin"></div>
                        <span className="text-sm text-blue-700">
                          Loading baseline...
                        </span>
                      </div>
                    )}
                    {baselineError && (
                      <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-xl">
                        <span className="text-sm text-red-700">
                          {baselineError}
                        </span>
                      </div>
                    )}
                  </form>
                </div>
              </div>

              {/* Error States */}
              {traitUnavailable && (
                <div className="mb-8 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-2xl p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-yellow-100 rounded-full">
                      <svg
                        className="w-6 h-6 text-yellow-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-yellow-800 mb-2">
                        No Trait Selected
                      </h3>
                      <p className="text-yellow-700">
                        Select a trait from the sidebar or launch from Trait
                        Management to start your playground session.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {primaryError && (
                <div className="mb-8 bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 rounded-2xl p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-red-100 rounded-full">
                      <svg
                        className="w-6 h-6 text-red-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-red-800 mb-2">
                        Trait Loading Error
                      </h3>
                      <p className="text-red-700">{primaryError}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Trait Comparison Cards */}
              <div className="grid gap-8 lg:grid-cols-2 mb-8">
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
                  error={
                    baselinePreviewError ||
                    (!baselineKey ? "Select a baseline to compare." : null)
                  }
                  asPercentages={asPercentages}
                />
              </div>

              {/* Comparison Panel */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 backdrop-blur-sm rounded-xl">
                      <svg
                        className="w-6 h-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2h2a2 2 0 002 2v6a2 2 0 002 2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">
                        Statistical Comparison
                      </h2>
                      <p className="text-white/80">
                        Side-by-side analysis of trait outcomes
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <ComparePanel
                    primaryLabel="Your trait"
                    baselineLabel={
                      baselineTrait ? baselineTrait.name : undefined
                    }
                    primary={primaryPreview}
                    baseline={baselinePreview}
                    asPercentages={asPercentages}
                  />
                </div>
              </div>
            </div>

            {/* Traits Sidebar */}
            <aside
              className={`${
                traitSidebarOpen ? "block" : "hidden"
              } lg:block lg:w-80 flex-shrink-0`}
            >
              <div className="sticky top-24 bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 backdrop-blur-sm rounded-xl">
                      <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                        />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">
                        Your Traits
                      </h2>
                      <p className="text-white/80 text-sm">
                        Select a trait to explore
                      </p>
                    </div>
                  </div>
                </div>

                {/* Search */}
                <div className="p-4 border-b border-gray-100">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg
                        className="h-5 w-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={traitSearch}
                      onChange={(event) => setTraitSearch(event.target.value)}
                      placeholder="Search traits..."
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                    />
                  </div>
                </div>

                {/* Traits List */}
                <div className="max-h-[60vh] overflow-y-auto p-4">
                  {traitsLoading ? (
                    <div className="flex items-center justify-center gap-3 py-8">
                      <div className="w-6 h-6 border-2 border-emerald-300 border-t-emerald-600 rounded-full animate-spin"></div>
                      <span className="text-sm text-gray-600">
                        Loading traits...
                      </span>
                    </div>
                  ) : filteredTraits.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                        <svg
                          className="w-8 h-8 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                      </div>
                      <p className="text-sm text-gray-500">No traits found</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredTraits.map((trait) => {
                        const identifier = trait.id || trait.key;
                        const isActive = identifier === traitId;
                        return (
                          <button
                            key={identifier}
                            type="button"
                            onClick={() => handleSelectTrait(trait)}
                            className={`w-full text-left rounded-xl border-2 p-4 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                              isActive
                                ? "border-emerald-300 bg-gradient-to-r from-emerald-50 to-teal-50 shadow-md"
                                : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-md"
                            }`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="font-semibold text-gray-800 truncate pr-2">
                                {trait.name}
                              </div>
                              {isActive && (
                                <div className="flex-shrink-0 w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                              )}
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-mono text-gray-600 truncate pr-2">
                                {trait.key}
                              </span>
                              <span
                                className={`px-2 py-1 rounded-full text-[10px] font-medium capitalize ${
                                  trait.status === "active"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-gray-100 text-gray-600"
                                }`}
                              >
                                {trait.status}
                              </span>
                            </div>
                            {trait.alleles && trait.alleles.length > 0 && (
                              <div className="mt-2 flex items-center gap-1">
                                <span className="text-[10px] font-medium text-gray-500">
                                  Alleles:
                                </span>
                                <div className="flex gap-1">
                                  {trait.alleles
                                    .slice(0, 3)
                                    .map((allele, i) => (
                                      <span
                                        key={i}
                                        className="text-[10px] font-mono bg-gray-100 px-1 py-0.5 rounded"
                                      >
                                        {allele}
                                      </span>
                                    ))}
                                  {trait.alleles.length > 3 && (
                                    <span className="text-[10px] text-gray-400">
                                      +{trait.alleles.length - 3}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
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
