import React from "react";

const iconMap = {
  dna: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
    >
      <path d="M8 4c3 3 4 6 8 7" />
      <path d="M16 20c-3-3-4-6-8-7" />
      <path d="M8 7h8" />
      <path d="M8 11h8" />
      <path d="M8 15h8" />
    </svg>
  ),
  network: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
    >
      <path d="M12 3v6" />
      <path d="M12 15v6" />
      <circle cx="12" cy="12" r="2.5" />
      <circle cx="6" cy="6" r="2.5" />
      <circle cx="18" cy="6" r="2.5" />
      <circle cx="6" cy="18" r="2.5" />
      <circle cx="18" cy="18" r="2.5" />
      <path d="M7.8 7.8l3.4 3.4M16.2 7.8l-3.4 3.4M7.8 16.2l3.4-3.4M16.2 16.2l-3.4-3.4" />
    </svg>
  ),
  chart: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
    >
      <path d="M4 20h16" />
      <rect x="5.5" y="11" width="3" height="6.5" rx="1" />
      <rect x="10.5" y="7" width="3" height="10.5" rx="1" />
      <rect x="15.5" y="13" width="3" height="4.5" rx="1" />
    </svg>
  ),
  shield: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
    >
      <path d="M12 3l8 4v5c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V7l8-4z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  ),
  spark: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
    >
      <path d="M12 3v4" />
      <path d="M12 17v4" />
      <path d="M4.22 5.22l2.83 2.83" />
      <path d="M16.95 17.95l2.83 2.83" />
      <path d="M3 12h4" />
      <path d="M17 12h4" />
      <path d="M4.22 18.78l2.83-2.83" />
      <path d="M16.95 6.05l2.83-2.83" />
      <path d="M9.5 9.5l5 5" />
      <path d="M14.5 9.5l-5 5" />
    </svg>
  ),
  layers: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
    >
      <path d="M12 3l9 5-9 5-9-5 9-5z" />
      <path d="M3 12l9 5 9-5" />
      <path d="M3 17l9 5 9-5" />
    </svg>
  ),
} as const;

type IconKey = keyof typeof iconMap;

type FeatureCard = {
  title: string;
  description: string;
  icon: IconKey;
  accent: string;
};

const featureCards: FeatureCard[] = [
  {
    title: "Composable trait registry",
    description:
      "Model diploid traits with canonical genotype enforcement, phenotype mapping, and metadata you control.",
    icon: "dna",
    accent: "from-[#1E3A8A] to-[#3B82F6]",
  },
  {
    title: "Hybrid simulations",
    description:
      "Blend Mendelian ratios and polygenic scores in a single simulator to explore complex inheritance scenarios.",
    icon: "network",
    accent: "from-[#3B82F6] to-[#10B981]",
  },
  {
    title: "Insightful distributions",
    description:
      "Convert genotype probabilities into phenotypes or percentages instantly, complete with sampling utilities.",
    icon: "chart",
    accent: "from-[#10B981] to-[#FBBF24]",
  },
  {
    title: "Type-safe toolkit",
    description:
      "Ships as a pure Python package with dataclass-powered traits, keeping your scientific code maintainable.",
    icon: "shield",
    accent: "from-[#4B5563] to-[#1E3A8A]",
  },
  {
    title: "Fast experimentation",
    description:
      "Swap registries, plug in weights, and iterate on hypotheses without rewriting probability logic.",
    icon: "spark",
    accent: "from-[#3B82F6] to-[#FBBF24]",
  },
  {
    title: "Layered integrations",
    description:
      "Embed results into dashboards, notebooks, or APIs thanks to modular calculators and helper utilities.",
    icon: "layers",
    accent: "from-[#1E3A8A] to-[#10B981]",
  },
];

const stats = [
  { value: "3", label: "Bundled traits" },
  { value: "0", label: "External deps" },
  { value: "100%", label: "Probability safe" },
];

const workflow = [
  {
    title: "Define traits",
    description:
      "Leverage ready-made blueprints for eye color, blood type, and hair color or register your own domain traits.",
  },
  {
    title: "Simulate inheritance",
    description:
      "Feed parental genotypes to compute offspring distributions, with automatic phenotype aggregation and percentages.",
  },
  {
    title: "Interpret insights",
    description:
      "Layer in polygenic weights, sample outcomes, or export distributions to power downstream analytics.",
  },
];

