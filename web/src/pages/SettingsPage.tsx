import React, { useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("general");

  const tabs = [
    { id: "general", label: "General", icon: "⚙️" },
    { id: "security", label: "Security", icon: "🔒" },
    { id: "notifications", label: "Notifications", icon: "🔔" },
    { id: "integrations", label: "Integrations", icon: "🔗" },
    { id: "billing", label: "Billing", icon: "💳" },
  ];

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-4">
          Profile Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Full Name
            </label>
            <input
              type="text"
              defaultValue="Nouman Ejaz"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Email
            </label>
            <input
              type="email"
              defaultValue="nouman@example.com"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Organization
            </label>
            <input
              type="text"
              defaultValue="Genetics Research Lab"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Time Zone
            </label>
            <select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option>UTC+05:00 Pakistan Standard Time</option>
              <option>UTC+00:00 Coordinated Universal Time</option>
              <option>UTC-05:00 Eastern Standard Time</option>
            </select>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-4">
          Platform Preferences
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-slate-900">Dark Mode</h4>
              <p className="text-sm text-slate-500">
                Use dark theme across the platform
              </p>
            </div>
            <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
              <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-1" />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-slate-900">Auto-save</h4>
              <p className="text-sm text-slate-500">
                Automatically save your work every 5 minutes
              </p>
            </div>
            <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
              <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-4">
          Password & Authentication
        </h3>
        <div className="space-y-4">
          <button className="w-full md:w-auto bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            Change Password
          </button>
          <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
            <div>
              <h4 className="text-sm font-medium text-slate-900">
                Two-Factor Authentication
              </h4>
              <p className="text-sm text-slate-500">
                Add an extra layer of security to your account
              </p>
            </div>
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              Enable 2FA
            </button>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-4">
          Active Sessions
        </h3>
        <div className="space-y-3">
          {[
            {
              device: "MacBook Pro",
              location: "Lahore, Pakistan",
              current: true,
            },
            {
              device: "iPhone 14",
              location: "Lahore, Pakistan",
              current: false,
            },
            {
              device: "Chrome Browser",
              location: "Karachi, Pakistan",
              current: false,
            },
          ].map((session, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 border border-slate-200 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {session.device}
                  </p>
                  <p className="text-xs text-slate-500">{session.location}</p>
                </div>
                {session.current && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    Current
                  </span>
                )}
              </div>
              {!session.current && (
                <button className="text-red-600 hover:text-red-700 text-sm">
                  Revoke
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-4">
          Email Notifications
        </h3>
        <div className="space-y-4">
          {[
            {
              label: "Simulation Complete",
              description:
                "Get notified when your simulations finish processing",
            },
            {
              label: "Data Upload",
              description: "Receive updates about data upload status",
            },
            {
              label: "System Maintenance",
              description: "Important system updates and maintenance schedules",
            },
            {
              label: "Weekly Reports",
              description: "Weekly summary of your platform activity",
            },
          ].map((notification, index) => (
            <div key={index} className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-slate-900">
                  {notification.label}
                </h4>
                <p className="text-sm text-slate-500">
                  {notification.description}
                </p>
              </div>
              <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderIntegrationsSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-4">
          API Access
        </h3>
        <div className="space-y-4">
          <div className="p-4 border border-slate-200 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-slate-900">API Key</h4>
              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                Generate New
              </button>
            </div>
            <div className="flex items-center gap-3">
              <code className="flex-1 p-2 bg-slate-100 rounded text-sm font-mono">
                zgt_1234567890abcdef...
              </code>
              <button className="text-slate-600 hover:text-slate-700">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-4">
          Connected Apps
        </h3>
        <div className="space-y-3">
          {[
            {
              name: "Slack",
              description: "Get notifications in your Slack workspace",
              connected: true,
            },
            {
              name: "GitHub",
              description: "Sync with your code repositories",
              connected: false,
            },
            {
              name: "Google Drive",
              description: "Store exports in your Google Drive",
              connected: true,
            },
          ].map((app, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 border border-slate-200 rounded-lg"
            >
              <div>
                <h4 className="text-sm font-medium text-slate-900">
                  {app.name}
                </h4>
                <p className="text-sm text-slate-500">{app.description}</p>
              </div>
              <button
                className={`px-3 py-1 text-sm font-medium rounded ${
                  app.connected
                    ? "text-red-600 hover:text-red-700"
                    : "text-blue-600 hover:text-blue-700"
                }`}
              >
                {app.connected ? "Disconnect" : "Connect"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderBillingSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-4">
          Current Plan
        </h3>
        <div className="p-6 border border-slate-200 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-lg font-semibold text-slate-900">
                Professional Plan
              </h4>
              <p className="text-slate-500">$99/month</p>
            </div>
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
              Active
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Simulations per month</span>
              <span className="text-slate-900">Unlimited</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Storage</span>
              <span className="text-slate-900">10 TB</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">API calls per month</span>
              <span className="text-slate-900">1,000,000</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-200">
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              Upgrade Plan
            </button>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-4">
          Payment Method
        </h3>
        <div className="p-4 border border-slate-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                💳
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">
                  •••• •••• •••• 4242
                </p>
                <p className="text-xs text-slate-500">Expires 12/25</p>
              </div>
            </div>
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              Update
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case "general":
        return renderGeneralSettings();
      case "security":
        return renderSecuritySettings();
      case "notifications":
        return renderNotificationSettings();
      case "integrations":
        return renderIntegrationsSettings();
      case "billing":
        return renderBillingSettings();
      default:
        return renderGeneralSettings();
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
              <p className="text-slate-600 mt-1">
                Manage your account preferences and platform configuration.
              </p>
            </div>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              Save Changes
            </button>
          </div>
        </div>

        {/* Settings Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
              <nav className="space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span className="text-sm font-medium">{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;
