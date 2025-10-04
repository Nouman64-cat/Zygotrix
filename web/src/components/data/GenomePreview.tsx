import React from "react";

import type { DataImportResponse } from "../../types/api";

interface GenomePreviewProps {
  result: DataImportResponse | null;
  className?: string;
}

const GenomePreview: React.FC<GenomePreviewProps> = ({ result, className = "" }) => {
  if (!result) {
    return null;
  }

  return (
    <div className={`rounded-lg border border-slate-200 bg-white shadow-sm ${className}`}>
      <div className="border-b border-slate-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-700">Preview summary</h2>
        <p className="text-xs text-slate-500">
          Normalized variants are transient and will be deleted when your session ends
          unless you chose to persist them.
        </p>
      </div>
      <div className="grid gap-4 px-4 py-4 lg:grid-cols-2">
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Mapped Traits
          </h3>
          <div className="mt-2 space-y-2">
            {Object.entries(result.mapped_traits).length === 0 && (
              <p className="text-xs text-slate-500">
                No markers matched internal trait presets.
              </p>
            )}
            {Object.entries(result.mapped_traits).map(([traitKey, entry]) => (
              <div
                key={traitKey}
                className="rounded border border-emerald-100 bg-emerald-50 px-3 py-2"
              >
                <div className="flex items-center justify-between text-sm font-medium text-emerald-700">
                  <span className="capitalize">{traitKey.replace(/_/g, " ")}</span>
                  {entry.confidence !== undefined && (
                    <span className="text-xs text-emerald-600">
                      Confidence {(entry.confidence * 100).toFixed(0)}%
                    </span>
                  )}
                </div>
                {entry.genotype && (
                  <div className="mt-1 text-xs text-emerald-700">
                    Suggested genotype: <span className="font-mono">{entry.genotype}</span>
                  </div>
                )}
                {entry.sources?.length ? (
                  <div className="mt-1 text-[11px] text-emerald-700">
                    Sources: {entry.sources.join(", ")}
                  </div>
                ) : null}
                {entry.notes && (
                  <div className="mt-1 text-[11px] text-emerald-600">{entry.notes}</div>
                )}
              </div>
            ))}
          </div>
        </section>
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Variant Calls
          </h3>
          <div className="mt-2 max-h-56 overflow-y-auto rounded border border-slate-200 bg-slate-50">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="bg-slate-100 text-slate-600">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold">Marker</th>
                  <th className="px-3 py-2 text-left font-semibold">Genotype</th>
                  <th className="px-3 py-2 text-right font-semibold">Dosage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {result.normalized_calls.slice(0, 50).map((call) => (
                  <tr key={call.rsid} className="bg-white">
                    <td className="px-3 py-1.5 font-mono text-slate-700">{call.rsid}</td>
                    <td className="px-3 py-1.5 text-slate-600">
                      {call.genotype || "—"}
                    </td>
                    <td className="px-3 py-1.5 text-right text-slate-600">
                      {call.dosage !== undefined && call.dosage !== null
                        ? call.dosage.toFixed(2)
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {result.normalized_calls.length > 50 && (
              <div className="px-3 py-2 text-[11px] text-slate-500">
                Showing first 50 of {result.normalized_calls.length} variants.
              </div>
            )}
          </div>
        </section>
      </div>
      {(result.warnings.length > 0 || result.unmapped_variants.length > 0) && (
        <div className="border-t border-slate-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
          {result.warnings.map((warning) => (
            <div key={warning}>⚠️ {warning}</div>
          ))}
          {result.unmapped_variants.length > 0 && (
            <div className="mt-1">
              Unmapped markers ({result.unmapped_variants.length}):{" "}
              {result.unmapped_variants.slice(0, 10).join(", ")}
              {result.unmapped_variants.length > 10 && "…"}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GenomePreview;