const App: React.FC = () => {
  return (
    <div className="min-h-screen">
      <header className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0" />
        <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-8">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl via-[#3B82F6] to-[#10B981] shadow-lg shadow-[#1E3A8A]/20">
              <img
                src="/zygotrix-logo.png"
                alt="Zygotrix logo"
                className="h-9 w-9 object-contain"
              />
            </div>
            <div>
              <p className="text-xl font-semibold uppercase tracking-[0.4em] text-[#1E3A8A]">
                Zygotrix
              </p>
              <p className="text-sm text-slate-500">
                Genetics intelligence engine
              </p>
            </div>
          </div>
          <a
            href="#cta"
            className="hidden rounded-full border border-[#1E3A8A]/20 bg-white px-5 py-2 text-sm font-semibold text-[#1E3A8A] shadow-sm shadow-[#1E3A8A]/10 transition hover:border-[#1E3A8A]/40 hover:shadow-[#1E3A8A]/30 sm:inline-flex"
          >
            Request demo
          </a>
        </nav>

        <section className="relative z-10 mx-auto grid max-w-7xl gap-16 px-6 pb-24 pt-10 lg:grid-cols-2 lg:pb-32">
          <div>
            <span className="inline-block rounded-full bg-[#10B981]/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-[#10B981]">
              Precision genetics
            </span>
            <h1 className="mt-6 text-4xl font-bold leading-tight text-[#1E3A8A] sm:text-5xl lg:text-6xl">
              Model inheritance with scientific clarity and creative control.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-slate-600">
              Zygotrix Engine combines rigorously tested Mendelian calculators,
              additive polygenic scoring, and expressive trait definitions so
              your team can explore the next generation of genetic scenarios.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="#cta"
                className="inline-flex items-center justify-center rounded-full bg-[#1E3A8A] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#1E3A8A]/30 transition hover:bg-[#162b63]"
              >
                Get started
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
                  <dt className="text-sm uppercase tracking-[0.25em] text-[#4B5563]">
                    {stat.label}
                  </dt>
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
                  <p className="text-xs uppercase tracking-[0.4em]">
                    Mendelian preview
                  </p>
                  <p className="mt-2 text-2xl font-semibold">
                    Eye color outcomes
                  </p>
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
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6]"
                          style={{ width: "50%" }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-sm font-medium text-slate-600">
                        <span>Blue phenotype</span>
                        <span>50%</span>
                      </div>
                      <div className="mt-2 h-3 w-full rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#3B82F6] to-[#10B981]"
                          style={{ width: "50%" }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl bg-[#1E3A8A] p-6 text-white shadow-xl shadow-[#1E3A8A]/40">
                <p className="text-xs uppercase tracking-[0.35em] text-[#A5B4FC]">
                  Polygenic signal
                </p>
                <p className="mt-2 text-2xl font-semibold">
                  Expected score 0.9
                </p>
                <p className="mt-4 text-sm text-slate-200">
                  Weighted SNP dosages averaged from both parents, ready for
                  downstream risk interpretation.
                </p>
                <div className="mt-6 flex items-center gap-4">
                  <div className="h-3 w-3 rounded-full bg-[#FBBF24]" />
                  <div className="flex h-3 flex-1 items-center overflow-hidden rounded-full bg-white/20">
                    <div className="h-full w-3/5 bg-[#FBBF24]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </header>

      <main>
        <section id="features" className="bg-white py-24">
          <div className="mx-auto max-w-7xl px-6">
            <div className="max-w-2xl">
              <span className="inline-block rounded-full bg-[#3B82F6]/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-[#3B82F6]">
                Engine capabilities
              </span>
              <h2 className="mt-6 text-3xl font-semibold text-[#1E3A8A] sm:text-4xl">
                Everything you need to explore inheritance scenarios end-to-end.
              </h2>
              <p className="mt-4 text-base text-slate-600">
                Each module is lightweight, documented, and decoupled so you can
                drop Zygotrix Engine into notebooks, APIs, or decision-support
                tools.
              </p>
            </div>
            <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {featureCards.map((feature) => (
                <article
                  key={feature.title}
                  className="group flex h-full flex-col gap-4 rounded-3xl border border-slate-100 bg-white p-8 shadow-sm shadow-slate-200/40 transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.accent} text-white shadow-inner shadow-black/20`}
                  >
                    {iconMap[feature.icon]}
                  </div>
                  <h3 className="text-xl font-semibold text-[#1E3A8A]">
                    {feature.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-slate-600">
                    {feature.description}
                  </p>
                  <div className="mt-auto flex items-center gap-2 text-sm font-semibold text-[#3B82F6] opacity-0 transition group-hover:opacity-100">
                    <span>Learn more</span>
                    <span aria-hidden>{"->"}</span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden py-24">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-[#10B981]/15 via-transparent" />
          <div className="relative mx-auto grid max-w-7xl gap-16 px-6 lg:grid-cols-[3fr,2fr]">
            <div className="space-y-10 rounded-3xl bg-white/80 p-10 shadow-xl shadow-slate-200/60 ring-1 ring-white/60 backdrop-blur">
              <span className="inline-block rounded-full bg-[#10B981]/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-[#10B981]">
                How it works
              </span>
              <h2 className="text-3xl font-semibold text-[#1E3A8A]">
                A simulator that adapts to your research cadence.
              </h2>
              <ul className="space-y-6">
                {workflow.map((step, index) => (
                  <li key={step.title} className="flex gap-5">
                    <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-[#1E3A8A]/10 text-sm font-semibold text-[#1E3A8A]">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-base font-semibold text-[#1E3A8A]">
                        {step.title}
                      </p>
                      <p className="mt-2 text-sm text-slate-600">
                        {step.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative rounded-3xl bg-slate-900 p-8 text-slate-100 shadow-2xl shadow-slate-900/50">
              <div className="absolute -top-12 -right-10 h-40 w-40 rounded-full bg-gradient-to-br from-[#FBBF24]/40 via-[#3B82F6]/40 to-[#10B981]/40 blur-2xl" />
              <p className="text-xs uppercase tracking-[0.3em] text-[#A5B4FC]">
                In action
              </p>
              <pre className="mt-4 overflow-x-auto rounded-2xl bg-slate-950/60 p-6 text-sm leading-relaxed">
                {`from zygotrix_engine import Simulator

sim = Simulator()
parent1 = {"eye_color": "Bb", "blood_type": "AO"}
parent2 = {"eye_color": "bb", "blood_type": "BO"}

results = sim.simulate_mendelian_traits(parent1, parent2, as_percentages=True)
# {'eye_color': {'Brown': 50.0, 'Blue': 50.0}}
`}
              </pre>
              <p className="mt-4 text-sm text-slate-300">
                Extend the registry with custom traits, polygenic weights, or
                sampling logic while the engine keeps probabilities normalized.
              </p>
            </div>
          </div>
        </section>

        <section id="cta" className="relative overflow-hidden py-24">
          <div className="absolute inset-0 bg-gradient-to-br from-[#1E3A8A] via-[#3B82F6] to-[#10B981]" />
          <div className="relative mx-auto flex max-w-4xl flex-col items-center gap-6 px-6 text-center text-white">
            <span className="rounded-full bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white/80">
              Join the next cohort
            </span>
            <h2 className="text-3xl font-semibold sm:text-4xl">
              Ready to power your genetics platform with Zygotrix Engine?
            </h2>
            <p className="max-w-2xl text-sm text-white/80">
              Request early access and we will share integration guides,
              component demos, and tailored support for your use case.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="mailto:hello@zygotrix.io"
                className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#1E3A8A] shadow-lg shadow-black/20 transition hover:shadow-black/30"
              >
                Talk to us
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-full border border-white/60 px-6 py-3 text-sm font-semibold text-white transition hover:border-white"
              >
                View docs
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-white py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 text-center text-sm text-slate-500 sm:flex-row sm:text-left">
          <p>
            &copy; {new Date().getFullYear()} Zygotrix. Engineered with care for
            genetic discovery.
          </p>
          <div className="flex gap-6">
            <a href="#features" className="transition hover:text-[#1E3A8A]">
              Features
            </a>
            <a href="#cta" className="transition hover:text-[#1E3A8A]">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
