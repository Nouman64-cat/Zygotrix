
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
        <section id="features" className="bg-slate-50 dark:bg-slate-950 py-24 border-t border-slate-200 dark:border-slate-800">
            <div className="mx-auto max-w-7xl px-6">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
                    <div className="max-w-2xl">
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl font-mono tracking-tight">
                            &lt;SystemModules /&gt;
                        </h2>
                        <p className="mt-4 text-base text-slate-600 dark:text-slate-400 max-w-xl">
                            Deploy high-performance genetic simulation engines directly into your workflow.
                            Built for scale, precision, and reproducibility.
                        </p>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {cards.map((feature) => (
                        <div
                            key={feature.title}
                            className="group relative flex flex-col gap-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-6 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 transition-all duration-300"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl pointer-events-none" />

                            <div className="flex items-center justify-between">
                                <div
                                    className={`flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors`}
                                >
                                    <Icon name={feature.icon} />
                                </div>
                                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                                    MOD_{feature.title.substring(0, 3).toUpperCase()}
                                </span>
                            </div>

                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                                    {feature.title}
                                </h3>
                                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                                    {feature.description}
                                </p>
                            </div>

                            <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                <span className="text-xs text-slate-400 font-mono">STATUS: ONLINE</span>
                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default StudioFeatures;
