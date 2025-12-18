import React, { useState, useEffect, useCallback } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { useAuth } from "../context/AuthContext";
import {
    getJobHistory,
    getQueueStatus,
    type JobHistoryResponse,
    type JobHistoryItem,
    type QueueStatusResponse,
    type QueuedJobInfo,
} from "../services/proteinGenerator.api";
import {
    MdError,
    MdRefresh,
    MdCheckCircle,
    MdCancel,
    MdArrowForward,
} from "react-icons/md";
import { FaDna, FaClock, FaServer } from "react-icons/fa";
import { BiLoaderAlt } from "react-icons/bi";
import { HiSparkles } from "react-icons/hi";
import Button from "../components/common/Button";
import useDocumentTitle from "../hooks/useDocumentTitle";

// Visual Queue Item Component - accepts both QueuedJobInfo and JobHistoryItem
interface QueueItemProps {
    job: QueuedJobInfo | JobHistoryItem;
    position?: number;
    isProcessing?: boolean;
}



const QueueItem: React.FC<QueueItemProps> = ({ job, position, isProcessing }) => {
    const formatNumber = (num: number) => {
        if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`;
        if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
        if (num >= 1_000) return `${(num / 1_000).toFixed(0)}K`;
        return num.toString();
    };

    return (
        <div
            className={`
        relative flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all duration-500
        ${isProcessing
                    ? "bg-gradient-to-r from-blue-500/20 to-emerald-500/20 border-blue-400 dark:border-blue-500 shadow-lg shadow-blue-500/20 animate-pulse"
                    : "bg-white dark:bg-slate-800/80 border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500"
                }
      `}
        >
            {/* Position Badge */}
            {position !== undefined && (
                <div className="absolute -left-3 -top-3 w-7 h-7 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center shadow-lg">
                    #{position}
                </div>
            )}

            {/* Processing Indicator */}
            {isProcessing && (
                <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center">
                        <BiLoaderAlt className="w-6 h-6 text-white animate-spin" />
                    </div>
                </div>
            )}

            {/* DNA Icon */}
            {!isProcessing && (
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <FaDna className="w-5 h-5 text-white" />
                </div>
            )}

            {/* Job Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <code className="text-sm font-mono font-bold text-gray-800 dark:text-white">
                        {job.job_id}
                    </code>
                    {isProcessing && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-500/30 text-blue-700 dark:text-blue-300 rounded-full animate-pulse">
                            Processing...
                        </span>
                    )}
                </div>
                <div className="text-sm text-gray-500 dark:text-slate-400">
                    {formatNumber(job.sequence_length)} base pairs
                </div>
            </div>
        </div>
    );
};

// Completed Job Component
const CompletedJob: React.FC<{ job: JobHistoryItem }> = ({ job }) => {
    const formatDuration = (seconds: number | undefined) => {
        if (!seconds) return "—";
        if (seconds < 60) return `${seconds.toFixed(1)}s`;
        const mins = Math.floor(seconds / 60);
        const secs = Math.round(seconds % 60);
        return `${mins}m ${secs}s`;
    };

    const formatNumber = (num: number) => {
        if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
        if (num >= 1_000) return `${(num / 1_000).toFixed(0)}K`;
        return num.toString();
    };

    const isSuccess = job.status === "completed";

    return (
        <div
            className={`
        flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-300
        ${isSuccess
                    ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30"
                    : "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30"
                }
      `}
        >
            {/* Status Icon */}
            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${isSuccess
                ? "bg-emerald-500"
                : "bg-red-500"
                }`}>
                {isSuccess ? (
                    <MdCheckCircle className="w-6 h-6 text-white" />
                ) : (
                    <MdCancel className="w-6 h-6 text-white" />
                )}
            </div>

            {/* Job Info */}
            <div className="flex-1 min-w-0">
                <code className="text-sm font-mono font-bold text-gray-800 dark:text-white">
                    {job.job_id}
                </code>
                <div className="text-xs text-gray-500 dark:text-slate-400">
                    {formatNumber(job.sequence_length)} bp
                </div>
            </div>

            {/* Duration */}
            <div className="text-right">
                <div className={`text-sm font-semibold ${isSuccess ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                    }`}>
                    {isSuccess ? formatDuration(job.duration_seconds) : "Failed"}
                </div>
                {job.error && (
                    <div className="text-xs text-red-500 max-w-[100px] truncate" title={job.error}>
                        {job.error}
                    </div>
                )}
            </div>
        </div>
    );
};

