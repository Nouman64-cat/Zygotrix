import React, { useState, useEffect, useRef } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { useAuth } from "../context/AuthContext";
import {
  fetchChatbotSettings,
  updateChatbotSettings,
  fetchAllPrompts,
  updatePrompt,
  resetPromptToDefault,
} from "../services/admin.api";
import type { ChatbotSettings, PromptTemplate, PromptType } from "../types/auth";
import { MdError, MdCheckCircle, MdSettings, MdCode, MdRefresh } from "react-icons/md";
import { BiLoaderAlt } from "react-icons/bi";
import { FaRobot } from "react-icons/fa";
import Button from "../components/common/Button";
import useDocumentTitle from "../hooks/useDocumentTitle";

const AdminChatbotSettingsPage: React.FC = () => {
  useDocumentTitle("Chatbot Settings");

  const botName = import.meta.env.VITE_ZYGOTRIX_BOT_NAME || "Zigi";
  const { user: currentUser } = useAuth();
  const [settings, setSettings] = useState<ChatbotSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Tab state
  const [activeTab, setActiveTab] = useState<"settings" | "prompts">("settings");

  // Prompt management state
  const [prompts, setPrompts] = useState<PromptTemplate[]>([]);
  const [promptsLoading, setPromptsLoading] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<PromptType | null>(null);
  const [promptContent, setPromptContent] = useState("");
  const [promptDescription, setPromptDescription] = useState("");
  const [promptActive, setPromptActive] = useState(true);
  const [promptSaving, setPromptSaving] = useState(false);
  const [promptError, setPromptError] = useState<string | null>(null);
  const [promptSuccess, setPromptSuccess] = useState<string | null>(null);

  // Refs for scroll synchronization
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  // Form state
  const [formData, setFormData] = useState<ChatbotSettings>({
    token_limit_per_session: 25000,
    max_tokens: 1024,
    temperature: 0.7,
    reset_limit_hours: 5,
    model: "claude-3-5-haiku-20241022",
    enabled: true,
    response_caching: true,
  });

  const isAdmin =
    currentUser?.user_role === "admin" ||
    currentUser?.user_role === "super_admin";

  useEffect(() => {
    if (isAdmin) {
      fetchSettings();
      if (activeTab === "prompts") {
        fetchPromptsData();
      }
    }
  }, [isAdmin, activeTab]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchChatbotSettings();
      setSettings(data);
      setFormData(data);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch settings";
      setError(errorMessage);
      // Set default values if fetch fails
      setFormData({
        token_limit_per_session: 25000,
        max_tokens: 1024,
        temperature: 0.7,
        reset_limit_hours: 5,
        model: "claude-3-5-haiku-20241022",
        enabled: true,
        response_caching: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : type === "number"
            ? parseFloat(value)
            : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setError(null);
    setSaving(true);

    try {
      const response = await updateChatbotSettings(formData);
      setSuccessMessage(response.message || "Settings updated successfully!");
      setSettings(response.settings);
      setFormData(response.settings);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update settings";
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (settings) {
      setFormData(settings);
      setSuccessMessage(null);
      setError(null);
    }
  };

  // Prompt management functions
  const fetchPromptsData = async () => {
    try {
      setPromptsLoading(true);
      setPromptError(null);
      const data = await fetchAllPrompts();
      setPrompts(data);

      // Select first prompt by default if none selected
      if (!selectedPrompt && data.length > 0) {
        selectPrompt(data[0].prompt_type as PromptType, data[0]);
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch prompts";
      setPromptError(errorMessage);
    } finally {
      setPromptsLoading(false);
    }
  };

  const selectPrompt = (promptType: PromptType, prompt?: PromptTemplate) => {
    setSelectedPrompt(promptType);
    setPromptError(null);
    setPromptSuccess(null);

    // Find the prompt data from the array (or use the passed prompt)
    const promptData = prompt || prompts.find((p) => p.prompt_type === promptType);

    if (promptData) {
      setPromptContent(promptData.prompt_content);
      setPromptDescription(promptData.description || "");
      setPromptActive(promptData.is_active);
    } else {
      // Clear content if no prompt found for this type
      setPromptContent("");
      setPromptDescription("");
      setPromptActive(true);
    }
  };

  const handlePromptSave = async () => {
    if (!selectedPrompt) return;

    setPromptSaving(true);
    setPromptError(null);
    setPromptSuccess(null);

    try {
      await updatePrompt(selectedPrompt, {
        prompt_content: promptContent,
        description: promptDescription || null,
        is_active: promptActive,
      });

      // Refresh prompts from server to ensure we have the latest data
      const refreshedPrompts = await fetchAllPrompts();
      setPrompts(refreshedPrompts);

      setPromptSuccess("Prompt updated successfully!");
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update prompt";
      setPromptError(errorMessage);
    } finally {
      setPromptSaving(false);
    }
  };

  const handlePromptReset = async () => {
    if (!selectedPrompt) return;

    if (!window.confirm("Are you sure you want to reset this prompt to default?")) {
      return;
    }

    setPromptSaving(true);
    setPromptError(null);
    setPromptSuccess(null);

    try {
      await resetPromptToDefault(selectedPrompt);
      setPromptSuccess("Prompt reset to default successfully!");

      // Refresh prompts list
      await fetchPromptsData();
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to reset prompt";
      setPromptError(errorMessage);
    } finally {
      setPromptSaving(false);
    }
  };

  // Synchronize scroll between textarea and line numbers
  const handleTextareaScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <MdError className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
              Access Denied
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              You don't have permission to access this page.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
              <FaRobot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Chatbot Settings
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Configure {botName} chatbot behavior and limits
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab("settings")}
                className={`${activeTab === "settings"
                  ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors`}
              >
                <MdSettings className="w-5 h-5" />
                Configuration
              </button>
              <button
                onClick={() => setActiveTab("prompts")}
                className={`${activeTab === "prompts"
                  ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors`}
              >
                <MdCode className="w-5 h-5" />
                Prompt Templates
              </button>
            </nav>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
            <MdError className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-start gap-3">
            <MdCheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <p className="text-green-800 dark:text-green-200">
              {successMessage}
            </p>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <>
            {/* Loading State */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <BiLoaderAlt className="w-8 h-8 animate-spin text-indigo-600" />
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <form onSubmit={handleSubmit}>
                  {/* Settings Form */}
                  <div className="p-6 space-y-6">
                    {/* Model Selection - Full Width */}
                    <div>
                      <label
                        htmlFor="model"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                      >
                        AI Model
                      </label>
                      <select
                        id="model"
                        name="model"
                        value={formData.model}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer"
                      >
                        <optgroup label="Latest Models">
                          <option value="claude-opus-4-1-20250805">
                            Claude Opus 4.1 (Latest, Most Advanced)
                          </option>
                          <option value="claude-opus-4-20250514">
                            Claude Opus 4 (Most Capable)
                          </option>
                          <option value="claude-sonnet-4-20250514">
                            Claude Sonnet 4 (Smart, Fast)
                          </option>
                          <option value="claude-3-7-sonnet-20250219">
                            Claude 3.7 Sonnet (Balanced)
                          </option>
                          <option value="claude-3-5-haiku-20241022">
                            Claude 3.5 Haiku (Fast, Cost-Effective)
                          </option>
                        </optgroup>
                        <optgroup label="Legacy Models">
                          <option value="claude-3-haiku-20240307">
                            Claude 3 Haiku
                          </option>
                        </optgroup>
                      </select>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Select the Claude model to power {botName}
                      </p>
                    </div>

                    {/* Two-Column Grid: Token Settings */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Token Limit Per Session */}
                      <div>
                        <label
                          htmlFor="token_limit_per_session"
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                        >
                          Session Token Limit
                        </label>
                        <input
                          type="number"
                          id="token_limit_per_session"
                          name="token_limit_per_session"
                          value={formData.token_limit_per_session}
                          onChange={handleInputChange}
                          min="1000"
                          max="200000"
                          step="1000"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          Max tokens per user session (1K-200K)
                        </p>
                      </div>

                      {/* Max Tokens Per Response */}
                      <div>
                        <label
                          htmlFor="max_tokens"
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                        >
                          Response Token Limit
                        </label>
                        <input
                          type="number"
                          id="max_tokens"
                          name="max_tokens"
                          value={formData.max_tokens}
                          onChange={handleInputChange}
                          min="128"
                          max="4096"
                          step="128"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          Max tokens per response (128-4096)
                        </p>
                      </div>
                    </div>

                    {/* Two-Column Grid: Behavior Settings */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Reset Limit Hours */}
                      <div>
                        <label
                          htmlFor="reset_limit_hours"
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                        >
                          Reset Interval (Hours)
                        </label>
                        <input
                          type="number"
                          id="reset_limit_hours"
                          name="reset_limit_hours"
                          value={formData.reset_limit_hours}
                          onChange={handleInputChange}
                          min="1"
                          max="168"
                          step="1"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          How often limits reset (1-168 hrs)
                        </p>
                      </div>

                      {/* Temperature - Compact Version */}
                      <div>
                        <label
                          htmlFor="temperature"
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                        >
                          Temperature: {formData.temperature}
                        </label>
                        <input
                          type="range"
                          id="temperature"
                          name="temperature"
                          value={formData.temperature}
                          onChange={handleInputChange}
                          min="0"
                          max="1"
                          step="0.1"
                          className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                          <span>Focused</span>
                          <span>Balanced</span>
                          <span>Creative</span>
                        </div>
                      </div>
                    </div>

                    {/* Enabled Toggle - Full Width */}
                    <div className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${formData.enabled
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                      : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                      }`}>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <label
                            htmlFor="enabled"
                            className="text-sm font-medium text-gray-700 dark:text-gray-300"
                          >
                            Chatbot Status
                          </label>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${formData.enabled
                            ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                            : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                            }`}>
                            {formData.enabled ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formData.enabled
                            ? `${botName} is currently active for all users`
                            : `${botName} is currently disabled for all users`}
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          id="enabled"
                          name="enabled"
                          checked={formData.enabled}
                          onChange={handleInputChange}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>

                    {/* Response Caching Toggle - Full Width */}
                    <div className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${formData.response_caching
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                      : 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
                      }`}>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <label
                            htmlFor="response_caching"
                            className="text-sm font-medium text-gray-700 dark:text-gray-300"
                          >
                            Response Caching
                          </label>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${formData.response_caching
                            ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                            : 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200'
                            }`}>
                            {formData.response_caching ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formData.response_caching
                            ? 'LLM responses are being cached for faster delivery and reduced costs'
                            : 'LLM responses are not cached - may result in higher latency and costs'}
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          id="response_caching"
                          name="response_caching"
                          checked={formData.response_caching}
                          onChange={handleInputChange}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between gap-4">
                    <Button
                      type="button"
                      onClick={handleReset}
                      disabled={saving}
                      text="Reset Changes"
                      classNames="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 cursor-pointer"
                    />
                    <Button
                      type="submit"
                      disabled={saving}
                      text="Save Settings"
                      classNames="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 cursor-pointer"
                      icon={<MdSettings />}
                      isLoading={saving}
                      loadingIcon={<BiLoaderAlt />}
                    />
                  </div>
                </form>
              </div>
            )}
          </>
        )}

        {/* Prompts Tab */}
        {activeTab === "prompts" && (
          <>
            {/* Prompt Messages */}
            {promptError && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
                <MdError className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-800 dark:text-red-200">{promptError}</p>
              </div>
            )}

            {promptSuccess && (
              <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-start gap-3">
                <MdCheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <p className="text-green-800 dark:text-green-200">{promptSuccess}</p>
              </div>
            )}

            {/* Prompt Loading State */}
            {promptsLoading ? (
              <div className="flex items-center justify-center py-12">
                <BiLoaderAlt className="w-8 h-8 animate-spin text-indigo-600" />
              </div>
            ) : (
              <div className="grid grid-cols-12 gap-6">
                {/* Prompt Type Selector */}
                <div className="col-span-3">
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                      <h3 className="font-semibold text-gray-900 dark:text-white">Prompt Types</h3>
                    </div>
                    <div className="p-2">
                      {[
                        { type: "system" as PromptType, label: "System Prompt", description: "Main chatbot prompt" },
                        { type: "system_verbose" as PromptType, label: "Verbose Prompt", description: "Detailed fallback prompt" },
                        { type: "simulation" as PromptType, label: "Simulation Prompt", description: "Simulation tool commands" },
                      ].map((item) => (
                        <button
                          key={item.type}
                          onClick={() => selectPrompt(item.type)}
                          className={`w-full text-left px-3 py-2.5 rounded-lg mb-1 transition-all ${selectedPrompt === item.type
                            ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium"
                            : "hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300"
                            }`}
                        >
                          <div className="font-medium text-sm">{item.label}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.description}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Prompt Editor */}
                <div className="col-span-9">
                  {selectedPrompt && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700">
                      <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {selectedPrompt === "system" && "System Prompt"}
                            {selectedPrompt === "system_verbose" && "Verbose System Prompt"}
                            {selectedPrompt === "simulation" && "Simulation Prompt"}
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            Edit the prompt template content below
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={promptActive}
                              onChange={(e) => setPromptActive(e.target.checked)}
                              className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
                          </label>
                        </div>
                      </div>

                      <div className="p-6 space-y-4">
                        {/* Description */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Description
                          </label>
                          <input
                            type="text"
                            value={promptDescription}
                            onChange={(e) => setPromptDescription(e.target.value)}
                            placeholder="Brief description of this prompt"
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          />
                        </div>

                        {/* Prompt Content */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Prompt Content
                          </label>
                          <div className="relative border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-white dark:bg-gray-900">
                            <div className="flex" style={{ height: '480px' }}>
                              {/* Line Numbers */}
                              <div
                                ref={lineNumbersRef}
                                className="flex-shrink-0 bg-gray-50 dark:bg-gray-800 border-r border-gray-300 dark:border-gray-600 select-none overflow-hidden pointer-events-none"
                                style={{
                                  height: '480px',
                                  paddingTop: '12px',
                                  paddingBottom: '12px'
                                }}
                              >
                                <div className="px-3 font-mono text-sm text-gray-500 dark:text-gray-400 text-right" style={{ lineHeight: '1.5rem' }}>
                                  {promptContent.split('\n').map((_, index) => (
                                    <div key={index} style={{ height: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                                      {index + 1}
                                    </div>
                                  ))}
                                </div>
                              </div>
                              {/* Textarea */}
                              <textarea
                                ref={textareaRef}
                                value={promptContent}
                                onChange={(e) => setPromptContent(e.target.value)}
                                onScroll={handleTextareaScroll}
                                rows={20}
                                className="flex-1 bg-transparent text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm resize-none overflow-y-auto"
                                placeholder="Enter prompt template content..."
                                style={{
                                  height: '480px',
                                  padding: '12px 16px',
                                  lineHeight: '1.5rem'
                                }}
                              />
                            </div>
                          </div>
                          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                            Available placeholders: {"{BOT_NAME}"}, {"{user_name}"}, {"{FRONTEND_URL}"}, {"{simulation_context}"}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3 pt-4">
                          <Button
                            onClick={handlePromptSave}
                            disabled={promptSaving || !promptContent.trim()}
                            text={promptSaving ? "Saving..." : "Save Prompt"}
                            classNames="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                            isLoading={promptSaving}
                            loadingIcon={<BiLoaderAlt />}
                          />
                          <Button
                            onClick={handlePromptReset}
                            disabled={promptSaving}
                            text="Reset to Default"
                            classNames="px-6 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 cursor-pointer"
                            icon={<MdRefresh />}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminChatbotSettingsPage;
