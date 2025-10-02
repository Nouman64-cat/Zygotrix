import React from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import DashboardLayout from "../layouts/DashboardLayout";
import { useUserStats } from "../hooks/useUserStats";
import StatsCard from "../components/universal/StatsCard";

const PortalPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { traitsCount, projectsCount, loading, error } = useUserStats();

  const quickActions = [
    {
      title: "New Simulation",
      href: "/portal/projects",
      icon: (
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        </svg>
      ),
      color: "bg-blue-500",
    },
    {
      title: "Manage Traits",
      href: "/portal/traits",
      icon: (
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
          />
        </svg>
      ),
      color: "bg-green-500",
    },
    {
      title: "View Analytics",
      href: "/portal/analytics",
      icon: (
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
      color: "bg-purple-500",
    },
    {
      title: "Data Upload",
      href: "/portal/data",
      icon: (
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
      ),
      color: "bg-orange-500",
    },
    {
      title: "Profile",
      href: "/portal/profile",
      icon: (
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5.121 17.804A9.004 9.004 0 0112 15c2.21 0 4.21.805 5.879 2.146M15 11a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      ),
      color: "bg-cyan-500",
    },
    {
      title: "Preferences",
      href: "/portal/preferences",
      icon: (
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 10h16M4 14h16M4 18h16"
          />
        </svg>
      ),
      color: "bg-teal-500",
    },
    {
      title: "Settings",
      href: "/portal/settings",
      icon: (
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6 0a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      color: "bg-gray-500",
    },
  ];

  return (
    <DashboardLayout>
      <div className="flex gap-6 min-h-screen">
        {/* Main Content */}
        <div className="flex-1 space-y-6">
          {/* Welcome Header */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Welcome back{user?.full_name ? `, ${user.full_name}` : ""}
                </h1>
                <p className="text-slate-600 mt-1">
                  Here's what's happening with your genetic intelligence
                  platform today.
                </p>
              </div>
              <div></div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
            <StatsCard
              title="Your Traits"
              value={traitsCount}
              loading={loading}
              error={error}
              description="Genetic traits you've created"
              icon={
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3l1 9-1 9m-3-9h6m-5.5-2.5L12 7.5l1.5 2.5M12 7.5V3m0 0L8 6l4 1.5L16 6l-4-1.5zM8 6l2.5 2.5M16 6l-2.5 2.5"
                  />
                </svg>
              }
              actionButton={{
                label: "Manage Traits",
                onClick: () => {
                  navigate("/portal/traits");
                },
                variant: "primary",
              }}
            />

            <StatsCard
              title="Your Projects"
              value={projectsCount}
              loading={loading}
              error={error}
              description="Active simulation projects"
              icon={
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 17v-2a4 4 0 818 0v2m-4-6a4 4 0 100-8 4 4 0 000 8zm6 8a2 2 0 01-2 2H7a2 2 0 01-2-2v-5a2 2 0 012-2h10a2 2 0 012 2v5z"
                  />
                </svg>
              }
              actionButton={{
                label: "View Projects",
                onClick: () => {
                  navigate("/portal/projects");
                },
                variant: "secondary",
              }}
            />
          </div>
        </div>

        {/* Quick Actions Sidebar */}
        <div className="w-80 flex-shrink-0">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 sticky top-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <svg
                className="w-5 h-5 text-slate-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              Quick Actions
            </h2>
            <div className="space-y-3">
              {quickActions.map((action) => (
                <Link
                  key={action.title}
                  to={action.href}
                  className="block p-4 border border-slate-200 rounded-lg hover:border-slate-300 hover:shadow-md hover:bg-slate-50 transition-all duration-200 group"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`p-2.5 rounded-lg ${action.color} text-white flex-shrink-0 group-hover:scale-105 transition-transform duration-200`}
                    >
                      {action.icon}
                    </div>
                    <h3 className="font-medium text-slate-900 group-hover:text-slate-700 transition-colors duration-200">
                      {action.title}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PortalPage;
