import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import type {
  MendelianPreviewResponse,
  TraitPreviewPayload,
} from "../../../types/api";
import { fetchMendelianPreview } from "../../../services/preview.api";
import PunnettGrid from "./PunnettGrid";
import DistributionBars from "./DistributionBars";
import HowComputed from "./HowComputed";

type ValidationState = {
  errors: string[];
  totalsOk: boolean;
  loading: boolean;
};

type PunnettPreviewProps = {
  draftTrait: TraitPreviewPayload;
  parent1: string;
  parent2: string;
  onParentChange: (which: "parent1" | "parent2", value: string) => void;
  onValidationChange?: (state: ValidationState) => void;
  traitId?: string;
};

const totalsWithinTolerance = (
  distribution: Record<string, number>,
  asPercentages: boolean
) => {
  const total = Object.values(distribution).reduce((acc, val) => acc + val, 0);
  const normalized = asPercentages ? total / 100 : total;
  return Math.abs(normalized - 1) <= 0.001;
};

const deriveDefaultGenotype = (alleles: string[]): string => {
  if (!alleles.length) return "";
  if (alleles.length === 1) return `${alleles[0]}${alleles[0]}`;
  return `${alleles[0]}${alleles[1]}`;
};

const ASSUMPTIONS = [
  "Independent assortment between gametes",
  "Simplified Mendelian dominance",
];

