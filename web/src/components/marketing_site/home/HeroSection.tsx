import React from "react";
import { Link } from "react-router-dom";
import DNAStrand from "./DNAStrand";
import GeneticCode from "./GeneticCode";
import DNAHelix from "./DNAHelix";

const HeroSection: React.FC = () => {
  return (
    <header className="relative overflow-hidden min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-emerald-50/20 dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-950">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1E3A8A]/5 via-transparent to-[#10B981]/5 dark:from-[#1E3A8A]/10 dark:via-transparent dark:to-[#10B981]/10" />

        {/* Large DNA Helix Background */}
        <div className="absolute -right-32 -top-20 w-96 h-96 opacity-10 dark:opacity-5 animate-spin-slow">
          <DNAHelix />
        </div>

        {/* Molecular Grid Pattern */}
        <div
          className="absolute inset-0 opacity-[0.02] dark:opacity-[0.04]"
          style={{
            backgroundImage: `radial-gradient(circle at 20px 20px, #1E3A8A 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <section className="relative z-10 mx-auto grid max-w-7xl gap-12 px-6 pb-16 pt-20 lg:grid-cols-2 lg:pb-20 lg:pt-32">
        <div className="relative">
          {/* Genetic Code Animation */}
          <GeneticCode />

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <span className="inline-block rounded-full bg-gradient-to-r from-[#10B981]/20 to-[#1E3A8A]/20 dark:from-[#10B981]/30 dark:to-[#1E3A8A]/30 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#1E3A8A] dark:text-[#3B82F6]">
                <span className="inline-block w-2 h-2 bg-[#10B981] rounded-full mr-2 animate-pulse"></span>{" "}
                Precision Genetics
              </span>
            </div>

            <h1 className="text-4xl font-bold leading-tight text-[#1E3A8A] dark:text-white sm:text-5xl lg:text-6xl xl:text-7xl">
              <span className="inline-block bg-gradient-to-r from-[#1E3A8A] via-[#3B82F6] to-[#10B981] bg-clip-text text-transparent">
                Engineer
              </span>{" "}
              <br />
              the Future of{" "}
              <span className="relative">
                <span className="inline-block bg-gradient-to-r from-[#10B981] via-[#059669] to-[#047857] bg-clip-text text-transparent">
                  Genetics
                </span>
                <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-[#10B981] to-[#1E3A8A] rounded-full" />
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
              Harness the power of{" "}
              <span className="font-semibold text-[#1E3A8A] dark:text-[#3B82F6]">
                Zygotrix Engine
              </span>{" "}
              to model complex genetic inheritance patterns with unprecedented
              precision. Combine Mendelian genetics, polygenic scoring, and
              advanced trait modeling to unlock new possibilities in genetic
              research and simulation.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/playground"
                className="group relative inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6] dark:from-[#3B82F6] dark:to-[#10B981] px-8 py-4 text-base font-semibold text-white shadow-xl shadow-[#1E3A8A]/30 dark:shadow-[#3B82F6]/30 transition-all duration-300 hover:shadow-2xl hover:shadow-[#1E3A8A]/40 dark:hover:shadow-[#3B82F6]/40 hover:scale-105"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Explore Genetic Playground
                  <svg
                    className="w-4 h-4 transition-transform group-hover:translate-x-1"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#3B82F6] to-[#10B981] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              </Link>
            </div>
          </div>
        </div>

        <div className="relative">
          {/* Interactive DNA Helix with ATCG Base Pairs */}
          <div className="relative w-full h-full flex items-center justify-center">
            <DNAStrand />
          </div>
        </div>
      </section>
    </header>
  );
};

export default HeroSection;
