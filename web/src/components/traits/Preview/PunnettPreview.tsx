import React, { useEffect, useMemo, useRef, useState } from "react";
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
};

const totalsWithinTolerance = (
  distribution: Record<string, number>,
  asPercentages: boolean,
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
}) => {
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

    if (!effectiveTrait.alleles.length || !Object.keys(effectiveTrait.phenotype_map).length) {
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
      dispatchValidation({ errors: [message], totalsOk: false, loading: false });
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

    const numericSeed = seedInput.trim().length
      ? Number(seedInput)
      : undefined;
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
          asPercentages,
        );
        const phenotypeTotalsOk = totalsWithinTolerance(
          data.phenotype_dist,
          asPercentages,
        );
        const totalsOk = genotypeTotalsOk && phenotypeTotalsOk;
        dispatchValidation({ errors: data.errors ?? [], totalsOk, loading: false });
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
        dispatchValidation({ errors: detailErrors, totalsOk: false, loading: false });
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
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-gray-100 bg-gray-50 rounded-t-lg">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">Live Preview</h3>
          <p className="text-xs text-gray-500">
            See how the Punnett square and distributions update before saving.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAsPercentages((prev) => !prev)}
            className="px-2 py-1 text-xs font-medium border border-blue-200 text-blue-600 rounded hover:bg-blue-50 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            {asPercentages ? "Show Probabilities" : "Show Percentages"}
          </button>
          <button
            type="button"
            onClick={handleCopyJson}
            disabled={!preview}
            className="px-2 py-1 text-xs font-medium border border-gray-200 text-gray-600 rounded hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {copied ? "Copied" : "Copy JSON"}
          </button>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col">
            <label className="text-xs font-medium text-gray-600" htmlFor="preview-parent-1">
              Parent 1 genotype
            </label>
            <input
              id="preview-parent-1"
              value={parent1}
              onChange={(event) => onParentChange("parent1", event.target.value)}
              placeholder={deriveDefaultGenotype(effectiveTrait.alleles)}
              className="mt-1 w-28 px-2 py-1 text-sm font-mono text-center border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs font-medium text-gray-600" htmlFor="preview-parent-2">
              Parent 2 genotype
            </label>
            <input
              id="preview-parent-2"
              value={parent2}
              onChange={(event) => onParentChange("parent2", event.target.value)}
              placeholder={deriveDefaultGenotype(effectiveTrait.alleles)}
              className="mt-1 w-28 px-2 py-1 text-sm font-mono text-center border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs font-medium text-gray-600" htmlFor="preview-seed">
              Seed (optional)
            </label>
            <input
              id="preview-seed"
              value={seedInput}
              onChange={(event) => setSeedInput(event.target.value)}
              placeholder="1234"
              className="mt-1 w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {ASSUMPTIONS.map((assumption) => (
              <span
                key={assumption}
                className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-100 rounded"
              >
                <svg
                  className="h-3 w-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                {assumption}
              </span>
            ))}
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            Updating preview...
          </div>
        )}

        {errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded p-3 text-xs text-red-700">
            <p className="font-semibold mb-1">Validation issues</p>
            <ul className="list-disc list-inside space-y-1">
              {errors.map((issue) => (
                <li key={issue}>{issue}</li>
              ))}
            </ul>
          </div>
        )}

        {preview && errors.length === 0 && (
          <div className="space-y-4">
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
