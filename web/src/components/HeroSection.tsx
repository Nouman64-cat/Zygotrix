import React from "react";

import PolygenicOverview from "./PolygenicOverview";
import Navbar from "./Navbar";

type HeroSectionProps = {
  stats: { value: string; label: string }[];
  polygenic: {
    score: number | null;
    loading: boolean;
    error: string | null;
  };
};

const HeroSection: React.FC<HeroSectionProps> = ({ stats, polygenic }) => {
  return (
    <header className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#1E3A8A]/10 via-transparent to-[#10B981]/10" />
      <Navbar />

      <section className="relative z-10 mx-auto grid max-w-7xl gap-16 px-6 pb-24 pt-10 lg:grid-cols-2 lg:pb-32">
        <div>
          <span className="inline-block rounded-full bg-[#10B981]/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-[#10B981]">
            Precision genetics
          </span>
          <h1 className="mt-6 text-4xl font-bold leading-tight text-[#1E3A8A] sm:text-5xl lg:text-6xl">
            Model inheritance with scientific clarity and creative control.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-slate-600">
            Zygotrix Engine combines rigorously tested Mendelian calculators, additive polygenic scoring, and expressive trait definitions so your team can explore the next generation of genetic scenarios.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <a
              href="#live-api"
              className="inline-flex items-center justify-center rounded-full bg-[#1E3A8A] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#1E3A8A]/30 transition hover:bg-[#162b63]"
            >
              Try the live API
            </a>
            <a
              href="#features"
              className="inline-flex items-center justify-center rounded-full border border-[#1E3A8A]/20 px-6 py-3 text-sm font-semibold text-[#1E3A8A] transition hover:border-[#1E3A8A]/40"
            >
              View capabilities
            </a>
          </div>
          <dl className="mt-12 grid gap-8 text-[#1E3A8A] sm:grid-cols-3">
            {stats.map((stat) => (
              <div key={stat.label}>
                <dt className="text-sm uppercase tracking-[0.25em] text-[#4B5563]">{stat.label}</dt>
                <dd className="mt-2 text-3xl font-bold">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative">
          <div className="absolute -left-8 -top-10 h-72 w-72 rounded-full bg-gradient-to-br from-[#1E3A8A]/30 via-[#3B82F6]/20 to-[#10B981]/20 blur-3xl" />
          <div className="relative space-y-6">
            <div className="overflow-hidden rounded-3xl bg-white shadow-2xl shadow-slate-300/40 ring-1 ring-white/60">
              <div className="bg-gradient-to-r from-[#1E3A8A] via-[#3B82F6] to-[#10B981] px-8 py-6 text-white">
                <p className="text-xs uppercase tracking-[0.4em]">Mendelian preview</p>
                <p className="mt-2 text-2xl font-semibold">Eye color outcomes</p>
              </div>
              <div className="space-y-6 px-8 py-6">
                <div className="flex items-center justify-between text-sm text-slate-500">
                  <span>Parent A</span>
                  <span className="font-semibold text-slate-700">Bb</span>
                </div>
                <div className="flex items-center justify-between text-sm text-slate-500">
                  <span>Parent B</span>
                  <span className="font-semibold text-slate-700">bb</span>
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between text-sm font-medium text-slate-600">
                      <span>Brown phenotype</span>
                      <span>50%</span>
                    </div>
                    <div className="mt-2 h-3 w-full rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6]" style={{ width: "50%" }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-sm font-medium text-slate-600">
                      <span>Blue phenotype</span>
                      <span>50%</span>
                    </div>
                    <div className="mt-2 h-3 w-full rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-gradient-to-r from-[#3B82F6] to-[#10B981]" style={{ width: "50%" }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <PolygenicOverview
              score={polygenic.score}
              loading={polygenic.loading}
              error={polygenic.error}
            />
          </div>
        </div>
      </section>
    </header>
  );
};

export default HeroSection;