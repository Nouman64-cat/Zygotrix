import React from 'react';
import Button from './Button';
import { FaPlay, FaArrowRight } from 'react-icons/fa';

const Hero = () => {
    return (
        <section className="relative min-h-screen flex items-center pt-20 overflow-hidden bg-white">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-emerald-50 to-transparent" />
                <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-emerald-50 to-transparent" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/10 rounded-full blur-3xl animate-pulse-glow" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
                {/* Left Content */}
                <div className="text-center lg:text-left space-y-8 animate-slide-in-left">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm font-medium">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        Next Generation AI Reasoning
                    </div>

                    <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-slate-800 leading-tight">
                        Evolve Your <br />
                        <span className="inline-block bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent animate-gradient-shift">
                            Digital DNA
                        </span>
                    </h1>

                    <p className="text-xl text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                        Zygotrix harnesses the power of evolutionary algorithms and neural networks to create self-adapting AI solutions that grow with your business.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                        <Button variant="primary" size="lg" className="w-full sm:w-auto">
                            Start Evolution <FaArrowRight />
                        </Button>
                        <Button variant="outline" size="lg" className="w-full sm:w-auto">
                            <FaPlay className="text-sm mr-2" /> Watch Demo
                        </Button>
                    </div>

                    <div className="pt-8 flex items-center justify-center lg:justify-start gap-8 text-slate-400 text-sm font-medium">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                            99.9% Uptime
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-slate-500" />
                            SOC2 Certified
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-purple-500" />
                            Enterprise Ready
                        </div>
                    </div>
                </div>

                {/* Right Content - Visual Representation */}
                <div className="relative animate-slide-in-right hidden lg:block">
                    {/* Abstract DNA Representation using CSS borders/animations */}
                    <div className="relative w-full aspect-square flex items-center justify-center">
                        <div className="absolute w-[400px] h-[400px] border border-slate-200 rounded-full animate-spin-slow opacity-30" />
                        <div className="absolute w-[300px] h-[300px] border border-slate-300 rounded-full animate-spin-slow opacity-30" style={{ animationDirection: 'reverse', animationDuration: '15s' }} />

                        {/* Central Glowing Core */}
                        <div className="relative w-40 h-40 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full blur-xl animate-pulse-glow opacity-50" />
                        <div className="absolute w-32 h-32 bg-slate-900 rounded-full flex items-center justify-center border border-slate-700 z-10 shadow-2xl">
                            <span className="text-4xl">🧬</span>
                        </div>

                        {/* Floating Cards */}
                        <div className="absolute top-20 right-20 bg-white p-4 rounded-xl shadow-xl border border-slate-100 animate-float-up" style={{ animationDelay: '0s' }}>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                                    98%
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500">Optimization</div>
                                    <div className="text-sm font-bold text-slate-800">Peak Efficiency</div>
                                </div>
                            </div>
                        </div>

                        <div className="absolute bottom-20 left-10 bg-white p-4 rounded-xl shadow-xl border border-slate-100 animate-float-up" style={{ animationDelay: '1.5s' }}>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                                    <span className="text-lg">⚡</span>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500">Speed</div>
                                    <div className="text-sm font-bold text-slate-800">Real-time Processing</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Hero;
