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
import {
  getUserPreferences,
  updateUserPreferences,
  resetUserPreferences,
} from "../services/auth.api";
import type { ChatbotSettings, PromptTemplate, PromptType, ChatPreferences } from "../types/auth";
import { MdError, MdCheckCircle, MdSettings, MdCode, MdRefresh, MdPsychology } from "react-icons/md";
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
  const [activeTab, setActiveTab] = useState<"settings" | "prompts" | "preferences">("settings");

  // AI Behavior Preferences state
  const [preferences, setPreferences] = useState<ChatPreferences | null>(null);
  const [preferencesLoading, setPreferencesLoading] = useState(false);
  const [preferencesSaving, setPreferencesSaving] = useState(false);
  const [preferencesError, setPreferencesError] = useState<string | null>(null);
  const [preferencesSuccess, setPreferencesSuccess] = useState<string | null>(null);

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
    admin_unlimited_tokens: false,
  });

  const isAdmin =
    currentUser?.user_role === "admin" ||
    currentUser?.user_role === "super_admin";

  const isSuperAdmin = currentUser?.user_role === "super_admin";

  useEffect(() => {
    if (isAdmin) {
      fetchSettings();
      if (activeTab === "prompts") {
        fetchPromptsData();
      } else if (activeTab === "preferences") {
        fetchPreferencesData();
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
        admin_unlimited_tokens: false,
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

      // Auto-select system prompt
      const systemPrompt = data.find((p) => p.prompt_type === "system");
      if (systemPrompt) {
        selectPrompt("system", systemPrompt);
      } else if (!selectedPrompt && data.length > 0) {
        // Fallback to first prompt if system not found
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

  // AI Behavior Preferences functions
  const fetchPreferencesData = async () => {
    try {
      setPreferencesLoading(true);
      setPreferencesError(null);
      const data = await getUserPreferences();
      setPreferences(data);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch preferences";
      setPreferencesError(errorMessage);
    } finally {
      setPreferencesLoading(false);
    }
  };

  const handlePreferenceChange = (
    field: keyof ChatPreferences,
    value: string | string[] | boolean
  ) => {
    if (!preferences) return;
    setPreferences({
      ...preferences,
      [field]: value,
    });
  };

  const handlePreferenceArrayToggle = (
    field: "teaching_aids" | "visual_aids",
    value: string
  ) => {
    if (!preferences) return;
    const currentArray = preferences[field] || [];
    const newArray = currentArray.includes(value)
      ? currentArray.filter((item) => item !== value)
      : [...currentArray, value];
    setPreferences({
      ...preferences,
      [field]: newArray,
    });
  };

  const handleSavePreferences = async () => {
    if (!preferences) return;

    setPreferencesSaving(true);
    setPreferencesError(null);
    setPreferencesSuccess(null);

    try {
      const updated = await updateUserPreferences({
        communication_style: preferences.communication_style,
        answer_length: preferences.answer_length,
        teaching_aids: preferences.teaching_aids,
        visual_aids: preferences.visual_aids,
        auto_learn: preferences.auto_learn,
      });
      setPreferences(updated);
      setPreferencesSuccess("Preferences updated successfully!");
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update preferences";
      setPreferencesError(errorMessage);
    } finally {
      setPreferencesSaving(false);
    }
  };

  const handleResetPreferences = async () => {
    if (!window.confirm("Are you sure you want to reset preferences to defaults?")) {
      return;
    }

    setPreferencesSaving(true);
    setPreferencesError(null);
    setPreferencesSuccess(null);

    try {
      const defaults = await resetUserPreferences();
      setPreferences(defaults);
      setPreferencesSuccess("Preferences reset to defaults successfully!");
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to reset preferences";
      setPreferencesError(errorMessage);
    } finally {
      setPreferencesSaving(false);
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
              <button
                onClick={() => setActiveTab("preferences")}
                className={`${activeTab === "preferences"
                  ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors`}
              >
                <MdPsychology className="w-5 h-5" />
                AI Behavior
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

                    {/* Admin Unlimited Tokens Toggle - Full Width (Super Admin Only) */}
                    {isSuperAdmin && (
                      <div className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${formData.admin_unlimited_tokens
                        ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800'
                        : 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-700'
                        }`}>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <label
                              htmlFor="admin_unlimited_tokens"
                              className="text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                              Admin Unlimited Tokens
                            </label>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${formData.admin_unlimited_tokens
                              ? 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200'
                              : 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200'
                              }`}>
                              {formData.admin_unlimited_tokens ? 'Enabled' : 'Disabled'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formData.admin_unlimited_tokens
                              ? 'Admins and super admins can use chatbot without token limits'
                              : 'Admins are subject to the same token limits as regular users'}
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            id="admin_unlimited_tokens"
                            name="admin_unlimited_tokens"
                            checked={formData.admin_unlimited_tokens}
                            onChange={handleInputChange}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                        </label>
                      </div>
                    )}
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
          <div className="space-y-6">
            {/* Prompt Messages */}
            {promptError && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3 animate-in slide-in-from-top-2 duration-300">
                <MdError className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800 dark:text-red-200">{promptError}</p>
              </div>
            )}

            {promptSuccess && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl flex items-start gap-3 animate-in slide-in-from-top-2 duration-300">
                <MdCheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-800 dark:text-green-200">{promptSuccess}</p>
              </div>
            )}

            {/* Prompt Loading State */}
            {promptsLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <BiLoaderAlt className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">Loading prompt templates...</p>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                {/* Prompt Editor Header */}
                <div className="px-6 py-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <MdCode className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        System Prompt Editor
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Configure the main AI personality and behavior
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Active</span>
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={promptActive}
                            onChange={(e) => setPromptActive(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* Description Field */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Description
                    </label>
                    <input
                      type="text"
                      value={promptDescription}
                      onChange={(e) => setPromptDescription(e.target.value)}
                      placeholder="Brief description of this prompt template..."
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    />
                  </div>

                  {/* Prompt Content Editor */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Prompt Template
                      </label>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded font-mono">{promptContent.split('\n').length} lines</span>
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded font-mono">{promptContent.length} chars</span>
                      </div>
                    </div>

                    <div className="relative border-2 border-gray-200 dark:border-gray-600 rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-900 shadow-inner">
                      <div className="flex" style={{ height: '560px' }}>
                        {/* Line Numbers */}
                        <div
                          ref={lineNumbersRef}
                          className="flex-shrink-0 bg-gray-100 dark:bg-gray-800 border-r-2 border-gray-200 dark:border-gray-600 select-none overflow-hidden"
                          style={{
                            width: '60px',
                            height: '560px',
                            paddingTop: '16px',
                            paddingBottom: '16px'
                          }}
                        >
                          <div className="font-mono text-xs text-gray-400 dark:text-gray-500 text-right pr-3" style={{ lineHeight: '1.6rem' }}>
                            {promptContent.split('\n').map((_, index) => (
                              <div key={index} className="hover:text-indigo-500 transition-colors" style={{ height: '1.6rem', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
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
                          className="flex-1 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-0 font-mono text-sm resize-none overflow-y-auto"
                          placeholder="Enter your system prompt template here..."
                          style={{
                            height: '560px',
                            padding: '16px 20px',
                            lineHeight: '1.6rem'
                          }}
                        />
                      </div>
                    </div>

                    {/* Helpful Info */}
                    <div className="mt-3 p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl">
                      <p className="text-xs font-semibold text-indigo-900 dark:text-indigo-200 mb-2">
                        Available Placeholders:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { key: "{BOT_NAME}", desc: "AI name" },
                          { key: "{user_name}", desc: "User's name" },
                          { key: "{FRONTEND_URL}", desc: "App URL" }
                        ].map((placeholder) => (
                          <div key={placeholder.key} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-gray-800 border border-indigo-200 dark:border-indigo-700 rounded-lg">
                            <code className="text-xs font-mono font-semibold text-indigo-700 dark:text-indigo-300">
                              {placeholder.key}
                            </code>
                            <span className="text-xs text-gray-500 dark:text-gray-400">→ {placeholder.desc}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Footer */}
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <Button
                    onClick={handlePromptReset}
                    disabled={promptSaving}
                    text="Reset to Default"
                    classNames="px-5 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 cursor-pointer shadow-sm hover:shadow"
                    icon={<MdRefresh className="w-4 h-4" />}
                  />
                  <Button
                    onClick={handlePromptSave}
                    disabled={promptSaving || !promptContent.trim()}
                    text={promptSaving ? "Saving Changes..." : "Save Prompt"}
                    classNames="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                    isLoading={promptSaving}
                    loadingIcon={<BiLoaderAlt className="w-4 h-4" />}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* AI Behavior Preferences Tab */}
        {activeTab === "preferences" && (
          <div className="space-y-6">
            {/* Preferences Messages */}
            {preferencesError && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
                <MdError className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-800 dark:text-red-200">{preferencesError}</p>
              </div>
            )}

            {preferencesSuccess && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-start gap-3">
                <MdCheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <p className="text-green-800 dark:text-green-200">{preferencesSuccess}</p>
              </div>
            )}

            {/* Loading State */}
            {preferencesLoading ? (
              <div className="flex items-center justify-center py-12">
                <BiLoaderAlt className="w-8 h-8 animate-spin text-indigo-600" />
              </div>
            ) : preferences ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-6 space-y-6">
                  {/* Info Banner */}
                  <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <MdPsychology className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="text-sm font-semibold text-indigo-900 dark:text-indigo-200 mb-1">
                          How AI Behavior Preferences Work
                        </h3>
                        <p className="text-xs text-indigo-700 dark:text-indigo-300">
                          Configure how {botName} responds to you. The AI can automatically learn your preferences from your prompts, or you can manually configure them here. These settings apply to all your conversations.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Auto-Learn Toggle */}
                  <div className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${preferences.auto_learn
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-700'
                    }`}>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <label className="text-sm font-semibold text-gray-900 dark:text-white">
                          Automatic Learning
                        </label>
                        {preferences.auto_learn && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        AI automatically detects and learns from signals in your prompts (e.g., "give me examples", "be detailed")
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.auto_learn}
                        onChange={(e) => handlePreferenceChange("auto_learn", e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
                    </label>
                  </div>

                  {/* Communication Style */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Communication Style
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { value: "simple", label: "Simple", desc: "Everyday language, no jargon" },
                        { value: "conversational", label: "Conversational", desc: "Friendly, balanced tone" },
                        { value: "technical", label: "Technical", desc: "Scientific terminology" },
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => handlePreferenceChange("communication_style", option.value)}
                          className={`p-3 rounded-lg border-2 text-left transition-all ${
                            preferences.communication_style === option.value
                              ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                              : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                              preferences.communication_style === option.value
                                ? "border-indigo-600 bg-indigo-600"
                                : "border-gray-300 dark:border-gray-600"
                            }`}>
                              {preferences.communication_style === option.value && (
                                <div className="w-2 h-2 rounded-full bg-white"></div>
                              )}
                            </div>
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                              {option.label}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {option.desc}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Answer Length */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Answer Length
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { value: "brief", label: "Brief", desc: "Concise, key points only" },
                        { value: "balanced", label: "Balanced", desc: "Neither too brief nor detailed" },
                        { value: "detailed", label: "Detailed", desc: "Comprehensive explanations" },
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => handlePreferenceChange("answer_length", option.value)}
                          className={`p-3 rounded-lg border-2 text-left transition-all ${
                            preferences.answer_length === option.value
                              ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                              : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                              preferences.answer_length === option.value
                                ? "border-indigo-600 bg-indigo-600"
                                : "border-gray-300 dark:border-gray-600"
                            }`}>
                              {preferences.answer_length === option.value && (
                                <div className="w-2 h-2 rounded-full bg-white"></div>
                              )}
                            </div>
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                              {option.label}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {option.desc}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Teaching Aids */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Teaching Aids
                      <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">(Select multiple)</span>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { value: "examples", label: "Examples", desc: "Include practical examples" },
                        { value: "real_world", label: "Real-World", desc: "Real-world applications" },
                        { value: "analogies", label: "Analogies", desc: "Use comparisons & metaphors" },
                        { value: "step_by_step", label: "Step-by-Step", desc: "Break down processes" },
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => handlePreferenceArrayToggle("teaching_aids", option.value)}
                          className={`p-3 rounded-lg border-2 text-left transition-all ${
                            (preferences.teaching_aids || []).includes(option.value)
                              ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                              : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                              (preferences.teaching_aids || []).includes(option.value)
                                ? "border-indigo-600 bg-indigo-600"
                                : "border-gray-300 dark:border-gray-600"
                            }`}>
                              {(preferences.teaching_aids || []).includes(option.value) && (
                                <MdCheckCircle className="w-3 h-3 text-white" />
                              )}
                            </div>
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                              {option.label}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {option.desc}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Visual Aids */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Visual Aids
                      <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">(Select multiple)</span>
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { value: "lists", label: "Lists", desc: "Bullet points & numbered lists" },
                        { value: "tables", label: "Tables", desc: "Structured data tables" },
                        { value: "diagrams", label: "Diagrams", desc: "Visual representations" },
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => handlePreferenceArrayToggle("visual_aids", option.value)}
                          className={`p-3 rounded-lg border-2 text-left transition-all ${
                            (preferences.visual_aids || []).includes(option.value)
                              ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                              : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                              (preferences.visual_aids || []).includes(option.value)
                                ? "border-indigo-600 bg-indigo-600"
                                : "border-gray-300 dark:border-gray-600"
                            }`}>
                              {(preferences.visual_aids || []).includes(option.value) && (
                                <MdCheckCircle className="w-3 h-3 text-white" />
                              )}
                            </div>
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                              {option.label}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {option.desc}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Action Footer */}
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <Button
                    onClick={handleResetPreferences}
                    disabled={preferencesSaving}
                    text="Reset to Defaults"
                    classNames="px-5 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 cursor-pointer shadow-sm hover:shadow"
                    icon={<MdRefresh className="w-4 h-4" />}
                  />
                  <Button
                    onClick={handleSavePreferences}
                    disabled={preferencesSaving}
                    text={preferencesSaving ? "Saving Preferences..." : "Save Preferences"}
                    classNames="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                    isLoading={preferencesSaving}
                    loadingIcon={<BiLoaderAlt className="w-4 h-4" />}
                  />
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminChatbotSettingsPage;
