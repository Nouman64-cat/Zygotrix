import React from "react";

type WorkflowSectionProps = {
  steps: { title: string; description: string }[];
};

const WorkflowSection: React.FC<WorkflowSectionProps> = ({ steps }) => {
  return (
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
            {steps.map((step, index) => (
              <li key={step.title} className="flex gap-5">
                <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-[#1E3A8A]/10 text-sm font-semibold text-[#1E3A8A]">
                  {index + 1}
                </div>
                <div>
                  <p className="text-base font-semibold text-[#1E3A8A]">{step.title}</p>
                  <p className="mt-2 text-sm text-slate-600">{step.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="relative rounded-3xl bg-slate-900 p-8 text-slate-100 shadow-2xl shadow-slate-900/50">
          <div className="absolute -top-12 -right-10 h-40 w-40 rounded-full bg-gradient-to-br from-[#FBBF24]/40 via-[#3B82F6]/40 to-[#10B981]/40 blur-2xl" />
          <p className="text-xs uppercase tracking-[0.3em] text-[#A5B4FC]">In action</p>
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
            Extend the registry with custom traits, polygenic weights, or sampling logic while the engine keeps probabilities normalized.
          </p>
        </div>
      </div>
    </section>
  );
};

export default WorkflowSection;