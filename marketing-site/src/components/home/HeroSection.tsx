import React from "react";
import Link from "next/link";
import DNAStrand from "./DNAStrand";
import { FaBrain, FaDna } from 'react-icons/fa';
import { STUDIO_URL } from "../../config";

const HeroSection: React.FC = () => {
    return (
        <section className="relative bg-white dark:bg-gray-950">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center py-12 lg:py-20">
                    {/* Left Column - Text Content */}
                    <div className="space-y-6 max-w-xl">
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight">
                            <span className="text-gray-900 dark:text-white">Genetics Ecosystem </span>
                            <span className="text-emerald-500 dark:text-emerald-400">for Everyone</span>
                        </h1>

                        <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                            Seamlessly merge <strong>AI-driven research</strong> with <strong>advanced biological simulation</strong>.
                            From literature review to phenotype prediction, Zygotrix powers your entire workflow.
                        </p>

                        <div className="flex flex-wrap items-center gap-4 pt-2">
                            <Link
                                href="https://ai.zygotrix.com/register"
                                className="px-6 py-3 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-500 hover:shadow-lg hover:shadow-emerald-500/30 transition-all duration-300 flex items-center gap-2"
                            >
                                <FaBrain className="w-5 h-5" /> Launch Zygotrix AI
                            </Link>
                            <a
                                href={`${STUDIO_URL}/signup`}
                                className="px-6 py-3 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors flex items-center gap-2"
                            >
                                <FaDna className="w-5 h-5" /> Launch Studio
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
