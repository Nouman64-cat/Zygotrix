import React, { useState } from "react";

import DashboardLayout from "../layouts/DashboardLayout";
import PGSPanel from "../components/data/PGSPanel";
import { runPGSDemo } from "../services/data.api";
import type { PGSDemoRequest, PGSDemoResponse } from "../types/api";

type WeightRow = { rsid: string; effect_allele: string; weight: number };

const parseWeightsCsv = (text: string): WeightRow[] => {
  const rows: WeightRow[] = [];
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) {
    return rows;
  }
  const [header, ...dataLines] = lines;
  const headers = header
    .split(/,|\t/)
    .map((value) => value.trim().toLowerCase());
  const rsidIndex = headers.findIndex((value) => value === "rsid");
  const effectIndex = headers.findIndex((value) => value === "effect_allele");
  const weightIndex = headers.findIndex((value) => value === "weight");
  if (rsidIndex === -1 || effectIndex === -1 || weightIndex === -1) {
    throw new Error("CSV must include rsid,effect_allele,weight columns.");
  }
  dataLines.forEach((line) => {
    const cols = line.split(/,|\t/);
    const rsid = cols[rsidIndex]?.trim();
    const effect = cols[effectIndex]?.trim();
    const weight = cols[weightIndex]?.trim();
    if (!rsid || !effect || !weight) {
      return;
    }
    const parsedWeight = Number(weight);
    if (Number.isNaN(parsedWeight)) {
      return;
    }
    rows.push({
      rsid,
      effect_allele: effect.toUpperCase(),
      weight: parsedWeight,
    });
  });
  return rows;
};

const parseGenotypeTable = (text: string): Record<string, number> => {
  const result: Record<string, number> = {};
  text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .forEach((line) => {
      const [rsid, dosage] = line.split(/,|\t/).map((value) => value.trim());
      if (!rsid || !dosage) return;
      const parsed = Number(dosage);
      if (Number.isNaN(parsed)) return;
      result[rsid.toLowerCase()] = parsed;
    });
  return result;
};

const PGSDemoPage: React.FC = () => {
  const [weightsText, setWeightsText] = useState("");
  const [genotypeText, setGenotypeText] = useState("");
  const [referenceMean, setReferenceMean] = useState("0");
  const [referenceSD, setReferenceSD] = useState("1");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PGSDemoResponse | null>(null);

  const handleWeightsFile = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    const text = await file.text();
    setWeightsText(text);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const weights = parseWeightsCsv(weightsText);
      if (weights.length === 0) {
        throw new Error("Provide at least one SNP weight.");
      }
      const genotypeCalls = parseGenotypeTable(genotypeText);
      const payload: PGSDemoRequest = {
        weights,
        genotype_calls: genotypeCalls,
        reference_mean: Number(referenceMean) || 0,
        reference_sd: Number(referenceSD) || 1,
      };
      const response = await runPGSDemo(payload);
      setResult(response);
    } catch (err: any) {
      const message = err?.message ?? "Unable to compute polygenic score.";
      setError(message);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <main className="min-h-screen bg-slate-50 pb-12">
        <div className="mx-auto max-w-7xl px-6 py-6 space-y-6">
          <header className="rounded-lg border border-purple-100 bg-purple-50 px-4 py-3">
            <h1 className="text-lg font-semibold text-purple-800">
              GWAS-lite demo
            </h1>
            <p className="text-sm text-purple-700">
              Combine lightweight SNP effect weights with private genotypes to
              approximate a polygenic score. Results are educational and should
              not guide medical decisions.
            </p>
          </header>

          <form
            onSubmit={handleSubmit}
            className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700">
                  SNP weights (CSV: rsid,effect_allele,weight)
                </label>
                <input type="file" accept=".csv" onChange={handleWeightsFile} />
              </div>
              <textarea
                value={weightsText}
                onChange={(event) => setWeightsText(event.target.value)}
                rows={6}
                placeholder="rs123,A,0.12"
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm font-mono focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Genotype dosages (rsid,dosage) – optional (defaults to zero for
                missing markers)
              </label>
              <textarea
                value={genotypeText}
                onChange={(event) => setGenotypeText(event.target.value)}
                rows={4}
                placeholder="rs123,1.0"
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm font-mono focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <label className="text-sm text-slate-600">
                Reference mean
                <input
                  type="number"
                  value={referenceMean}
                  onChange={(event) => setReferenceMean(event.target.value)}
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-2 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </label>
              <label className="text-sm text-slate-600">
                Reference SD
                <input
                  type="number"
                  step="0.01"
                  value={referenceSD}
                  onChange={(event) => setReferenceSD(event.target.value)}
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-2 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center rounded-md bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:bg-purple-300"
            >
              {loading ? "Calculating…" : "Compute polygenic score"}
            </button>

            {error && (
              <div className="rounded border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {error}
              </div>
            )}
          </form>

          <PGSPanel result={result} />
        </div>
      </main>
    </DashboardLayout>
  );
};

export default PGSDemoPage;
