import Link from 'next/link';
import Button from './Button';
import { FaPlay, FaArrowRight } from 'react-icons/fa';

const Hero = () => {
    return (
        <section className="relative min-h-[calc(100vh-4rem)] flex items-center overflow-hidden bg-white dark:bg-gray-900 pt-10">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-emerald-50 to-transparent dark:from-emerald-900/10" />
                <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-emerald-50 to-transparent dark:from-emerald-900/10" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-3xl animate-pulse-glow" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
                {/* Left Content */}
                <div className="text-center lg:text-left space-y-8 animate-slide-in-left">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-sm font-medium">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        Your Personal AI Geneticist
                    </div>

                    <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-slate-800 dark:text-white leading-tight">
                        Research Faster with <br />
                        <span className="inline-block bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-400 dark:to-teal-300 bg-clip-text text-transparent animate-gradient-shift">
                            Your AI Geneticist
                        </span>
                    </h1>

                    <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                        Control your research with voice. Perform deep academic sweeps, run GWAS analyses, and access scholar mode without touching your keyboard.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                        <Link href="https://ai.zygotrix.com/register" className="w-full sm:w-auto">
                            <Button variant="primary" size="lg" className="w-full">
                                Start Researching <FaArrowRight />
                            </Button>
                        </Link>
                        <Link href="#demo" className="w-full sm:w-auto">
                            <Button variant="outline" size="lg" className="w-full">
                                <FaPlay className="text-sm mr-2" /> See Voice Demo
                            </Button>
                        </Link>
                    </div>

                    <div className="pt-8 flex items-center justify-center lg:justify-start gap-8 text-slate-400 dark:text-slate-500 text-sm font-medium">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                            Deep Research
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-slate-500 dark:bg-slate-400" />
                            Scholar Mode
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-purple-500" />
                            Voice Control
                        </div>
                    </div>
                </div>

                {/* Right Content - Modern Abstract Visualization */}
                <div className="relative animate-slide-in-right hidden lg:flex items-center justify-end h-full min-h-[600px] w-full">

                    {/* Main container for the 3D composition */}
                    <div className="relative w-[500px] h-[500px] perspective-1000">

                        {/* Background Gradients/Glows */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-100/30 dark:bg-emerald-900/10 rounded-full blur-[100px]" />

                        {/* Central "Deep Research" Hub */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 relative z-10">
                            {/* Rotating Rings */}
                            <div className="absolute inset-0 border border-slate-200 dark:border-slate-700 rounded-full animate-[spin_10s_linear_infinite]" />
                            <div className="absolute inset-4 border border-dashed border-slate-300 dark:border-slate-600 rounded-full animate-[spin_15s_linear_infinite_reverse]" />
                            <div className="absolute inset-12 border border-emerald-100 dark:border-emerald-800 rounded-full animate-pulse" />

                            {/* Core Element */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-32 h-32 bg-white dark:bg-slate-800 rounded-full shadow-[0_0_50px_rgba(16,185,129,0.15)] flex items-center justify-center border border-slate-50 dark:border-slate-700 relative z-20">
                                    <div className="text-4xl animate-bounce-slow">🧬</div>

                                    {/* Scanning Beam effect */}
                                    <div className="absolute inset-0 rounded-full overflow-hidden">
                                        <div className="w-full h-1/2 bg-gradient-to-b from-transparent to-emerald-500/10 absolute top-0 animate-scan" />
                                    </div>
                                </div>
                            </div>

                            {/* Orbiting Satellite Cards */}

                            {/* Card 1: Voice Control */}
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-48 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md p-3 rounded-xl border border-white/50 dark:border-slate-600 shadow-xl animate-float" style={{ animationDelay: '0s' }}>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-500">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M7 4a3 3 0 016 0v6a3 3 0 11-6 0V4zM5.5 9.643a.75.75 0 00-1.5 0V10c0 3.06 2.29 5.585 5.25 5.954V17.5h-1.5a.75.75 0 000 1.5h4.5a.75.75 0 000-1.5h-1.5v-1.546A6.001 6.001 0 0016 10v-.357a.75.75 0 00-1.5 0V10a4.5 4.5 0 01-9 0v-.357z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Voice Command</div>
                                        <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">"Run GWAS Analysis"</div>
                                    </div>
                                </div>
                            </div>

                            {/* Card 2: Paper Analysis */}
                            <div className="absolute top-1/2 -right-24 -translate-y-1/2 w-52 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md p-3 rounded-xl border border-white/50 dark:border-slate-600 shadow-xl animate-float" style={{ animationDelay: '1.5s' }}>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-500">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.965 3.129V2.75z" />
                                            <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Deep Research</div>
                                        <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">142 Papers Processed</div>
                                        <div className="w-full bg-slate-100 dark:bg-slate-700 h-1 mt-1.5 rounded-full overflow-hidden">
                                            <div className="bg-emerald-500 w-3/4 h-full" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Card 3: Scholar Mode */}
                            <div className="absolute -bottom-6 left-1/4 -translate-x-1/2 w-48 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md p-3 rounded-xl border border-white/50 dark:border-slate-600 shadow-xl animate-float" style={{ animationDelay: '0.8s' }}>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-500">
                                        <span className="text-sm">🎓</span>
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Scholar Mode</div>
                                        <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">Citation Ready</div>
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* Connection Lines (SVG) */}
                        <svg className="absolute inset-0 pointer-events-none opacity-20" style={{ zIndex: 0 }}>
                            <path d="M250 250 L250 170" stroke="currentColor" strokeDasharray="4 4" className="text-slate-400" />
                            <path d="M250 250 L380 250" stroke="currentColor" strokeDasharray="4 4" className="text-slate-400" />
                            <path d="M250 250 L180 330" stroke="currentColor" strokeDasharray="4 4" className="text-slate-400" />
                        </svg>

                    </div>
                </div>
            </div>
        </section>
    );
};

export default Hero;
