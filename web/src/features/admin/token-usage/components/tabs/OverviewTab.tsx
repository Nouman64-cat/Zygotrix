import React, { useEffect, useMemo } from "react";
import {
    MdTrendingUp,
    MdAutorenew,
} from "react-icons/md";
import { FaDatabase, FaChartLine, FaUsers } from "react-icons/fa";
import { HiSparkles } from "react-icons/hi";
import { BiLoaderAlt } from "react-icons/bi";
import type { ChartData } from "chart.js";

import { useTokenUsageStats } from "../../hooks/useTokenUsageStats";
import StatsCard from "../../components/shared/StatsCard";
import UsageChart from "../../components/shared/UsageChart";
import UserUsageTable from "../../components/shared/UserUsageTable";
import { formatNumber } from "../../utils/formatters";
import { estimateCost, getModelInfo } from "../../utils/calculations";
import type { TokenUsageUser } from "../../types";

interface OverviewTabProps {
    chartDays: number;
    onChartDaysChange: (days: number) => void;
    refreshSignal: number;
}

const OverviewTab: React.FC<OverviewTabProps> = ({
    chartDays,
    onChartDaysChange,
    refreshSignal,
}) => {
    const {
        stats,
        dailyData,
        chatbotSettings,
        loading,
        error,
        refresh,
    } = useTokenUsageStats(chartDays);

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
                    label: "Total Tokens",
                    data: dailyData.daily_usage.map((d) => d.total_tokens),
                    borderColor: "rgb(139, 92, 246)",
                    backgroundColor: "rgba(139, 92, 246, 0.1)",
                    fill: true,
                    tension: 0.4,
                    pointRadius: 3,
                    pointHoverRadius: 6,
                    borderWidth: 2,
                },
                {
                    label: "Input Tokens",
                    data: dailyData.daily_usage.map((d) => d.input_tokens),
                    borderColor: "rgb(6, 182, 212)", // Cyan
                    backgroundColor: "rgba(6, 182, 212, 0.05)",
                    fill: false,
                    tension: 0.4,
                    pointRadius: 3,
                    pointHoverRadius: 6,
                    borderWidth: 2,
                },
                {
                    label: "Output Tokens",
                    data: dailyData.daily_usage.map((d) => d.output_tokens),
                    borderColor: "rgb(16, 185, 129)", // Emerald
                    backgroundColor: "rgba(16, 185, 129, 0.05)",
                    fill: false,
                    tension: 0.4,
                    pointRadius: 3,
                    pointHoverRadius: 6,
                    borderWidth: 2,
                },
                {
                    label: "Requests",
                    // Scale requests up for visibility on same axis, handled by tooltip callback mostly, 
                    // or we can use y2 usage. The original used y1 (right axis). 
                    // UsageChart component passes options so we can define scales there.
                    data: dailyData.daily_usage.map((d) => d.request_count * 100),
                    borderColor: "rgb(245, 158, 11)", // Amber
                    backgroundColor: "rgba(245, 158, 11, 0.1)",
                    fill: false,
                    tension: 0.4,
                    pointRadius: 3,
                    pointHoverRadius: 6,
                    yAxisID: "y1",
                    borderWidth: 2,
                },
            ],
        };
    }, [dailyData]);

    // Chart Options
    const chartOptions = useMemo(() => ({
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
                borderColor: "rgba(99, 102, 241, 0.3)",
                borderWidth: 1,
                padding: 12,
                callbacks: {
                    label: function (context: any) {
                        const label = context.dataset.label || "";
                        const value = context.parsed.y;
                        if (label === "Requests") {
                            return `${label}: ${value / 100}`;
                        }
                        return `${label}: ${formatNumber(value)}`;
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
                title: { display: true, text: "Tokens" },
                grid: { color: "rgba(148, 163, 184, 0.1)" },
                ticks: {
                    callback: function (value: any) {
                        return formatNumber(value);
                    },
                },
            },
            y1: {
                type: "linear" as const,
                display: true,
                position: "right" as const,
                title: { display: true, text: "Requests" },
                grid: { drawOnChartArea: false },
                ticks: {
                    callback: function (value: any) {
                        const actual = value / 100;
                        return formatNumber(actual);
                    },
                },
            },
        },
    }), []);

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

    const modelInfo = getModelInfo(chatbotSettings?.model || "claude-3-haiku-20240307");

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Stats Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2 sm:gap-4">
                <StatsCard
                    title="Total Tokens"
                    value={formatNumber(stats.total_tokens)}
                    subtext={`${formatNumber(stats.total_input_tokens)} in / ${formatNumber(stats.total_output_tokens)} out`}
                    icon={<HiSparkles className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500 dark:text-indigo-400" />}
                    iconBgColor="bg-indigo-100 dark:bg-indigo-500/20"
                />
                <StatsCard
                    title="Current Cost"
                    value={`$${estimateCost(stats.total_input_tokens, stats.total_output_tokens)}`}
                    subtext="Total API cost"
                    icon={<FaChartLine className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 dark:text-emerald-400" />}
                    iconBgColor="bg-emerald-100 dark:bg-emerald-500/20"
                    valueColor="text-emerald-600 dark:text-emerald-400"
                />
                <StatsCard
                    title="Projected/Mo"
                    value={`$${dailyData?.summary ? dailyData.summary.projected_monthly_cost.toFixed(2) : "0.00"}`}
                    subtext={`${chartDays}-day avg`}
                    icon={<MdTrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 dark:text-amber-400" />}
                    iconBgColor="bg-amber-100 dark:bg-amber-500/20"
                    valueColor="text-amber-600 dark:text-amber-400"
                />
                <StatsCard
                    title="Requests"
                    value={formatNumber(stats.total_requests)}
                    subtext="API calls"
                    icon={<FaDatabase className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 dark:text-blue-400" />}
                    iconBgColor="bg-blue-100 dark:bg-blue-500/20"
                />
                <StatsCard
                    title="Response Cache"
                    value={stats.cache_hit_rate}
                    subtext={`${stats.cached_requests} / ${stats.total_requests}`}
                    icon={<MdAutorenew className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-500 dark:text-cyan-400" />}
                    iconBgColor="bg-cyan-100 dark:bg-cyan-500/20"
                />
                <StatsCard
                    title="Users"
                    value={stats.user_count.toString()}
                    subtext="Active chatters"
                    icon={<FaUsers className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500 dark:text-purple-400" />}
                    iconBgColor="bg-purple-100 dark:bg-purple-500/20"
                />
            </div>

            {/* Chart and Token Info Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
                {/* Chart */}
                <div className="lg:col-span-2">
                    <UsageChart
                        title="Usage Over Time"
                        data={chartData}
                        options={chartOptions}
                        days={chartDays}
                        onDaysChange={onChartDaysChange}
                    />
                </div>

                {/* Token Breakdown Stack */}
                <div className="flex flex-col gap-4">
                    {/* Input Tokens */}
                    <div className="bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <FaDatabase className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">Input Tokens</span>
                                </div>
                                <div className="text-2xl font-bold text-blue-500 dark:text-blue-400">{formatNumber(stats.total_input_tokens)}</div>
                                <div className="text-xs text-gray-400 dark:text-slate-500 mt-1">Prompts + context sent</div>
                            </div>
                            <div className="text-right pl-4 border-l border-gray-200 dark:border-slate-600">
                                <div className="text-xs text-gray-400 dark:text-slate-500 mb-1">Cost</div>
                                <div className="text-lg font-bold text-blue-600 dark:text-blue-300">
                                    ${((stats.total_input_tokens / 1000000) * modelInfo.input).toFixed(4)}
                                </div>
                                <div className="text-[10px] text-gray-400 dark:text-slate-500">
                                    @ ${modelInfo.input}/MTok
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Output Tokens */}
                    <div className="bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <FaDatabase className="w-4 h-4 text-green-500 dark:text-green-400" />
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">Output Tokens</span>
                                </div>
                                <div className="text-2xl font-bold text-green-500 dark:text-green-400">{formatNumber(stats.total_output_tokens)}</div>
                                <div className="text-xs text-gray-400 dark:text-slate-500 mt-1">Responses generated</div>
                            </div>
                            <div className="text-right pl-4 border-l border-gray-200 dark:border-slate-600">
                                <div className="text-xs text-gray-400 dark:text-slate-500 mb-1">Cost</div>
                                <div className="text-lg font-bold text-green-600 dark:text-green-300">
                                    ${((stats.total_output_tokens / 1000000) * modelInfo.output).toFixed(4)}
                                </div>
                                <div className="text-[10px] text-gray-400 dark:text-slate-500">
                                    @ ${modelInfo.output}/MTok
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Cache Tokens */}
                    <div className="bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <FaDatabase className="w-4 h-4 text-purple-500 dark:text-purple-400" />
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">Cache Tokens</span>
                                </div>
                                <div className="text-2xl font-bold text-purple-500 dark:text-purple-400">
                                    {formatNumber(stats.total_cache_read_tokens || 0)}
                                </div>
                                <div className="text-xs text-gray-400 dark:text-slate-500 mt-1">
                                    {stats.prompt_cache_hit_rate || "0.0%"} cache hit rate
                                </div>
                            </div>
                            <div className="text-right pl-4 border-l border-gray-200 dark:border-slate-600">
                                <div className="text-xs text-gray-400 dark:text-slate-500 mb-1">Saved</div>
                                <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                                    ${(stats.total_cache_savings || 0).toFixed(4)}
                                </div>
                                <div className="text-[10px] text-gray-400 dark:text-slate-500">
                                    90% cache discount
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* User Table */}
            <UserUsageTable
                title="Usage by User"
                users={stats.users}
                headers={[
                    { label: "User" },
                    { label: "Total Tokens", className: "text-right" },
                    { label: "Input", className: "text-right hidden sm:table-cell" },
                    { label: "Output", className: "text-right hidden sm:table-cell" },
                    { label: "Requests", className: "text-right" },
                    { label: "Cache Rate", className: "text-right hidden md:table-cell" },
                    { label: "Last Active", className: "text-right hidden lg:table-cell" },
                    { label: "Est. Cost", className: "text-right" },
                ]}
                renderRow={(user: TokenUsageUser) => (
                    <tr key={user.user_id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                        <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                                    <span className="text-white text-xs font-bold">
                                        {user.user_name.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-gray-900 dark:text-white">{user.user_name}</div>
                                    <div className="text-xs text-gray-400 dark:text-slate-500">{user.user_id}</div>
                                </div>
                            </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                            <div className="text-sm font-semibold text-gray-900 dark:text-white">{formatNumber(user.total_tokens)}</div>
                        </td>
                        <td className="px-4 py-3 text-right hidden sm:table-cell">
                            <div className="text-sm text-gray-600 dark:text-slate-400">{formatNumber(user.input_tokens)}</div>
                        </td>
                        <td className="px-4 py-3 text-right hidden sm:table-cell">
                            <div className="text-sm text-gray-600 dark:text-slate-400">{formatNumber(user.output_tokens)}</div>
                        </td>
                        <td className="px-4 py-3 text-right">
                            <div className="text-sm text-gray-600 dark:text-slate-400">{user.request_count}</div>
                        </td>
                        <td className="px-4 py-3 text-right hidden md:table-cell">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300">
                                {user.cache_hit_rate}
                            </span>
                        </td>
                        <td className="px-4 py-3 text-right hidden lg:table-cell">
                            <div className="text-xs text-gray-500 dark:text-slate-500">
                                {user.last_request ? new Date(user.last_request).toLocaleDateString() : "N/A"}
                            </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                            <div className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                                ${estimateCost(user.input_tokens, user.output_tokens)}
                            </div>
                        </td>
                    </tr>
                )}
            />
        </div>
    );
};

export default OverviewTab;
