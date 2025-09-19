import React from "react";

import logo from "../../public/zygotrix-logo.png";

const timeline = [
  {
    title: "Genetics-first foundations",
    period: "2019-2021",
    description:
      "Zygotrix began as a research initiative focused on making Mendelian models approachable for data teams and clinicians alike.",
  },
  {
    title: "Polygenic expansion",
    period: "2022-2023",
    description:
      "We layered in additive scoring, confidence analytics, and validation pipelines so polygenic risk could sit alongside classical inheritance.",
  },
  {
    title: "Platform era",
    period: "2024-present",
    description:
      "Today Zygotrix powers web experiences, lab notebooks, and embedded diagnostics through a consistent simulation engine and API.",
  },
];

const values = [
  {
    name: "Scientific rigor",
    description:
      "Probability engines are validated against published ratios and unit tests, keeping outputs predictable and reproducible.",
  },
  {
    name: "Design empathy",
    description:
      "Interfaces are built for cross-functional teams so engineers, geneticists, and operators work from a shared language.",
  },
  {
    name: "Extensible tooling",
    description:
      "Traits, weights, and downstream pipelines are modular so teams can adapt Zygotrix to bespoke research programs.",
  },
];

const AboutPage: React.FC = () => {
  return (
    <div className="bg-gradient-to-b from-white via-slate-50 to-slate-100">
      <section className="mx-auto max-w-5xl px-6 pb-20 pt-24">
        <div className="grid gap-10 lg:grid-cols-[1.4fr,1fr] lg:items-center">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-3 rounded-full bg-[#1E3A8A]/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-[#1E3A8A]">
              <span className="h-2 w-2 rounded-full bg-[#10B981]" />
              Our story
            </span>
            <h1 className="text-4xl font-bold text-[#1E3A8A] sm:text-5xl">
              Zygotrix is crafted for teams who translate genetics into action.
            </h1>
            <p className="text-base text-slate-600">
              We believe that understanding inheritance patterns should feel
              intuitive, whether you are prototyping in a notebook or running
              production simulations. Zygotrix distills complex models into
              approachable building blocks so you can focus on insight
              generation.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="mailto:hello@zygotrix.io"
                className="inline-flex items-center justify-center rounded-full bg-[#1E3A8A] px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-[#1E3A8A]/30 transition hover:bg-[#162b63]"
              >
                Contact us
              </a>
              <a
                href="#milestones"
                className="inline-flex items-center justify-center rounded-full border border-[#1E3A8A]/40 px-5 py-2 text-sm font-semibold text-[#1E3A8A] transition hover:border-[#1E3A8A]/60"
              >
                View milestones
              </a>
            </div>
          </div>

          <div className="relative flex justify-center lg:justify-end">
            <div className="relative w-full max-w-xs">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-[#1E3A8A]/10 via-[#3B82F6]/10 to-[#10B981]/10 blur-xl" />
              <div className="relative overflow-hidden rounded-3xl border border-white bg-white/90 p-8 shadow-2xl shadow-[#1E3A8A]/20">
                <img src={logo} alt="Zygotrix" className="mx-auto w-32" />
                <p className="mt-6 text-center text-sm text-slate-600">
                  Merging Mendelian logic, polygenic scoring, and thoughtful
                  interaction design into a single learning platform.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-[1.4fr,1fr]">
          <div className="rounded-3xl border border-white/70 bg-white/95 p-8 shadow-xl shadow-slate-200/60">
            <h2 className="text-xl font-semibold text-[#1E3A8A]">
              What guides us
            </h2>
            <ul className="mt-6 space-y-6">
              {values.map((value) => (
                <li
                  key={value.name}
                  className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4"
                >
                  <p className="text-base font-semibold text-[#1E3A8A]">
                    {value.name}
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    {value.description}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
