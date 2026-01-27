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

                {/* MacBook Pro CSS Mockup */}
                <div className="relative mx-auto max-w-[900px] transform transition-all hover:scale-[1.01] duration-500 perspective-1000">
                    {/* Glow effect */}
                    <div className="absolute -inset-4 bg-emerald-500/20 blur-3xl rounded-[3rem] -z-10 opacity-40" />

                    {/* Lid (Screen) */}
                    <div className="relative bg-[#0a0a0a] rounded-[2rem] p-3 shadow-2xl ring-1 ring-white/10">
                        {/* Camera Notch */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-6 w-40 bg-[#0a0a0a] rounded-b-xl z-20">
                            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[#1a1a1a] ring-1 ring-white/5 shadow-inner" />
                        </div>

                        {/* Internal Screen Content */}
                        <div className="relative bg-slate-900 w-full aspect-[16/10] rounded-[1.25rem] overflow-hidden border border-white/5">
                            {/* App UI */}
                            <div className="absolute inset-0 flex bg-[#0f1117]">
                                {/* Sidebar */}
                                <div className="hidden sm:flex w-64 bg-[#0B0C10] flex-col border-r border-white/5 p-5 gap-6">
                                    <div className="flex items-center gap-3 text-emerald-400 font-bold tracking-tight">
                                        <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                            <span className="text-sm">Z</span>
                                        </div>
                                        Zygotrix AI
                                    </div>
                                    <div className="space-y-2">
                                        <div className="h-9 rounded-lg bg-white/[0.03] w-full animate-pulse flex items-center px-3">
                                            <div className="h-2 w-24 bg-white/10 rounded-full" />
                                        </div>
                                        <div className="h-9 rounded-lg bg-transparent w-full flex items-center px-3">
                                            <div className="h-2 w-32 bg-white/5 rounded-full" />
                                        </div>
                                        <div className="h-9 rounded-lg bg-transparent w-full flex items-center px-3">
                                            <div className="h-2 w-20 bg-white/5 rounded-full" />
                                        </div>
                                    </div>
                                    <div className="mt-auto">
                                        <div className="h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-sm text-emerald-400 font-medium hover:bg-emerald-500/20 transition-colors cursor-pointer">
                                            + New Research
                                        </div>
                                    </div>
                                </div>

                                {/* Main Area */}
                                <div className="flex-1 flex flex-col relative bg-[#13151C]">
                                    {/* App Header */}
                                    <div className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-[#13151C]/50 backdrop-blur-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                            <span className="text-slate-400 text-sm font-medium">Session #2941 • Analysis Mode</span>
                                        </div>
                                        {/* Traffic Lights */}
                                        <div className="flex gap-2 opacity-50">
                                            <div className="w-3 h-3 rounded-full bg-[#FF5F56]" />
                                            <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
                                            <div className="w-3 h-3 rounded-full bg-[#27C93F]" />
                                        </div>
                                    </div>

                                    {/* Messages Area */}
                                    <div className="flex-1 p-8 space-y-8 overflow-hidden relative">
                                        {/* User Bubble */}
                                        <div className="flex justify-end">
                                            <div className="bg-[#10B981] text-white px-6 py-4 rounded-2xl rounded-tr-sm max-w-lg shadow-lg shadow-emerald-500/10">
                                                <p className="text-sm sm:text-[15px] font-medium leading-relaxed">
                                                    Based on the heatmap, identify likely candidate genes for the drought resistance trait in SampleSet-A.
                                                </p>
                                            </div>
                                        </div>

                                        {/* AI Response Bubble */}
                                        <div className="flex gap-4 max-w-3xl">
                                            <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center flex-shrink-0 shadow-lg">
                                                <HiOutlineSparkles className="w-5 h-5 text-emerald-400" />
                                            </div>
                                            <div className="space-y-4 flex-1">
                                                <div className="bg-[#1F2937] border border-white/5 px-6 py-5 rounded-2xl rounded-tl-sm shadow-xl">
                                                    <p className="text-slate-300 text-sm sm:text-[15px] leading-relaxed mb-4">
                                                        I've analyzed the expression variance in <strong className="text-white">SampleSet-A</strong>. Three candidate genes show significant upregulation correlations with the drought resistance phenotype <span className="text-emerald-400 font-mono text-xs">($p &lt; 0.05$)</span>:
                                                    </p>
                                                    <ul className="space-y-2.5 mb-5 relative z-10">
                                                        <li className="flex items-start gap-2.5 text-slate-300 text-sm">
                                                            <span className="text-emerald-500 mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                            <span><strong className="text-white">DREB1A</strong> (Chr 4): Transcription factor known for stress response loops.</span>
                                                        </li>
                                                        <li className="flex items-start gap-2.5 text-slate-300 text-sm">
                                                            <span className="text-emerald-500 mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                            <span><strong className="text-white">NCED3</strong> (Chr 11): Key limiter in abscisic acid biosynthesis.</span>
                                                        </li>
                                                    </ul>

                                                    {/* Chart Visual */}
                                                    <div className="rounded-xl bg-[#111827] border border-white/10 p-5 mt-2">
                                                        <div className="flex items-center justify-between mb-4">
                                                            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Expression Levels (RPKM)</span>
                                                            <div className="flex gap-2">
                                                                <span className="w-2 h-2 rounded-full bg-emerald-500/50"></span>
                                                                <span className="w-2 h-2 rounded-full bg-emerald-900/50"></span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-end justify-between h-24 gap-1.5">
                                                            {[35, 60, 25, 85, 40, 55, 20, 95, 45, 75].map((h, i) => (
                                                                <div key={i} className="flex-1 bg-gray-800/30 rounded-t-sm relative group h-full">
                                                                    <div
                                                                        className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-sm opacity-90 transition-all duration-700 group-hover:to-teal-300"
                                                                        style={{ height: `${h}%` }}
                                                                    />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Input Bar Placeholder */}
                                    <div className="p-6 pt-0 mt-auto">
                                        <div className="bg-[#1F2937] border border-white/10 rounded-xl h-14 flex items-center px-4 gap-3 text-slate-500">
                                            <div className="w-5 h-5 rounded-full border-2 border-slate-600 flex items-center justify-center text-[10px] font-bold">+</div>
                                            <span className="text-sm">Ask a follow-up question...</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Base (Bottom Chassis) */}
                    <div className="relative mx-auto w-full max-w-[940px]">
                        {/* Top Hinge Gradient */}
                        <div className="h-[12px] bg-gradient-to-b from-[#272729] to-[#1a1a1c] mx-[2px] rounded-b-md shadow-inner" />

                        {/* Main Aluminum Base */}
                        <div className="h-[14px] bg-[#d1d5db] dark:bg-[#3f3f46] rounded-b-[16px] mx-auto relative shadow-2xl overflow-hidden">
                            {/* Metallic Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-b from-[#e5e7eb] to-[#9ca3af] dark:from-[#52525b] dark:to-[#27272a]" />

                            {/* Groove Notch */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-[6px] bg-[#1f2937] dark:bg-[#18181b] rounded-b-lg opacity-80" />
                        </div>
                    </div>
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
