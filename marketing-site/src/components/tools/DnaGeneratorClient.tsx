"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { GiDna2, GiDna1 } from "react-icons/gi";
import { HiDownload, HiClipboardCopy, HiRefresh, HiArrowRight, HiLockClosed, HiSparkles } from "react-icons/hi";
import { FaDna, FaChartLine, FaProjectDiagram, FaDatabase, FaUsers, FaBrain } from "react-icons/fa";
import { BiTestTube } from "react-icons/bi";
import { generateDnaAndRna, type ProteinGenerateResponse } from "../../services/proteinGenerator.api";

const DnaGeneratorClient: React.FC = () => {
    const [length, setLength] = useState<number>(999);
    const [gcContent, setGcContent] = useState<number>(0.5);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<ProteinGenerateResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState<"dna" | "rna" | null>(null);
    const [elapsedTime, setElapsedTime] = useState<number>(0);
    const [tipIndex, setTipIndex] = useState<number>(0);
    const startTimeRef = useRef<number | null>(null);

    const isLargeSequence = length > 10000000;

    // End-to-end rate: ~303,030 bp/second based on benchmarks (100M bp in ~330 seconds)
    // Note: C++ generation is fast (~19s for 100M), but total time includes JSON serialization & transfer
    const GENERATION_RATE = 303030;

    // Estimate generation time in seconds based on sequence length
    const estimateGenerationTime = (bp: number): number => {
        // Add a small base overhead for short sequences
        const baseOverhead = 2;
        return baseOverhead + (bp / GENERATION_RATE);
    };

    // Format seconds to human-readable time
    const formatTime = (seconds: number): string => {
        if (seconds < 60) {
            return `${Math.round(seconds)}s`;
        } else if (seconds < 3600) {
            const mins = Math.floor(seconds / 60);
            const secs = Math.round(seconds % 60);
            return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
        } else {
            const hours = Math.floor(seconds / 3600);
            const mins = Math.round((seconds % 3600) / 60);
            return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
        }
    };

    // Tips to show during generation
    const generationTips = [
        "DNA sequences are generated using a high-performance C++ engine for speed.",
        "GC content affects DNA stability - higher GC means stronger hydrogen bonding.",
        "The generated RNA is transcribed from the template strand (3' to 5').",
        "100 million base pairs is roughly the size of a small chromosome!",
        "Our C++ engine can process millions of base pairs per second.",
        "Each codon (3 nucleotides) in the RNA will code for one amino acid.",
        "Did you know? Human DNA has about 3 billion base pairs.",
        "The GC content of most organisms ranges from 25% to 75%.",
        "Large sequences take time to transfer — the server is packaging ~100MB of data!",
        "The C++ engine generates quickly, but transferring the data takes most of the time.",
    ];

    // Timer effect for elapsed time and tip rotation
    useEffect(() => {
        let intervalId: ReturnType<typeof setInterval>;
        let tipIntervalId: ReturnType<typeof setInterval>;

        if (loading) {
            startTimeRef.current = Date.now();
            setElapsedTime(0);
            setTipIndex(Math.floor(Math.random() * generationTips.length));

            intervalId = setInterval(() => {
                if (startTimeRef.current) {
                    setElapsedTime((Date.now() - startTimeRef.current) / 1000);
                }
            }, 100);

            // Rotate tips every 8 seconds
            tipIntervalId = setInterval(() => {
                setTipIndex((prev) => (prev + 1) % generationTips.length);
            }, 8000);
        } else {
            startTimeRef.current = null;
            setElapsedTime(0);
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
            if (tipIntervalId) clearInterval(tipIntervalId);
        };
    }, [loading]);

    const estimatedTime = estimateGenerationTime(length);
    const progress = loading ? Math.min((elapsedTime / estimatedTime) * 100, 95) : 0;
    const remainingTime = Math.max(0, estimatedTime - elapsedTime);
    const displayResult = result && result.length <= 10000000;

    const handleGenerate = async () => {
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const response = await generateDnaAndRna({
                length,
                gc_content: gcContent,
            });
            setResult(response);
        } catch (err: unknown) {
            const axiosError = err as { response?: { data?: { detail?: unknown } }; message?: string };
            const detail = axiosError.response?.data?.detail;
            if (typeof detail === "string") {
                setError(detail);
            } else if (Array.isArray(detail) && detail.length > 0) {
                const firstError = detail[0] as { msg?: string };
                setError(firstError?.msg || "Failed to generate sequence");
            } else {
                setError(axiosError.message || "Failed to generate sequence");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = (sequence: string, type: "dna" | "rna") => {
        const blob = new Blob([sequence], { type: "text/plain;charset=utf-8" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `${type}_sequence_${result?.length || length}bp.txt`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleCopy = (sequence: string, type: "dna" | "rna") => {
        navigator.clipboard.writeText(sequence);
        setCopied(type);
        setTimeout(() => setCopied(null), 2000);
    };

    const handleReset = () => {
        setResult(null);
        setError(null);
    };

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
                    <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute top-40 right-20 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
                    <div className="absolute bottom-20 left-1/3 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }}></div>
                </div>

                <div className="relative mx-auto max-w-7xl px-6">
                    {/* Header */}
                    <div className="text-center max-w-4xl mx-auto mb-12">
                        <div className="inline-flex items-center gap-2 rounded-full bg-gray-900 px-6 py-2.5 mb-8 shadow-lg shadow-gray-900/25">
                            <GiDna2 className="w-5 h-5 text-white animate-spin" style={{ animationDuration: "3s" }} />
                            <span className="text-sm font-semibold uppercase tracking-[0.2em] text-white">
                                Free DNA Generator Tool
                            </span>
                        </div>

                        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
                            Generate <span className="text-emerald-500 dark:text-emerald-400">DNA Sequences</span>
                        </h1>

                        <p className="text-xl text-slate-700 dark:text-slate-300 leading-relaxed max-w-3xl mx-auto">
                            Create random DNA sequences with customizable GC content. Our high-performance
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400"> C++ engine </span>
                            can generate sequences up to <span className="font-bold">10 million base pairs</span> in seconds.
                        </p>
                    </div>

                    {/* Stats */}
                    <div className="flex flex-wrap justify-center gap-8 mb-16">
                        <div className="text-center px-6">
                            <p className="text-4xl font-bold text-emerald-600 dark:text-emerald-400">10M</p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">Max Base Pairs</p>
                        </div>
                        <div className="text-center px-6 border-l border-slate-200 dark:border-slate-700">
                            <p className="text-4xl font-bold text-gray-900 dark:text-white">&lt; 10s</p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">Generation Time</p>
                        </div>
                        <div className="text-center px-6 border-l border-slate-200 dark:border-slate-700">
                            <p className="text-4xl font-bold text-emerald-600 dark:text-emerald-400">100%</p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">Free to Use</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Generator Section */}
            <section className="relative py-12">
                <div className="mx-auto max-w-4xl px-6">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 md:p-10 border border-slate-200 dark:border-slate-700 shadow-2xl shadow-gray-200/40 dark:shadow-gray-950/40">

                        {!result ? (
                            <>
                                {/* Input Controls */}
                                <div className="grid md:grid-cols-2 gap-8 mb-8">
                                    {/* Length Input */}
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                                            Sequence Length (base pairs)
                                        </label>
                                        <input
                                            type="number"
                                            min={3}
                                            max={10000000}
                                            step={3}
                                            value={length}
                                            onChange={(e) => setLength(Math.max(3, parseInt(e.target.value) || 3))}
                                            className="w-full px-5 py-4 border-2 border-slate-200 dark:border-slate-600 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xl font-mono transition-all"
                                            disabled={loading}
                                        />
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                                            Range: 3 - 10,000,000 bp (must be divisible by 3)
                                        </p>
                                        {isLargeSequence && (
                                            <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                                                <p className="text-sm text-amber-700 dark:text-amber-400 flex items-center gap-2">
                                                    <span>⚠️</span>
                                                    <span>Sequences over 10M bp will be download-only</span>
                                                </p>
                                            </div>
                                        )}
                                        {/* Time estimate warning for long generations */}
                                        {estimatedTime > 30 && (
                                            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                                                <p className="text-sm text-blue-700 dark:text-blue-400 flex items-center gap-2">
                                                    <span>⏱️</span>
                                                    <span>
                                                        Estimated generation time: <strong>{formatTime(estimatedTime)}</strong>
                                                        {estimatedTime > 120 && " — You can leave this tab open while processing"}
                                                    </span>
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* GC Content */}
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                                            GC Content: <span className="text-emerald-600 dark:text-emerald-400">{(gcContent * 100).toFixed(0)}%</span>
                                        </label>
                                        <input
                                            type="range"
                                            min={0}
                                            max={1}
                                            step={0.01}
                                            value={gcContent}
                                            onChange={(e) => setGcContent(parseFloat(e.target.value))}
                                            className="w-full h-4 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                                            disabled={loading}
                                        />
                                        <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-2">
                                            <span>0% (AT-rich)</span>
                                            <span>50% (Balanced)</span>
                                            <span>100% (GC-rich)</span>
                                        </div>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-4">
                                            <strong>GC Content</strong> affects DNA stability. Higher GC = more stable double helix.
                                        </p>
                                    </div>
                                </div>

                                {/* Generate Button */}
                                {!loading ? (
                                    <button
                                        onClick={handleGenerate}
                                        className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-5 px-8 rounded-xl transition-all duration-300 shadow-xl hover:shadow-2xl hover:-translate-y-1 flex items-center justify-center gap-3 text-lg cursor-pointer"
                                    >
                                        <GiDna1 className="w-7 h-7" />
                                        <span>Generate DNA Sequence</span>
                                    </button>
                                ) : (
                                    /* Enhanced Loading Progress UI */
                                    <div className="w-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                                        {/* Header with spinner and sequence info */}
                                        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                                                    <div>
                                                        <h4 className="font-semibold text-slate-900 dark:text-white">
                                                            {length >= 10000000 ? "Generating & Transferring" : "Generating"} {length >= 1000000 ? `${(length / 1000000).toFixed(1)}M` : length.toLocaleString()} bp
                                                        </h4>
                                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                                            {length >= 10000000
                                                                ? `DNA & RNA sequences (~${(length / 1000000).toFixed(0)}MB payload)`
                                                                : "DNA & RNA sequences"}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm text-slate-500 dark:text-slate-400">Elapsed</p>
                                                    <p className="text-lg font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                                                        {formatTime(elapsedTime)}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Progress Bar */}
                                            <div className="relative h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                                <div
                                                    className="absolute inset-y-0 left-0 bg-emerald-500 rounded-full transition-all duration-300 ease-out"
                                                    style={{ width: `${progress}%` }}
                                                >
                                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
                                                </div>
                                            </div>

                                            {/* Time Estimates */}
                                            <div className="flex items-center justify-between mt-3 text-sm">
                                                <span className="text-slate-500 dark:text-slate-400">
                                                    {progress < 95 ? (
                                                        <>Est. remaining: <span className="font-semibold text-slate-700 dark:text-slate-300">{formatTime(remainingTime)}</span></>
                                                    ) : (
                                                        <span className="text-emerald-600 dark:text-emerald-400">Almost done...</span>
                                                    )}
                                                </span>
                                                <span className="text-slate-500 dark:text-slate-400">
                                                    Est. total: <span className="font-semibold text-slate-700 dark:text-slate-300">{formatTime(estimatedTime)}</span>
                                                </span>
                                            </div>
                                        </div>

                                        {/* Tips Section - only show for longer generations */}
                                        {estimatedTime > 5 && (
                                            <div className="px-6 py-4 bg-emerald-50/50 dark:bg-emerald-950/20">
                                                <div className="flex items-start gap-3">
                                                    <HiSparkles className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                                                    <div>
                                                        <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-1">
                                                            Did you know?
                                                        </p>
                                                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                                            {generationTips[tipIndex]}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </>
                        ) : (
                            <>
                                {/* Results */}
                                <div className="space-y-6">
                                    {/* Stats Bar */}
                                    <div className="flex flex-wrap items-center justify-between gap-4 p-5 bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-900/80 dark:to-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-700">
                                        <div className="flex items-center gap-8">
                                            <div>
                                                <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Length</span>
                                                <p className="text-2xl font-bold text-slate-900 dark:text-white">{result.length.toLocaleString()} <span className="text-sm font-normal text-slate-500">bp</span></p>
                                            </div>
                                            <div>
                                                <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actual GC</span>
                                                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{(result.actual_gc * 100).toFixed(2)}%</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleReset}
                                            className="flex items-center gap-2 px-5 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg transition-colors font-medium"
                                        >
                                            <HiRefresh className="w-5 h-5" />
                                            <span>Generate New</span>
                                        </button>
                                    </div>

                                    {/* DNA Sequence */}
                                    <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                                        <div className="flex items-center justify-between px-5 py-4 bg-blue-50 dark:bg-blue-900/20 border-b border-slate-200 dark:border-slate-700">
                                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-3">
                                                <span className="w-4 h-4 rounded-full bg-blue-500"></span>
                                                DNA Sequence
                                            </h3>
                                            <div className="flex gap-2">
                                                {displayResult && (
                                                    <button
                                                        onClick={() => handleCopy(result.dna_sequence, "dna")}
                                                        className="flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm transition-colors border border-slate-200 dark:border-slate-600"
                                                    >
                                                        <HiClipboardCopy className="w-4 h-4" />
                                                        {copied === "dna" ? "Copied!" : "Copy"}
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDownload(result.dna_sequence, "dna")}
                                                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors font-medium"
                                                >
                                                    <HiDownload className="w-4 h-4" />
                                                    Download .txt
                                                </button>
                                            </div>
                                        </div>
                                        {displayResult ? (
                                            <div className="bg-slate-50 dark:bg-slate-900 p-5 max-h-48 overflow-auto">
                                                <code className="text-sm text-blue-600 dark:text-blue-400 font-mono break-all leading-relaxed">
                                                    {result.dna_sequence}
                                                </code>
                                            </div>
                                        ) : (
                                            <div className="bg-slate-50 dark:bg-slate-900 p-10 text-center">
                                                <div className="text-5xl mb-3">🧬</div>
                                                <p className="text-slate-600 dark:text-slate-400 font-medium">Sequence too large to display in browser</p>
                                                <p className="text-sm text-slate-500 mt-1">Click "Download .txt" to save the file ({(result.length / 1000000).toFixed(1)} MB)</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* RNA Sequence */}
                                    <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                                        <div className="flex items-center justify-between px-5 py-4 bg-green-50 dark:bg-green-900/20 border-b border-slate-200 dark:border-slate-700">
                                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-3">
                                                <span className="w-4 h-4 rounded-full bg-green-500"></span>
                                                RNA Sequence (Transcribed)
                                            </h3>
                                            <div className="flex gap-2">
                                                {displayResult && (
                                                    <button
                                                        onClick={() => handleCopy(result.rna_sequence, "rna")}
                                                        className="flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm transition-colors border border-slate-200 dark:border-slate-600"
                                                    >
                                                        <HiClipboardCopy className="w-4 h-4" />
                                                        {copied === "rna" ? "Copied!" : "Copy"}
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDownload(result.rna_sequence, "rna")}
                                                    className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors font-medium"
                                                >
                                                    <HiDownload className="w-4 h-4" />
                                                    Download .txt
                                                </button>
                                            </div>
                                        </div>
                                        {displayResult ? (
                                            <div className="bg-slate-50 dark:bg-slate-900 p-5 max-h-48 overflow-auto">
                                                <code className="text-sm text-green-600 dark:text-green-400 font-mono break-all leading-relaxed">
                                                    {result.rna_sequence}
                                                </code>
                                            </div>
                                        ) : (
                                            <div className="bg-slate-50 dark:bg-slate-900 p-10 text-center">
                                                <div className="text-5xl mb-3">🧬</div>
                                                <p className="text-slate-600 dark:text-slate-400 font-medium">Sequence too large to display in browser</p>
                                                <p className="text-sm text-slate-500 mt-1">Click "Download .txt" to save the file ({(result.length / 1000000).toFixed(1)} MB)</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Error Display */}
                        {error && (
                            <div className="mt-6 p-5 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl">
                                <p className="text-red-700 dark:text-red-400">{error}</p>
                            </div>
                        )}
                    </div>

                    {/* Info Badge */}
                    <div className="flex justify-center mt-8">
                        <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 shadow-lg">
                            <HiSparkles className="w-5 h-5 text-emerald-500" />
                            <span className="text-sm text-slate-600 dark:text-slate-400">
                                Powered by our <span className="font-semibold text-emerald-600 dark:text-emerald-400">C++ engine</span> • No signup required
                            </span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Studio Features Section */}
            <section className="py-20 bg-white dark:bg-gray-950">
                <div className="mx-auto max-w-7xl px-6">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <div className="inline-flex items-center gap-2 rounded-full bg-gray-900 px-5 py-2 mb-6 border border-gray-800">
                            <HiLockClosed className="w-4 h-4 text-emerald-400" />
                            <span className="text-xs font-semibold uppercase tracking-wider text-white">
                                Pro Features
                            </span>
                        </div>

                        <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white mb-6">
                            Unlock Powerful <span className="text-emerald-500 dark:text-emerald-400">Studio Tools</span>
                        </h2>

                        <p className="text-lg text-slate-600 dark:text-slate-400">
                            Create a free account to access our comprehensive genetics research platform with advanced simulations,
                            visualizations, and analysis tools.
                        </p>
                    </div>

                    {/* Feature Cards */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                        {studioFeatures.map((feature) => (
                            <Link
                                key={feature.title}
                                href={feature.path}
                                className="group relative bg-white dark:bg-gray-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300"
                            >
                                {/* Icon */}
                                <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gray-900 text-white shadow-lg mb-5 group-hover:scale-110 transition-transform duration-300">
                                    <feature.icon className="w-7 h-7" />
                                </div>

                                {/* Title */}
                                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                    {feature.title}
                                </h3>

                                {/* Description */}
                                <p className="text-slate-600 dark:text-slate-400 mb-4">
                                    {feature.description}
                                </p>

                                {/* Link Arrow */}
                                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium">
                                    <span>Try Now</span>
                                    <HiArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
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
                                <span>Create Free Account</span>
                                <HiArrowRight className="w-5 h-5" />
                            </Link>
                            <span className="text-slate-500 dark:text-slate-400">or</span>
                            <Link
                                href="/signin"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full font-medium border border-slate-200 dark:border-slate-700 transition-colors"
                            >
                                <span>Sign In</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer Info */}
            <section className="py-12 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
                <div className="mx-auto max-w-4xl px-6 text-center">
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                        Why Zygotrix?
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                        Zygotrix is a comprehensive genetics research platform designed for researchers, educators, and students.
                        Our tools are built with performance in mind, using C++ engines for computationally intensive tasks.
                        Start with our free DNA generator, and explore our full suite of tools when you're ready to dive deeper into genetics research.
                    </p>
                </div>
            </section>
        </div>
    );
};

export default DnaGeneratorClient;
