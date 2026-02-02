"use client";

import React from "react";
import Link from "next/link";
import { HiOutlineSparkles, HiLightningBolt, HiChatAlt2, HiSearch, HiCheck } from "react-icons/hi";
import { RiRobot2Line, RiFlaskLine, RiFileTextLine } from "react-icons/ri";
import { BiAnalyse } from "react-icons/bi"; // Added BiAnalyse import

const ZygoAISectionClient: React.FC = () => {
    return (
        <section className="relative bg-slate-50 dark:bg-slate-950 py-24 sm:py-32 overflow-hidden border-t border-slate-200 dark:border-slate-800">
            {/* Background Decor */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/10 rounded-full blur-[120px]" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />
            </div>

            <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
                {/* Header Section */}
                <div className="mx-auto max-w-4xl text-center mb-16">
                    <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400 ring-1 ring-inset ring-emerald-500/20 mb-6">
                        <HiOutlineSparkles className="w-4 h-4" />
                        <span>Powered by Advanced AI</span>
                    </div>

                    <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-slate-900 dark:text-white mb-6">
                        Your Personal <br />
                        <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                            Genetics Lab Assistant
                        </span>
                    </h2>

                    <p className="text-lg sm:text-xl leading-8 text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                        Experience the power of Zygotrix AI right from your screen.
                        Analyze data, generate hypotheses, and visualize inheritance patterns in real-time.
                    </p>
                </div>

                {/* MacBook Mockup - Login Page Style */}
                <div className="relative mx-auto w-full max-w-[900px] transform transition-all hover:scale-[1.01] duration-500 perspective-1000">
                    {/* Glow effect */}
                    <div className="absolute -inset-4 bg-emerald-500/20 blur-3xl rounded-[3rem] -z-10 opacity-40" />

                    {/* Laptop Mockup Container */}
                    <div className="relative">
                        {/* Screen Frame */}
                        <div className="relative mx-auto bg-slate-800 rounded-t-xl sm:rounded-t-3xl border-[4px] sm:border-[8px] border-slate-700 shadow-2xl flex flex-col overflow-hidden ring-1 ring-white/10 z-20 w-[90%] sm:w-full aspect-[16/10] sm:h-auto">
                            {/* Camera Notch Area */}
                            <div className="absolute top-0 inset-x-0 h-3 sm:h-6 bg-slate-800 z-20 flex justify-center">
                                <div className="w-16 sm:w-32 h-full bg-slate-900/50 rounded-b-md sm:rounded-b-lg flex items-center justify-center gap-1 sm:gap-2">
                                    <div className="w-0.5 h-0.5 sm:w-1 sm:h-1 rounded-full bg-slate-600"></div>
                                    <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-emerald-900/80 ring-1 ring-emerald-500/30"></div>
                                </div>
                            </div>

                            {/* Screen Content: Dashboard UI */}
                            <div className="flex-1 bg-slate-950 flex pt-3 sm:pt-6 relative overflow-hidden">
                                {/* Sidebar */}
                                <div className="w-10 sm:w-16 border-r border-white/5 flex flex-col items-center py-2 sm:py-4 gap-2 sm:gap-4 flex-shrink-0">
                                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-md bg-emerald-500/20 text-emerald-500 flex items-center justify-center text-[10px] sm:text-xs font-bold">AI</div>
                                    {[1, 2, 3].map(i => <div key={i} className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-white/5" />)}
                                </div>

                                {/* Main Content */}
                                <div className="flex-1 p-3 sm:p-5 space-y-3 sm:space-y-4 overflow-hidden flex flex-col">
                                    {/* Header Row */}
                                    <div className="flex justify-between items-center">
                                        <div className="h-2 sm:h-3 w-24 sm:w-32 bg-white/10 rounded-full" />
                                        <div className="flex gap-2">
                                            <div className="h-5 sm:h-6 w-16 sm:w-20 bg-emerald-500/10 rounded-full border border-emerald-500/20" />
                                        </div>
                                    </div>

                                    {/* Grid */}
                                    <div className="grid grid-cols-3 gap-3 sm:gap-4 h-full pb-2 sm:pb-6">
                                        {/* Card 1: Gene Sequence */}
                                        <div className="col-span-2 bg-white/5 rounded-lg p-3 sm:p-4 border border-white/5 overflow-hidden relative flex flex-col justify-center">
                                            <div className="flex justify-between items-center mb-2 sm:mb-4">
                                                <div className="h-1.5 sm:h-2 w-12 sm:w-16 bg-white/10 rounded-full" />
                                                <div className="h-1.5 sm:h-2 w-6 sm:w-8 bg-emerald-400/50 rounded-full" />
                                            </div>
                                            <div className="space-y-1.5 sm:space-y-2 animate-pulse">
                                                {[...Array(5)].map((_, i) => (
                                                    <div key={i} className="flex gap-1">
                                                        <div className="h-1 sm:h-1.5 rounded-full w-full bg-gradient-to-r from-emerald-500/40 to-teal-500/40" style={{ width: `${((i * 13) % 40) + 40}%` }} />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Card 2: Stats */}
                                        <div className="col-span-1 bg-white/5 rounded-lg p-3 sm:p-4 border border-white/5 flex flex-col justify-between items-center">
                                            <div className="h-10 w-10 sm:h-16 sm:w-16 rounded-full border-2 sm:border-4 border-emerald-500/30 border-t-emerald-400 animate-spin mb-1" />
                                            <div className="h-1.5 sm:h-2 w-10 sm:w-14 bg-white/10 rounded-full mt-2" />
                                        </div>

                                        {/* Card 3: Chat/Analysis */}
                                        <div className="col-span-3 bg-white/5 rounded-lg p-3 sm:p-4 border border-white/5 h-24 sm:h-full relative overflow-hidden flex flex-col justify-center">
                                            <div className="absolute top-3 left-3 right-3 space-y-2 sm:space-y-3">
                                                <div className="flex gap-2 sm:gap-3 items-center">
                                                    <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-emerald-500/20" />
                                                    <div className="h-1.5 sm:h-2 w-3/4 bg-white/10 rounded-full" />
                                                </div>
                                                <div className="flex gap-2 sm:gap-3 items-center">
                                                    <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-purple-500/20" />
                                                    <div className="h-1.5 sm:h-2 w-1/2 bg-white/10 rounded-full" />
                                                </div>
                                            </div>
                                            {/* Scan line */}
                                            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/5 to-transparent h-1/2 animate-[scan_3s_ease-in-out_infinite]" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Laptop Base - Matches Login Page Style */}
                        <div className="relative mx-auto bg-slate-700 rounded-b-xl sm:rounded-b-[20px] h-[10px] sm:h-[16px] w-[96%] sm:w-[104%] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] border-t border-slate-600">
                            <div className="absolute left-1/2 top-0 -translate-x-1/2 w-20 sm:w-32 h-[3px] sm:h-[4px] bg-slate-800 rounded-b-md shadow-inner"></div>
                        </div>
                    </div>

                    <style jsx>{`
                        @keyframes scan {
                            0% { transform: translateY(-100%); }
                            100% { transform: translateY(200%); }
                        }
                    `}</style>
                </div>

                {/* Feature Pills Under Laptop */}
                <div className="mt-16 flex flex-wrap justify-center gap-4 sm:gap-8">
                    {[
                        { icon: HiChatAlt2, label: "Contextual Chat" },
                        { icon: RiFlaskLine, label: "Deep Research" },
                        { icon: BiAnalyse, label: "Pattern Recognition" },
                        { icon: RiFileTextLine, label: "Report Generation" }
                    ].map((feature) => (
                        <div key={feature.label} className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full px-6 py-3 shadow-sm hover:border-emerald-500/50 transition-colors cursor-default">
                            <feature.icon className="w-5 h-5 text-emerald-500" />
                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{feature.label}</span>
                        </div>
                    ))}
                </div>

                {/* Final CTA */}
                <div className="mt-12 text-center">
                    <Link
                        href="https://ai.zygotrix.com/register"
                        className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 hover:bg-emerald-500 hover:scale-105 transition-all duration-300"
                    >
                        <span>Launch Zygotrix AI</span>
                        <HiLightningBolt className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        </section>
    );
};

export default ZygoAISectionClient;
