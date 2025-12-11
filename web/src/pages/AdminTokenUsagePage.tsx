import React, { useState, useEffect } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { useAuth } from "../context/AuthContext";
import { getTokenUsageStats } from "../services/chatbotService";
import {
  MdError,
  MdRefresh,
  MdPerson,
  MdAutorenew,
} from "react-icons/md";
import {
  FaRobot,
  FaDatabase,
  FaChartLine,
  FaUsers,
} from "react-icons/fa";
import { BiLoaderAlt } from "react-icons/bi";
import { HiSparkles } from "react-icons/hi";

interface TokenUsageUser {
  user_id: string;
  user_name: string;
  total_tokens: number;
  input_tokens: number;
  output_tokens: number;
  request_count: number;
  cached_count: number;
  cache_hit_rate: string;
  last_request: string | null;
}

interface TokenUsageStats {
  total_tokens: number;
  total_input_tokens: number;
  total_output_tokens: number;
  total_requests: number;
  cached_requests: number;
  cache_hit_rate: string;
  user_count: number;
  users: TokenUsageUser[];
  error?: string;
}

const AdminTokenUsagePage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [stats, setStats] = useState<TokenUsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isSuperAdmin = currentUser?.user_role === "super_admin";

  useEffect(() => {
    if (isSuperAdmin) {
      fetchStats();
    }
  }, [isSuperAdmin]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getTokenUsageStats();
      if (data) {
        setStats(data as TokenUsageStats);
      } else {
        setError("Failed to fetch token usage statistics");
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch statistics";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(2)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Estimate cost (Claude Haiku: ~$0.25 per 1M input tokens, ~$1.25 per 1M output tokens)
  const estimateCost = (inputTokens: number, outputTokens: number) => {
    const inputCost = (inputTokens / 1000000) * 0.25;
    const outputCost = (outputTokens / 1000000) * 1.25;
    return (inputCost + outputCost).toFixed(4);
  };

  if (!isSuperAdmin) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <MdError className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">
              Access Denied
            </h2>
            <p className="text-slate-400">
              Only super admins can access token usage statistics.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-[1600px] mx-auto p-4 lg:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600">
              <FaRobot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                AI Token Usage
              </h1>
              <p className="text-sm text-slate-400">
                Monitor Claude API token consumption per user
              </p>
            </div>
          </div>
          <button
            onClick={fetchStats}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-white text-sm transition-colors disabled:opacity-50"
          >
            {loading ? (
              <BiLoaderAlt className="w-4 h-4 animate-spin" />
            ) : (
              <MdRefresh className="w-4 h-4" />
            )}
            Refresh
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3">
            <MdError className="w-5 h-5 text-red-500 flex-shrink-0" />
            <span className="text-red-400 text-sm">{error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <BiLoaderAlt className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
        ) : stats ? (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Tokens */}
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-indigo-500/20">
                    <HiSparkles className="w-5 h-5 text-indigo-400" />
                  </div>
                  <span className="text-sm text-slate-400">Total Tokens</span>
                </div>
                <div className="text-3xl font-bold text-white mb-1">
                  {formatNumber(stats.total_tokens)}
                </div>
                <div className="text-xs text-slate-500">
                  ~${estimateCost(stats.total_input_tokens, stats.total_output_tokens)} estimated cost
                </div>
              </div>

              {/* Total Requests */}
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-emerald-500/20">
                    <FaChartLine className="w-5 h-5 text-emerald-400" />
                  </div>
                  <span className="text-sm text-slate-400">Total Requests</span>
                </div>
                <div className="text-3xl font-bold text-white mb-1">
                  {formatNumber(stats.total_requests)}
                </div>
                <div className="text-xs text-slate-500">
                  API calls to Claude
                </div>
              </div>

              {/* Cache Hit Rate */}
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-amber-500/20">
                    <MdAutorenew className="w-5 h-5 text-amber-400" />
                  </div>
                  <span className="text-sm text-slate-400">Cache Hit Rate</span>
                </div>
                <div className="text-3xl font-bold text-white mb-1">
                  {stats.cache_hit_rate}
                </div>
                <div className="text-xs text-slate-500">
                  {stats.cached_requests} cached / {stats.total_requests} total
                </div>
              </div>

              {/* Active Users */}
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-purple-500/20">
                    <FaUsers className="w-5 h-5 text-purple-400" />
                  </div>
                  <span className="text-sm text-slate-400">Active Users</span>
                </div>
                <div className="text-3xl font-bold text-white mb-1">
                  {stats.user_count}
                </div>
                <div className="text-xs text-slate-500">
                  Users who chatted with Zigi
                </div>
              </div>
            </div>

            {/* Token Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <FaDatabase className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-medium text-white">Input Tokens</span>
                </div>
                <div className="text-2xl font-bold text-blue-400">
                  {formatNumber(stats.total_input_tokens)}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Tokens sent to Claude (prompts + context)
                </div>
              </div>

              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <FaDatabase className="w-4 h-4 text-green-400" />
                  <span className="text-sm font-medium text-white">Output Tokens</span>
                </div>
                <div className="text-2xl font-bold text-green-400">
                  {formatNumber(stats.total_output_tokens)}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Tokens generated by Claude (responses)
                </div>
              </div>

              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <FaDatabase className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-medium text-white">Tokens Saved</span>
                </div>
                <div className="text-2xl font-bold text-purple-400">
                  ~{formatNumber(stats.cached_requests * 150)}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Estimated tokens saved by caching
                </div>
              </div>
            </div>

            {/* User Table */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-slate-700 bg-slate-800">
                <h2 className="text-lg font-semibold text-white">
                  Usage by User
                </h2>
                <p className="text-sm text-slate-400">
                  Token consumption breakdown per user
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-800/50">
                      <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                        User
                      </th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Total Tokens
                      </th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider hidden sm:table-cell">
                        Input
                      </th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider hidden sm:table-cell">
                        Output
                      </th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Requests
                      </th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider hidden md:table-cell">
                        Cache Rate
                      </th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider hidden lg:table-cell">
                        Last Active
                      </th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Est. Cost
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {stats.users.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                          No usage data yet. Users will appear here after chatting with Zigi.
                        </td>
                      </tr>
                    ) : (
                      stats.users.map((user) => (
                        <tr
                          key={user.user_id}
                          className="hover:bg-slate-700/30 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                                <MdPerson className="w-4 h-4 text-white" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-white truncate max-w-[150px]">
                                  {user.user_name}
                                </p>
                                <p className="text-xs text-slate-500 truncate max-w-[150px]">
                                  {user.user_id === "anonymous" ? "Guest" : user.user_id.slice(0, 8) + "..."}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-sm font-medium text-white">
                              {formatNumber(user.total_tokens)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right hidden sm:table-cell">
                            <span className="text-sm text-blue-400">
                              {formatNumber(user.input_tokens)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right hidden sm:table-cell">
                            <span className="text-sm text-green-400">
                              {formatNumber(user.output_tokens)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-sm text-slate-300">
                              {user.request_count}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right hidden md:table-cell">
                            <span className={`text-sm ${
                              parseFloat(user.cache_hit_rate) > 50 
                                ? 'text-emerald-400' 
                                : parseFloat(user.cache_hit_rate) > 20 
                                  ? 'text-amber-400' 
                                  : 'text-slate-400'
                            }`}>
                              {user.cache_hit_rate}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right hidden lg:table-cell">
                            <span className="text-sm text-slate-400">
                              {formatDate(user.last_request)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-sm text-amber-400">
                              ${estimateCost(user.input_tokens, user.output_tokens)}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Info Card */}
            <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <HiSparkles className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-indigo-300 mb-1">
                    Token Usage Insights
                  </h3>
                  <p className="text-xs text-slate-400">
                    Tokens are the building blocks of AI text processing. Input tokens include your prompts and context, 
                    while output tokens are the AI's responses. The cache system helps reduce costs by serving repeated 
                    questions from memory instead of calling the API again. Claude Haiku pricing: ~$0.25/1M input tokens, 
                    ~$1.25/1M output tokens.
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </DashboardLayout>
  );
};

export default AdminTokenUsagePage;
