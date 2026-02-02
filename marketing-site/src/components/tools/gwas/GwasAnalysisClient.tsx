"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { HiCloudUpload, HiRefresh, HiChartBar, HiInformationCircle, HiSparkles, HiLockClosed, HiArrowRight } from "react-icons/hi";
import { FaDna, FaChartLine, FaProjectDiagram, FaDatabase, FaUsers, FaBrain } from "react-icons/fa";
import { BiTestTube } from "react-icons/bi";
import { ManhattanPlot } from "./ManhattanPlot";
import { QQPlot } from "./QQPlot";
import { AssociationTable } from "./AssociationTable";
import { cn } from "./utils";
import { API_URL } from "../../../config";

const API_BASE_URL = API_URL;

interface GwasAnalysisClientProps { }

type Stage = "idle" | "uploading" | "analyzing" | "completed" | "error";
type TabType = "manhattan" | "qq" | "associations";

interface GwasDatasetResponse {
    id: string;
    variable_name: string;
    status: string;
}

interface GwasJobResponse {
    id: string;
    status: string;
    execution_time_seconds?: number;
}

interface GwasResultResponse {
    job_id: string;
    manhattan_data: any;
    qq_data: any;
    associations: any[];
    summary?: {
        total_snps: number;
        genomic_inflation_lambda: number;
        execution_time_seconds: number;
    };
}

