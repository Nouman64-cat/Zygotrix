import React, { useMemo } from "react";

import type { MendelianPreviewResponse } from "../../types/api";

type ComparePanelProps = {
  primaryLabel: string;
  baselineLabel?: string;
  primary: MendelianPreviewResponse | null;
  baseline?: MendelianPreviewResponse | null;
  asPercentages: boolean;
};

const toPercent = (value: number, asPercentages: boolean) =>
  asPercentages ? value : value * 100;

const formatValue = (value: number, asPercentages: boolean) =>
  asPercentages ? `${value.toFixed(2)}%` : value.toFixed(3);

const formatDelta = (delta: number) =>
  `${delta >= 0 ? "+" : ""}${delta.toFixed(2)}%`;

const buildRows = (
  primary: Record<string, number>,
  baseline: Record<string, number> | undefined,
  asPercentages: boolean,
) => {
  const keys = new Set<string>(Object.keys(primary));
  if (baseline) {
    Object.keys(baseline).forEach((key) => keys.add(key));
  }

  return Array.from(keys).sort().map((key) => {
    const yourValue = primary[key] ?? 0;
    const baselineValue = baseline?.[key] ?? 0;

    const yourPercent = toPercent(yourValue, asPercentages);
    const baselinePercent = toPercent(baselineValue, asPercentages);
    const delta = yourPercent - baselinePercent;

    return {
      key,
      yourValue,
      baselineValue,
      yourPercent,
      baselinePercent,
      delta,
    };
  });
};

const ComparePanel: React.FC<ComparePanelProps> = ({
  primaryLabel,
  baselineLabel,
  primary,
  baseline,
  asPercentages,
}) => {
  const genotypeRows = useMemo(
    () =>
      primary
        ? buildRows(primary.genotype_dist, baseline?.genotype_dist, asPercentages)
        : [],
    [primary, baseline, asPercentages],
  );

  const phenotypeRows = useMemo(
    () =>
      primary
        ? buildRows(primary.phenotype_dist, baseline?.phenotype_dist, asPercentages)
        : [],
    [primary, baseline, asPercentages],
  );

  const hasBaseline = Boolean(baseline && baselineLabel);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-700">Distribution comparison</h3>
      {!primary ? (
        <p className="mt-3 text-sm text-slate-500">
          Preview results will appear here once the trait loads.
        </p>
      ) : (
        <div className="mt-4 space-y-6">
          <section>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Genotypes
            </h4>
            <table className="mt-2 w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <th className="py-2">Genotype</th>
                  <th className="py-2">{primaryLabel}</th>
                  {hasBaseline && <th className="py-2">{baselineLabel}</th>}
                  {hasBaseline && <th className="py-2">Δ</th>}
                </tr>
              </thead>
              <tbody>
                {genotypeRows.map((row) => (
                  <tr key={`geno-${row.key}`} className="border-b border-slate-100 last:border-0">
                    <td className="py-2 font-mono text-slate-600">{row.key}</td>
                    <td className="py-2 text-slate-700">
                      {formatValue(row.yourValue, asPercentages)}
                    </td>
                    {hasBaseline && (
                      <td className="py-2 text-slate-600">
                        {formatValue(row.baselineValue, asPercentages)}
                      </td>
                    )}
                    {hasBaseline && (
                      <td className="py-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className={`h-2 rounded-full ${
                                row.delta >= 0 ? "bg-emerald-400" : "bg-rose-400"
                              }`}
                              style={{ width: `${Math.min(Math.abs(row.delta), 100)}%` }}
                            />
                          </div>
                          <span className={`w-16 text-right text-xs ${row.delta >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                            {formatDelta(row.delta)}
                          </span>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Phenotypes
            </h4>
            <table className="mt-2 w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <th className="py-2">Phenotype</th>
                  <th className="py-2">{primaryLabel}</th>
                  {hasBaseline && <th className="py-2">{baselineLabel}</th>}
                  {hasBaseline && <th className="py-2">Δ</th>}
                </tr>
              </thead>
              <tbody>
                {phenotypeRows.map((row) => (
                  <tr key={`pheno-${row.key}`} className="border-b border-slate-100 last:border-0">
                    <td className="py-2 text-slate-600">{row.key}</td>
                    <td className="py-2 text-slate-700">
                      {formatValue(row.yourValue, asPercentages)}
                    </td>
                    {hasBaseline && (
                      <td className="py-2 text-slate-600">
                        {formatValue(row.baselineValue, asPercentages)}
                      </td>
                    )}
                    {hasBaseline && (
                      <td className="py-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className={`h-2 rounded-full ${
                                row.delta >= 0 ? "bg-emerald-400" : "bg-rose-400"
                              }`}
                              style={{ width: `${Math.min(Math.abs(row.delta), 100)}%` }}
                            />
                          </div>
                          <span className={`w-16 text-right text-xs ${row.delta >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                            {formatDelta(row.delta)}
                          </span>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {!hasBaseline && (
            <p className="text-xs text-slate-500">
              Add a baseline trait to compare probabilities side by side.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default ComparePanel;

