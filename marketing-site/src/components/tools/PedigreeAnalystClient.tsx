"use client";

import React from "react";
import Link from "next/link";
import ReactFlow, {
    Background,
    Controls,
    useNodesState,
    useEdgesState,
    Node,
    Edge
} from 'reactflow';
import 'reactflow/dist/style.css';
import { FiCpu, FiCheckCircle, FiShare2, FiLayout, FiChevronDown, FiActivity } from 'react-icons/fi';
import { HiArrowRight, HiLockClosed, HiSparkles } from "react-icons/hi";
import { FaDna, FaChartLine, FaProjectDiagram, FaDatabase, FaUsers, FaBrain } from "react-icons/fa";
import { BiTestTube } from "react-icons/bi";
import { TbBinaryTree } from "react-icons/tb";

// --- Mock Data for Demo ---
const demoNodes: Node[] = [
    {
        id: 'gf1',
        type: 'default',
        data: { label: 'Grandfather (Aa)' },
        position: { x: 250, y: 0 },
        style: { background: '#1e293b', color: 'white', border: '1px solid #334155', borderRadius: '8px', width: 160 }
    },
    {
        id: 'gm1',
        type: 'default',
        data: { label: 'Grandmother (aa)' },
        position: { x: 450, y: 0 },
        style: { background: '#f8fafc', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '8px', width: 160 }
    },
    {
        id: 'f1',
        type: 'default',
        data: { label: 'Father (Aa)' },
        position: { x: 350, y: 150 },
        style: { background: '#1e293b', color: 'white', border: '1px solid #334155', borderRadius: '8px', width: 160 }
    },
    {
        id: 'm1',
        type: 'default',
        data: { label: 'Mother (Aa)' },
        position: { x: 550, y: 150 },
        style: { background: '#1e293b', color: 'white', border: '1px solid #334155', borderRadius: '8px', width: 160 }
    },
    {
        id: 'c1',
        type: 'default',
        data: { label: 'Child (aa) - Target' },
        position: { x: 450, y: 300 },
        style: { background: '#ecfdf5', color: '#064e3b', border: '2px solid #10b981', borderRadius: '8px', fontWeight: 'bold', width: 160 }
    }
];

const demoEdges: Edge[] = [
    { id: 'e1', source: 'gf1', target: 'f1', type: 'smoothstep', style: { stroke: '#94a3b8' } },
    { id: 'e2', source: 'gm1', target: 'f1', type: 'smoothstep', style: { stroke: '#94a3b8' } },
    // Connect parents to child
    { id: 'e3', source: 'f1', target: 'c1', type: 'smoothstep', animated: true, style: { stroke: '#10b981', strokeWidth: 2 } },
    { id: 'e4', source: 'm1', target: 'c1', type: 'smoothstep', animated: true, style: { stroke: '#10b981', strokeWidth: 2 } },
];

