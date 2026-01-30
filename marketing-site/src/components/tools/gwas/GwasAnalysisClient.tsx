"use client";

import React, { useState, useEffect } from "react";
import { HiCloudUpload, HiRefresh, HiChartBar, HiInformationCircle } from "react-icons/hi";
import { ManhattanPlot } from "./ManhattanPlot";
import { QQPlot } from "./QQPlot";
import { AssociationTable } from "./AssociationTable";
import { cn } from "./utils";

const API_BASE_URL = process.env.NEXT_PUBLIC_ZYGOTRIX_API || "https://api.zygotrix.com";

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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
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
            // Backend expects: name, trait_type, trait_name, file_format
            // query params: name, trait_type, trait_name, file_format, description
            // It's a POST with query params + body file? 
            // app/routes/gwas.py: 
            // @router.post("/datasets/upload") 
            // name: str = Query(...)
            // file: UploadFile = File(...)

            // We need to construct URL with query params
            const uploadUrl = new URL(`${API_BASE_URL}/api/gwas/datasets/upload`);
            uploadUrl.searchParams.append("name", datasetName);
            uploadUrl.searchParams.append("trait_type", traitType);
            uploadUrl.searchParams.append("trait_name", traitName);
            uploadUrl.searchParams.append("file_format", "vcf"); // defaulting to vcf for now

            const uploadRes = await fetch(uploadUrl.toString(), {
                method: "POST",
                body: formData,
                // Don't set Content-Type header, let browser set it with boundary
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
                    analysis_type: "linear", // default
                    phenotype_column: traitName,
                    // Assuming the VCF/custom format handling matches. 
                    // Typically for VCF, phenotype might be separate or integrated. 
                    // For simplicty we send what the API expects.
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
        <div className="max-w-2xl mx-auto bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-700">
            <div className="p-8">
                <div className="flex items-center gap-3 mb-6 text-slate-900 dark:text-white">
                    <HiCloudUpload className="w-8 h-8 text-purple-600" />
                    <h2 className="text-2xl font-bold">Upload GWAS Data</h2>
                </div>

                <div className="space-y-6">
                    {/* Dataset Name */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Dataset Name
                        </label>
                        <input
                            type="text"
                            value={datasetName}
                            onChange={(e) => setDatasetName(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-purple-500"
                        />
                    </div>

                    {/* Trait Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Trait Name
                            </label>
                            <input
                                type="text"
                                value={traitName}
                                onChange={(e) => setTraitName(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-purple-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Type
                            </label>
                            <select
                                value={traitType}
                                onChange={(e) => setTraitType(e.target.value as any)}
                                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="quantitative">Quantitative</option>
                                <option value="binary">Binary</option>
                            </select>
                        </div>
                    </div>

                    {/* File Input */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            VCF File
                        </label>
                        <div className="flex items-center justify-center w-full">
                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 dark:border-slate-600 border-dashed rounded-lg cursor-pointer bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <HiCloudUpload className="w-8 h-8 mb-2 text-slate-400" />
                                    <p className="mb-2 text-sm text-slate-500 dark:text-slate-400">
                                        <span className="font-semibold">Click to upload</span> or drag and drop
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        VCF, VCF.GZ (MAX. 100MB)
                                    </p>
                                </div>
                                <input type="file" className="hidden" accept=".vcf,.vcf.gz" onChange={handleFileChange} />
                            </label>
                        </div>
                        {file && (
                            <p className="mt-2 text-sm text-center text-purple-600 font-medium">
                                Selected: {file.name}
                            </p>
                        )}
                    </div>

                    <button
                        onClick={handleAnalyze}
                        disabled={!file}
                        className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Run Analysis
                    </button>
                </div>
            </div>
        </div>
    );

    const renderProcessing = () => (
        <div className="max-w-xl mx-auto text-center py-12">
            <div className="mb-8 relative">
                <div className="w-24 h-24 mx-auto border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                {statusMessage}
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
                This may take a few minutes depending on file size.
            </p>
        </div>
    );

    const renderError = () => (
        <div className="max-w-xl mx-auto text-center py-12">
            <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-xl border border-red-200 dark:border-red-800 mb-6">
                <div className="text-red-500 text-5xl mb-4">⚠️</div>
                <h3 className="text-xl font-bold text-red-700 dark:text-red-400 mb-2">
                    Analysis Failed
                </h3>
                <p className="text-slate-700 dark:text-slate-300">
                    {error}
                </p>
            </div>
            <button
                onClick={reset}
                className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors"
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
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                            <HiChartBar className="text-purple-600" />
                            Analysis Results
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400 mt-1">
                            Dataset: {datasetName} • Trait: {traitName}
                        </p>
                    </div>
                    <button
                        onClick={reset}
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                        <HiRefresh className="w-5 h-5" />
                        New Analysis
                    </button>
                </div>

                {/* Tab Navigation */}
                <div className="flex border-b border-slate-200 dark:border-slate-700">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "px-6 py-3 text-sm font-medium transition-colors relative",
                                activeTab === tab.id
                                    ? "text-purple-600 dark:text-purple-400"
                                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                            )}
                        >
                            {tab.label}
                            {activeTab === tab.id && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 dark:bg-purple-400" />
                            )}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-b-2xl rounded-tr-2xl shadow-sm border border-slate-200 dark:border-slate-700">
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

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
            {stage === "idle" && renderForm()}
            {(stage === "uploading" || stage === "analyzing") && renderProcessing()}
            {stage === "error" && renderError()}
            {stage === "completed" && renderResults()}
        </div>
    );
};

export default GwasAnalysisClient;
