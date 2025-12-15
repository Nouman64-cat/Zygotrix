import React, { useState } from "react";

import DashboardLayout from "../layouts/DashboardLayout";
import GenomePreview from "../components/data/GenomePreview";
import { uploadGenomeFile } from "../services/data.api";
import type { DataImportResponse } from "../types/api";
import useDocumentTitle from "../hooks/useDocumentTitle";

const DataImportPage: React.FC = () => {
  useDocumentTitle("Data Import");

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [persist, setPersist] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<DataImportResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setSelectedFile(null);
      return;
    }
    setError(null);
    setSelectedFile(file);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedFile) {
      setError("Select a VCF or CSV file first.");
      return;
    }
    try {
      setIsSubmitting(true);
      setError(null);
      const uploadResult = await uploadGenomeFile(selectedFile, { persist });
      setResult(uploadResult);
    } catch (err: any) {
      const message =
        err?.response?.data?.detail ?? err?.message ?? "Upload failed.";
      setError(Array.isArray(message) ? message.join("; ") : message);
      setResult(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <main className="min-h-screen bg-slate-50 pb-12">
        <div className="mx-auto max-w-7xl px-6 py-6 space-y-6">
          <header className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
            <h1 className="text-lg font-semibold text-blue-800">
              VCF / CSV Import (private)
            </h1>
            <p className="text-sm text-blue-700">
              Upload small genotype files for educational analysis. Files are
              sanitized and, by default, deleted when the session ends.
            </p>
          </header>

          <form
            onSubmit={handleSubmit}
            className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm space-y-4"
          >
            <div className="rounded border-2 border-dashed border-slate-300 p-6 text-center">
              <input
                id="genome-file"
                type="file"
                accept=".vcf,.csv,.tsv"
                onChange={handleFileChange}
                className="hidden"
              />
              <label
                htmlFor="genome-file"
                className="inline-flex cursor-pointer flex-col items-center gap-2 text-slate-600"
              >
                <svg
                  className="h-10 w-10 text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 15a4 4 0 004 4h10a4 4 0 004-4m-6-4l-4-4m0 0L7 11m4-4v12"
                  />
                </svg>
                <span className="text-sm font-medium">
                  {selectedFile
                    ? selectedFile.name
                    : "Click to select a VCF, CSV, or TSV file"}
                </span>
                <span className="text-xs text-slate-500">
                  rsIDs and genotypes are normalized; sample identifiers are
                  stripped automatically.
                </span>
              </label>
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={persist}
                onChange={(event) => setPersist(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              Keep sanitized copy on the server for this session (you can delete
              it later).
            </label>

            <button
              type="submit"
              disabled={isSubmitting || !selectedFile}
              className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              {isSubmitting ? "Processing…" : "Upload & Parse"}
            </button>

            {error && (
              <div className="rounded border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {error}
              </div>
            )}
          </form>

          <GenomePreview result={result} />
        </div>
      </main>
    </DashboardLayout>
  );
};

export default DataImportPage;
