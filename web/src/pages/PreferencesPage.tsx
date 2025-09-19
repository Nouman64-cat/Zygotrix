import React, { useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";

const PreferencesPage: React.FC = () => {
  const [preferences, setPreferences] = useState({
    // Appearance
    theme: "light",
    language: "en",
    dateFormat: "MM/DD/YYYY",
    timeFormat: "12h",

    // Notifications
    emailNotifications: true,
    pushNotifications: false,
    analysisComplete: true,
    projectUpdates: true,
    systemAlerts: true,
    weeklyDigest: false,

    // Privacy
    profileVisibility: "team",
    dataSharing: false,
    analyticsTracking: true,

    // Data Processing
    autoSave: true,
    compressionLevel: "medium",
    maxFileSize: "100MB",
    defaultDataFormat: "vcf",

    // Collaboration
    allowInvitations: true,
    showOnlineStatus: true,
    shareByDefault: false,
  });

  const handleToggle = (key: string) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key as keyof typeof prev],
    }));
  };

  const handleSelect = (key: string, value: string) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = () => {
    // Here you would typically save to backend
    console.log("Preferences saved:", preferences);
    // Show success message
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Preferences</h1>
              <p className="text-slate-600 mt-1">
                Customize your Zygotrix experience and workflow settings
              </p>
            </div>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              Save Preferences
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Appearance Settings */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Appearance
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Theme
                </label>
                <select
                  value={preferences.theme}
                  onChange={(e) => handleSelect("theme", e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="auto">Auto (System)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Language
                </label>
                <select
                  value={preferences.language}
                  onChange={(e) => handleSelect("language", e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Date Format
                </label>
                <select
                  value={preferences.dateFormat}
                  onChange={(e) => handleSelect("dateFormat", e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Time Format
                </label>
                <select
                  value={preferences.timeFormat}
                  onChange={(e) => handleSelect("timeFormat", e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="12h">12 Hour</option>
                  <option value="24h">24 Hour</option>
                </select>
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Notifications
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-slate-900">
                    Email Notifications
                  </label>
                  <p className="text-xs text-slate-600">
                    Receive notifications via email
                  </p>
                </div>
                <button
                  onClick={() => handleToggle("emailNotifications")}
                  className={`relative inline-flex w-10 h-5 rounded-full transition-colors ${
                    preferences.emailNotifications
                      ? "bg-blue-600"
                      : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`inline-block w-4 h-4 bg-white rounded-full transition-transform transform ${
                      preferences.emailNotifications
                        ? "translate-x-5"
                        : "translate-x-0.5"
                    } mt-0.5`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-slate-900">
                    Push Notifications
                  </label>
                  <p className="text-xs text-slate-600">
                    Browser push notifications
                  </p>
                </div>
                <button
                  onClick={() => handleToggle("pushNotifications")}
                  className={`relative inline-flex w-10 h-5 rounded-full transition-colors ${
                    preferences.pushNotifications
                      ? "bg-blue-600"
                      : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`inline-block w-4 h-4 bg-white rounded-full transition-transform transform ${
                      preferences.pushNotifications
                        ? "translate-x-5"
                        : "translate-x-0.5"
                    } mt-0.5`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-slate-900">
                    Analysis Complete
                  </label>
                  <p className="text-xs text-slate-600">
                    When genetic analysis finishes
                  </p>
                </div>
                <button
                  onClick={() => handleToggle("analysisComplete")}
                  className={`relative inline-flex w-10 h-5 rounded-full transition-colors ${
                    preferences.analysisComplete
                      ? "bg-blue-600"
                      : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`inline-block w-4 h-4 bg-white rounded-full transition-transform transform ${
                      preferences.analysisComplete
                        ? "translate-x-5"
                        : "translate-x-0.5"
                    } mt-0.5`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-slate-900">
                    Project Updates
                  </label>
                  <p className="text-xs text-slate-600">
                    Changes to shared projects
                  </p>
                </div>
                <button
                  onClick={() => handleToggle("projectUpdates")}
                  className={`relative inline-flex w-10 h-5 rounded-full transition-colors ${
                    preferences.projectUpdates ? "bg-blue-600" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`inline-block w-4 h-4 bg-white rounded-full transition-transform transform ${
                      preferences.projectUpdates
                        ? "translate-x-5"
                        : "translate-x-0.5"
                    } mt-0.5`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-slate-900">
                    Weekly Digest
                  </label>
                  <p className="text-xs text-slate-600">
                    Summary of weekly activity
                  </p>
                </div>
                <button
                  onClick={() => handleToggle("weeklyDigest")}
                  className={`relative inline-flex w-10 h-5 rounded-full transition-colors ${
                    preferences.weeklyDigest ? "bg-blue-600" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`inline-block w-4 h-4 bg-white rounded-full transition-transform transform ${
                      preferences.weeklyDigest
                        ? "translate-x-5"
                        : "translate-x-0.5"
                    } mt-0.5`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Privacy Settings */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Privacy
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Profile Visibility
                </label>
                <select
                  value={preferences.profileVisibility}
                  onChange={(e) =>
                    handleSelect("profileVisibility", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="public">Public</option>
                  <option value="team">Team Only</option>
                  <option value="private">Private</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-slate-900">
                    Data Sharing
                  </label>
                  <p className="text-xs text-slate-600">
                    Allow anonymized data sharing for research
                  </p>
                </div>
                <button
                  onClick={() => handleToggle("dataSharing")}
                  className={`relative inline-flex w-10 h-5 rounded-full transition-colors ${
                    preferences.dataSharing ? "bg-blue-600" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`inline-block w-4 h-4 bg-white rounded-full transition-transform transform ${
                      preferences.dataSharing
                        ? "translate-x-5"
                        : "translate-x-0.5"
                    } mt-0.5`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-slate-900">
                    Analytics Tracking
                  </label>
                  <p className="text-xs text-slate-600">
                    Help improve the platform
                  </p>
                </div>
                <button
                  onClick={() => handleToggle("analyticsTracking")}
                  className={`relative inline-flex w-10 h-5 rounded-full transition-colors ${
                    preferences.analyticsTracking
                      ? "bg-blue-600"
                      : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`inline-block w-4 h-4 bg-white rounded-full transition-transform transform ${
                      preferences.analyticsTracking
                        ? "translate-x-5"
                        : "translate-x-0.5"
                    } mt-0.5`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Data Processing Settings */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Data Processing
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-slate-900">
                    Auto-Save
                  </label>
                  <p className="text-xs text-slate-600">
                    Automatically save work progress
                  </p>
                </div>
                <button
                  onClick={() => handleToggle("autoSave")}
                  className={`relative inline-flex w-10 h-5 rounded-full transition-colors ${
                    preferences.autoSave ? "bg-blue-600" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`inline-block w-4 h-4 bg-white rounded-full transition-transform transform ${
                      preferences.autoSave ? "translate-x-5" : "translate-x-0.5"
                    } mt-0.5`}
                  />
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Compression Level
                </label>
                <select
                  value={preferences.compressionLevel}
                  onChange={(e) =>
                    handleSelect("compressionLevel", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low (Faster processing)</option>
                  <option value="medium">Medium (Balanced)</option>
                  <option value="high">High (Better compression)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Max File Size
                </label>
                <select
                  value={preferences.maxFileSize}
                  onChange={(e) => handleSelect("maxFileSize", e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="50MB">50 MB</option>
                  <option value="100MB">100 MB</option>
                  <option value="500MB">500 MB</option>
                  <option value="1GB">1 GB</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Default Data Format
                </label>
                <select
                  value={preferences.defaultDataFormat}
                  onChange={(e) =>
                    handleSelect("defaultDataFormat", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 lg:col-span-2">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Collaboration
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-slate-900">
                    Allow Invitations
                  </label>
                  <p className="text-xs text-slate-600">
                    Let others invite you to projects
                  </p>
                </div>
                <button
                  onClick={() => handleToggle("allowInvitations")}
                  className={`relative inline-flex w-10 h-5 rounded-full transition-colors ${
                    preferences.allowInvitations
                      ? "bg-blue-600"
                      : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`inline-block w-4 h-4 bg-white rounded-full transition-transform transform ${
                      preferences.allowInvitations
                        ? "translate-x-5"
                        : "translate-x-0.5"
                    } mt-0.5`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-slate-900">
                    Show Online Status
                  </label>
                  <p className="text-xs text-slate-600">
                    Display when you're active
                  </p>
                </div>
                <button
                  onClick={() => handleToggle("showOnlineStatus")}
                  className={`relative inline-flex w-10 h-5 rounded-full transition-colors ${
                    preferences.showOnlineStatus
                      ? "bg-blue-600"
                      : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`inline-block w-4 h-4 bg-white rounded-full transition-transform transform ${
                      preferences.showOnlineStatus
                        ? "translate-x-5"
                        : "translate-x-0.5"
                    } mt-0.5`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-slate-900">
                    Share by Default
                  </label>
                  <p className="text-xs text-slate-600">
                    Make new projects shareable
                  </p>
                </div>
                <button
                  onClick={() => handleToggle("shareByDefault")}
                  className={`relative inline-flex w-10 h-5 rounded-full transition-colors ${
                    preferences.shareByDefault ? "bg-blue-600" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`inline-block w-4 h-4 bg-white rounded-full transition-transform transform ${
                      preferences.shareByDefault
                        ? "translate-x-5"
                        : "translate-x-0.5"
                    } mt-0.5`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Reset Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mt-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            Reset Settings
          </h3>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-slate-900">
                Reset to Defaults
              </h4>
              <p className="text-sm text-slate-600">
                Restore all preferences to their default values
              </p>
            </div>
            <button className="px-4 py-2 text-sm font-medium text-red-600 border border-red-600 rounded-lg hover:bg-red-50">
              Reset All
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PreferencesPage;