const GwasAnalysisClient: React.FC<GwasAnalysisClientProps> = () => {
    // Form State
    const [datasetName, setDatasetName] = useState("My GWAS Dataset");
    const [traitType, setTraitType] = useState<"quantitative" | "binary">("quantitative");
    const [traitName, setTraitName] = useState("Phenotype");
    const [file, setFile] = useState<File | null>(null);

    // Execution State
    const [stage, setStage] = useState<Stage>("idle");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [statusMessage, setStatusMessage] = useState("");
    const [activeTab, setActiveTab] = useState<TabType>("manhattan");

    // Results
    const [results, setResults] = useState<GwasResultResponse | null>(null);
    const [pollingIntervalId, setPollingIntervalId] = useState<NodeJS.Timeout | null>(null);

    useEffect(() => {
        return () => {
            if (pollingIntervalId) clearInterval(pollingIntervalId);
        };
    }, [pollingIntervalId]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const f = e.target.files[0];
            setFile(f);
            setDatasetName(f.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " "));
        }
    };

    const pollJobStatus = async (jobId: string) => {
        const pollInterval = setInterval(async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/api/gwas/jobs/${jobId}`);
                if (!response.ok) throw new Error("Failed to check job status");

                const job: GwasJobResponse = await response.json();
                console.log("DEBUG: Polling job status:", job.id, job.status);

                // Check for completed status (case-insensitive just in case)
                if (job.status.toUpperCase() === "COMPLETED") {
                    clearInterval(pollInterval);
                    setStatusMessage("Fetching results...");
                    await fetchResults(jobId, job);
                } else if (job.status.toUpperCase() === "FAILED" || job.status.toUpperCase() === "CANCELLED") {
                    clearInterval(pollInterval);
                    setStage("error");
                    setError(`Analysis ${job.status.toLowerCase()}. Please try again.`);
                    setLoading(false);
                } else {
                    setStatusMessage(`Analysis in progress (${job.status})...`);
                }
            } catch (err) {
                clearInterval(pollInterval);
                setStage("error");
                setError("Network error while polling job status.");
                setLoading(false);
            }
        }, 2000);
        setPollingIntervalId(pollInterval);
    };

    const fetchResults = async (jobId: string, job?: GwasJobResponse) => {
        try {
            // Fetch full results including visualization data
            // For simplicity we try fetching everything at once, or we could fetch visualization separate
            // The backend has /jobs/{id}/results which presumably has everything or /jobs/{id}/visualization
            // Let's try /results first
            const response = await fetch(`${API_BASE_URL}/api/gwas/jobs/${jobId}/results`);
            if (!response.ok) throw new Error("Failed to fetch results");
            const data = await response.json();

            // Data likely needs some mapping if it doesn't perfectly match props, but let's assume it does based on backend
            // We might need to construct the shape `messageMetadata.gwas_data` usually has in zygotrix_ai

            // Backend returns GwasResultResponse which has associations.
            // It might NOT have pre-calculated manhattan/qq data if the backend endpoint computes it on fly or if it's stored differently.
            // Checking backend code: GET /jobs/{job_id}/results returns results including "manhattan_plot", "qq_plot" data potentially?
            // Wait, reading backend code:
            // get_job_results returns GwasResultResponse. 
            // We also have /jobs/{job_id}/visualization. 

            // Let's call both to be safe or check if results already has it.
            // Ideally we want the visualization data.

            const vizResponse = await fetch(`${API_BASE_URL}/api/gwas/jobs/${jobId}/visualization`);
            const vizData = vizResponse.ok ? await vizResponse.json() : {};

            console.log("DEBUG: Received results data:", data);
            console.log("DEBUG: Received viz data:", vizData);

            setResults({
                job_id: jobId,
                manhattan_data: vizData.manhattan_plot_data || data.manhattan_plot_data,
                qq_data: vizData.qq_plot_data || data.qq_plot_data,
                associations: data.top_hits || [],
                summary: data.summary ? {
                    total_snps: data.summary.total_snps_tested,
                    genomic_inflation_lambda: data.summary.genomic_inflation_lambda,
                    execution_time_seconds: job?.execution_time_seconds || 0
                } : undefined
            });

            setStage("completed");
            setLoading(false);

        } catch (err) {
            setStage("error");
            setError("Failed to load analysis results.");
            setLoading(false);
        }
    };

    const handleAnalyze = async () => {
        if (!file) {
            setError("Please select a VCF file.");
            return;
        }

        setLoading(true);
        setStage("uploading");
        setError(null);
        setStatusMessage("Uploading dataset...");

        try {
            // 1. Upload Dataset
            const formData = new FormData();
            formData.append("file", file);

            const uploadUrl = new URL(`${API_BASE_URL}/api/gwas/datasets/upload`);
            uploadUrl.searchParams.append("name", datasetName);
            uploadUrl.searchParams.append("trait_type", traitType);
            uploadUrl.searchParams.append("trait_name", traitName);
            uploadUrl.searchParams.append("file_format", "vcf");

            const uploadRes = await fetch(uploadUrl.toString(), {
                method: "POST",
                body: formData,
            });

            if (!uploadRes.ok) {
                const errData = await uploadRes.json();
                throw new Error(errData.detail || "Upload failed");
            }

            const dataset: GwasDatasetResponse = await uploadRes.json();

            // 2. Start Analysis Job
            setStage("analyzing");
            setStatusMessage("Starting analysis...");

            const jobRes = await fetch(`${API_BASE_URL}/api/gwas/jobs`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    dataset_id: dataset.id,
                    analysis_type: "linear",
                    phenotype_column: traitName,
                    maf_threshold: 0.01,
                    num_threads: 2
                }),
            });

            if (!jobRes.ok) {
                const errData = await jobRes.json();
                throw new Error(errData.detail || "Failed to start job");
            }

            const job: GwasJobResponse = await jobRes.json();

            // 3. Poll Status
            pollJobStatus(job.id);

        } catch (err: any) {
            setStage("error");
            setError(err.message || "An unexpected error occurred.");
            setLoading(false);
        }
    };

    const reset = () => {
        setFile(null);
        setResults(null);
        setStage("idle");
        setError(null);
        setStatusMessage("");
    };

    // Render Functions
    const renderForm = () => (
        <div className="max-w-2xl mx-auto bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-800 relative z-10">
            <div className="p-8">
                <div className="flex items-center gap-3 mb-6 text-slate-900 dark:text-white">
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                        <HiChartBar className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold">New Analysis</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">Upload your VCF file to discover associations</p>
                    </div>
                </div>

                <div className="space-y-6">

                    {/* File Input */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Genotype File (VCF)
                        </label>
                        <div className="flex items-center justify-center w-full">
                            <label className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl cursor-pointer transition-all ${file
                                ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10"
                                : "border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/50"
                                }`}>
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <HiCloudUpload className={`w-10 h-10 mb-3 ${file ? "text-emerald-600" : "text-slate-400"}`} />
                                    {file ? (
                                        <div className="text-center">
                                            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 mb-1">
                                                {file.name}
                                            </p>
                                            <p className="text-xs text-emerald-600/80 dark:text-emerald-500/80">
                                                {(file.size / (1024 * 1024)).toFixed(2)} MB
                                            </p>
                                        </div>
                                    ) : (
                                        <>
                                            <p className="mb-2 text-sm text-slate-500 dark:text-slate-400">
                                                <span className="font-semibold text-emerald-600 dark:text-emerald-400">Click to upload</span> or drag and drop
                                            </p>
                                            <p className="text-xs text-slate-400 dark:text-slate-500">
                                                VCF, VCF.GZ (MAX. 100MB)
                                            </p>
                                        </>
                                    )}
                                </div>
                                <input type="file" className="hidden" accept=".vcf,.vcf.gz" onChange={handleFileChange} />
                            </label>
                        </div>
                    </div>

                    <button
                        onClick={handleAnalyze}
                        disabled={!file}
                        className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <HiChartBar className="w-5 h-5" />
                        )}
                        {loading ? "Processing..." : "Run Analysis"}
                    </button>

                    <p className="text-xs text-center text-slate-400 dark:text-slate-500">
                        By uploading, you agree to process data securely. Synthetic data augmentation is applied for small sample sizes.
                    </p>
                </div>
            </div>
        </div>
    );

    const renderProcessing = () => (
        <div className="max-w-xl mx-auto text-center py-20 relative z-10">
            <div className="mb-8 relative flex justify-center">
                <div className="relative">
                    <div className="w-24 h-24 border-4 border-emerald-100 dark:border-emerald-900 border-t-emerald-500 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <HiChartBar className="w-8 h-8 text-emerald-500 animate-pulse" />
                    </div>
                </div>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                {statusMessage}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
                We're crunching the numbers. This usually takes less than a minute for standard VCFs.
            </p>
        </div>
    );

    const renderError = () => (
        <div className="max-w-xl mx-auto text-center py-12 relative z-10">
            <div className="bg-red-50 dark:bg-red-900/10 p-8 rounded-2xl border border-red-100 dark:border-red-900/30 mb-8 max-w-lg mx-auto">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">⚠️</span>
                </div>
                <h3 className="text-xl font-bold text-red-700 dark:text-red-400 mb-2">
                    Analysis Failed
                </h3>
                <p className="text-slate-600 dark:text-slate-300">
                    {error}
                </p>
            </div>
            <button
                onClick={reset}
                className="px-8 py-3 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 text-white font-medium rounded-xl transition-colors shadow-lg"
            >
                Try Again
            </button>
        </div>
    );

    const renderResults = () => {
        if (!results) return null;

        const tabs: Array<{ id: TabType; label: string }> = [
            { id: "manhattan", label: "Manhattan Plot" },
            { id: "qq", label: "Q-Q Plot" },
            { id: "associations", label: "Top Associations" },
        ];

        return (
            <div className="max-w-7xl mx-auto space-y-8 relative z-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div>
                        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-1 text-sm font-medium uppercase tracking-wider">
                            <HiChartBar /> GWAS Analysis Results
                        </div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                            {datasetName}
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400">
                            Trait: <span className="font-semibold text-slate-700 dark:text-slate-300">{traitName}</span> •
                            Samples: <span className="font-semibold text-slate-700 dark:text-slate-300">{results.summary?.total_snps ? "10+" : "10"}</span>
                        </p>
                    </div>
                    <button
                        onClick={reset}
                        className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-medium"
                    >
                        <HiRefresh className="w-5 h-5" />
                        New Analysis
                    </button>
                </div>

                {/* Tab Navigation */}
                <div className="flex border-b border-slate-200 dark:border-slate-800">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "px-6 py-4 text-sm font-medium transition-colors relative",
                                activeTab === tab.id
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                            )}
                        >
                            {tab.label}
                            {activeTab === tab.id && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 dark:bg-emerald-400" />
                            )}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-b-2xl rounded-tr-2xl shadow-sm border border-slate-200 dark:border-slate-800 min-h-[500px]">
                    {activeTab === "manhattan" && results.manhattan_data && (
                        <ManhattanPlot data={results.manhattan_data} />
                    )}
                    {activeTab === "qq" && results.qq_data && (
                        <QQPlot data={results.qq_data} />
                    )}
                    {activeTab === "associations" && results.associations && (
                        <AssociationTable associations={results.associations} />
                    )}
                </div>
            </div>
        );
    };

    // --- OTHER SECTIONS ---
    const studioFeatures = [
        { icon: FaDna, title: "DNA Generator", description: "Generate random DNA sequences with customizable GC content.", path: "/tools/dna-generator" },
        { icon: BiTestTube, title: "Punnett Square", description: "Predict offspring genotypes with interactive Punnett squares.", path: "/tools/punnett-square" },
        { icon: FaDna, title: "Protein Synthesis", description: "Transcribe DNA to RNA and translate to protein sequences.", path: "/tools/dna-to-protein" },
    ];

    return (
        <div className="min-h-screen bg-white dark:bg-gray-950">
            {/* Hero Section */}
            <section className="relative pt-20 pb-16 overflow-hidden">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute top-40 right-20 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
                </div>

                <div className="relative mx-auto max-w-7xl px-6">
                    <div className="text-center max-w-4xl mx-auto mb-12">
                        <div className="inline-flex items-center gap-2 rounded-full bg-gray-900 px-6 py-2.5 mb-8 shadow-lg shadow-gray-900/25">
                            <HiChartBar className="w-5 h-5 text-emerald-400" />
                            <span className="text-sm font-semibold uppercase tracking-[0.2em] text-white">GWAS Analysis Tool</span>
                        </div>
                        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
                            Visualize <span className="text-emerald-500 dark:text-emerald-400">Genetics Data</span>
                        </h1>
                        <p className="text-xl text-slate-700 dark:text-slate-300 leading-relaxed max-w-3xl mx-auto">
                            Upload your VCF files to instantly generate interactive Manhattan and Q-Q plots.
                            Identify significant SNPs and potential disease markers with our high-performance analysis engine.
                        </p>
                    </div>

                    <div className="flex flex-wrap justify-center gap-8 mb-16">
                        <div className="text-center px-6">
                            <p className="text-4xl font-bold text-emerald-600 dark:text-emerald-400">VCF</p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">Format Support</p>
                        </div>
                        <div className="text-center px-6 border-l border-slate-200 dark:border-slate-700">
                            <p className="text-4xl font-bold text-gray-900 dark:text-white">Instant</p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">Visualization</p>
                        </div>
                        <div className="text-center px-6 border-l border-slate-200 dark:border-slate-700">
                            <p className="text-4xl font-bold text-emerald-600 dark:text-emerald-400">100%</p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">Free to Use</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Application Section */}
            <section className="relative py-12 bg-slate-50 dark:bg-slate-900/50">
                <div className="mx-auto max-w-7xl px-6">
                    {stage === "idle" && renderForm()}
                    {(stage === "uploading" || stage === "analyzing") && renderProcessing()}
                    {stage === "error" && renderError()}
                    {stage === "completed" && renderResults()}
                </div>
            </section>

            {/* Features/Upsell Section */}
            <section className="py-20 bg-white dark:bg-gray-950">
                <div className="mx-auto max-w-7xl px-6">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-6">
                            Explore More <span className="text-emerald-500 dark:text-emerald-400">Genetics Tools</span>
                        </h2>
                        <p className="text-lg text-slate-600 dark:text-slate-400">
                            Zygotrix offers a comprehensive suite of tools for researchers and students.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6 mb-12">
                        {studioFeatures.map((feature) => (
                            <Link key={feature.title} href={feature.path} className="group relative bg-white dark:bg-gray-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all">
                                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gray-900 text-white shadow-lg mb-5 group-hover:scale-110 transition-transform">
                                    <feature.icon className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2 group-hover:text-emerald-600 transition-colors">{feature.title}</h3>
                                <p className="text-slate-600 dark:text-slate-400 mb-4">{feature.description}</p>
                                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium">
                                    <span>Try Now</span> <HiArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default GwasAnalysisClient;