const PedigreeAnalystClient: React.FC = () => {
    const [nodes, , onNodesChange] = useNodesState(demoNodes);
    const [edges, , onEdgesChange] = useEdgesState(demoEdges);

    const studioFeatures = [
        {
            icon: FaDna,
            title: "Protein Fold Generation",
            description: "Convert DNA to RNA and identify all Open Reading Frames (ORFs) with our C++ engine.",
            path: "/studio/protein-fold-generation",
            gradient: "from-emerald-500 to-teal-600",
            color: "emerald",
        },
        {
            icon: BiTestTube,
            title: "Simulation Studio",
            description: "Run Mendelian genetics simulations with visual Punnett squares and inheritance patterns.",
            path: "/studio/simulation-studio",
            gradient: "from-teal-500 to-cyan-600",
            color: "teal",
        },
        {
            icon: FaUsers,
            title: "Population Genetics",
            description: "Simulate population dynamics with Hardy-Weinberg equilibrium and genetic drift.",
            path: "/studio/population",
            gradient: "from-green-500 to-emerald-600",
            color: "green",
        },
        {
            icon: FaChartLine,
            title: "PGS Demo",
            description: "Explore Polygenic Score calculations and understand complex trait inheritance.",
            path: "/studio/pgs-demo",
            gradient: "from-cyan-500 to-blue-600",
            color: "cyan",
        },
        {
            icon: FaDatabase,
            title: "Browse Traits",
            description: "Explore our comprehensive database of genetic traits with detailed information.",
            path: "/studio/browse-traits",
            gradient: "from-teal-500 to-emerald-600",
            color: "teal",
        },
        {
            icon: FaProjectDiagram,
            title: "Project Management",
            description: "Create and manage your genetics projects with collaborative features.",
            path: "/studio/projects",
            gradient: "from-emerald-500 to-green-600",
            color: "emerald",
        },
    ];

    return (
        <div className="min-h-screen bg-white dark:bg-gray-950">
            {/* Hero Section */}
            <section className="relative pt-20 pb-16 overflow-hidden">
                {/* Animated Background */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-20 right-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute top-40 left-20 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
                    <div className="absolute bottom-20 right-1/3 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }}></div>
                </div>

                <div className="relative mx-auto max-w-7xl px-6">
                    {/* Header */}
                    <div className="text-center max-w-4xl mx-auto mb-12">
                        <div className="inline-flex items-center gap-2 rounded-full bg-gray-900 px-6 py-2.5 mb-8 shadow-lg shadow-gray-900/25">
                            <TbBinaryTree className="w-5 h-5 text-emerald-400" />
                            <span className="text-sm font-semibold uppercase tracking-[0.2em] text-white">
                                Visual Pedigree Builder
                            </span>
                        </div>

                        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
                            Map <span className="text-emerald-500 dark:text-emerald-400">Genetic Ancestry</span>
                        </h1>

                        <p className="text-xl text-slate-700 dark:text-slate-300 leading-relaxed max-w-3xl mx-auto">
                            Trace traits, predict inheritance patterns, and visualize family potential.
                            Powered by Zygotrix's specialized <span className="font-semibold text-emerald-600 dark:text-emerald-400">genetic inference engine</span>.
                        </p>
                    </div>

                    {/* Stats */}
                    <div className="flex flex-wrap justify-center gap-8 mb-16">
                        <div className="text-center px-6">
                            <p className="text-4xl font-bold text-emerald-600 dark:text-emerald-400">Instant</p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">Visualisation</p>
                        </div>
                        <div className="text-center px-6 border-l border-slate-200 dark:border-slate-700">
                            <p className="text-4xl font-bold text-gray-900 dark:text-white">Auto</p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">Layout Engine</p>
                        </div>
                        <div className="text-center px-6 border-l border-slate-200 dark:border-slate-700">
                            <p className="text-4xl font-bold text-emerald-600 dark:text-emerald-400">100%</p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">Free to Use</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Demo Section */}
            <section className="relative py-12">
                <div className="mx-auto max-w-6xl px-6">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-4 md:p-6 border border-slate-200 dark:border-slate-700 shadow-2xl shadow-gray-200/40 dark:shadow-gray-950/40 overflow-hidden">

                        {/* Simulation Header Mock */}
                        <div className="flex items-center justify-between mb-4 px-2">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-emerald-600 dark:text-emerald-400">
                                    <FiActivity className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-900 dark:text-white">Pedigree Simulation</h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Interactive Demo</p>
                                </div>
                            </div>

                            <div className="hidden sm:flex items-center gap-2">
                                <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-medium flex items-center gap-1.5">
                                    <FiCheckCircle className="w-3.5 h-3.5" /> Mendelian Pattern
                                </span>
                            </div>
                        </div>

                        <div className="relative h-[500px] w-full bg-slate-50 dark:bg-gray-950 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden group">
                            {/* Overlay CTA */}
                            <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/30 dark:bg-black/30 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                                <div className="bg-white dark:bg-gray-900 px-6 py-4 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 flex flex-col items-center gap-3 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                    <p className="font-semibold text-slate-900 dark:text-white">Start Building Your Tree</p>
                                    <a href="https://ai.zygotrix.com/register" className="pointer-events-auto px-5 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium text-sm flex items-center gap-2">
                                        Launch Full App <HiArrowRight />
                                    </a>
                                </div>
                            </div>

                            <ReactFlow
                                nodes={nodes}
                                edges={edges}
                                onNodesChange={onNodesChange}
                                onEdgesChange={onEdgesChange}
                                fitView
                                className="z-10"
                            >
                                <Background gap={20} size={1} color="#94a3b8" />
                                <Controls className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 fill-gray-500 dark:fill-gray-400" />
                            </ReactFlow>
                        </div>

                        <div className="mt-6 flex justify-center">
                            <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                <HiSparkles className="text-emerald-500" />
                                <span>Powered by the unified <strong>Zygotrix Engine</strong></span>
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Other Tools Section */}
            <section className="py-20 bg-white dark:bg-gray-950 border-t border-slate-100 dark:border-slate-900">
                <div className="mx-auto max-w-7xl px-6">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <div className="inline-flex items-center gap-2 rounded-full bg-gray-900 px-5 py-2 mb-6 border border-gray-800">
                            <HiLockClosed className="w-4 h-4 text-emerald-400" />
                            <span className="text-xs font-semibold uppercase tracking-wider text-white">
                                Free Suite
                            </span>
                        </div>

                        <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white mb-6">
                            Explore More <span className="text-emerald-500 dark:text-emerald-400">Genetic Tools</span>
                        </h2>

                        <p className="text-lg text-slate-600 dark:text-slate-400">
                            Zygotrix provides a complete suite of high-performance tools for genetic analysis,
                            available for free to researchers and students.
                        </p>
                    </div>

                    {/* Tool Cards */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                        {[
                            {
                                icon: FaDna,
                                title: "DNA Generator",
                                description: "Generate random DNA sequences up to 10M bp with custom GC content.",
                                path: "/tools/dna-generator"
                            },
                            {
                                icon: TbBinaryTree, // Using Grid icon for Punnett Square fallback or similar
                                title: "Punnett Square",
                                description: "Calculate genotype and phenotype ratios for Mendelian crosses.",
                                path: "/tools/punnett-square"
                            },
                            {
                                icon: BiTestTube,
                                title: "DNA to Protein",
                                description: "Transcribe and translate DNA sequences into protein chains.",
                                path: "/tools/dna-to-protein"
                            },
                            {
                                icon: FaChartLine,
                                title: "GWAS Analysis",
                                description: "Visualize Genome-Wide Association Studies with Manhattan plots.",
                                path: "/tools/gwas-analysis"
                            }
                        ].map((tool) => (
                            <Link
                                key={tool.title}
                                href={tool.path}
                                className="group relative bg-white dark:bg-gray-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300"
                            >
                                {/* Icon */}
                                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gray-900 text-white shadow-lg mb-5 group-hover:scale-110 transition-transform duration-300">
                                    <tool.icon className="w-5 h-5" />
                                </div>

                                {/* Title */}
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                    {tool.title}
                                </h3>

                                {/* Description */}
                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                                    {tool.description}
                                </p>

                                {/* Link Arrow */}
                                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium text-sm">
                                    <span>Open Tool</span>
                                    <HiArrowRight className="w-3.5 h-3.5 group-hover:translate-x-2 transition-transform" />
                                </div>
                            </Link>
                        ))}
                    </div>

                    {/* CTA */}
                    <div className="text-center">
                        <div className="inline-flex flex-col sm:flex-row items-center gap-4">
                            <Link
                                href="/signup"
                                className="inline-flex items-center gap-3 px-8 py-4 bg-gray-900 hover:bg-gray-800 text-white rounded-full font-semibold shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300"
                            >
                                <FaBrain className="w-5 h-5" />
                                <span>Get All Tools</span>
                                <HiArrowRight className="w-5 h-5" />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default PedigreeAnalystClient;
