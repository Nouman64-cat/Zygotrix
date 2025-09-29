import React from "react";

const CTASection: React.FC = () => {
  return (
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
          Request early access and we will share integration guides, component demos, and tailored support for your use case.
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
  );
};

export default CTASection;