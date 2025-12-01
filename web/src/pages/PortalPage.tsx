import React, { useEffect, useState } from "react";
import {
  HiOutlinePlus,
  HiOutlineCog,
  HiOutlineChartBar,
  HiOutlineUpload,
  HiOutlineUser,
  HiOutlineAdjustments,
  HiOutlineClock,
  HiOutlineTrendingUp,
  HiOutlineBeaker,
  HiOutlineAcademicCap,
  HiOutlineFolder,
  HiOutlineSparkles,
} from "react-icons/hi";
import { FaDna, FaProjectDiagram, FaBookOpen, FaFlask, FaRocket } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import DashboardLayout from "../layouts/DashboardLayout";
import { useUserStats } from "../hooks/useUserStats";
import StatsCard from "../components/universal/StatsCard";

const PortalPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { projectsCount, publicTraitsCount, loading, error } = useUserStats();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const quickActions = [
    {
      title: "New Project",
      description: "Start a new genetics project",
      href: "/studio/projects",
      icon: <HiOutlinePlus className="w-5 h-5" />,
      color: "from-blue-500 to-blue-600",
      hoverColor: "hover:from-blue-600 hover:to-blue-700",
    },
    {
      title: "Simulation Studio",
      description: "Run genetic simulations",
      href: "/studio/simulation-studio",
      icon: <FaDna className="w-5 h-5" />,
      color: "from-emerald-500 to-emerald-600",
      hoverColor: "hover:from-emerald-600 hover:to-emerald-700",
    },
    {
      title: "Browse Traits",
      description: "Explore trait database",
      href: "/studio/browse-traits",
      icon: <FaBookOpen className="w-5 h-5" />,
      color: "from-indigo-500 to-indigo-600",
      hoverColor: "hover:from-indigo-600 hover:to-indigo-700",
    },
    {
      title: "Analytics",
      description: "View insights & reports",
      href: "/studio/analytics",
      icon: <HiOutlineChartBar className="w-5 h-5" />,
      color: "from-purple-500 to-purple-600",
      hoverColor: "hover:from-purple-600 hover:to-purple-700",
    },
  ];

  const featuredTraits = [
    {
      name: "Blood Type",
      category: "Hematology",
      icon: "🩸",
      color: "bg-rose-100 text-rose-700 border-rose-200",
    },
    {
      name: "Eye Color",
      category: "Ophthalmology",
      icon: "👁️",
      color: "bg-blue-100 text-blue-700 border-blue-200",
    },
    {
      name: "Hair Color",
      category: "Dermatology",
      icon: "💇",
      color: "bg-amber-100 text-amber-700 border-amber-200",
    },
    {
      name: "Height",
      category: "Anthropometry",
      icon: "📏",
      color: "bg-teal-100 text-teal-700 border-teal-200",
    },
  ];

  const recentActivity = [
    {
      type: "simulation",
      title: "Completed Mendelian cross simulation",
      time: "2 hours ago",
      icon: <FaFlask className="w-4 h-4" />,
      color: "text-emerald-600",
    },
    {
      type: "project",
      title: "Created new project: Eye Color Study",
      time: "1 day ago",
      icon: <HiOutlineFolder className="w-4 h-4" />,
      color: "text-blue-600",
    },
    {
      type: "trait",
      title: "Viewed Blood Type trait details",
      time: "2 days ago",
      icon: <FaBookOpen className="w-4 h-4" />,
      color: "text-indigo-600",
    },
  ];

  const learningResources = [
    {
      title: "Getting Started Guide",
      description: "Learn the basics of Zygotrix",
      icon: <FaRocket className="w-5 h-5" />,
      color: "bg-blue-500",
    },
    {
      title: "Advanced Simulations",
      description: "Master complex genetic crosses",
      icon: <HiOutlineBeaker className="w-5 h-5" />,
      color: "bg-purple-500",
    },
    {
      title: "Trait Database",
      description: "Understanding trait inheritance",
      icon: <HiOutlineAcademicCap className="w-5 h-5" />,
      color: "bg-emerald-500",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-8">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-8 text-white shadow-2xl">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30"></div>
          <div className="relative z-10 flex items-start justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold">
                {getGreeting()}{user?.full_name ? `, ${user.full_name.split(" ")[0]}` : ""}!
              </h1>
              <p className="text-blue-100 max-w-2xl">
                Welcome to your genetics intelligence platform. Explore traits, run simulations, and unlock genetic insights.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 backdrop-blur-sm">
              <HiOutlineClock className="h-5 w-5 text-blue-200" />
              <span className="text-sm font-medium">
                {currentTime.toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => (
            <Link
              key={action.title}
              to={action.href}
              className="group relative overflow-hidden rounded-xl border-2 border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-transparent hover:shadow-xl"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 transition-opacity group-hover:opacity-100`}></div>
              <div className="relative z-10">
                <div className={`inline-flex rounded-lg bg-gradient-to-br ${action.color} p-3 text-white shadow-lg transition-transform group-hover:scale-110`}>
                  {action.icon}
                </div>
                <h3 className="mt-4 font-bold text-slate-900 transition-colors group-hover:text-white">
                  {action.title}
                </h3>
                <p className="mt-1 text-sm text-slate-600 transition-colors group-hover:text-white/90">
                  {action.description}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {/* Stats Overview */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <StatsCard
            title="Your Projects"
            value={projectsCount}
            loading={loading}
            error={error}
            description="Active simulation projects"
            icon={<FaProjectDiagram className="w-6 h-6" />}
            actionButton={{
              label: "View All",
              onClick: () => navigate("/studio/projects"),
              variant: "secondary",
            }}
          />

          <StatsCard
            title="Public Traits"
            value={publicTraitsCount}
            loading={loading}
            error={error}
            description="Available reference traits"
            icon={<FaBookOpen className="w-6 h-6" />}
            actionButton={{
              label: "Browse",
              onClick: () => navigate("/studio/browse-traits"),
              variant: "secondary",
            }}
          />

          <div className="rounded-xl border-2 border-slate-200 bg-gradient-to-br from-purple-50 to-indigo-50 p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-purple-100 p-2">
                    <HiOutlineTrendingUp className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-slate-900">Platform Activity</h3>
                </div>
                <p className="mt-3 text-3xl font-bold text-slate-900">Active</p>
                <p className="text-sm text-slate-600 mt-1">All systems operational</p>
              </div>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content - 2/3 width */}
          <div className="space-y-6 lg:col-span-2">
            {/* Featured Traits */}
            <div className="rounded-xl border-2 border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">Featured Traits</h2>
                <Link
                  to="/studio/browse-traits"
                  className="text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  View All →
                </Link>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {featuredTraits.map((trait) => (
                  <div
                    key={trait.name}
                    className={`flex items-center gap-3 rounded-lg border-2 ${trait.color} p-4 transition-all hover:shadow-md cursor-pointer`}
                  >
                    <span className="text-3xl">{trait.icon}</span>
                    <div className="flex-1">
                      <h3 className="font-bold">{trait.name}</h3>
                      <p className="text-xs opacity-75">{trait.category}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Getting Started */}
            <div className="rounded-xl border-2 border-slate-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <HiOutlineSparkles className="h-6 w-6 text-emerald-600" />
                <h2 className="text-lg font-bold text-slate-900">Learning Resources</h2>
              </div>
              <div className="space-y-3">
                {learningResources.map((resource) => (
                  <div
                    key={resource.title}
                    className="flex items-center gap-4 rounded-lg border-2 border-white bg-white p-4 shadow-sm transition-all hover:shadow-md cursor-pointer"
                  >
                    <div className={`rounded-lg ${resource.color} p-3 text-white`}>
                      {resource.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-900">{resource.title}</h3>
                      <p className="text-sm text-slate-600">{resource.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar - 1/3 width */}
          <div className="space-y-6">
            {/* Recent Activity */}
            <div className="rounded-xl border-2 border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <HiOutlineClock className="h-5 w-5 text-slate-600" />
                <h2 className="font-bold text-slate-900">Recent Activity</h2>
              </div>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex gap-3">
                    <div className={`mt-0.5 rounded-lg bg-slate-100 p-2 ${activity.color}`}>
                      {activity.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900">{activity.title}</p>
                      <p className="text-xs text-slate-500">{activity.time}</p>
                    </div>
                  </div>
                ))}
                {recentActivity.length === 0 && (
                  <p className="text-center text-sm text-slate-500 py-4">No recent activity</p>
                )}
              </div>
            </div>

            {/* Quick Links */}
            <div className="rounded-xl border-2 border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 font-bold text-slate-900">Quick Links</h2>
              <div className="space-y-2">
                <Link
                  to="/studio/data"
                  className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 text-sm font-medium text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50"
                >
                  <HiOutlineUpload className="h-4 w-4 text-orange-500" />
                  Data Upload
                </Link>
                <Link
                  to="/studio/profile"
                  className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 text-sm font-medium text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50"
                >
                  <HiOutlineUser className="h-4 w-4 text-cyan-500" />
                  Profile
                </Link>
                <Link
                  to="/studio/preferences"
                  className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 text-sm font-medium text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50"
                >
                  <HiOutlineAdjustments className="h-4 w-4 text-teal-500" />
                  Preferences
                </Link>
                <Link
                  to="/studio/settings"
                  className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 text-sm font-medium text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50"
                >
                  <HiOutlineCog className="h-4 w-4 text-gray-500" />
                  Settings
                </Link>
              </div>
            </div>

            {/* Help & Support */}
            <div className="rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 shadow-sm">
              <h2 className="mb-2 font-bold text-slate-900">Need Help?</h2>
              <p className="mb-4 text-sm text-slate-600">
                Get assistance with your genetics research and simulations.
              </p>
              <button
                onClick={() => navigate("/community")}
                className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-blue-700"
              >
                Visit Community
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PortalPage;
