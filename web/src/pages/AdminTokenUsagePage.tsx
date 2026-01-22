import React, { useState, useEffect } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { useAuth } from "../context/AuthContext";
import { MdError, MdRefresh } from "react-icons/md";
import { FaRobot } from "react-icons/fa";
import { BiLoaderAlt } from "react-icons/bi";

import useDocumentTitle from "../hooks/useDocumentTitle";
import { fetchChatbotSettings } from "../services/admin.api";
import type { ChatbotSettings } from "../types/auth";
import { getModelInfo } from "../features/admin/token-usage/utils/calculations";

import TabNavigation from "../features/admin/token-usage/components/shared/TabNavigation";
import OverviewTab from "../features/admin/token-usage/components/tabs/OverviewTab";
import CacheAnalyticsTab from "../features/admin/token-usage/components/tabs/CacheAnalyticsTab";
import EmbeddingsTab from "../features/admin/token-usage/components/tabs/EmbeddingsTab";
import DeepResearchTab from "../features/admin/token-usage/components/tabs/DeepResearchTab";
import WebSearchTab from "../features/admin/token-usage/components/tabs/WebSearchTab";
import ScholarModeTab from "../features/admin/token-usage/components/tabs/ScholarModeTab";

import Button from "../components/common/Button";

type TabId =
  | "overview"
  | "cache"
  | "embeddings"
  | "deep_research"
  | "web_search"
  | "scholar_mode";

const AdminTokenUsagePage: React.FC = () => {
  useDocumentTitle("AI Token Usage");

  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [chartDays, setChartDays] = useState(30);
  const [refreshSignal, setRefreshSignal] = useState(0);

  // Header Info
  const [chatbotSettings, setChatbotSettings] = useState<ChatbotSettings | null>(null);
  const [isHeaderLoading, setIsHeaderLoading] = useState(false);

  const hasAdminAccess =
    currentUser?.user_role === "super_admin" ||
    currentUser?.user_role === "admin";

  const fetchSettings = async () => {
    try {
      setIsHeaderLoading(true);
      const settings = await fetchChatbotSettings();
      setChatbotSettings(settings);
    } catch (err) {
      console.error("Failed to fetch settings", err);
    } finally {
      setIsHeaderLoading(false);
    }
  };

  useEffect(() => {
    if (hasAdminAccess) {
      fetchSettings();
    }
  }, [hasAdminAccess]);

  const handleRefresh = () => {
    setRefreshSignal((prev) => prev + 1);
    fetchSettings();
  };

  if (!hasAdminAccess) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <MdError className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Access Denied
            </h2>
            <p className="text-gray-500 dark:text-slate-400">
              Only admins can access token usage statistics.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const modelInfo = chatbotSettings ? getModelInfo(chatbotSettings.model) : null;

  return (
    <DashboardLayout>
      <div className="max-w-[1600px] mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600">
              <FaRobot className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  AI Token Usage
                </h1>
                {modelInfo && (
                  <div className="flex items-center gap-1.5 px-2 sm:px-3 py-1 bg-indigo-100 dark:bg-indigo-500/20 rounded-lg">
                    <FaRobot className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span className="text-xs sm:text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                      {modelInfo.name}
                    </span>
                    <span className="text-[10px] sm:text-xs text-indigo-600/70 dark:text-indigo-400/70">
                      (${modelInfo.input} / ${modelInfo.output} per MTok)
                    </span>
                  </div>
                )}
              </div>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400">
                Monitor Claude API consumption
              </p>
            </div>
          </div>
          <Button
            isLoading={isHeaderLoading}
            icon={<MdRefresh />}
            loadingIcon={<BiLoaderAlt className="w-4 h-4 animate-spin" />}
            disabled={isHeaderLoading}
            onClick={handleRefresh}
            text="Refresh"
            classNames="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-700 dark:text-white text-xs sm:text-sm transition-colors disabled:opacity-50 w-full sm:w-auto"
          />
        </div>

        {/* Tab Navigation */}
        <TabNavigation activeTab={activeTab} onTabChange={(t) => setActiveTab(t)} />

        {/* Tab Content */}
        {activeTab === "overview" && (
          <OverviewTab
            chartDays={chartDays}
            onChartDaysChange={setChartDays}
            refreshSignal={refreshSignal}
          />
        )}
        {activeTab === "cache" && (
          <CacheAnalyticsTab
            chartDays={chartDays}
            onChartDaysChange={setChartDays}
            refreshSignal={refreshSignal}
          />
        )}
        {activeTab === "embeddings" && (
          <EmbeddingsTab
            chartDays={chartDays}
            onChartDaysChange={setChartDays}
            refreshSignal={refreshSignal}
          />
        )}
        {activeTab === "deep_research" && (
          <DeepResearchTab
            chartDays={chartDays}
            refreshSignal={refreshSignal}
          />
        )}
        {activeTab === "web_search" && (
          <WebSearchTab
            chartDays={chartDays}
            refreshSignal={refreshSignal}
          />
        )}
        {activeTab === "scholar_mode" && (
          <ScholarModeTab
            chartDays={chartDays}
            onChartDaysChange={setChartDays}
            refreshSignal={refreshSignal}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminTokenUsagePage;
