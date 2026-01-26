import React from "react";
import { Link } from "react-router-dom";
import DNAStrand from "./DNAStrand";

const HeroSection: React.FC = () => {
  return (
    <section className="relative bg-white dark:bg-gray-950">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center py-12 lg:py-20">
          {/* Left Column - Text Content */}
          <div className="space-y-6 max-w-xl">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight">
              <span className="text-gray-900 dark:text-white">the only solution you need to run </span>
              <span className="text-emerald-500 dark:text-emerald-400">a world-class genetics platform</span>
            </h1>

            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
              Model complex genetic inheritance patterns, close deals, and watch your research
              grow with Zygotrix's end-to-end genetics solution, powered by AI.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                to="/studio"
                className="px-6 py-3 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
              >
                Get started
              </Link>
              <a
                href="https://calendly.com/working-nouman-ejaz/zygotrix-demo"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
              >
                Get a demo
              </a>
            </div>
          </div>

          {/* Right Column - DNA Strand - Hidden on mobile to prevent overlap */}
          <div className="hidden lg:block relative w-full h-[400px] lg:h-[500px] lg:ml-auto">
            <DNAStrand />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
