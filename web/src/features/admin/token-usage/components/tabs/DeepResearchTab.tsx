import React, { useEffect } from "react";
import { FaChartLine, FaUsers } from "react-icons/fa";
import { BiLoaderAlt } from "react-icons/bi";

import { useDeepResearchStats } from "../../hooks/useDeepResearchStats";
import StatsCard from "../../components/shared/StatsCard";
import HeroStatCard from "../../components/shared/HeroStatCard";
import UserUsageTable from "../../components/shared/UserUsageTable";
import { formatNumber } from "../../utils/formatters";

interface DeepResearchTabProps {
    chartDays: number; // Not used for chart here but maybe for refreshing? Hook uses it.
    refreshSignal: number;
}

const DeepResearchTab: React.FC<DeepResearchTabProps> = ({
    chartDays,
    refreshSignal,
}) => {
    const { stats, dailyData, loading, refresh } =
        useDeepResearchStats(chartDays);

    useEffect(() => {
        if (refreshSignal > 0) {
            refresh();
        }
    }, [refreshSignal, refresh]);

    if (loading && !stats) {
        return (
            <div className="flex items-center justify-center py-20">
                <BiLoaderAlt className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
        );
    }

    if (!stats) return null;

    const avgCost =
        stats.total_queries > 0
            ? (stats.total_cost / stats.total_queries).toFixed(4)
            : "0.0000";

    const openaiAvg =
        stats.total_queries > 0
            ? (stats.total_openai_cost / stats.total_queries).toFixed(4)
            : "0";
    const claudeAvg =
        stats.total_queries > 0
            ? (stats.total_claude_cost / stats.total_queries).toFixed(4)
            : "0";
    const cohereAvg =
        stats.total_queries > 0
            ? (stats.total_cohere_cost / stats.total_queries).toFixed(4)
            : "0";

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* HERO */}
            <HeroStatCard
                title="Average Cost Per Request"
                subtitle="Deep Research (including all token consumption)"
                value={`$${avgCost}`}
                valueSubtext="per research session"
                icon={<span className="text-3xl">🔬</span>}
                gradient="from-emerald-500 via-emerald-600 to-teal-600"
                borderColor="border-emerald-400/30"
                footerItems={[
                    { color: "bg-green-300", label: `OpenAI: $${openaiAvg}` },
                    { color: "bg-indigo-300", label: `Claude 3 Haiku: $${claudeAvg}` },
                    { color: "bg-purple-300", label: `Cohere: $${cohereAvg}` },
                ]}
            />

            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4">
                <StatsCard
                    title="Total Queries"
                    value={stats.total_queries.toString()}
                    subtext={`${stats.success_rate} success rate`}
                    icon={<span className="text-lg">🔬</span>}
                    iconBgColor="bg-emerald-100 dark:bg-emerald-500/20"
                />
                <StatsCard
                    title="Total Cost"
                    value={`$${stats.total_cost.toFixed(4)}`}
                    subtext="All deep research"
                    icon={<FaChartLine className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 dark:text-red-400" />}
                    iconBgColor="bg-red-100 dark:bg-red-500/20"
                    valueColor="text-red-600 dark:text-red-400"
                />
                <StatsCard
                    title="OpenAI"
                    value={formatNumber(
                        stats.total_openai_input_tokens + stats.total_openai_output_tokens
                    )}
                    subtext={`$${stats.total_openai_cost.toFixed(4)}`}
                    icon={<span className="text-xs font-bold text-green-600 dark:text-green-400">GPT</span>}
                    iconBgColor="bg-green-100 dark:bg-green-500/20"
                />
                <StatsCard
                    title="Claude"
                    value={formatNumber(
                        stats.total_claude_input_tokens + stats.total_claude_output_tokens
                    )}
                    subtext={`$${stats.total_claude_cost.toFixed(4)}`}
                    icon={<span className="text-xs font-bold text-orange-600 dark:text-orange-400">CL</span>}
                    iconBgColor="bg-orange-100 dark:bg-orange-500/20"
                />
                <StatsCard
                    title="Cohere"
                    value={stats.total_cohere_searches.toString()}
                    subtext={`$${stats.total_cohere_cost.toFixed(4)}`}
                    icon={<span className="text-xs font-bold text-purple-600 dark:text-purple-400">CO</span>}
                    iconBgColor="bg-purple-100 dark:bg-purple-500/20"
                />
                <StatsCard
                    title="Users"
                    value={stats.user_count.toString()}
                    subtext={`${stats.total_sources_retrieved} sources used`}
                    icon={<FaUsers className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 dark:text-blue-400" />}
                    iconBgColor="bg-blue-100 dark:bg-blue-500/20"
                />
            </div>

            {/* Monthly Projection */}
            {dailyData && (
                <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl p-4 sm:p-6 text-white">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h3 className="text-lg font-semibold">
                                Deep Research Cost Projection
                            </h3>
                            <p className="text-emerald-100 text-sm">
                                Based on last {dailyData.period_days} days
                            </p>
                        </div>
                        <div className="flex gap-6">
                            <div>
                                <p className="text-emerald-100 text-xs">Avg Daily Cost</p>
                                <p className="text-2xl font-bold">
                                    ${dailyData.avg_daily_cost?.toFixed(4) || "0.00"}
                                </p>
                            </div>
                            <div>
                                <p className="text-emerald-100 text-xs">Projected Monthly</p>
                                <p className="text-2xl font-bold">
                                    ${dailyData.projected_monthly_cost?.toFixed(2) || "0.00"}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Users Table */}
            <UserUsageTable
                title="Deep Research Usage by User"
                titleIcon={<span className="text-lg">🔬</span>}
                users={stats.users}
                headers={[
                    { label: "User" },
                    { label: "Queries", className: "text-right" },
                    { label: "OpenAI Tokens", className: "text-right hidden sm:table-cell" },
                    { label: "Claude Tokens", className: "text-right hidden sm:table-cell" },
                    { label: "Cohere Searches", className: "text-right hidden lg:table-cell" },
                    { label: "Cost", className: "text-right" },
                ]}
                renderRow={(user: any) => (
                    <tr key={user.user_id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30">
                        <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-semibold text-xs">
                                    {user.user_name?.charAt(0).toUpperCase() || "?"}
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-gray-900 dark:text-white">{user.user_name || "Unknown"}</div>
                                    <div className="text-xs text-gray-500 dark:text-slate-500">
                                        {user.last_query ? `Last: ${new Date(user.last_query).toLocaleDateString()}` : "No recent activity"}
                                    </div>
                                </div>
                            </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                            <div className="text-sm font-semibold text-gray-900 dark:text-white">{user.total_queries}</div>
                        </td>
                        <td className="px-4 py-3 text-right hidden sm:table-cell">
                            <div className="text-sm text-green-600 dark:text-green-400">{formatNumber(user.openai_tokens)}</div>
                        </td>
                        <td className="px-4 py-3 text-right hidden sm:table-cell">
                            <div className="text-sm text-orange-600 dark:text-orange-400">{formatNumber(user.claude_tokens)}</div>
                        </td>
                        <td className="px-4 py-3 text-right hidden lg:table-cell">
                            <div className="text-sm text-purple-600 dark:text-purple-400">{user.cohere_searches}</div>
                        </td>
                        <td className="px-4 py-3 text-right">
                            <div className="text-sm font-semibold text-red-600 dark:text-red-400">
                                ${user.total_cost?.toFixed(4) || "0.0000"}
                            </div>
                        </td>
                    </tr>
                )}
            />
        </div>
    );
};

export default DeepResearchTab;
