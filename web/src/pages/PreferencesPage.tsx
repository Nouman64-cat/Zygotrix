import React, { useState, useEffect } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import * as authApi from "../services/auth.api";
import type { UserPreferences } from "../types/auth";

const PreferencesPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [preferences, setPreferences] = useState<UserPreferences>({
    theme: "light",
    language: "en",
    dateFormat: "MM/DD/YYYY",
    timeFormat: "12h",
    emailNotifications: true,
    pushNotifications: false,
    analysisComplete: true,
    projectUpdates: true,
    systemAlerts: true,
    weeklyDigest: false,
    profileVisibility: "team",
    dataSharing: false,
    analyticsTracking: true,
    autoSave: true,
    compressionLevel: "medium",
    maxFileSize: "100MB",
    defaultDataFormat: "vcf",
    allowInvitations: true,
    showOnlineStatus: true,
    shareByDefault: false,
  });

  // Load preferences from user
  useEffect(() => {
    console.log("[PreferencesPage] Loading preferences from user");
    console.log("[PreferencesPage] user?.preferences:", user?.preferences);
    if (user?.preferences) {
      console.log("[PreferencesPage] Setting preferences:", user.preferences);
      setPreferences((prev) => ({
        ...prev,
        ...user.preferences,
      }));
    }
  }, [user]);

  const handleToggle = (key: keyof UserPreferences) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSelect = async (key: keyof UserPreferences, value: string) => {
    console.log("[PreferencesPage] handleSelect called:", { key, value });
    const updatedPreferences = {
      ...preferences,
      [key]: value,
    };

    setPreferences(updatedPreferences);

    // Immediately update theme if theme preference changes
    if (key === "theme" && (value === "light" || value === "dark" || value === "auto")) {
      console.log("[PreferencesPage] Updating theme to:", value);
      setTheme(value);
      console.log("[PreferencesPage] Theme updated via setTheme");

      // Immediately save theme preference to database to prevent override
      console.log("[PreferencesPage] Saving theme to database immediately...");
      try {
        await authApi.updateProfile({ preferences: updatedPreferences });
        await refreshUser();
        console.log("[PreferencesPage] Theme saved to database and user refreshed");
      } catch (error) {
        console.error("[PreferencesPage] Failed to save theme to database:", error);
      }
    }
  };

  const handleSave = async () => {
    console.log("[PreferencesPage] Saving preferences:", preferences);
    setIsSaving(true);
    setSaveMessage(null);

    try {
      await authApi.updateProfile({ preferences });
      console.log("[PreferencesPage] Profile updated successfully");
      await refreshUser();
      console.log("[PreferencesPage] User refreshed");

      setSaveMessage({
        type: "success",
        text: "Preferences saved successfully!",
      });

      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error("[PreferencesPage] Failed to save preferences:", error);
      setSaveMessage({
        type: "error",
        text: "Failed to save preferences. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    const defaultPrefs: UserPreferences = {
      theme: "light",
      language: "en",
      dateFormat: "MM/DD/YYYY",
      timeFormat: "12h",
      emailNotifications: true,
      pushNotifications: false,
      analysisComplete: true,
      projectUpdates: true,
      systemAlerts: true,
      weeklyDigest: false,
      profileVisibility: "team",
      dataSharing: false,
      analyticsTracking: true,
      autoSave: true,
      compressionLevel: "medium",
      maxFileSize: "100MB",
      defaultDataFormat: "vcf",
      allowInvitations: true,
      showOnlineStatus: true,
      shareByDefault: false,
    };
    setPreferences(defaultPrefs);
    setTheme("light");
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Preferences</h1>
              <p className="text-slate-600 dark:text-slate-400 mt-2">
                Customize your Zygotrix experience and workflow settings
              </p>
            </div>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 dark:bg-blue-700 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Save Preferences
                </>
              )}
            </button>
          </div>

          {/* Success/Error Message */}
          {saveMessage && (
            <div
              className={`mt-4 p-4 rounded-lg flex items-center gap-3 ${
                saveMessage.type === "success"
                  ? "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800"
                  : "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800"
              }`}
            >
              {saveMessage.type === "success" ? (
                <svg
                  className="w-5 h-5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
              <span className="font-medium">{saveMessage.text}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Appearance Settings */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-blue-600 dark:text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Appearance</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Theme
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: "light", label: "Light", icon: "☀️" },
                    { value: "dark", label: "Dark", icon: "🌙" },
                    { value: "auto", label: "Auto", icon: "🔄" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleSelect("theme", option.value)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        preferences.theme === option.value
                          ? "border-blue-600 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/30"
                          : "border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500"
                      }`}
                    >
                      <div className="text-2xl mb-1">{option.icon}</div>
                      <div className="text-xs font-medium text-slate-900 dark:text-white">
                        {option.label}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Language
                </label>
                <select
                  value={preferences.language}
                  onChange={(e) => handleSelect("language", e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="zh">Chinese</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Date Format
                </label>
                <select
                  value={preferences.dateFormat}
                  onChange={(e) => handleSelect("dateFormat", e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                >
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Time Format
                </label>
                <select
                  value={preferences.timeFormat}
                  onChange={(e) => handleSelect("timeFormat", e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                >
                  <option value="12h">12 Hour</option>
                  <option value="24h">24 Hour</option>
                </select>
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-purple-600 dark:text-purple-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Notifications
              </h3>
            </div>
            <div className="space-y-4">
              {[
                {
                  key: "emailNotifications",
                  label: "Email Notifications",
                  description: "Receive notifications via email",
                },
                {
                  key: "pushNotifications",
                  label: "Push Notifications",
                  description: "Browser push notifications",
                },
                {
                  key: "analysisComplete",
                  label: "Analysis Complete",
                  description: "When genetic analysis finishes",
                },
                {
                  key: "projectUpdates",
                  label: "Project Updates",
                  description: "Changes to shared projects",
                },
                {
                  key: "systemAlerts",
                  label: "System Alerts",
                  description: "Important system updates",
                },
                {
                  key: "weeklyDigest",
                  label: "Weekly Digest",
                  description: "Summary of weekly activity",
                },
              ].map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between py-2"
                >
                  <div>
                    <label className="text-sm font-medium text-slate-900 dark:text-white">
                      {item.label}
                    </label>
                    <p className="text-xs text-slate-600 dark:text-slate-400">{item.description}</p>
                  </div>
                  <button
                    onClick={() =>
                      handleToggle(item.key as keyof UserPreferences)
                    }
                    className={`relative inline-flex w-11 h-6 rounded-full transition-colors ${
                      preferences[item.key as keyof UserPreferences]
                        ? "bg-blue-600 dark:bg-blue-500"
                        : "bg-slate-300 dark:bg-slate-600"
                    }`}
                  >
                    <span
                      className={`inline-block w-5 h-5 bg-white rounded-full transition-transform transform ${
                        preferences[item.key as keyof UserPreferences]
                          ? "translate-x-5"
                          : "translate-x-0.5"
                      } mt-0.5`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Privacy Settings */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-green-600 dark:text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Privacy</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Profile Visibility
                </label>
                <select
                  value={preferences.profileVisibility}
                  onChange={(e) =>
                    handleSelect("profileVisibility", e.target.value)
                  }
                  className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                >
                  <option value="public">Public</option>
                  <option value="team">Team Only</option>
                  <option value="private">Private</option>
                </select>
              </div>

              {[
                {
                  key: "dataSharing",
                  label: "Data Sharing",
                  description: "Allow anonymized data sharing for research",
                },
                {
                  key: "analyticsTracking",
                  label: "Analytics Tracking",
                  description: "Help improve the platform",
                },
              ].map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between py-2"
                >
                  <div>
                    <label className="text-sm font-medium text-slate-900 dark:text-white">
                      {item.label}
                    </label>
                    <p className="text-xs text-slate-600 dark:text-slate-400">{item.description}</p>
                  </div>
                  <button
                    onClick={() =>
                      handleToggle(item.key as keyof UserPreferences)
                    }
                    className={`relative inline-flex w-11 h-6 rounded-full transition-colors ${
                      preferences[item.key as keyof UserPreferences]
                        ? "bg-blue-600 dark:bg-blue-500"
                        : "bg-slate-300 dark:bg-slate-600"
                    }`}
                  >
                    <span
                      className={`inline-block w-5 h-5 bg-white rounded-full transition-transform transform ${
                        preferences[item.key as keyof UserPreferences]
                          ? "translate-x-5"
                          : "translate-x-0.5"
                      } mt-0.5`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Data Processing Settings */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-orange-600 dark:text-orange-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Data Processing
              </h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <label className="text-sm font-medium text-slate-900 dark:text-white">
                    Auto-Save
                  </label>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Automatically save work progress
                  </p>
                </div>
                <button
                  onClick={() => handleToggle("autoSave")}
                  className={`relative inline-flex w-11 h-6 rounded-full transition-colors ${
                    preferences.autoSave ? "bg-blue-600 dark:bg-blue-500" : "bg-slate-300 dark:bg-slate-600"
                  }`}
                >
                  <span
                    className={`inline-block w-5 h-5 bg-white rounded-full transition-transform transform ${
                      preferences.autoSave ? "translate-x-5" : "translate-x-0.5"
                    } mt-0.5`}
                  />
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Compression Level
                </label>
                <select
                  value={preferences.compressionLevel}
                  onChange={(e) =>
                    handleSelect("compressionLevel", e.target.value)
                  }
                  className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                >
                  <option value="low">Low (Faster processing)</option>
                  <option value="medium">Medium (Balanced)</option>
                  <option value="high">High (Better compression)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Max File Size
                </label>
                <select
                  value={preferences.maxFileSize}
                  onChange={(e) => handleSelect("maxFileSize", e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                >
                  <option value="50MB">50 MB</option>
                  <option value="100MB">100 MB</option>
                  <option value="500MB">500 MB</option>
                  <option value="1GB">1 GB</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Default Data Format
                </label>
                <select
                  value={preferences.defaultDataFormat}
                  onChange={(e) =>
                    handleSelect("defaultDataFormat", e.target.value)
                  }
                  className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                >
                  <option value="vcf">VCF (Variant Call Format)</option>
                  <option value="csv">CSV (Comma Separated)</option>
                  <option value="json">JSON</option>
                  <option value="tsv">TSV (Tab Separated)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Collaboration Settings */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-indigo-600 dark:text-indigo-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Collaboration
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  key: "allowInvitations",
                  label: "Allow Invitations",
                  description: "Let others invite you to projects",
                },
                {
                  key: "showOnlineStatus",
                  label: "Show Online Status",
                  description: "Display when you're active",
                },
                {
                  key: "shareByDefault",
                  label: "Share by Default",
                  description: "Make new projects shareable",
                },
              ].map((item) => (
                <div key={item.key} className="flex items-start justify-between">
                  <div className="flex-1 mr-4">
                    <label className="text-sm font-medium text-slate-900 dark:text-white">
                      {item.label}
                    </label>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      {item.description}
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      handleToggle(item.key as keyof UserPreferences)
                    }
                    className={`relative inline-flex w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                      preferences[item.key as keyof UserPreferences]
                        ? "bg-blue-600 dark:bg-blue-500"
                        : "bg-slate-300 dark:bg-slate-600"
                    }`}
                  >
                    <span
                      className={`inline-block w-5 h-5 bg-white rounded-full transition-transform transform ${
                        preferences[item.key as keyof UserPreferences]
                          ? "translate-x-5"
                          : "translate-x-0.5"
                      } mt-0.5`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Reset Section */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 mt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                Reset Settings
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Restore all preferences to their default values
              </p>
            </div>
            <button
              onClick={handleReset}
              className="px-5 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 border-2 border-red-600 dark:border-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              Reset All
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PreferencesPage;
