import React, { useState, useEffect } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { useAuth } from "../context/AuthContext";
import { fetchChatbotSettingsHistory, fetchPromptHistory } from "../services/admin.api";
import type { ChatbotSettingsHistory, PromptHistory } from "../types/auth";
import {
  MdError,
  MdRefresh,
  MdHistory,
  MdPerson,
  MdAccessTime,
  MdComputer,
  MdLocationOn,
  MdSettings,
  MdCode,
} from "react-icons/md";
import { FaRobot } from "react-icons/fa";
import { BiLoaderAlt } from "react-icons/bi";
import { HiSparkles } from "react-icons/hi";
import Button from "../components/common/Button";
import useDocumentTitle from "../hooks/useDocumentTitle";

type TabType = "settings" | "prompts";

const ChatbotSettingsAuditPage: React.FC = () => {
  useDocumentTitle("Chatbot Audit Log");

  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("settings");

  // Settings history state
  const [settingsHistory, setSettingsHistory] = useState<ChatbotSettingsHistory[]>([]);
  const [settingsTotalCount, setSettingsTotalCount] = useState(0);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsCurrentPage, setSettingsCurrentPage] = useState(1);

  // Prompt history state
  const [promptHistory, setPromptHistory] = useState<PromptHistory[]>([]);
  const [promptTotalCount, setPromptTotalCount] = useState(0);
  const [promptLoading, setPromptLoading] = useState(true);
  const [promptCurrentPage, setPromptCurrentPage] = useState(1);

  const [error, setError] = useState<string | null>(null);
  const itemsPerPage = 20;

  const isSuperAdmin = currentUser?.user_role === "super_admin";

  useEffect(() => {
    if (isSuperAdmin) {
      if (activeTab === "settings") {
        fetchSettingsHistory();
      } else {
        fetchPromptsHistory();
      }
    }
  }, [isSuperAdmin, activeTab, settingsCurrentPage, promptCurrentPage]);

  const fetchSettingsHistory = async () => {
    try {
      setSettingsLoading(true);
      setError(null);
      const skip = (settingsCurrentPage - 1) * itemsPerPage;
      const data = await fetchChatbotSettingsHistory(itemsPerPage, skip);
      setSettingsHistory(data.history);
      setSettingsTotalCount(data.total_count);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch settings audit history";
      setError(errorMessage);
    } finally {
      setSettingsLoading(false);
    }
  };

  const fetchPromptsHistory = async () => {
    try {
      setPromptLoading(true);
      setError(null);
      const skip = (promptCurrentPage - 1) * itemsPerPage;
      const data = await fetchPromptHistory(itemsPerPage, skip);
      setPromptHistory(data.history);
      setPromptTotalCount(data.total_count);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch prompt audit history";
      setError(errorMessage);
    } finally {
      setPromptLoading(false);
    }
  };

  const handleRefresh = () => {
    if (activeTab === "settings") {
      fetchSettingsHistory();
    } else {
      fetchPromptsHistory();
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatFieldName = (fieldName: string): string => {
    return fieldName
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const formatValue = (value: string | number | boolean | null | undefined): string => {
    if (value === null || value === undefined) return "Not set";
    if (typeof value === "boolean") return value ? "Enabled" : "Disabled";
    if (typeof value === "string" && value.includes("claude")) {
      return value.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
    }
    return String(value);
  };

  const formatPromptType = (promptType: string): string => {
    switch (promptType) {
      case "system": return "System Prompt";
      case "system_verbose": return "Verbose Prompt";
      case "simulation": return "Simulation Prompt";
      default: return promptType;
    }
  };

  const formatAction = (action: string): string => {
    return action === "reset" ? "Reset to Default" : "Updated";
  };

  const settingsTotalPages = Math.ceil(settingsTotalCount / itemsPerPage);
  const promptTotalPages = Math.ceil(promptTotalCount / itemsPerPage);
  const isLoading = activeTab === "settings" ? settingsLoading : promptLoading;

  if (!isSuperAdmin) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <MdError className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Access Denied
            </h2>
            <p className="text-gray-500 dark:text-slate-400">
              Only super admins can access the chatbot audit log.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600">
              <MdHistory className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                Chatbot Audit Log
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400">
                Complete history of all chatbot configuration changes
              </p>
            </div>
          </div>
          <Button
            isLoading={isLoading}
            icon={<MdRefresh />}
            loadingIcon={<BiLoaderAlt className="w-4 h-4 animate-spin" />}
            disabled={isLoading}
            onClick={handleRefresh}
            text="Refresh"
            classNames="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-700 dark:text-white text-xs sm:text-sm transition-colors disabled:opacity-50 w-full sm:w-auto"
          />
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("settings")}
              className={`${activeTab === "settings"
                ? "border-purple-500 text-purple-600 dark:text-purple-400"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors`}
            >
              <MdSettings className="w-5 h-5" />
              Settings Changes
              {settingsTotalCount > 0 && (
                <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                  {settingsTotalCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("prompts")}
              className={`${activeTab === "prompts"
                ? "border-purple-500 text-purple-600 dark:text-purple-400"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors`}
            >
              <MdCode className="w-5 h-5" />
              Prompt Changes
              {promptTotalCount > 0 && (
                <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                  {promptTotalCount}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Stats Card */}
        {!isLoading && (
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border border-purple-200 dark:border-purple-700/50 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <HiSparkles className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              <div>
                <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                  {activeTab === "settings" ? settingsTotalCount : promptTotalCount}
                </div>
                <div className="text-sm text-gray-600 dark:text-slate-400">
                  {activeTab === "settings" ? "Settings Changes Recorded" : "Prompt Changes Recorded"}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl p-4 flex items-center gap-3">
            <MdError className="w-5 h-5 text-red-500 flex-shrink-0" />
            <span className="text-red-600 dark:text-red-400 text-sm">
              {error}
            </span>
          </div>
        )}

        {/* Settings History Tab */}
        {activeTab === "settings" && (
          <>
            {settingsLoading ? (
              <div className="flex items-center justify-center py-20">
                <BiLoaderAlt className="w-8 h-8 text-purple-500 animate-spin" />
              </div>
            ) : settingsHistory.length > 0 ? (
              <>
                <div className="space-y-4">
                  {settingsHistory.map((entry, index) => (
                    <div
                      key={index}
                      className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow"
                    >
                      {/* Header */}
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-500/20 mt-0.5">
                            <FaRobot className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <MdPerson className="w-4 h-4 text-gray-500 dark:text-slate-400" />
                              <span className="font-semibold text-gray-900 dark:text-white">
                                {entry.updated_by_name || "Unknown Admin"}
                              </span>
                              {entry.updated_by_email && (
                                <span className="text-sm text-gray-500 dark:text-slate-400">
                                  ({entry.updated_by_email})
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-slate-400">
                              <MdAccessTime className="w-3.5 h-3.5" />
                              {formatDate(entry.timestamp)}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1 text-xs text-gray-500 dark:text-slate-400">
                          {entry.ip_address && (
                            <div className="flex items-center gap-1">
                              <MdLocationOn className="w-3.5 h-3.5" />
                              <span className="font-mono">{entry.ip_address}</span>
                            </div>
                          )}
                          {entry.user_agent && (
                            <div className="flex items-center gap-1">
                              <MdComputer className="w-3.5 h-3.5" />
                              <span className="truncate max-w-xs">
                                {entry.user_agent.split(" ")[0]}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Changes */}
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                          Changes Made:
                        </div>
                        {entry.changes.map((change, changeIndex) => (
                          <div
                            key={changeIndex}
                            className="bg-gray-50 dark:bg-slate-900/50 rounded-lg p-3 border border-gray-200 dark:border-slate-700"
                          >
                            <div className="font-medium text-sm text-gray-900 dark:text-white mb-2">
                              {formatFieldName(change.field_name)}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <div className="text-xs text-gray-500 dark:text-slate-500 mb-1">
                                  Previous Value
                                </div>
                                <div className="text-sm px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded text-red-700 dark:text-red-300 font-mono">
                                  {formatValue(change.old_value)}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-gray-500 dark:text-slate-500 mb-1">
                                  New Value
                                </div>
                                <div className="text-sm px-3 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded text-green-700 dark:text-green-300 font-mono">
                                  {formatValue(change.new_value)}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {settingsTotalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-4">
                    <Button
                      text="Previous"
                      disabled={settingsCurrentPage === 1}
                      onClick={() => setSettingsCurrentPage((p) => Math.max(1, p - 1))}
                      classNames="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-700 dark:text-white text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <span className="text-sm text-gray-600 dark:text-slate-400">
                      Page {settingsCurrentPage} of {settingsTotalPages}
                    </span>
                    <Button
                      text="Next"
                      disabled={settingsCurrentPage === settingsTotalPages}
                      onClick={() => setSettingsCurrentPage((p) => Math.min(settingsTotalPages, p + 1))}
                      classNames="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-700 dark:text-white text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-12 text-center">
                <MdSettings className="w-16 h-16 text-gray-300 dark:text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No Settings Changes Yet
                </h3>
                <p className="text-gray-500 dark:text-slate-400">
                  Chatbot settings changes will appear here once admins make updates.
                </p>
              </div>
            )}
          </>
        )}

        {/* Prompt History Tab */}
        {activeTab === "prompts" && (
          <>
            {promptLoading ? (
              <div className="flex items-center justify-center py-20">
                <BiLoaderAlt className="w-8 h-8 text-purple-500 animate-spin" />
              </div>
            ) : promptHistory.length > 0 ? (
              <>
                <div className="space-y-4">
                  {promptHistory.map((entry, index) => (
                    <div
                      key={index}
                      className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow"
                    >
                      {/* Header */}
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 mt-0.5">
                            <MdCode className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="px-2 py-0.5 text-xs rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium">
                                {formatPromptType(entry.prompt_type)}
                              </span>
                              <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${entry.action === "reset"
                                  ? "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300"
                                  : "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                                }`}>
                                {formatAction(entry.action)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <MdPerson className="w-4 h-4 text-gray-500 dark:text-slate-400" />
                              <span className="font-semibold text-gray-900 dark:text-white">
                                {entry.updated_by_name || "Unknown Admin"}
                              </span>
                              {entry.updated_by_email && (
                                <span className="text-sm text-gray-500 dark:text-slate-400">
                                  ({entry.updated_by_email})
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-slate-400">
                              <MdAccessTime className="w-3.5 h-3.5" />
                              {formatDate(entry.timestamp)}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1 text-xs text-gray-500 dark:text-slate-400">
                          {entry.ip_address && (
                            <div className="flex items-center gap-1">
                              <MdLocationOn className="w-3.5 h-3.5" />
                              <span className="font-mono">{entry.ip_address}</span>
                            </div>
                          )}
                          {entry.user_agent && (
                            <div className="flex items-center gap-1">
                              <MdComputer className="w-3.5 h-3.5" />
                              <span className="truncate max-w-xs">
                                {entry.user_agent.split(" ")[0]}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Changes */}
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                          Changes Made:
                        </div>
                        {entry.changes.map((change, changeIndex) => (
                          <div
                            key={changeIndex}
                            className="bg-gray-50 dark:bg-slate-900/50 rounded-lg p-3 border border-gray-200 dark:border-slate-700"
                          >
                            <div className="font-medium text-sm text-gray-900 dark:text-white mb-2">
                              {formatFieldName(change.field_name)}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <div className="text-xs text-gray-500 dark:text-slate-500 mb-1">
                                  Previous Value
                                </div>
                                <div className="text-sm px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded text-red-700 dark:text-red-300 font-mono break-words">
                                  {change.old_value || "Not set"}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-gray-500 dark:text-slate-500 mb-1">
                                  New Value
                                </div>
                                <div className="text-sm px-3 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded text-green-700 dark:text-green-300 font-mono break-words">
                                  {change.new_value || "Not set"}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {promptTotalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-4">
                    <Button
                      text="Previous"
                      disabled={promptCurrentPage === 1}
                      onClick={() => setPromptCurrentPage((p) => Math.max(1, p - 1))}
                      classNames="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-700 dark:text-white text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <span className="text-sm text-gray-600 dark:text-slate-400">
                      Page {promptCurrentPage} of {promptTotalPages}
                    </span>
                    <Button
                      text="Next"
                      disabled={promptCurrentPage === promptTotalPages}
                      onClick={() => setPromptCurrentPage((p) => Math.min(promptTotalPages, p + 1))}
                      classNames="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-700 dark:text-white text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-12 text-center">
                <MdCode className="w-16 h-16 text-gray-300 dark:text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No Prompt Changes Yet
                </h3>
                <p className="text-gray-500 dark:text-slate-400">
                  Prompt template changes will appear here once admins make updates.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ChatbotSettingsAuditPage;

