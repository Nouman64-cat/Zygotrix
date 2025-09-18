import React from "react";

import LiveSandbox from "../components/LiveSandbox";
import PolygenicOverview from "../components/PolygenicOverview";
import TraitManagementSection from "../components/TraitManagementSection";
import { usePolygenicScore } from "../hooks/usePolygenicScore";
import { useTraits } from "../hooks/useTraits";

const PlaygroundPage: React.FC = () => {
  const { traits, loading, error, reload } = useTraits();
  const { score, loading: scoreLoading, error: scoreError } = usePolygenicScore();

  return (
    <div className="bg-slate-50">
      <section className="relative overflow-hidden bg-slate-900 pb-24 pt-20 text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1E3A8A] via-slate-900 to-[#0f766e] opacity-80" />
        <div className="relative mx-auto max-w-6xl px-6">
          <div className="max-w-3xl">
            <span className="inline-block rounded-full bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white/80">
              Playground
            </span>
            <h1 className="mt-6 text-4xl font-bold sm:text-5xl">
              Experiment with inheritance models and persist custom traits.
            </h1>
            <p className="mt-6 text-base text-white/80">
              Combine Mendelian distributions and polygenic scoring, iterate with your own allele maps, and keep the registry in sync with your team.
            </p>
          </div>
          <div className="mt-10 max-w-xl">
            <PolygenicOverview score={score} loading={scoreLoading} error={scoreError} />
          </div>
        </div>
      </section>

      <div className="space-y-24 pb-24">
        <LiveSandbox traits={traits} loading={loading} error={error} reload={reload} />
        <TraitManagementSection traits={traits} loading={loading} error={error} reload={reload} />
      </div>
    </div>
  );
};

export default PlaygroundPage;