const PunnettPreview: React.FC<PunnettPreviewProps> = ({
  draftTrait,
  parent1,
  parent2,
  onParentChange,
  onValidationChange,
  traitId,
}) => {
  const navigate = useNavigate();
  const [asPercentages, setAsPercentages] = useState(true);
  const [seedInput, setSeedInput] = useState<string>("");
  const [preview, setPreview] = useState<MendelianPreviewResponse | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const effectiveTrait = useMemo<TraitPreviewPayload>(() => {
    return {
      alleles: draftTrait.alleles ?? [],
      phenotype_map: draftTrait.phenotype_map ?? {},
      inheritance_pattern: draftTrait.inheritance_pattern,
    };
  }, [draftTrait]);

  // Ensure parent genotypes always use available alleles when alleles change
  useEffect(() => {
    if (!effectiveTrait.alleles.length) {
      onParentChange("parent1", "");
      onParentChange("parent2", "");
      return;
    }
    const defaultGenotype = deriveDefaultGenotype(effectiveTrait.alleles);
    if (!parent1) {
      onParentChange("parent1", defaultGenotype);
    }
    if (!parent2) {
      onParentChange("parent2", defaultGenotype);
    }
  }, [effectiveTrait.alleles, onParentChange, parent1, parent2]);

  useEffect(() => {
    const dispatchValidation = (state: ValidationState) => {
      onValidationChange?.(state);
    };

    if (
      !effectiveTrait.alleles.length ||
      !Object.keys(effectiveTrait.phenotype_map).length
    ) {
      setPreview(null);
      setErrors([]);
      setIsLoading(false);
      dispatchValidation({ errors: [], totalsOk: true, loading: false });
      return;
    }
    if (!parent1 || !parent2) {
      setPreview(null);
      const message = "Enter genotypes for both parents to view preview.";
      setErrors([message]);
      dispatchValidation({
        errors: [message],
        totalsOk: false,
        loading: false,
      });
      return;
    }

    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    setErrors([]);
    dispatchValidation({ errors: [], totalsOk: false, loading: true });

    const numericSeed = seedInput.trim().length ? Number(seedInput) : undefined;
    const payload = {
      trait: effectiveTrait,
      parent1,
      parent2,
      as_percentages: asPercentages,
      seed: Number.isFinite(numericSeed) ? numericSeed : undefined,
    };

    fetchMendelianPreview(payload, controller.signal)
      .then((data) => {
        setPreview(data);
        setErrors(data.errors ?? []);
        const genotypeTotalsOk = totalsWithinTolerance(
          data.genotype_dist,
          asPercentages
        );
        const phenotypeTotalsOk = totalsWithinTolerance(
          data.phenotype_dist,
          asPercentages
        );
        const totalsOk = genotypeTotalsOk && phenotypeTotalsOk;
        dispatchValidation({
          errors: data.errors ?? [],
          totalsOk,
          loading: false,
        });
      })
      .catch((error) => {
        if (axios.isCancel(error)) {
          return;
        }
        let detailErrors: string[] = [
          "Unable to compute preview. Please verify the inputs.",
        ];
        if (axios.isAxiosError(error)) {
          const detail = error.response?.data?.detail;
          if (Array.isArray(detail)) {
            detailErrors = detail.map((item) => String(item));
          } else if (
            detail &&
            typeof detail === "object" &&
            Array.isArray((detail as { errors?: string[] }).errors)
          ) {
            detailErrors = (detail as { errors: string[] }).errors;
          } else if (typeof detail === "string") {
            detailErrors = [detail];
          }
        }
        setPreview(null);
        setErrors(detailErrors);
        dispatchValidation({
          errors: detailErrors,
          totalsOk: false,
          loading: false,
        });
      })
      .finally(() => {
        setIsLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [
    effectiveTrait,
    parent1,
    parent2,
    asPercentages,
    seedInput,
    onValidationChange,
  ]);

  useEffect(() => {
    if (!copied) return;
    const timeout = window.setTimeout(() => setCopied(false), 1500);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  const handleCopyJson = () => {
    if (!preview) return;
    const payload = {
      parent1,
      parent2,
      as_percentages: asPercentages,
      seed: seedInput.trim().length ? seedInput : undefined,
      result: preview,
    };
    navigator.clipboard
      .writeText(JSON.stringify(payload, null, 2))
      .then(() => setCopied(true))
      .catch(() => setCopied(false));
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
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
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Live Preview</h3>
              <p className="text-sm text-white/80">
                Interactive genetics simulation with real-time updates
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAsPercentages((prev) => !prev)}
              className="px-3 py-2 text-sm font-medium bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-200 cursor-pointer"
            >
              <div className="flex items-center gap-2">
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
                    d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                  />
                </svg>
                {asPercentages ? "Probabilities" : "Percentages"}
              </div>
            </button>
            <button
              type="button"
              onClick={handleCopyJson}
              disabled={!preview}
              className="px-3 py-2 text-sm font-medium bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer"
            >
              <div className="flex items-center gap-2">
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
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                {copied ? "Copied!" : "Copy JSON"}
              </div>
            </button>
            <button
              type="button"
              onClick={() => {
                if (!traitId || !preview || errors.length > 0 || isLoading) {
                  return;
                }

                navigate("/portal/traits/playground", {
                  state: {
                    traitId,
                    parent1: parent1.replace(/\s+/g, ""),
                    parent2: parent2.replace(/\s+/g, ""),
                    asPct: asPercentages,
                  },
                });
              }}
              disabled={!traitId || !preview || errors.length > 0 || isLoading}
              className="px-3 py-2 text-sm font-medium bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer"
              title={
                traitId
                  ? errors.length > 0
                    ? "Resolve validation issues before running in the playground"
                    : undefined
                  : "Save trait first to enable the playground"
              }
            >
              <div className="flex items-center gap-2">
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
                    d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z"
                  />
                </svg>
                Playground
              </div>
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-5 border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg
                className="w-5 h-5 text-purple-600"
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
              <h4 className="text-lg font-semibold text-gray-800">
                Simulation Parameters
              </h4>
              <p className="text-sm text-gray-600">
                Configure parent genotypes and randomization
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label
                className="text-sm font-semibold text-gray-700 flex items-center gap-2"
                htmlFor="preview-parent-1"
              >
                <div className="w-3 h-3 rounded-full bg-purple-400"></div>
                Parent 1 Genotype
              </label>
              <div className="relative">
                <input
                  id="preview-parent-1"
                  value={parent1}
                  onChange={(event) =>
                    onParentChange("parent1", event.target.value)
                  }
                  placeholder={deriveDefaultGenotype(effectiveTrait.alleles)}
                  className="w-full px-4 py-3 text-lg font-mono text-center border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white shadow-sm transition-all duration-200"
                />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-400 rounded-full"></div>
              </div>
            </div>

            <div className="space-y-2">
              <label
                className="text-sm font-semibold text-gray-700 flex items-center gap-2"
                htmlFor="preview-parent-2"
              >
                <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                Parent 2 Genotype
              </label>
              <div className="relative">
                <input
                  id="preview-parent-2"
                  value={parent2}
                  onChange={(event) =>
                    onParentChange("parent2", event.target.value)
                  }
                  placeholder={deriveDefaultGenotype(effectiveTrait.alleles)}
                  className="w-full px-4 py-3 text-lg font-mono text-center border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white shadow-sm transition-all duration-200"
                />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full"></div>
              </div>
            </div>

            <div className="space-y-2">
              <label
                className="text-sm font-semibold text-gray-700 flex items-center gap-2"
                htmlFor="preview-seed"
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
                id="preview-seed"
                value={seedInput}
                onChange={(event) => setSeedInput(event.target.value)}
                placeholder="1234 (optional)"
                className="w-full px-4 py-3 text-center border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white shadow-sm transition-all duration-200"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
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
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Assumptions
              </label>
              <div className="space-y-1">
                {ASSUMPTIONS.map((assumption) => (
                  <div
                    key={assumption}
                    className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded-lg"
                  >
                    <svg
                      className="w-3 h-3"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {assumption}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center gap-3 p-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
            <div className="relative">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              <div
                className="absolute inset-0 w-8 h-8 border-4 border-transparent border-r-blue-400 rounded-full animate-spin"
                style={{
                  animationDirection: "reverse",
                  animationDuration: "1s",
                }}
              ></div>
            </div>
            <div>
              <p className="text-sm font-semibold text-blue-700">
                Updating preview...
              </p>
              <p className="text-xs text-blue-600">
                Computing genetic probabilities
              </p>
            </div>
          </div>
        )}

        {errors.length > 0 && (
          <div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 rounded-xl p-5">
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
              <div className="flex-1">
                <h4 className="text-sm font-bold text-red-800 mb-2">
                  Validation Issues
                </h4>
                <ul className="space-y-1">
                  {errors.map((issue) => (
                    <li
                      key={issue}
                      className="flex items-start gap-2 text-sm text-red-700"
                    >
                      <span className="w-1.5 h-1.5 bg-red-400 rounded-full mt-2 flex-shrink-0"></span>
                      <span>{issue}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {preview && errors.length === 0 && (
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
        )}
      </div>
    </div>
  );
};

export default PunnettPreview;
