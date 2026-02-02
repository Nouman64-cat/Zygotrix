
import React from "react";
import { IconType } from "react-icons";
import { FiGrid, FiFolder, FiActivity, FiCpu, FiEdit, FiSearch, FiBarChart2, FiUser, FiSettings, FiSliders } from "react-icons/fi";
import { STUDIO_URL } from "../../config";

// Floating Card Component
const FloatingCard: React.FC<{
    title: string;
    value: string;
    sub: string;
    icon: React.ReactNode;
    color: string;
    className: string;
}> = ({ title, value, sub, icon, color, className }) => (
    <div className={`absolute p-4 rounded-xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border border-slate-200 dark:border-slate-700 shadow-xl z-20 animate-float ${className}`}>
        <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-lg ${color} text-white`}>
                {icon}
            </div>
            <div>
                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">{title}</div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">{value}</div>
            </div>
        </div>
        <div className="text-[10px] text-emerald-500 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            {sub}
        </div>
    </div>
);

const StudioHero: React.FC = () => {
    const customLink = STUDIO_URL;

    return (
        <section className="relative bg-slate-50 dark:bg-slate-950 overflow-hidden pt-16 pb-20 lg:min-h-[90vh] flex items-center border-b border-slate-200 dark:border-slate-800">
            {/* Background Gradients */}
            <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="container mx-auto px-4 lg:px-6 relative z-10">
                <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">

                    {/* Left Side: Content */}
                    <div className="lg:w-5/12 text-left space-y-8">
                        <div className="space-y-4">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                Live Simulation Engine v2.0
                            </div>

                            <h1 className="text-4xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1]">
                                Your entire lab, <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500">
                                    in one workspace.
                                </span>
                            </h1>

                            <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-lg">
                                Manage projects, run simulations, and analyze complex genetic data from a single, unified dashboard.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-4">
                            <a
                                href={`${customLink}/signup`}
                                className="px-8 py-3.5 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-500 transition-all shadow-lg hover:shadow-emerald-500/30 flex items-center gap-2"
                            >
                                Start for free
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                            </a>
                            <a
                                href="https://calendly.com/working-nouman-ejaz/zygotrix-demo"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-8 py-3.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-gray-50 dark:hover:bg-slate-800 transition-all"
                            >
                                Book Demo
                            </a>
                        </div>
                    </div>

                    {/* Right Side: Macbook Mockup */}
                    <div className="lg:w-7/12 relative perspective-1000">
                        {/* The Laptop */}
                        <div className="relative mx-auto w-full max-w-[800px] transform transition-transform duration-700 hover:rotate-x-2">
                            {/* Screen Frame */}
                            <div className="relative bg-[#1a1b26] rounded-[20px] p-2 shadow-2xl border border-slate-800 ring-1 ring-white/10">
                                {/* Camera Notch */}
                                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-32 h-4 bg-black rounded-b-xl z-20"></div>

                                {/* Screen Content (Mock Dashboard) */}
                                <div className="bg-[#0f172a] rounded-xl overflow-hidden aspect-[16/10] flex border border-slate-800/50">
                                    {/* Sidebar */}
                                    <div className="w-[240px] bg-[#1e293b] border-r border-slate-700/50 hidden md:flex flex-col p-4 gap-6 shrink-0">
                                        <div className="flex items-center gap-2 px-2">
                                            <div className="w-6 h-6 rounded-lg bg-emerald-500"></div>
                                            <div className="h-3 w-20 bg-slate-700 rounded"></div>
                                        </div>

                                        <div className="space-y-1">
                                            <div className="flex items-center gap-3 px-3 py-2 bg-emerald-500/10 text-emerald-400 rounded-lg text-sm font-medium border border-emerald-500/20 whitespace-nowrap">
                                                <FiGrid /> Dashboard
                                            </div>
                                            {[
                                                { icon: <FiFolder />, label: "Projects" },
                                                { icon: <FiActivity />, label: "Simulation Studio" },
                                                { icon: <FiCpu />, label: "Protein Fold" },
                                                { icon: <FiEdit />, label: "DNA Editor" },
                                                { icon: <FiSearch />, label: "Browse Traits" },
                                                { icon: <FiBarChart2 />, label: "Analytics" },
                                            ].map((item, i) => (
                                                <div key={i} className="flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-lg text-sm transition-colors cursor-default whitespace-nowrap">
                                                    {item.icon} {item.label}
                                                </div>
                                            ))}
                                        </div>

                                        <div className="mt-auto pt-4 border-t border-slate-700/50 space-y-1">
                                            {[
                                                { icon: <FiUser />, label: "Profile" },
                                                { icon: <FiSliders />, label: "Preferences" },
                                                { icon: <FiSettings />, label: "Settings" },
                                            ].map((item, i) => (
                                                <div key={i} className="flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-lg text-sm transition-colors cursor-default">
                                                    {item.icon} {item.label}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Main Area */}
                                    <div className="flex-1 bg-[#0f172a] p-6 relative overflow-hidden">
                                        {/* Header Mock */}
                                        <div className="flex justify-between items-center mb-8">
                                            <div className="space-y-1">
                                                <div className="h-5 w-32 bg-slate-800 rounded"></div>
                                                <div className="h-3 w-48 bg-slate-800/50 rounded"></div>
                                            </div>
                                            <div className="flex gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-800"></div>
                                                <div className="w-8 h-8 rounded-full bg-emerald-500/20"></div>
                                            </div>
                                        </div>

                                        {/* Content Grid */}
                                        <div className="grid grid-cols-3 gap-4">
                                            {/* Big Chart Card */}
                                            <div className="col-span-2 bg-[#1e293b]/50 rounded-xl p-4 border border-slate-800 h-48 relative overflow-hidden">
                                                <div className="flex justify-between mb-4">
                                                    <div className="h-3 w-24 bg-slate-700 rounded"></div>
                                                    <div className="h-3 w-12 bg-emerald-500/20 rounded text-emerald-500 text-[10px] flex items-center justify-center">LIVE</div>
                                                </div>
                                                {/* Mock Chart Line */}
                                                <div className="absolute bottom-0 left-0 right-0 h-32 opacity-50">
                                                    <svg className="w-full h-full" viewBox="0 0 100 40" preserveAspectRatio="none">
                                                        <path d="M0 35 Q 20 30 30 20 T 60 15 T 100 5 V 40 H 0 Z" fill="url(#gradient)" opacity="0.4" />
                                                        <path d="M0 35 Q 20 30 30 20 T 60 15 T 100 5" fill="none" stroke="#10b981" strokeWidth="0.5" />
                                                        <defs>
                                                            <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="0%" stopColor="#10b981" />
                                                                <stop offset="100%" stopColor="transparent" />
                                                            </linearGradient>
                                                        </defs>
                                                    </svg>
                                                </div>
                                            </div>

                                            {/* Side Stats */}
                                            <div className="space-y-4">
                                                <div className="bg-[#1e293b]/50 rounded-xl p-4 border border-slate-800 h-[5.5rem]">
                                                    <div className="h-2 w-16 bg-slate-700 rounded mb-3"></div>
                                                    <div className="h-6 w-20 bg-slate-600/50 rounded"></div>
                                                </div>
                                                <div className="bg-[#1e293b]/50 rounded-xl p-4 border border-slate-800 h-[5.5rem]">
                                                    <div className="h-2 w-16 bg-slate-700 rounded mb-3"></div>
                                                    <div className="h-6 w-20 bg-slate-600/50 rounded"></div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Bottom Table Mock */}
                                        <div className="mt-4 bg-[#1e293b]/50 rounded-xl border border-slate-800 h-32 p-4">
                                            <div className="flex gap-4 mb-3 border-b border-slate-700 pb-2">
                                                <div className="h-2 w-20 bg-slate-700 rounded"></div>
                                                <div className="h-2 w-20 bg-slate-700 rounded"></div>
                                                <div className="h-2 w-20 bg-slate-700 rounded"></div>
                                            </div>
                                            <div className="space-y-3">
                                                <div className="h-2 w-full bg-slate-800/50 rounded"></div>
                                                <div className="h-2 w-full bg-slate-800/50 rounded"></div>
                                                <div className="h-2 w-2/3 bg-slate-800/50 rounded"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Laptop Bottom Base */}
                            <div className="relative mx-auto bg-[#e2e8f0] dark:bg-[#1e293b] h-3 w-[calc(100%+20px)] -ml-[10px] rounded-b-xl shadow-lg border-t border-black/10">
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-1.5 bg-black/10 rounded-b-lg"></div>
                            </div>
                        </div>

                        {/* Simulated Floating Windows */}
                        <FloatingCard
                            className="-top-6 -right-6 md:-right-12"
                            title="Job Status"
                            value="Complete"
                            sub="0.4s exec time"
                            color="bg-emerald-500"
                            icon={<FiActivity className="w-5 h-5" />}
                        />

                        <FloatingCard
                            className="-bottom-8 -left-4 md:-left-12 delay-700"
                            title="Genetic Score"
                            value="98.2%"
                            sub="Top percentile"
                            color="bg-blue-500"
                            icon={<FiBarChart2 className="w-5 h-5" />}
                        />

                        <FloatingCard
                            className="bottom-20 -right-8 md:-right-16 delay-1000 hidden md:block"
                            title="Active Users"
                            value="2,401"
                            sub="Currently online"
                            color="bg-purple-500"
                            icon={<FiUser className="w-5 h-5" />}
                        />

                    </div>
                </div>
            </div>
        </section>
    );
};

export default StudioHero;
