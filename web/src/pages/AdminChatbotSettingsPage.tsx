import React, { useState, useEffect } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { useAuth } from "../context/AuthContext";
import {
  fetchChatbotSettings,
  updateChatbotSettings,
} from "../services/admin.api";
import type { ChatbotSettings } from "../types/auth";
import { MdError, MdCheckCircle, MdSettings } from "react-icons/md";
import { BiLoaderAlt } from "react-icons/bi";
import { FaRobot } from "react-icons/fa";

const AdminChatbotSettingsPage: React.FC = () => {
  const botName = import.meta.env.VITE_ZYGOTRIX_BOT_NAME || "Zigi";
  const { user: currentUser } = useAuth();
  const [settings, setSettings] = useState<ChatbotSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<ChatbotSettings>({
    token_limit_per_session: 25000,
    max_tokens: 1024,
    temperature: 0.7,
    reset_limit_hours: 5,
    model: "claude-3-haiku-20240307",
    enabled: true,
  });

  const isAdmin =
    currentUser?.user_role === "admin" ||
    currentUser?.user_role === "super_admin";

  useEffect(() => {
    if (isAdmin) {
      fetchSettings();
    }
  }, [isAdmin]);

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
        model: "claude-3-haiku-20240307",
        enabled: true,
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
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="claude-3-haiku-20240307">
                      Claude 3 Haiku (Fastest, Most Cost-Effective)
                    </option>
                    <option value="claude-3-5-haiku-20241022">
                      Claude 3.5 Haiku (Fast, Smart)
                    </option>
                    <option value="claude-3-5-sonnet-20241022">
                      Claude 3.5 Sonnet (Balanced)
                    </option>
                    <option value="claude-3-opus-20240229">
                      Claude 3 Opus (Most Capable)
                    </option>
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
                      Temperature: {formData.temperature.toFixed(1)}
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
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div>
                    <label
                      htmlFor="enabled"
                      className="text-sm font-medium text-gray-700 dark:text-gray-300 block"
                    >
                      Chatbot Enabled
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Enable or disable {botName} for all users
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
              </div>

              {/* Form Actions */}
              <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Reset Changes
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <BiLoaderAlt className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <MdSettings className="w-4 h-4" />
                      Save Settings
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">
            Configuration Notes
          </h3>
          <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1 list-disc list-inside">
            <li>
              Changes take effect immediately for all new chatbot sessions
            </li>
            <li>
              Existing active sessions will continue with their current settings
            </li>
            <li>Token limits help manage API costs and prevent abuse</li>
            <li>
              Temperature controls response creativity (0.7 is a good default)
            </li>
            <li>
              Claude 3 Haiku is recommended for cost-effective operation
            </li>
          </ul>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminChatbotSettingsPage;