const AdminJobQueuePage: React.FC = () => {
    useDocumentTitle("Job Queue Monitor");

    const { user: currentUser } = useAuth();
    const [history, setHistory] = useState<JobHistoryResponse | null>(null);
    const [queueStatus, setQueueStatus] = useState<QueueStatusResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [autoRefresh, setAutoRefresh] = useState(true);

    const isAdmin =
        currentUser?.user_role === "admin" ||
        currentUser?.user_role === "super_admin";

    const fetchData = useCallback(async () => {
        try {
            setError(null);
            const [historyData, statusData] = await Promise.all([
                getJobHistory(50),
                getQueueStatus(),
            ]);
            setHistory(historyData);
            setQueueStatus(statusData);
        } catch (err: unknown) {
            const errorMessage =
                err instanceof Error ? err.message : "Failed to fetch job data";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isAdmin) {
            fetchData();
        }
    }, [isAdmin, fetchData]);

    useEffect(() => {
        if (autoRefresh && isAdmin) {
            const interval = setInterval(fetchData, 3000);
            return () => clearInterval(interval);
        }
    }, [autoRefresh, isAdmin, fetchData]);

    const handleRefresh = () => {
        setLoading(true);
        fetchData();
    };

    // Separate jobs by status
    const processingJobs = history?.jobs.filter(j => j.status === "processing") || [];
    const queuedJobs = history?.jobs.filter(j => j.status === "queued") || [];
    const completedJobs = history?.jobs.filter(j => j.status === "completed" || j.status === "failed").slice(0, 10) || [];

    const formatNumber = (num: number) => {
        if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(2)}B`;
        if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
        if (num >= 1_000) return `${(num / 1_000).toFixed(0)}K`;
        return num.toString();
    };

    const formatDuration = (seconds: number | undefined | null) => {
        if (!seconds) return "—";
        if (seconds < 60) return `${seconds.toFixed(1)}s`;
        const mins = Math.floor(seconds / 60);
        const secs = Math.round(seconds % 60);
        return `${mins}m ${secs}s`;
    };

    const formatTimestamp = (timestamp: string | undefined) => {
        if (!timestamp) return "—";
        try {
            const date = new Date(timestamp);
            const now = new Date();
            const diffMs = now.getTime() - date.getTime();
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMs / 3600000);
            const diffDays = Math.floor(diffMs / 86400000);

            // If less than 1 minute ago
            if (diffMins < 1) return "Just now";
            // If less than 1 hour ago
            if (diffMins < 60) return `${diffMins}m ago`;
            // If less than 24 hours ago
            if (diffHours < 24) return `${diffHours}h ago`;
            // If less than 7 days ago
            if (diffDays < 7) return `${diffDays}d ago`;

            // Otherwise show full date
            return date.toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            });
        } catch {
            return "—";
        }
    };

    if (!isAdmin) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                        <MdError className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            Access Denied
                        </h2>
                        <p className="text-gray-500 dark:text-slate-400">
                            Only admins and super admins can access job queue monitoring.
                        </p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="max-w-[1600px] mx-auto p-3 sm:p-4 lg:p-6 space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-600 shadow-lg shadow-blue-500/25">
                            <FaServer className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                                Live Queue Monitor
                            </h1>
                            <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400">
                                Real-time sequence generation pipeline
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-400 cursor-pointer">
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    checked={autoRefresh}
                                    onChange={(e) => setAutoRefresh(e.target.checked)}
                                    className="sr-only"
                                />
                                <div className={`w-10 h-6 rounded-full transition-colors ${autoRefresh ? "bg-emerald-500" : "bg-gray-300 dark:bg-slate-600"
                                    }`}>
                                    <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${autoRefresh ? "translate-x-4" : ""
                                        }`} />
                                </div>
                            </div>
                            <span className={autoRefresh ? "text-emerald-600 dark:text-emerald-400 font-medium" : ""}>
                                Live
                            </span>
                        </label>
                        <Button
                            isLoading={loading}
                            icon={<MdRefresh />}
                            loadingIcon={<BiLoaderAlt className="w-4 h-4 animate-spin" />}
                            disabled={loading}
                            onClick={handleRefresh}
                            text="Refresh"
                            classNames="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-700 dark:text-white text-sm transition-colors disabled:opacity-50"
                        />
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl p-4 flex items-center gap-3">
                        <MdError className="w-5 h-5 text-red-500 flex-shrink-0" />
                        <span className="text-red-600 dark:text-red-400 text-sm">{error}</span>
                    </div>
                )}

                {loading && !history ? (
                    <div className="flex items-center justify-center py-20">
                        <BiLoaderAlt className="w-8 h-8 text-blue-500 animate-spin" />
                    </div>
                ) : (
                    <>
                        {/* ===== VISUAL QUEUE PIPELINE ===== */}
                        <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-6 overflow-hidden">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                <HiSparkles className="w-5 h-5 text-blue-500" />
                                Queue Pipeline
                            </h2>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-0 relative">

                                {/* === WAITING QUEUE === */}
                                <div className="relative">
                                    <div className="bg-amber-50 dark:bg-amber-500/10 rounded-xl p-4 border-2 border-amber-200 dark:border-amber-500/30 min-h-[280px]">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-2">
                                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-bold">
                                                    {queueStatus?.queued_jobs?.length || queueStatus?.queue_length || 0}
                                                </span>
                                                Waiting
                                            </h3>
                                            <FaClock className="w-4 h-4 text-amber-500" />
                                        </div>

                                        <div className="space-y-3">
                                            {/* Use queueStatus.queued_jobs for actual job data */}
                                            {queueStatus?.queued_jobs && queueStatus.queued_jobs.length > 0 ? (
                                                queueStatus.queued_jobs.map((job, idx) => (
                                                    <QueueItem key={job.job_id} job={job} position={idx + 1} />
                                                ))
                                            ) : queuedJobs.length > 0 ? (
                                                // Fallback to history-based queued jobs
                                                queuedJobs.map((job, idx) => (
                                                    <QueueItem key={job.job_id} job={job} position={idx + 1} />
                                                ))
                                            ) : (
                                                <div className="flex flex-col items-center justify-center py-8 text-center">
                                                    <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center mb-3">
                                                        <FaClock className="w-8 h-8 text-amber-400" />
                                                    </div>
                                                    <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">
                                                        Queue Empty
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-slate-500 mt-1">
                                                        No jobs waiting
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Arrow to Processing */}
                                    <div className="hidden lg:flex absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                                        <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-700 border-2 border-gray-200 dark:border-slate-600 flex items-center justify-center shadow-lg">
                                            <MdArrowForward className="w-5 h-5 text-gray-500 dark:text-slate-400" />
                                        </div>
                                    </div>
                                </div>

                                {/* === PROCESSING (CENTER) === */}
                                <div className="relative lg:px-8">
                                    <div className="bg-gradient-to-br from-blue-50 to-emerald-50 dark:from-blue-500/10 dark:to-emerald-500/10 rounded-xl p-4 border-2 border-blue-300 dark:border-blue-500/50 min-h-[280px] shadow-xl shadow-blue-500/10">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-2">
                                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 text-white text-xs font-bold animate-pulse">
                                                    {queueStatus?.processing_jobs?.length || queueStatus?.active_jobs || 0}
                                                </span>
                                                Processing
                                            </h3>
                                            <BiLoaderAlt className="w-5 h-5 text-blue-500 animate-spin" />
                                        </div>

                                        <div className="space-y-3">
                                            {/* Use queueStatus.processing_jobs for actual job data */}
                                            {queueStatus?.processing_jobs && queueStatus.processing_jobs.length > 0 ? (
                                                queueStatus.processing_jobs.map((job) => (
                                                    <QueueItem key={job.job_id} job={job} isProcessing />
                                                ))
                                            ) : processingJobs.length > 0 ? (
                                                // Fallback to history-based processing jobs
                                                processingJobs.map((job) => (
                                                    <QueueItem key={job.job_id} job={job} isProcessing />
                                                ))
                                            ) : (
                                                <div className="flex flex-col items-center justify-center py-8 text-center">
                                                    <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center mb-3">
                                                        <FaServer className="w-8 h-8 text-gray-400" />
                                                    </div>
                                                    <p className="text-sm text-gray-600 dark:text-slate-400 font-medium">
                                                        Idle
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-slate-500 mt-1">
                                                        Ready for jobs
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Arrow to Completed */}
                                    <div className="hidden lg:flex absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                                        <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-700 border-2 border-gray-200 dark:border-slate-600 flex items-center justify-center shadow-lg">
                                            <MdArrowForward className="w-5 h-5 text-gray-500 dark:text-slate-400" />
                                        </div>
                                    </div>
                                </div>

                                {/* === COMPLETED === */}
                                <div className="relative">
                                    <div className="bg-emerald-50 dark:bg-emerald-500/10 rounded-xl p-4 border-2 border-emerald-200 dark:border-emerald-500/30 min-h-[280px]">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500 text-white text-xs font-bold">
                                                    {history?.completed_jobs || 0}
                                                </span>
                                                Completed
                                            </h3>
                                            <MdCheckCircle className="w-5 h-5 text-emerald-500" />
                                        </div>

                                        <div className="space-y-2 max-h-[220px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-emerald-300 dark:scrollbar-thumb-emerald-600">
                                            {completedJobs.length > 0 ? (
                                                completedJobs.map((job) => (
                                                    <CompletedJob key={job.job_id} job={job} />
                                                ))
                                            ) : (
                                                <div className="flex flex-col items-center justify-center py-8 text-center">
                                                    <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center mb-3">
                                                        <MdCheckCircle className="w-8 h-8 text-emerald-400" />
                                                    </div>
                                                    <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                                                        No Completed Jobs
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-slate-500 mt-1">
                                                        Jobs appear here after finishing
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ===== STATISTICS ROW ===== */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4">
                                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {history?.total_jobs || 0}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-slate-400">Total Jobs</div>
                            </div>
                            <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4">
                                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                    {formatDuration(history?.avg_duration_seconds)}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-slate-400">Avg Duration</div>
                            </div>
                            <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4">
                                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                    {formatNumber(history?.total_bp_processed || 0)}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-slate-400">Total BP</div>
                            </div>
                            <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4">
                                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                    {history?.total_jobs && history.completed_jobs
                                        ? `${((history.completed_jobs / history.total_jobs) * 100).toFixed(0)}%`
                                        : "—"}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-slate-400">Success Rate</div>
                            </div>
                        </div>

                        {/* ===== JOB HISTORY TABLE ===== */}
                        <div className="bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden">
                            <div className="p-4 border-b border-gray-200 dark:border-slate-700">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Job History</h2>
                            </div>
                            <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                                <table className="w-full">
                                    <thead className="sticky top-0 bg-gray-50 dark:bg-slate-800">
                                        <tr>
                                            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Job ID</th>
                                            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Status</th>
                                            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Created</th>
                                            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Completed</th>
                                            <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Size</th>
                                            <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Duration</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-slate-700/50">
                                        {history?.jobs.length ? (
                                            history.jobs.map((job) => (
                                                <tr key={job.job_id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30">
                                                    <td className="px-4 py-3">
                                                        <code className="text-sm font-mono text-gray-700 dark:text-slate-300">
                                                            {job.job_id}
                                                        </code>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${job.status === "completed"
                                                            ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                                                            : job.status === "failed"
                                                                ? "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300"
                                                                : job.status === "processing"
                                                                    ? "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300"
                                                                    : "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300"
                                                            }`}>
                                                            {job.status === "completed" && <MdCheckCircle className="w-3 h-3" />}
                                                            {job.status === "failed" && <MdCancel className="w-3 h-3" />}
                                                            {job.status === "processing" && <BiLoaderAlt className="w-3 h-3 animate-spin" />}
                                                            {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-left text-sm text-gray-600 dark:text-slate-400">
                                                        {formatTimestamp(job.created_at)}
                                                    </td>
                                                    <td className="px-4 py-3 text-left text-sm text-gray-600 dark:text-slate-400">
                                                        {formatTimestamp(job.completed_at)}
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-sm text-gray-700 dark:text-slate-300">
                                                        {formatNumber(job.sequence_length)} bp
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                                                        {formatDuration(job.duration_seconds)}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                               <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                                                    No jobs recorded yet
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </DashboardLayout>
    );
};

export default AdminJobQueuePage;
