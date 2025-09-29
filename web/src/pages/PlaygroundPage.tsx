import React, { useMemo } from "react";

import JointPhenotypeTest from "../components/marketing_site/joint_analysis/JointPhenotypeTest";
import PolygenicOverview from "../components/dashboard/PolygenicOverview";
import { usePolygenicScore } from "../hooks/usePolygenicScore";
import { useTraits } from "../hooks/useTraits";
import LiveSandbox from "../components/marketing_site/playground/LiveSandbox";

const DEFAULT_BUNDLED_TRAITS = 3;

const PlaygroundPage: React.FC = () => {
  const { traits, loading, error, reload, applyFilters } = useTraits();
  const {
    score,
    loading: scoreLoading,
    error: scoreError,
    refresh: refreshScore,
  } = usePolygenicScore();

  const metrics = useMemo(() => {
    const totalTraits = traits.length;
    const customTraits = Math.max(totalTraits - DEFAULT_BUNDLED_TRAITS, 0);

    return [
      {
        label: "Available traits",
        value: loading ? "..." : totalTraits.toString(),
        description: loading
          ? "Loading registry from the API"
          : customTraits > 0
          ? `${customTraits} custom trait${
              customTraits === 1 ? "" : "s"
            } synced`
          : "Bundled defaults ready to run",
      },
      {
        label: "Polygenic signal",
        value: scoreLoading ? "..." : score !== null ? score.toFixed(2) : "N/A",
        description: scoreError
          ? "Awaiting backend response"
          : "Live from /api/polygenic/score",
      },
    ];
  }, [loading, score, scoreError, scoreLoading, traits]);

  const handleRefreshAll = () => {
    reload();
    refreshScore();
  };

  return (
    <main className="bg-slate-50">
      <header
        className="border-b border-slate-200 bg-white"
        aria-labelledby="playground-heading"
      >
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#1E3A8A]">
              Playground
            </p>
            <h1
              id="playground-heading"
              className="text-2xl font-bold text-[#1E3A8A] sm:text-3xl"
            >
              Experiment quickly with live inheritance simulations
            </h1>
            <p className="text-sm text-slate-600">
              Jump straight into the sandbox to preview outcomes, or fine-tune
              the trait registry without leaving the page.
            </p>
            <div
              className="flex flex-wrap items-center gap-2"
              role="navigation"
              aria-label="Playground shortcuts"
            >
              <a
                href="#live-api"
                className="inline-flex items-center justify-center rounded-full bg-[#1E3A8A] px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#162b63]"
              >
                Go to live sandbox
              </a>
              <a
                href="#manage"
                className="inline-flex items-center justify-center rounded-full border border-[#1E3A8A]/40 px-5 py-2 text-sm font-semibold text-[#1E3A8A] transition hover:border-[#1E3A8A]/60"
              >
                Manage traits
              </a>
              <button
                type="button"
                onClick={handleRefreshAll}
                className="inline-flex items-center justify-center rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-600 transition hover:border-[#10B981] hover:text-[#10B981]"
              >
                Refresh data
              </button>
            </div>
          </div>

          <div className="flex-1">
            <dl
              className="grid gap-3 sm:grid-cols-2"
              aria-label="Playground metrics"
            >
              {metrics.map((metric) => (
                <div
                  key={metric.label}
                  className="flex h-full flex-col rounded-2xl border border-slate-200 bg-slate-100/60 p-4 shadow-sm"
                >
                  <dt className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                    {metric.label}
                  </dt>
                  <dd className="mt-1 text-xl font-semibold text-[#1E3A8A]">
                    {metric.value}
                  </dd>
                  <p className="mt-1 text-xs text-slate-600">
                    {metric.description}
                  </p>
                </div>
              ))}
            </dl>
            <div className="flex h-full rounded-3xl bg-white p-0 mt-2">
              <PolygenicOverview
                score={score}
                loading={scoreLoading}
                error={scoreError}
              />
            </div>
          </div>
        </div>
      </header>

      <section
        className="mx-auto max-w-6xl px-6 py-8"
        aria-labelledby="playground-sandbox-heading"
      >
        <h2 id="playground-sandbox-heading" className="sr-only">
          Live sandbox
        </h2>
        <LiveSandbox
          traits={traits}
          loading={loading}
          error={error}
          reload={reload}
          applyFilters={applyFilters}
        />
      </section>

      <section
        className="mx-auto max-w-6xl px-6 py-8"
        aria-labelledby="playground-joint-phenotype-heading"
      >
        <h2 id="playground-joint-phenotype-heading" className="sr-only">
          Joint phenotype analysis
        </h2>
        <JointPhenotypeTest />
      </section>

      <section
        className="mx-auto max-w-6xl px-6 pb-12"
        aria-labelledby="playground-management-heading"
      >
        <h2 id="playground-management-heading" className="sr-only">
          Trait management
        </h2>
      </section>
    </main>
  );
};

export default PlaygroundPage;
