
import React from "react";
import type { IconKey } from "../universal/Icon";
import { Icon } from "../universal/Icon";

type FeatureCard = {
    title: string;
    description: string;
    icon: IconKey;
    accent: string;
};

type StudioFeaturesProps = {
    cards: FeatureCard[];
};

const StudioFeatures: React.FC<StudioFeaturesProps> = ({ cards }) => {
    return (
        <section id="features" className="bg-slate-50 dark:bg-slate-950 py-24 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none">
                <div className="absolute top-40 right-10 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
                <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-500/5 rounded-full blur-3xl"></div>
            </div>

            <div className="container mx-auto px-4 lg:px-6 relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm font-medium mb-6">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Powerful Capabilities
                    </div>
                    <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6 tracking-tight">
                        Everything you need to <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500">engineer biology.</span>
                    </h2>
                    <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
                        A comprehensive suite of tools designed for modern synthetic biology. From sequence editing to population scale analysis.
                    </p>
                </div>

                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {cards.map((feature, idx) => (
                        <div
                            key={feature.title}
                            className="group relative flex flex-col p-8 rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/30 dark:hover:border-emerald-500/40 shadow-sm hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300"
                        >
                            <div className="mb-6 inline-flex p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors duration-300 w-fit">
                                <Icon name={feature.icon} className="w-6 h-6" />
                            </div>

                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-emerald-500 transition-colors">
                                {feature.title}
                            </h3>

                            <p className="text-base leading-relaxed text-slate-600 dark:text-slate-400">
                                {feature.description}
                            </p>

                            {/* Hover effect bottom decoration */}
                            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 rounded-b-2xl origin-left"></div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default StudioFeatures;
