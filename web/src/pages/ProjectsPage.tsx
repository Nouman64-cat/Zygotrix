import React from "react";
import DashboardLayout from "../layouts/DashboardLayout";

const ProjectsPage: React.FC = () => {
  const projects = [
    {
      id: 1,
      name: "Height Prediction Model",
      description:
        "Polygenic risk score model for predicting adult height based on genetic variants",
      status: "Active",
      progress: 85,
      lastUpdated: "2 days ago",
      type: "Polygenic Analysis",
    },
    {
      id: 2,
      name: "Eye Color Inheritance Study",
      description:
        "Mendelian inheritance patterns for eye color traits across populations",
      status: "In Progress",
      progress: 60,
      lastUpdated: "1 week ago",
      type: "Mendelian Study",
    },
    {
      id: 3,
      name: "Cardiovascular Risk Assessment",
      description:
        "Multi-trait analysis for cardiovascular disease risk prediction",
      status: "Planning",
      progress: 25,
      lastUpdated: "3 days ago",
      type: "Risk Assessment",
    },
    {
      id: 4,
      name: "Diabetes Susceptibility",
      description:
        "Genetic markers and environmental factors for Type 2 diabetes",
      status: "Completed",
      progress: 100,
      lastUpdated: "1 month ago",
      type: "Disease Analysis",
    },
    {
      id: 5,
      name: "Alzheimer's Early Detection",
      description:
        "Genomic markers for early onset Alzheimer's disease prediction",
      status: "Active",
      progress: 70,
      lastUpdated: "5 days ago",
      type: "Neurodegenerative",
    },
    {
      id: 6,
      name: "Cancer Predisposition Panel",
      description:
        "Comprehensive genetic testing panel for hereditary cancer syndromes",
      status: "In Progress",
      progress: 40,
      lastUpdated: "1 week ago",
      type: "Oncogenomics",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800";
      case "In Progress":
        return "bg-blue-100 text-blue-800";
      case "Planning":
        return "bg-yellow-100 text-yellow-800";
      case "Completed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return "bg-green-500";
    if (progress >= 60) return "bg-blue-500";
    if (progress >= 40) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Projects</h1>
              <p className="text-slate-600 mt-1">
                Manage your genetic research projects and track their progress.
              </p>
            </div>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
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
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              New Project
            </button>
          </div>
        </div>

        {/* Project Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">
                  Total Projects
                </p>
                <p className="text-2xl font-bold text-slate-900">6</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">Active</p>
                <p className="text-2xl font-bold text-slate-900">2</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-yellow-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">
                  In Progress
                </p>
                <p className="text-2xl font-bold text-slate-900">3</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-gray-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-gray-600"
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
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">Completed</p>
                <p className="text-2xl font-bold text-slate-900">1</p>
              </div>
            </div>
          </div>
        </div>

        {/* Projects Grid */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">
              All Projects
            </h2>
          </div>
          <div className="divide-y divide-slate-200">
            {projects.map((project) => (
              <div
                key={project.id}
                className="p-6 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-slate-900">
                        {project.name}
                      </h3>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                          project.status
                        )}`}
                      >
                        {project.status}
                      </span>
                      <span className="px-2 py-1 text-xs font-medium bg-slate-100 text-slate-700 rounded-full">
                        {project.type}
                      </span>
                    </div>
                    <p className="text-slate-600 mb-3">{project.description}</p>
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <span>Last updated: {project.lastUpdated}</span>
                      <span>Progress: {project.progress}%</span>
                    </div>
                  </div>
                  <div className="ml-6">
                    <div className="flex items-center gap-3">
                      {/* Progress bar */}
                      <div className="w-32">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-slate-500">
                            Progress
                          </span>
                          <span className="text-xs font-medium text-slate-700">
                            {project.progress}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${getProgressColor(
                              project.progress
                            )}`}
                            style={{ width: `${project.progress}%` }}
                          ></div>
                        </div>
                      </div>
                      {/* Action buttons */}
                      <div className="flex gap-2">
                        <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                          View
                        </button>
                        <button className="text-slate-600 hover:text-slate-700 text-sm font-medium">
                          Edit
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProjectsPage;
