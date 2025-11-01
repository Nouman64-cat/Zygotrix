import React from "react";
import {
  HiOutlinePlus,
  HiOutlineCog,
  HiOutlineChartBar,
  HiOutlineUpload,
  HiOutlineUser,
  HiOutlineAdjustments,
  HiOutlineLightningBolt,
} from "react-icons/hi";
import { FaDna, FaProjectDiagram, FaBookOpen } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import DashboardLayout from "../layouts/DashboardLayout";
import { useUserStats } from "../hooks/useUserStats";
import StatsCard from "../components/universal/StatsCard";
import UserStatsChart from "../components/charts/UserStatsChart";

const PortalPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { projectsCount, publicTraitsCount, loading, error } = useUserStats();

  const quickActions = [
    {
      title: "New Simulation",
      href: "/studio/projects",
      icon: <HiOutlinePlus className="w-4 h-4" />,
      color: "bg-blue-500",
    },
    {
      title: "Simulation Studio",
      href: "/studio/simulation-studio",
      icon: <FaDna className="w-4 h-4" />,
      color: "bg-green-500",
    },
    {
      title: "View Analytics",
      href: "/studio/analytics",
      icon: <HiOutlineChartBar className="w-4 h-4" />,
      color: "bg-purple-500",
    },
    {
      title: "Data Upload",
      href: "/studio/data",
      icon: <HiOutlineUpload className="w-4 h-4" />,
      color: "bg-orange-500",
    },
    {
      title: "Profile",
      href: "/studio/profile",
      icon: <HiOutlineUser className="w-4 h-4" />,
      color: "bg-cyan-500",
    },
    {
      title: "Preferences",
      href: "/studio/preferences",
      icon: <HiOutlineAdjustments className="w-4 h-4" />,
      color: "bg-teal-500",
    },
    {
      title: "Settings",
      href: "/studio/settings",
      icon: <HiOutlineCog className="w-4 h-4" />,
      color: "bg-gray-500",
    },
    {
      title: "Browse Traits",
      href: "/studio/browse-traits",
      icon: <FaBookOpen className="w-4 h-4" />,
      color: "bg-indigo-500",
    },
  ];

  return (
    <DashboardLayout>
      <div className="flex gap-6 min-h-screen w-full overflow-hidden">
        {/* Main Content */}
        <div className="flex-1 space-y-6 min-w-0">
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
              title="Your Projects"
              value={projectsCount}
              loading={loading}
              error={error}
              description="Active simulation projects"
              icon={<FaProjectDiagram className="w-6 h-6" />}
              actionButton={{
                label: "View Projects",
                onClick: () => {
                  navigate("/studio/projects");
                },
                variant: "secondary",
              }}
            />

            <StatsCard
              title="Public Traits"
              value={publicTraitsCount}
              loading={loading}
              error={error}
              description="Available reference traits from dataset"
              icon={<FaBookOpen className="w-6 h-6" />}
              actionButton={{
                label: "Browse Traits",
                onClick: () => {
                  navigate("/studio/browse-traits");
                },
                variant: "secondary",
              }}
            />
          </div>

          {/* User Stats Chart */}
          <UserStatsChart
            projectsCount={projectsCount}
            loading={loading}
            error={error}
            className="col-span-full"
          />
        </div>

        {/* Quick Actions Sidebar */}
        <div className="w-64 flex-shrink-0 h-screen">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-3 sticky top-0 max-h-screen overflow-auto">
            <h2 className="text-base font-semibold text-slate-900 mb-3 flex items-center gap-1">
              <HiOutlineLightningBolt className="w-4 h-4 text-slate-600" />
              Quick Actions
            </h2>
            <div className="space-y-2">
              {quickActions.map((action) => (
                <Link
                  key={action.title}
                  to={action.href}
                  className="block p-2 border border-slate-200 rounded-md hover:border-slate-300 hover:shadow-md hover:bg-slate-50 transition-all duration-200 group"
                >
                  <div className="flex items-center gap-2 cursor-pointer">
                    <div
                      className={`p-1.5 rounded-md ${action.color} text-white flex-shrink-0 group-hover:scale-105 transition-transform duration-200 cursor-pointer`}
                    >
                      {action.icon}
                    </div>
                    <h3 className="font-medium text-xs text-slate-900 group-hover:text-slate-700 transition-colors duration-200 cursor-pointer">
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
