import React from 'react';
import Link from 'next/link';
import { FaBrain, FaDna, FaArrowRight } from 'react-icons/fa';
import { STUDIO_URL } from "../../config";

const AppSelectionSection: React.FC = () => {
    return (
        <section className="py-24 bg-white dark:bg-gray-950 relative overflow-hidden">
            {/* Styles for the tech animations */}
            <style dangerouslySetInnerHTML={{
                __html: `
                    @keyframes data-flow {
                        0% { stroke-dashoffset: 1000; }
                        100% { stroke-dashoffset: 0; }
                    }
                    @keyframes pulse-glow {
                        0%, 100% { opacity: 0.5; filter: brightness(1); }
                        50% { opacity: 1; filter: brightness(1.5); }
                    }
                    .circuit-trace {
                        fill: none;
                        stroke-width: 0.2;
                        stroke-linecap: square;
                        opacity: 0.2;
                    }
                    .circuit-active {
                        fill: none;
                        stroke-width: 0.2;
                        stroke-linecap: square;
                        stroke-dasharray: 50 1000;
                        animation: data-flow 2s linear infinite;
                        filter: url(#glow);
                    }
                    .chip-border {
                        position: absolute;
                        inset: -2px;
                        border-radius: 1.6rem;
                        background: transparent;
                        outline: 2px solid transparent;
                        z-index: 20;
                        pointer-events: none;
                    }
                `
            }} />

            {/* Global SVG Filters */}
            <svg className="absolute w-0 h-0">
                <defs>
                    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="0.3" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                    <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeOpacity="0.05" strokeWidth="1" />
                    </pattern>
                </defs>
            </svg>

            {/* Background Decorations - Subtle Grid */}
            <div className="absolute inset-0 pointer-events-none text-slate-500">
                <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, transparent 0%, rgba(0,0,0,0.02) 100%)' }}></div>
                <svg className="w-full h-full opacity-20">
                    <rect width="100%" height="100%" fill="url(#grid-pattern)" />
                </svg>
            </div>

            <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
                <div className="text-center max-w-3xl mx-auto mb-16 relative z-10">
                    <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                        Two Powerful Engines. <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500">One Ecosystem.</span>
                    </h2>
                    <p className="text-lg text-gray-600 dark:text-gray-400">
                        Choose the specific workspace tailored to your immediate research needs.
                        Seamlessly switch between intelligent drafting and rigorous simulation.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-16 lg:gap-24 max-w-6xl mx-auto relative z-10 px-4 sm:px-12">

                    {/* --- ZYGOTRIX AI CARD --- */}
                    <div className="relative group">
                        {/* Connecting Circuits (Left Card) */}
                        <svg className="absolute -inset-[50%] w-[200%] h-[200%] pointer-events-none z-0 overflow-visible" viewBox="0 0 200 200" preserveAspectRatio="none">
                            {/* Traces feeding IN to the card center area */}
                            {/* Top Inputs - BUS 1 */}
                            <path d="M 100,0 V 30 H 80 V 50" className="circuit-trace stroke-emerald-500" />
                            <path d="M 100,0 V 30 H 80 V 50" className="circuit-active stroke-emerald-500" />
                            <path d="M 105,0 V 25 H 85 V 50" className="circuit-trace stroke-emerald-500" />
                            <path d="M 105,0 V 25 H 85 V 50" className="circuit-active stroke-emerald-500" style={{ animationDelay: '0.2s' }} />

                            <path d="M 60,0 V 20 H 90 V 50" className="circuit-trace stroke-emerald-500" />
                            <path d="M 60,0 V 20 H 90 V 50" className="circuit-active stroke-emerald-500" style={{ animationDelay: '0.5s' }} />
                            <path d="M 55,0 V 15 H 75 V 50" className="circuit-trace stroke-emerald-500" />
                            <path d="M 55,0 V 15 H 75 V 50" className="circuit-active stroke-emerald-500" style={{ animationDelay: '0.7s' }} />

                            {/* Left Inputs - BUS 2 */}
                            <path d="M 0,80 H 30 V 100 H 50" className="circuit-trace stroke-emerald-500" />
                            <path d="M 0,80 H 30 V 100 H 50" className="circuit-active stroke-emerald-500" style={{ animationDelay: '1s' }} />
                            <path d="M 0,85 H 35 V 105 H 50" className="circuit-trace stroke-emerald-500" />
                            <path d="M 0,85 H 35 V 105 H 50" className="circuit-active stroke-emerald-500" style={{ animationDelay: '1.2s' }} />

                            <path d="M 0,120 H 20 V 100 H 50" className="circuit-trace stroke-emerald-500" />
                            <path d="M 0,120 H 20 V 100 H 50" className="circuit-active stroke-emerald-500" style={{ animationDelay: '1.5s' }} />
                            <path d="M 0,125 H 25 V 110 H 50" className="circuit-trace stroke-emerald-500" />
                            <path d="M 0,125 H 25 V 110 H 50" className="circuit-active stroke-emerald-500" style={{ animationDelay: '1.7s' }} />
                            <path d="M 0,135 H 15 V 150 H 50" className="circuit-trace stroke-emerald-500" />
                            <path d="M 0,135 H 15 V 150 H 50" className="circuit-active stroke-emerald-500" style={{ animationDelay: '1.9s' }} />

                            {/* Bottom Inputs - BUS 3 */}
                            <path d="M 80,200 V 170 H 100 V 150" className="circuit-trace stroke-emerald-500" />
                            <path d="M 80,200 V 170 H 100 V 150" className="circuit-active stroke-emerald-500" style={{ animationDelay: '0.8s' }} />
                            <path d="M 75,200 V 165 H 95 V 150" className="circuit-trace stroke-emerald-500" />
                            <path d="M 75,200 V 165 H 95 V 150" className="circuit-active stroke-emerald-500" style={{ animationDelay: '1s' }} />
                            <path d="M 120,200 V 180 H 110 V 150" className="circuit-trace stroke-emerald-500" />
                            <path d="M 120,200 V 180 H 110 V 150" className="circuit-active stroke-emerald-500" style={{ animationDelay: '1.3s' }} />
                        </svg>

                        {/* Glowing Border when Active */}
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-3xl opacity-30 group-hover:opacity-100 group-hover:blur-md transition-all duration-500"></div>

                        <div className="relative bg-slate-50 dark:bg-slate-900 rounded-3xl p-8 sm:p-10 border border-emerald-500/20 shadow-2xl shadow-emerald-500/5 group-hover:shadow-emerald-500/20 transition-all duration-300 overflow-hidden z-20">
                            {/* Internal Chips/Grid */}
                            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(emerald 1px, transparent 1px), linear-gradient(90deg, emerald 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

                            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40">
                                <path d="M 20,50 H 80 V 150 H 200" className="circuit-active stroke-emerald-500" style={{ strokeWidth: 0.2 }} />
                                <path d="M 300,50 H 200 V 100 H 100" className="circuit-active stroke-emerald-500" style={{ strokeWidth: 0.2, animationDirection: 'reverse' }} />
                            </svg>

                            <div className="relative z-10 flex flex-col h-full">
                                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-6 border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                                    <FaBrain className="w-8 h-8" />
                                </div>

                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Zygotrix AI</h3>
                                <p className="text-gray-600 dark:text-gray-400 mb-8 flex-grow">
                                    Your personal AI Geneticist. Perform deep literature reviews, run automated GWAS analyses, and synthesize complex biological data.
                                </p>

                                <Link
                                    href="https://ai.zygotrix.com/register"
                                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-500 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]"
                                >
                                    Launch Zygotrix AI <FaArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                        </div>
                    </div>


                    {/* --- ZYGOTRIX STUDIO CARD --- */}
                    <div className="relative group">
                        {/* Connecting Circuits (Right Card) */}
                        <svg className="absolute -inset-[50%] w-[200%] h-[200%] pointer-events-none z-0 overflow-visible" viewBox="0 0 200 200" preserveAspectRatio="none">
                            {/* Traces feeding IN to the card center area */}
                            {/* Top Inputs - BUS 1 */}
                            <path d="M 100,0 V 30 H 120 V 50" className="circuit-trace stroke-blue-500" />
                            <path d="M 100,0 V 30 H 120 V 50" className="circuit-active stroke-blue-500" />
                            <path d="M 95,0 V 25 H 115 V 50" className="circuit-trace stroke-blue-500" />
                            <path d="M 95,0 V 25 H 115 V 50" className="circuit-active stroke-blue-500" style={{ animationDelay: '0.2s' }} />

                            <path d="M 140,0 V 20 H 110 V 50" className="circuit-trace stroke-blue-500" />
                            <path d="M 140,0 V 20 H 110 V 50" className="circuit-active stroke-blue-500" style={{ animationDelay: '0.5s' }} />
                            <path d="M 145,0 V 15 H 125 V 50" className="circuit-trace stroke-blue-500" />
                            <path d="M 145,0 V 15 H 125 V 50" className="circuit-active stroke-blue-500" style={{ animationDelay: '0.7s' }} />

                            {/* Right Inputs - BUS 2 */}
                            <path d="M 200,80 H 170 V 100 H 150" className="circuit-trace stroke-blue-500" />
                            <path d="M 200,80 H 170 V 100 H 150" className="circuit-active stroke-blue-500" style={{ animationDelay: '1s' }} />
                            <path d="M 200,85 H 165 V 105 H 150" className="circuit-trace stroke-blue-500" />
                            <path d="M 200,85 H 165 V 105 H 150" className="circuit-active stroke-blue-500" style={{ animationDelay: '1.2s' }} />

                            <path d="M 200,120 H 180 V 100 H 150" className="circuit-trace stroke-blue-500" />
                            <path d="M 200,120 H 180 V 100 H 150" className="circuit-active stroke-blue-500" style={{ animationDelay: '1.5s' }} />
                            <path d="M 200,125 H 175 V 110 H 150" className="circuit-trace stroke-blue-500" />
                            <path d="M 200,125 H 175 V 110 H 150" className="circuit-active stroke-blue-500" style={{ animationDelay: '1.7s' }} />
                            <path d="M 200,135 H 185 V 150 H 150" className="circuit-trace stroke-blue-500" />
                            <path d="M 200,135 H 185 V 150 H 150" className="circuit-active stroke-blue-500" style={{ animationDelay: '1.9s' }} />

                            {/* Bottom Inputs - BUS 3 */}
                            <path d="M 120,200 V 170 H 100 V 150" className="circuit-trace stroke-blue-500" />
                            <path d="M 120,200 V 170 H 100 V 150" className="circuit-active stroke-blue-500" style={{ animationDelay: '0.8s' }} />
                            <path d="M 125,200 V 175 H 105 V 150" className="circuit-trace stroke-blue-500" />
                            <path d="M 125,200 V 175 H 105 V 150" className="circuit-active stroke-blue-500" style={{ animationDelay: '1s' }} />
                            <path d="M 80,200 V 180 H 90 V 150" className="circuit-trace stroke-blue-500" />
                            <path d="M 80,200 V 180 H 90 V 150" className="circuit-active stroke-blue-500" style={{ animationDelay: '1.3s' }} />
                        </svg>

                        {/* Glowing Border when Active */}
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-slate-500 rounded-3xl opacity-30 group-hover:opacity-100 group-hover:blur-md transition-all duration-500"></div>

                        <div className="relative bg-slate-50 dark:bg-slate-900 rounded-3xl p-8 sm:p-10 border border-slate-500/20 shadow-2xl shadow-slate-500/5 group-hover:shadow-blue-500/20 transition-all duration-300 overflow-hidden z-20">
                            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40">
                                <path d="M 20,50 H 80 V 150 H 200" className="circuit-active stroke-blue-500" style={{ strokeWidth: 0.2 }} />
                                <path d="M 300,50 H 200 V 100 H 100" className="circuit-active stroke-blue-500" style={{ strokeWidth: 0.2, animationDirection: 'reverse' }} />
                            </svg>

                            <div className="relative z-10 flex flex-col h-full">
                                <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 mb-6 border border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.2)]">
                                    <FaDna className="w-8 h-8" />
                                </div>

                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Zygotrix Studio</h3>
                                <p className="text-gray-600 dark:text-gray-400 mb-8 flex-grow">
                                    The advanced simulation workbench. Design complex breeding programs, visualize pedigree inheritance, and manage virtual experiments.
                                </p>

                                <a
                                    href={STUDIO_URL || "https://studio.zygotrix.com/signup"}
                                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold hover:bg-slate-800 dark:hover:bg-slate-200 transition-all shadow-lg"
                                >
                                    Launch Studio <FaArrowRight className="w-4 h-4" />
                                </a>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
};

export default AppSelectionSection;
