import React from "react";

const timeline = [
  {
    title: "Genetics-first foundations",
    period: "2019 – 2021",
    description:
      "Zygotrix began as a research initiative focused on making Mendelian models approachable for data teams and clinicians alike.",
  },
  {
    title: "Polygenic expansion",
    period: "2022 – 2023",
    description:
      "We layered in additive scoring, confidence analytics, and validation pipelines so polygenic risk could sit alongside classical inheritance.",
  },
  {
    title: "Platform era",
    period: "2024 – present",
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
      "Interfaces are built for cross-functional teams—engineers, geneticists, and operators work from a shared language.",
  },
  {
    name: "Extensible tooling",
    description:
      "Traits, weights, and downstream pipelines are modular so teams can adapt Zygotrix to bespoke research programs.",
  },
];

const AboutPage: React.FC = () => {
  return (
    <div className="bg-slate-50">
      <section className="mx-auto max-w-5xl px-6 pb-20 pt-24">
        <div className="max-w-3xl">
          <span className="inline-block rounded-full bg-[#1E3A8A]/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-[#1E3A8A]">
            Our story
          </span>
          <h1 className="mt-6 text-4xl font-bold text-[#1E3A8A] sm:text-5xl">
            Zygotrix is crafted for teams who translate genetics into action.
          </h1>
          <p className="mt-6 text-base text-slate-600">
            We believe that understanding inheritance patterns should feel intuitive, whether you are prototyping in a notebook or running
            production simulations. Zygotrix distills complex models into approachable building blocks so you can focus on insight generation.
          </p>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-[2fr,3fr]">
          <div className="rounded-3xl border border-white bg-white p-8 shadow-xl">
            <h2 className="text-xl font-semibold text-[#1E3A8A]">What guides us</h2>
            <ul className="mt-6 space-y-6">
              {values.map((value) => (
                <li key={value.name}>
                  <p className="text-base font-semibold text-[#1E3A8A]">{value.name}</p>
                  <p className="mt-2 text-sm text-slate-600">{value.description}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl border border-white bg-white p-8 shadow-xl">
            <h2 className="text-xl font-semibold text-[#1E3A8A]">Milestones</h2>
            <ol className="mt-6 space-y-6">
              {timeline.map((entry) => (
                <li key={entry.title} className="relative pl-6">
                  <span className="absolute left-0 top-2 h-2 w-2 rounded-full bg-[#10B981]" />
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#3B82F6]">{entry.period}</p>
                  <p className="mt-2 text-base font-semibold text-[#1E3A8A]">{entry.title}</p>
                  <p className="mt-2 text-sm text-slate-600">{entry.description}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
