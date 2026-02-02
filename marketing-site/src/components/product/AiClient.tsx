"use client";

import React from "react";
import Link from "next/link";
import { RiSparklingFill } from "react-icons/ri";
import {
    HiOutlineSparkles,
    HiLightningBolt,
    HiChatAlt2,
    HiBeaker,
    HiChip,
    HiClock,
    HiExternalLink,
} from "react-icons/hi";
import { BiAnalyse, BiBrain, BiBot } from "react-icons/bi";
import {
    FaDna,
    FaRocket,
    FaMagic,
    FaUserGraduate,
    FaChartLine,
} from "react-icons/fa";
import { AI_APP_URL, BOT_NAME } from "../../config";

const ZYGOTRIX_AI_URL = AI_APP_URL;

const AiClient: React.FC = () => {
    const botName = BOT_NAME;

    const capabilities = [
        {
            icon: HiChatAlt2,
            title: "Natural Conversation",
            description:
                "Chat naturally about genetics concepts, ask questions, and get instant, accurate answers powered by advanced AI models.",
            color: "from-[#1E3A8A] to-[#3B82F6]",
        },
        {
            icon: BiAnalyse,
            title: "Result Analysis",
            description:
                "Automatically interprets simulation results, identifies inheritance patterns, and explains phenotype distributions.",
            color: "from-[#3B82F6] to-[#10B981]",
        },
        {
            icon: HiLightningBolt,
            title: "Context Awareness",
            description:
                "Understands which page you're on and tailors responses to your current workflow, whether in simulation studio or trait library.",
            color: "from-[#10B981] to-[#059669]",
        },
        {
            icon: HiBeaker,
            title: "Experiment Control",
            description:
                "Use natural language to add traits, set alleles, randomize genotypes, and run simulations without clicking buttons.",
            color: "from-[#059669] to-[#047857]",
        },
        {
            icon: BiBrain,
            title: "Intelligent Suggestions",
            description:
                "Get smart recommendations for experimental design, trait combinations, and analysis approaches based on your goals.",
            color: "from-[#1E3A8A] to-[#10B981]",
        },
        {
            icon: HiClock,
            title: "24/7 Availability",
            description:
                "Always available to help, no matter when inspiration strikes or when you need guidance with your research.",
            color: "from-[#3B82F6] to-[#059669]",
        },
    ];

    const useCases = [
        {
            icon: FaUserGraduate,
            title: "For Students",
            description:
                "Learn genetics interactively with explanations tailored to your level. Ask follow-up questions and get instant clarification on complex topics.",
            examples: [
                "Explain Mendelian inheritance",
                "Why did I get this ratio?",
                "Help me understand codominance",
            ],
        },
        {
            icon: HiBeaker,
            title: "For Researchers",
            description:
                `Accelerate your workflow with AI-powered simulation control and analysis. Focus on insights while ${botName} handles the mechanics.`,
            examples: [
                "Add all traits and run 5000 sims",
                "Analyze this inheritance pattern",
                "Set up a dihybrid cross",
            ],
        },
        {
            icon: FaUserGraduate,
            title: "For Educators",
            description:
                "Create engaging demonstrations and help students explore genetics concepts interactively. Let AI assist in answering student questions.",
            examples: [
                "Show incomplete dominance example",
                "Explain this result to students",
                "Create practice scenarios",
            ],
        },
    ];

    const features = [
        {
            icon: BiBot,
            title: "Agentic Commands",
            description:
                "Control the simulation studio with natural language. Add traits, randomize alleles, set parameters, and run experiments through conversation.",
        },
        {
            icon: FaChartLine,
            title: "Data Interpretation",
            description:
                "Automatically analyzes offspring distributions, calculates ratios, and explains deviations from expected Mendelian patterns.",
        },
        {
            icon: FaDna,
            title: "Genetics Knowledge",
            description:
                "Trained on comprehensive genetics concepts including inheritance patterns, chromosomal behavior, and molecular mechanisms.",
        },
        {
            icon: HiChip,
            title: "Real-time Processing",
            description:
                "Powered by cutting-edge AI models with fast response times and context-aware understanding of your research needs.",
        },
    ];

    return (
        <div className="bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-950 min-h-screen transition-colors duration-300">
            {/* DNA Pattern Background */}
            <div className="pointer-events-none fixed inset-0 opacity-[0.02]">
                <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <pattern
                            id="ai-pattern"
                            x="0"
                            y="0"
                            width="100"
                            height="100"
                            patternUnits="userSpaceOnUse"
                        >
                            <circle cx="10" cy="10" r="2" fill="currentColor" />
                            <circle cx="50" cy="50" r="3" fill="currentColor" />
                            <circle cx="90" cy="90" r="2" fill="currentColor" />
                            <path
                                d="M10,10 L50,50 M50,50 L90,90"
                                stroke="currentColor"
                                strokeWidth="0.5"
                                fill="none"
                            />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#ai-pattern)" />
                </svg>
            </div>

            {/* Floating Gradient Orbs */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute top-20 left-10 w-96 h-96 bg-gradient-to-br from-[#1E3A8A]/10 to-[#3B82F6]/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-br from-[#3B82F6]/10 to-[#10B981]/10 rounded-full blur-3xl animate-pulse delay-1000" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-[#10B981]/10 to-[#059669]/10 rounded-full blur-3xl animate-pulse delay-2000" />
            </div>

            {/* Main Content */}
            <div className="relative z-10 mx-auto max-w-7xl px-6 pb-20 pt-24">
                {/* Hero Section */}
                <div className="text-center mb-20">
                    {/* Logo Display */}
                    <div className="relative inline-block mb-8">
                        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#1E3A8A]/30 to-[#10B981]/30 blur-2xl animate-pulse"></div>
                        {/* Using a placeholder text if image is missing, but keeping img for now */}
                        <div
                            className="relative w-64 h-64 object-contain drop-shadow-2xl flex items-center justify-center bg-transparent text-6xl"
                        >
                            🧬🤖
                        </div>
                    </div>

                    <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
                        <span className="bg-gradient-to-r from-[#1E3A8A] via-[#3B82F6] to-[#10B981] dark:from-[#3B82F6] dark:via-[#10B981] dark:to-[#059669] bg-clip-text text-transparent">
                            {botName}
                        </span>
                        <br />
                        <span className="bg-gradient-to-r from-slate-900 via-[#1E3A8A] to-[#3B82F6] dark:from-white dark:via-[#3B82F6] dark:to-[#10B981] bg-clip-text text-transparent">
                            Your AI Genetics Assistant
                        </span>
                    </h1>

                    <p className="mx-auto max-w-3xl text-xl text-slate-600 dark:text-slate-300 leading-relaxed mb-8">
                        Harness the power of artificial intelligence to explore genetics,
                        run simulations, and gain insights faster than ever before.
                        Available right inside Zygotrix, whenever you need help.
                    </p>

                    {/* Standalone App Banner */}
                    <div className="mx-auto max-w-3xl bg-gradient-to-r from-[#1E3A8A]/10 to-[#10B981]/10 dark:from-[#3B82F6]/20 dark:to-[#10B981]/20 border border-[#3B82F6]/30 dark:border-[#3B82F6]/40 rounded-2xl p-6 mb-12">
                        <div className="flex items-center justify-center gap-2 mb-3">
                            <RiSparklingFill className="w-5 h-5 text-[#3B82F6] dark:text-[#10B981]" />
                            <span className="text-sm font-semibold uppercase tracking-wider text-[#1E3A8A] dark:text-[#3B82F6]">
                                New: Standalone Application
                            </span>
                            <RiSparklingFill className="w-5 h-5 text-[#3B82F6] dark:text-[#10B981]" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                            Complete Agent AI Experience
                        </h3>
                        <p className="text-slate-600 dark:text-slate-300 mb-5 max-w-2xl mx-auto">
                            {botName} is now available as a <strong>dedicated standalone application</strong> with
                            full conversation history, advanced context management, and persistent chat sessions.
                            Experience the complete AI agent platform designed specifically for genetics research.
                        </p>
                        <a
                            href={ZYGOTRIX_AI_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-[#1E3A8A] to-[#10B981] dark:from-[#3B82F6] dark:to-[#10B981] text-white rounded-full font-semibold text-lg shadow-2xl hover:shadow-[#1E3A8A]/50 dark:hover:shadow-[#3B82F6]/50 hover:scale-105 transition-all duration-300"
                        >
                            <span>Launch {botName} App</span>
                            <HiExternalLink className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        </a>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            href="/signup"
                            className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6] dark:from-[#3B82F6] dark:to-[#10B981] text-white rounded-full font-semibold text-lg shadow-2xl hover:shadow-[#1E3A8A]/50 dark:hover:shadow-[#3B82F6]/50 hover:scale-105 transition-all duration-300"
                        >
                            <span>Get Started Free</span>
                            <FaRocket className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Link>

                        <Link
                            href="/tools/dna-generator"
                            className="inline-flex items-center gap-3 px-8 py-4 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-full font-semibold text-lg border-2 border-slate-200 dark:border-slate-700 hover:border-[#1E3A8A] dark:hover:border-[#3B82F6] hover:shadow-xl transition-all duration-300"
                        >
                            <span>Try in Studio</span>
                            <HiOutlineSparkles className="w-5 h-5" />
                        </Link>
                    </div>
                </div>

                {/* Capabilities Section */}
                <div className="mb-24">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <span className="inline-block rounded-full bg-[#1E3A8A]/10 dark:bg-[#3B82F6]/20 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-[#1E3A8A] dark:text-[#3B82F6] mb-6">
                            Capabilities
                        </span>
                        <h2 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-[#1E3A8A] dark:from-white dark:to-[#3B82F6] bg-clip-text text-transparent mb-6">
                            What {botName} Can Do
                        </h2>
                        <p className="text-lg text-slate-600 dark:text-slate-400">
                            A comprehensive AI assistant built specifically for genetics
                            research and education.
                        </p>
                    </div>

                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                        {capabilities.map((capability) => (
                            <div
                                key={capability.title}
                                className="group relative bg-white dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-8 border border-slate-200 dark:border-slate-700 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300"
                            >
                                <div
                                    className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${capability.color} text-white shadow-lg mb-6 group-hover:scale-110 transition-transform duration-300`}
                                >
                                    <capability.icon className="w-7 h-7" />
                                </div>

                                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">
                                    {capability.title}
                                </h3>

                                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                                    {capability.description}
                                </p>

                                <div
                                    className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${capability.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none`}
                                ></div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Use Cases Section */}
                <div className="mb-24">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <span className="inline-block rounded-full bg-[#10B981]/10 dark:bg-[#10B981]/20 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-[#10B981] dark:text-emerald-400 mb-6">
                            Use Cases
                        </span>
                        <h2 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-[#10B981] dark:from-white dark:to-emerald-300 bg-clip-text text-transparent mb-6">
                            Who Benefits from {botName}?
                        </h2>
                        <p className="text-lg text-slate-600 dark:text-slate-400">
                            Whether you're learning, teaching, or researching, {botName}{" "}
                            adapts to your needs.
                        </p>
                    </div>

                    <div className="grid gap-8 lg:grid-cols-3">
                        {useCases.map((useCase) => (
                            <div
                                key={useCase.title}
                                className="bg-white dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-8 border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-2xl transition-all duration-300"
                            >
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-[#1E3A8A] to-[#3B82F6] text-white">
                                        <useCase.icon className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-2xl font-semibold text-slate-900 dark:text-white">
                                        {useCase.title}
                                    </h3>
                                </div>

                                <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                                    {useCase.description}
                                </p>

                                <div className="space-y-3">
                                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                                        Example Commands:
                                    </p>
                                    {useCase.examples.map((example) => (
                                        <div
                                            key={example}
                                            className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400"
                                        >
                                            <span className="text-[#10B981] dark:text-emerald-400 mt-1">
                                                •
                                            </span>
                                            <span className="italic">"{example}"</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Technical Features Section */}
                <div className="mb-24">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <span className="inline-block rounded-full bg-[#3B82F6]/10 dark:bg-[#3B82F6]/20 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-[#3B82F6] dark:text-blue-400 mb-6">
                            Technology
                        </span>
                        <h2 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-[#3B82F6] dark:from-white dark:to-blue-300 bg-clip-text text-transparent mb-6">
                            Powered by Advanced AI
                        </h2>
                        <p className="text-lg text-slate-600 dark:text-slate-400">
                            Built on state-of-the-art language models and optimized for
                            genetics research.
                        </p>
                    </div>

                    <div className="grid gap-8 md:grid-cols-2">
                        {features.map((feature) => (
                            <div
                                key={feature.title}
                                className="flex gap-6 p-8 bg-white dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all duration-300"
                            >
                                <div className="flex-shrink-0">
                                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-[#1E3A8A] to-[#10B981] text-white">
                                        <feature.icon className="w-6 h-6" />
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">
                                        {feature.title}
                                    </h3>
                                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                                        {feature.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Final CTA Section */}
                <div className="relative">
                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#1E3A8A] via-[#3B82F6] to-[#10B981] p-12 shadow-2xl">
                        {/* Sparkles */}
                        <RiSparklingFill className="absolute top-4 right-8 w-8 h-8 text-white/30 animate-pulse" />
                        <RiSparklingFill className="absolute bottom-8 left-12 w-6 h-6 text-white/30 animate-pulse delay-500" />
                        <RiSparklingFill className="absolute top-1/2 right-1/4 w-4 h-4 text-white/30 animate-pulse delay-1000" />

                        <div className="relative text-center">
                            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
                                Ready to Experience the Future of Genetics Research?
                            </h2>

                            <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
                                Join thousands of students, educators, and researchers using{" "}
                                {botName} to accelerate their work.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <Link
                                    href="/signup"
                                    className="group inline-flex items-center gap-3 px-8 py-4 bg-white text-[#1E3A8A] rounded-full font-semibold text-lg shadow-2xl hover:shadow-white/50 hover:scale-105 transition-all duration-300"
                                >
                                    <span>Start Using {botName}</span>
                                    <FaMagic className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                                </Link>

                                <Link
                                    href="/about"
                                    className="inline-flex items-center gap-3 px-8 py-4 bg-transparent text-white rounded-full font-semibold text-lg border-2 border-white/30 hover:bg-white/10 hover:border-white transition-all duration-300"
                                >
                                    <span>Learn More</span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AiClient;
