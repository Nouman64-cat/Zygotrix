import React, { useEffect, useMemo } from "react";
import { MdAutorenew, MdTrendingUp } from "react-icons/md";
import { FaChartLine } from "react-icons/fa";
import { HiSparkles } from "react-icons/hi";
import { BiLoaderAlt } from "react-icons/bi";
import type { ChartData } from "chart.js";

import { useTokenUsageStats } from "../../hooks/useTokenUsageStats";

import UsageChart from "../../components/shared/UsageChart";
import { formatNumber } from "../../utils/formatters";

interface CacheAnalyticsTabProps {
    chartDays: number;
    onChartDaysChange: (days: number) => void;
    refreshSignal: number;
}

const CacheAnalyticsTab: React.FC<CacheAnalyticsTabProps> = ({
    chartDays,
    onChartDaysChange,
    refreshSignal,
}) => {
    const { stats, dailyData, loading, error, refresh } =
        useTokenUsageStats(chartDays);

    useEffect(() => {
        if (refreshSignal > 0) {
            refresh();
        }
    }, [refreshSignal, refresh]);

    // Chart Data Preparation
    const chartData: ChartData<"line"> = useMemo(() => {
        if (!dailyData) return { labels: [], datasets: [] };

        return {
            labels: dailyData.daily_usage.map((d) => {
                const date = new Date(d.date);
                return date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                });
            }),
            datasets: [
                {
                    label: "Prompt Cache Savings",
                    data: dailyData.daily_usage.map(
                        (d) => (d.prompt_cache_savings || 0) * 100,
                    ), // Convert to cents
                    borderColor: "rgb(16, 185, 129)",
                    backgroundColor: "rgba(16, 185, 129, 0.2)",
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointHoverRadius: 7,
                    borderWidth: 2,
                },
                {
                    label: "Response Cache Savings",
                    data: dailyData.daily_usage.map(
                        (d) => (d.response_cache_savings || 0) * 100,
                    ), // Convert to cents
                    borderColor: "rgb(6, 182, 212)",
                    backgroundColor: "rgba(6, 182, 212, 0.2)",
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointHoverRadius: 7,
                    borderWidth: 2,
                },
                {
                    label: "Total Cost",
                    data: dailyData.daily_usage.map((d) => (d.cost || 0) * 100), // Convert to cents
                    borderColor: "rgb(239, 68, 68)",
                    backgroundColor: "rgba(239, 68, 68, 0.1)",
                    fill: false,
                    tension: 0.4,
                    pointRadius: 4,
                    pointHoverRadius: 7,
                    borderWidth: 2,
                },
            ],
        };
    }, [dailyData]);

    const chartOptions = useMemo(
        () => ({
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: "index" as const,
                intersect: false,
            },
            plugins: {
                legend: {
                    position: "top" as const,
                    labels: { usePointStyle: true, padding: 20 },
                },
                tooltip: {
                    backgroundColor: "rgba(15, 23, 42, 0.9)",
                    titleColor: "#fff",
                    bodyColor: "#e2e8f0",
                    borderColor: "rgba(16, 185, 129, 0.5)",
                    borderWidth: 1,
                    padding: 12,
                    callbacks: {
                        label: function (context: any) {
                            const label = context.dataset.label || "";
                            const value = context.parsed.y / 100; // Convert back from cents to dollars
                            return `${label}: $${value.toFixed(4)}`;
                        },
                    },
                },
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { maxRotation: 45, minRotation: 45 },
                },
                y: {
                    type: "linear" as const,
                    display: true,
                    position: "left" as const,
                    title: { display: true, text: "Cost (cents)" },
                    grid: { color: "rgba(148, 163, 184, 0.1)" },
                    ticks: {
                        callback: function (value: number | string) {
                            const num = typeof value === "string" ? parseFloat(value) : value;
                            return `${num.toFixed(1)}¢`;
                        },
                    },
                },
            },
        }),
        [],
    );

    if (loading && !stats) {
        return (
            <div className="flex items-center justify-center py-20">
                <BiLoaderAlt className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl p-4 text-red-600 dark:text-red-400">
                {error}
            </div>
        );
    }

    if (!stats) return null;

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Prompt Caching Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
                {/* Cache Read Tokens */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-700 rounded-xl p-3 sm:p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 rounded-lg bg-green-100 dark:bg-green-500/20">
                            <HiSparkles className="w-4 h-4 text-green-600 dark:text-green-400" />
                        </div>
                        <span className="text-xs font-medium text-green-700 dark:text-green-300">
                            Cache Reads
                        </span>
                    </div>
                    <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                        {formatNumber(stats.total_cache_read_tokens || 0)}
                    </div>
                    <div className="text-[10px] text-green-600/70 dark:text-green-400/70">
                        90% cost reduction
                    </div>
                </div>

                {/* Total Cache Savings */}
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200 dark:border-emerald-700 rounded-xl p-3 sm:p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-500/20">
                            <FaChartLine className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                            Total Saved
                        </span>
                    </div>
                    <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                        ${(stats.total_cache_savings || 0).toFixed(2)}
                    </div>
                    <div className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70">
                        From prompt caching
                    </div>
                </div>

                {/* Prompt Cache Hit Rate */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-3 sm:p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-500/20">
                            <MdAutorenew className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                            Cache Efficiency
                        </span>
                    </div>
                    <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                        {stats.prompt_cache_hit_rate || "0.0%"}
                    </div>
                    <div className="text-[10px] text-blue-600/70 dark:text-blue-400/70">
                        Of input tokens cached
                    </div>
                </div>

                {/* Projected Monthly Savings */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-700 rounded-xl p-3 sm:p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-500/20">
                            <MdTrendingUp className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
                            Monthly Savings
                        </span>
                    </div>
                    <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                        $
                        {dailyData?.summary?.projected_monthly_savings
                            ? dailyData.summary.projected_monthly_savings.toFixed(2)
                            : "0.00"}
                    </div>
                    <div className="text-[10px] text-purple-600/70 dark:text-purple-400/70">
                        Projected cache savings
                    </div>
                </div>
            </div>

            {/* Cache Savings Chart - Full Width */}
            <div>
                <UsageChart
                    title="Cache Savings Over Time"
                    data={chartData}
                    options={chartOptions}
                    days={chartDays}
                    onDaysChange={onChartDaysChange}
                    icon={<FaChartLine className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />}
                />
                <div className="mt-2 text-xs text-gray-500 dark:text-slate-400 px-1">
                    Prompt caching reduces costs by 90% on cached tokens
                </div>

                {/* Cache Breakdown Pills */}
                <div className="mt-3 p-3 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                    <div className="flex items-center justify-between text-xs mb-2">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                            <span className="font-medium text-emerald-700 dark:text-emerald-300">Prompt Cache Savings</span>
                        </div>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                            ${dailyData?.summary?.total_prompt_cache_savings?.toFixed(2) || "0.00"}
                        </span>
                    </div>

                    <div className="flex items-center justify-between text-xs mb-2">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-cyan-500"></div>
                            <span className="font-medium text-cyan-700 dark:text-cyan-300">Response Cache Savings</span>
                        </div>
                        <span className="text-cyan-600 dark:text-cyan-400 font-bold">
                            ${dailyData?.summary?.total_response_cache_savings?.toFixed(2) || "0.00"}
                        </span>
                    </div>

                    <div className="pt-2 border-t border-emerald-300 dark:border-emerald-700">
                        <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                <span className="font-medium text-red-700 dark:text-red-300">Total Cost (with caching)</span>
                            </div>
                            <span className="text-red-600 dark:text-red-400 font-bold">
                                ${dailyData?.summary?.total_cost?.toFixed(2) || "0.00"}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Info Card - Dual Cache System */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-2 border-indigo-200 dark:border-indigo-700 rounded-xl p-4">
                <div className="flex items-start gap-3">
                    <HiSparkles className="w-5 h-5 text-indigo-500 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
                    <div className="space-y-3">
                        <h3 className="text-sm font-bold text-indigo-700 dark:text-indigo-300">
                            Dual Cache System
                        </h3>

                        {/* Response Cache */}
                        <div className="pl-3 border-l-2 border-cyan-400">
                            <h4 className="text-xs font-semibold text-cyan-700 dark:text-cyan-300 mb-1">
                                1. Response Cache (In-Memory)
                            </h4>
                            <p className="text-xs text-gray-600 dark:text-slate-400">
                                Stores complete LLM responses for <strong>1 hour</strong>. When
                                the same question is asked, returns instantly with{" "}
                                <strong className="text-emerald-600 dark:text-emerald-400">
                                    100% cost savings
                                </strong>{" "}
                                (zero API calls). Controlled via admin settings.
                            </p>
                        </div>

                        {/* Prompt Cache */}
                        <div className="pl-3 border-l-2 border-green-400">
                            <h4 className="text-xs font-semibold text-green-700 dark:text-green-300 mb-1">
                                2. Prompt Cache (Claude API)
                            </h4>
                            <p className="text-xs text-gray-600 dark:text-slate-400">
                                Caches conversation history and system prompts for{" "}
                                <strong>5 minutes</strong>. Cache reads cost{" "}
                                <strong className="text-emerald-600 dark:text-emerald-400">
                                    90% less
                                </strong>{" "}
                                than regular input tokens. Always enabled on every request.
                            </p>
                        </div>

                        {/* Pricing Example */}
                        <div className="mt-2 p-2 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                            <p className="text-xs text-gray-700 dark:text-slate-300">
                                <strong className="text-indigo-600 dark:text-indigo-300">
                                    Pricing (Haiku):
                                </strong>{" "}
                                Input $0.25/MTok • Cache write $0.30/MTok •
                                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                                    {" "}
                                    Cache read $0.03/MTok (90% off!)
                                </span>{" "}
                                • Output $1.25/MTok
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CacheAnalyticsTab;
