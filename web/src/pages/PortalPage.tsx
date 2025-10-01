import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { fetchPortalStatus } from "../services/auth.api";
import DashboardLayout from "../layouts/DashboardLayout";
import { fetchUserProjects } from "../services/project.api";

const PortalPage: React.FC = () => {
  // ...existing code...
  const { user, token } = useAuth();
  const [projectCount, setProjectCount] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadStatus = async () => {
      // ...existing code...
      if (!token) {
        setProjectCount(null);
        return;
      }
      try {
        await fetchPortalStatus(token);
        // statusMessage and error are unused, so skip setting them
      } catch {
        // No-op: error state not used
      }
      // Fetch project count
      try {
        const projectRes = await fetchUserProjects(token, 1, 1);
        if (isMounted) {
          const count =
            typeof projectRes.total === "number"
              ? projectRes.total
              : Number(projectRes.total) || 0;
          setProjectCount(count);
        }
      } catch {
        if (isMounted) setProjectCount(null);
      }
    };
    loadStatus();
    return () => {
      isMounted = false;
    };
  }, [token]);

  const quickActions = [
    {
      title: "Start New Simulation",
      description: "Launch a new Mendelian or polygenic simulation",
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
      description: "Add, edit, or organize your trait configurations",
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
      description: "Review simulation results and performance metrics",
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
      description: "Import new datasets or genetic information",
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
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Welcome back{user?.full_name ? `, ${user.full_name}` : ""}
              </h1>
              <p className="text-slate-600 mt-1">
                Here's what's happening with your genetic intelligence platform
                today.
              </p>
            </div>
            <div></div>
          </div>
        </div>
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-indigo-100 shadow flex flex-col items-center justify-center p-6">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-indigo-50 mb-3">
              <svg
                className="w-7 h-7 text-indigo-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 17v-2a4 4 0 018 0v2m-4-6a4 4 0 100-8 4 4 0 000 8zm6 8a2 2 0 01-2 2H7a2 2 0 01-2-2v-5a2 2 0 012-2h10a2 2 0 012 2v5z"
                />
              </svg>
            </div>
            <div className="text-3xl font-bold text-indigo-700">
              {projectCount ?? "-"}
            </div>
            <div className="mt-2 text-sm text-slate-600">Your Projects</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action) => (
              <Link
                key={action.title}
                to={action.href}
                className="block p-4 border border-slate-200 rounded-lg hover:border-slate-300 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${action.color} text-white`}>
                    {action.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-slate-900">
                      {action.title}
                    </h3>
                    <p className="text-sm text-slate-600">
                      {action.description}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PortalPage;
