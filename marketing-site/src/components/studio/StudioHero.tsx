import React from "react";
import DNAStrand from "../home/DNAStrand";

const StudioHero: React.FC = () => {
    const customLink = process.env.NEXT_PUBLIC_STUDIO_URL || "https://studio.zygotrix.com";

    return (
        <section className="relative bg-slate-50 dark:bg-slate-950 overflow-hidden min-h-[90vh] flex items-center">
            {/* Technical Grid Background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

            <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
                <div className="flex flex-col items-center text-center max-w-4xl mx-auto mb-12">
                    <div className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-600 dark:text-emerald-400 mb-6 backdrop-blur-sm">
                        <span className="flex h-2 w-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
                        Zygotrix Studio v2.0
                    </div>

                    <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-slate-900 dark:text-white mb-8">
                        The Operating System for <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-400">Biological Computation</span>
                    </h1>

                    <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl mb-10">
                        Design, simulate, and analyze complex genetic systems in a unified workspace. From CRISPR editing to population dynamics.
                    </p>

                    <div className="flex flex-wrap justify-center items-center gap-4">
                        <a
                            href={`${customLink}/signup`}
                            className="px-8 py-4 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-base font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300"
                        >
                            Launch Studio
                        </a>
                        <a
                            href="https://calendly.com/working-nouman-ejaz/zygotrix-demo"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-8 py-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 text-base font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all backdrop-blur-sm"
                        >
                            View Documentation
                        </a>
                    </div>
                </div>

                {/* Technical Visualization Container */}
                <div className="relative mt-8 mx-auto max-w-5xl">
                    <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-3xl blur opacity-20 dark:opacity-40 animate-pulse"></div>
                    <div className="relative rounded-3xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl overflow-hidden shadow-2xl">
                        {/* Fake Browser Toolbar */}
                        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80">
                            <div className="w-3 h-3 rounded-full bg-red-400"></div>
                            <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                            <div className="w-3 h-3 rounded-full bg-green-400"></div>
                            <div className="ml-4 flex-1">
                                <div className="h-6 w-1/3 min-w-[150px] rounded-md bg-slate-200 dark:bg-slate-700/50"></div>
                            </div>
                        </div>

                        {/* Simulation Viewport */}
                        <div className="relative w-full h-[400px] lg:h-[500px] flex items-center justify-center bg-slate-50 dark:bg-black">
                            {/* Overlay Grid lines inside viewport */}
                            <div className="absolute inset-0 bg-[linear-gradient(45deg,#80808012_1px,transparent_1px)] bg-[size:40px_40px]"></div>
                            <DNAStrand />

                            {/* Floating UI Badges */}
                            <div className="absolute top-4 left-4 flex flex-col gap-2">
                                <div className="px-3 py-1.5 rounded-md bg-black/80 text-emerald-400 text-xs font-mono font-bold border border-emerald-500/30 backdrop-blur-md">
                                    SIMULATION: ACTIVE
                                </div>
                                <div className="px-3 py-1.5 rounded-md bg-black/80 text-white text-xs font-mono border border-white/10 backdrop-blur-md">
                                    T: 24.5°C
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default StudioHero;
