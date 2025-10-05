import React, { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { fetchGWASTraitDetails, searchGWASTraits } from "../services/gwas.api";
import type { GWASTraitRecord } from "../types/api";

const SUGGESTION_LIMIT = 20;
const DEFAULT_RESULT_LIMIT = 25;
const SUMMARY_FIELDS = [
  "STUDY ACCESSION",
  "STUDY",
  "FIRST AUTHOR",
  "PUBMEDID",
  "P-VALUE",
  "PVALUE_MLOG",
  "DISEASE/TRAIT",
  "REGION",
  "CHR_ID",
  "CHR_POS",
  "REPORTED GENE(S)",
  "MAPPED_GENE",
  "UPSTREAM_GENE_ID",
  "DOWNSTREAM_GENE_ID",
  "SNP_GENE_IDS",
  "UPSTREAM_GENE_DISTANCE",
  "DOWNSTREAM_GENE_DISTANCE",
  "STRONGEST SNP-RISK ALLELE",
];

const TraitManagementPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedTrait, setSelectedTrait] = useState<string | null>(null);
  const [records, setRecords] = useState<GWASTraitRecord[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [resultLimit, setResultLimit] = useState(DEFAULT_RESULT_LIMIT);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      try {
        setIsSearching(true);
        const result = await searchGWASTraits(
          searchTerm.trim(),
          controller.signal
        );
        setSuggestions(result.slice(0, SUGGESTION_LIMIT));
      } catch (err) {
        if (!isAbortError(err)) {
          setError("Unable to search traits right now. Please try again.");
        }
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [searchTerm]);

  useEffect(() => {
    if (!selectedTrait) {
      setRecords([]);
      setColumns([]);
      return;
    }

    const controller = new AbortController();
    setLoadingRecords(true);
    setError(null);

    fetchGWASTraitDetails(selectedTrait, {
      limit: resultLimit,
      signal: controller.signal,
    })
      .then((response) => {
        setRecords(response.records);
        setColumns(response.columns);
      })
      .catch((err) => {
        if (isAbortError(err)) {
          return;
        }
        setRecords([]);
        setColumns([]);
        setError("Unable to load trait details. Please try again.");
      })
      .finally(() => setLoadingRecords(false));

    return () => controller.abort();
  }, [selectedTrait, resultLimit]);

  useEffect(() => {
    if (!error) return;

    const timeoutId = window.setTimeout(() => setError(null), 6000);
    return () => window.clearTimeout(timeoutId);
  }, [error]);

  const tableColumns = useMemo(() => {
    if (columns.length) {
      return columns;
    }

    if (!records.length) return [] as string[];

    const keys = new Set<string>();
    records.forEach((row) => {
      Object.keys(row).forEach((key) => keys.add(key));
    });

    return Array.from(keys);
  }, [columns, records]);

  const handleSelectTrait = (traitName: string) => {
    setSearchTerm(traitName);
    setSelectedTrait(traitName);
  };

  const handleSubmitSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = searchTerm.trim();
    if (!trimmed) return;

    const exactMatch = suggestions.find(
      (item) => item.toLowerCase() === trimmed.toLowerCase()
    );

    handleSelectTrait(exactMatch ?? trimmed);
  };

  const activeTraitDisplay =
    selectedTrait ?? (suggestions.length === 1 ? suggestions[0] : null);
  const firstRecord = records[0];
  const allFields = useMemo(() => {
    if (columns.length) {
      return columns;
    }
    if (firstRecord) {
      return Object.keys(firstRecord);
    }
    return [] as string[];
  }, [columns, firstRecord]);

  return (
    <DashboardLayout>
      <div className="flex h-full bg-gray-50">
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="bg-white shadow-sm border-b border-gray-200">
            <div className="px-6 py-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16l-4 4m0 0l4-4m-4 4V4m16 4l4-4m0 0l-4 4m4-4v16"
                        />
                      </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900">
                      Trait Management
                    </h1>
                  </div>
                  <p className="text-gray-600">
                    Search the GWAS catalog and inspect study-level evidence for
                    each trait.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            <div className="max-w-8xl mx-auto px-6 py-8 space-y-8">
              <section className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-6">
                <div className="space-y-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex-1">
                      <form onSubmit={handleSubmitSearch} className="relative">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Search Traits
                        </label>
                        <input
                          type="search"
                          value={searchTerm}
                          onChange={(event) =>
                            setSearchTerm(event.target.value)
                          }
                          placeholder="e.g. Blood pressure"
                          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {isSearching && (
                          <div className="absolute right-3 top-9 text-blue-500">
                            <svg
                              className="animate-spin h-4 w-4"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                                fill="none"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                              />
                            </svg>
                          </div>
                        )}
                      </form>
                    </div>
                    <div className="w-full md:w-auto">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Result Limit
                      </label>
                      <select
                        className="w-full md:w-32 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                        value={resultLimit}
                        onChange={(event) =>
                          setResultLimit(Number(event.target.value))
                        }
                      >
                        {[10, 25, 50].map((value) => (
                          <option key={value} value={value}>
                            {value} rows
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {!!suggestions.length && (
                    <div className="flex flex-wrap gap-2">
                      {suggestions.map((item) => {
                        const isActive = selectedTrait
                          ? item.toLowerCase() === selectedTrait.toLowerCase()
                          : false;
                        return (
                          <button
                            key={item}
                            type="button"
                            onClick={() => handleSelectTrait(item)}
                            className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                              isActive
                                ? "border-blue-500 bg-blue-50 text-blue-700"
                                : "border-gray-200 bg-gray-100 text-gray-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                            }`}
                          >
                            {item}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {error}
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">
                        {activeTraitDisplay
                          ? `Study Records for "${activeTraitDisplay}"`
                          : "Trait Overview"}
                      </h2>
                      <p className="text-sm text-gray-500">
                        {records.length
                          ? `Showing ${records.length} record${
                              records.length === 1 ? "" : "s"
                            } (limit ${resultLimit}).`
                          : selectedTrait
                          ? "No study records found for this trait in the first page."
                          : "Select a trait to view the associated GWAS studies."}
                      </p>
                    </div>
                    {loadingRecords && (
                      <div className="flex items-center gap-2 text-blue-600 text-sm">
                        <svg
                          className="animate-spin h-4 w-4"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                          />
                        </svg>
                        Loading...
                      </div>
                    )}
                  </div>

                  {firstRecord && (
                    <div className="grid gap-4 rounded-lg border border-blue-100 bg-blue-50/60 p-4 text-sm text-blue-900 md:grid-cols-4">
                      {SUMMARY_FIELDS.filter((field) => field in firstRecord).map(
                        (field) => (
                          <div key={field} className="space-y-1">
                            <dt className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                              {field}
                            </dt>
                            <dd className="font-medium break-words">
                              {formatValue(firstRecord[field])}
                            </dd>
                          </div>
                        )
                      )}
                    </div>
                  )}

                  {firstRecord && allFields.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Full Study Metadata (first record)
                      </h3>
                      <div className="grid gap-4 rounded-lg border border-gray-200 bg-gray-50/80 p-4 text-sm text-gray-900 md:grid-cols-2 xl:grid-cols-3">
                        {allFields.map((field) => (
                          <div key={field} className="space-y-1">
                            <dt className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                              {field}
                            </dt>
                            <dd className="font-medium break-words">
                              {formatValue(firstRecord[field])}
                            </dd>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {records.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            {tableColumns.map((column) => (
                              <th
                                key={column}
                                scope="col"
                                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600"
                              >
                                {column}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                          {records.map((row, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              {tableColumns.map((column) => (
                                <td
                                  key={column}
                                  className="px-4 py-3 text-sm text-gray-700 align-top"
                                >
                                  {formatValue(row[column])}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center text-sm text-gray-500">
                      Search for a mapped trait to explore its associated GWAS
                      publications.
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

const isAbortError = (error: unknown): boolean => {
  if (!error) {
    return false;
  }

  if (typeof DOMException !== "undefined" && error instanceof DOMException) {
    return error.name === "AbortError";
  }

  if (typeof error === "object" && error !== null && "name" in error) {
    const name = String((error as { name?: unknown }).name ?? "");
    return name === "AbortError" || name === "CanceledError";
  }

  if (typeof error === "string") {
    return error === "AbortError" || error === "CanceledError";
  }

  return false;
};

const formatValue = (value: unknown): string => {
  if (value === null || value === undefined) {
    return "—";
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      return String(value);
    }

    if (Math.abs(value) >= 1_000_000 || Math.abs(value) < 0.001) {
      return value.toExponential(3);
    }

    if (Number.isInteger(value)) {
      return value.toLocaleString();
    }

    return value.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 6,
    });
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (typeof value === "string") {
    if (value.startsWith("http")) {
      return value;
    }
    return value;
  }

  return JSON.stringify(value);
};

export default TraitManagementPage;
