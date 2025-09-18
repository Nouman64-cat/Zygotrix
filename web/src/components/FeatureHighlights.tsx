import React from "react";

import { Icon, IconKey } from "./Icon";

type FeatureCard = {
  title: string;
  description: string;
  icon: IconKey;
  accent: string;
};

type FeatureHighlightsProps = {
  cards: FeatureCard[];
};

const FeatureHighlights: React.FC<FeatureHighlightsProps> = ({ cards }) => {
  return (
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
            Each module is lightweight, documented, and decoupled so you can drop Zygotrix Engine into notebooks, APIs, or decision-support tools.
          </p>
        </div>
        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((feature) => (
            <article
              key={feature.title}
              className="group flex h-full flex-col gap-4 rounded-3xl border border-slate-100 bg-white p-8 shadow-sm shadow-slate-200/40 transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.accent} text-white shadow-inner shadow-black/20`}
              >
                <Icon name={feature.icon} />
              </div>
              <h3 className="text-xl font-semibold text-[#1E3A8A]">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-slate-600">{feature.description}</p>
              <div className="mt-auto flex items-center gap-2 text-sm font-semibold text-[#3B82F6] opacity-0 transition group-hover:opacity-100">
                <span>Learn more</span>
                <span aria-hidden>{"->"}</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureHighlights;