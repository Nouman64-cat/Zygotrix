import React, { useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { PlusIcon } from "@heroicons/react/24/solid";

interface Project {
  id: number;
  name: string;
  description: string;
  color: string;
  samples: number;
  variants: number;
  status: "Active" | "Completed" | "In Progress";
  progress: number;
  lastUpdated: string;
  type: string;
}

const ProjectsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const projects: Project[] = [
    {
      id: 1,
      name: "Alzheimer's Disease Study",
      description:
        "GWAS analysis for early onset Alzheimer's disease with focus on APOE variants",
      color: "blue",
      samples: 1247,
      variants: 850000,
      status: "Active",
      progress: 85,
      lastUpdated: "2 hours ago",
      type: "Neurodegenerative",
    },
    {
      id: 2,
      name: "Cancer Genomics Panel",
      description:
        "Targeted sequencing analysis for hereditary cancer predisposition genes",
      color: "red",
      samples: 892,
      variants: 45000,
      status: "In Progress",
      progress: 62,
      lastUpdated: "1 day ago",
      type: "Oncology",
    },
    {
      id: 3,
      name: "Cardiovascular Risk Assessment",
      description:
        "Polygenic risk scoring for coronary artery disease and hypertension",
      color: "green",
      samples: 2150,
      variants: 120000,
      status: "Completed",
      progress: 100,
      lastUpdated: "3 days ago",
      type: "Cardiovascular",
    },
    {
      id: 4,
      name: "Pharmacogenomics Study",
      description:
        "Drug metabolism variants analysis for personalized medicine",
      color: "purple",
      samples: 567,
      variants: 28000,
      status: "Active",
      progress: 45,
      lastUpdated: "6 hours ago",
      type: "Pharmacogenomics",
    },
    {
      id: 5,
      name: "Rare Disease Exome",
      description:
        "Whole exome sequencing for undiagnosed rare genetic disorders",
      color: "orange",
      samples: 234,
      variants: 450000,
      status: "Active",
      progress: 70,
      lastUpdated: "5 days ago",
      type: "Rare Disease",
    },
    {
      id: 6,
      name: "Population Genomics",
      description: "Large-scale population structure and ancestry analysis",
      color: "indigo",
      samples: 5000,
      variants: 2000000,
      status: "In Progress",
      progress: 30,
      lastUpdated: "1 week ago",
      type: "Population",
    },
  ];

  const filteredProjects = projects.filter(
    (project) =>
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return "bg-green-500";
    if (progress >= 60) return "bg-blue-500";
    if (progress >= 40) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getColorBorder = (color: string) => {
    switch (color) {
      case "blue":
        return "border-l-blue-500";
      case "red":
        return "border-l-red-500";
      case "green":
        return "border-l-green-500";
      case "purple":
        return "border-l-purple-500";
      case "orange":
        return "border-l-orange-500";
      case "indigo":
        return "border-l-indigo-500";
      default:
        return "border-l-gray-500";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
            <p className="text-gray-600 mt-1">
              Manage your genomic analysis projects
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {/* Start New Project Card */}
          <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors duration-200 p-6 flex flex-col items-center justify-center text-center cursor-pointer group aspect-[3/4] min-h-[320px]">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
              <PlusIcon className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Start New Project
            </h3>
            <p className="text-gray-500 text-sm">
              Create a new genomic analysis project
            </p>
          </div>

          {/* Project Cards */}
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className={`bg-white rounded-lg shadow-sm border-l-4 ${getColorBorder(
                project.color
              )} hover:shadow-md transition-shadow duration-200 cursor-pointer aspect-[3/4] min-h-[320px] flex flex-col`}
            >
              <div className="p-6 flex-1 flex flex-col">
                {/* Header */}
                <div className="mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {project.name}
                  </h3>
                </div>

                {/* Description */}
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {project.description}
                </p>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900">
                      {project.samples.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">Samples</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900">
                      {project.variants.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">Variants</div>
                  </div>
                </div>

                {/* Progress */}
                <div className="mb-4 flex-1 flex flex-col justify-end">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Progress
                    </span>
                    <span className="text-sm text-gray-500">
                      {project.progress}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getProgressColor(
                        project.progress
                      )}`}
                      style={{ width: `${project.progress}%` }}
                    ></div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex justify-between items-center text-xs text-gray-500 mt-auto">
                  <span>{project.type}</span>
                  <span>Updated {project.lastUpdated}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredProjects.length === 0 && searchTerm && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <MagnifyingGlassIcon className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No projects found
            </h3>
            <p className="text-gray-500">Try adjusting your search criteria</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ProjectsPage;
