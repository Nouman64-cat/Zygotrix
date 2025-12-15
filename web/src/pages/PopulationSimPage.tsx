import React, { useEffect, useMemo, useState } from "react";

import DashboardLayout from "../layouts/DashboardLayout";
import CohortChart from "../components/data/CohortChart";
import { fetchTraits } from "../services/traits.api";
import { simulatePopulation } from "../services/data.api";
import type {
  PopulationSimRequest,
  PopulationSimResponse,
  TraitInfo,
} from "../types/api";
import useDocumentTitle from "../hooks/useDocumentTitle";

const POPULATIONS = ["AFR", "EUR", "EAS", "SAS", "AMR"];

const PopulationSimPage: React.FC = () => {
  useDocumentTitle("Population Simulation");

  const [population, setPopulation] = useState("EUR");
  const [sampleSize, setSampleSize] = useState(10000);
  const [selectedTraits, setSelectedTraits] = useState<string[]>([
    "abo_blood_group",
  ]);
  const [seed, setSeed] = useState<string>("");
  const [traits, setTraits] = useState<TraitInfo[]>([]);
  const [loadingTraits, setLoadingTraits] = useState(false);
  const [simLoading, setSimLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PopulationSimResponse | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoadingTraits(true);
    fetchTraits(controller.signal, { owned_only: true })
      .then((data) => setTraits(data))
      .catch(() => setTraits([]))
      .finally(() => setLoadingTraits(false));
    return () => controller.abort();
  }, []);

  const traitOptions = useMemo(() => {
    return traits.map((trait) => ({ label: trait.name, value: trait.key }));
  }, [traits]);

  const handleToggleTrait = (value: string) => {
    setSelectedTraits((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value]
    );
  };

  const handleSimulate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (selectedTraits.length === 0) {
      setError("Select at least one trait to simulate.");
      return;
    }
    try {
      setSimLoading(true);
      setError(null);
      const payload: PopulationSimRequest = {
        population,
        trait_keys: selectedTraits,
        n: sampleSize,
        seed: seed ? Number(seed) : undefined,
      };
      const simulation = await simulatePopulation(payload);
      setResult(simulation);
    } catch (err: any) {
      const detail =
        err?.response?.data?.detail ?? err?.message ?? "Simulation failed.";
      setError(Array.isArray(detail) ? detail.join("; ") : detail);
      setResult(null);
    } finally {
      setSimLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <main className="min-h-screen bg-slate-50 pb-12">
        <div className="mx-auto max-w-7xl px-6 py-6 space-y-6">
          <header className="rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3">
            <h1 className="text-lg font-semibold text-emerald-800">
              Population presets
            </h1>
            <p className="text-sm text-emerald-700">
              Generate expected genotype and phenotype distributions for curated
              populations using Hardy–Weinberg equilibrium assumptions.
            </p>
          </header>

          <form
            onSubmit={handleSimulate}
            className="grid gap-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm lg:grid-cols-4"
          >
            <label className="space-y-1 text-sm text-slate-600">
              Population
              <select
                value={population}
                onChange={(event) => setPopulation(event.target.value)}
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                {POPULATIONS.map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1 text-sm text-slate-600">
              Sample size
              <input
                type="range"
                min={100}
                max={20000}
                step={100}
                value={sampleSize}
                onChange={(event) => setSampleSize(Number(event.target.value))}
                className="w-full"
              />
              <div className="text-xs text-slate-500">
                {sampleSize.toLocaleString()} individuals
              </div>
            </label>

            <label className="space-y-1 text-sm text-slate-600 lg:col-span-2">
              Traits
              <div className="max-h-40 overflow-y-auto rounded border border-slate-200 bg-slate-50">
                {loadingTraits ? (
                  <div className="px-3 py-2 text-xs text-slate-500">
                    Loading traits…
                  </div>
                ) : traitOptions.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-slate-500">
                    No private traits found. Create a trait first.
                  </div>
                ) : (
                  <ul className="divide-y divide-slate-200">
                    {traitOptions.map((option) => (
                      <li key={option.value} className="px-3 py-2">
                        <label className="flex items-center gap-2 text-xs text-slate-600">
                          <input
                            type="checkbox"
                            checked={selectedTraits.includes(option.value)}
                            onChange={() => handleToggleTrait(option.value)}
                            className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                          />
                          {option.label}
                        </label>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </label>

            <label className="space-y-1 text-sm text-slate-600">
              RNG seed (optional)
              <input
                type="number"
                value={seed}
                onChange={(event) => setSeed(event.target.value)}
                className="w-full rounded border border-slate-300 px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </label>

            <button
              type="submit"
              disabled={simLoading}
              className="lg:col-span-4 inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
            >
              {simLoading ? "Simulating…" : "Run simulation"}
            </button>

            {error && (
              <div className="lg:col-span-4 rounded border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {error}
              </div>
            )}
          </form>

          {result && result.results.length > 0 && (
            <div className="grid gap-4 lg:grid-cols-2">
              {result.results.map((traitResult) => (
                <CohortChart key={traitResult.trait_key} result={traitResult} />
              ))}
            </div>
          )}

          {result && result.missing_traits.length > 0 && (
            <div className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
              Missing presets for: {result.missing_traits.join(", ")}
            </div>
          )}
        </div>
      </main>
    </DashboardLayout>
  );
};

export default PopulationSimPage;
