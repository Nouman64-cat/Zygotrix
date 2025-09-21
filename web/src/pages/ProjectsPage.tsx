import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import { useProjects, useProjectTemplates } from "../hooks/useProjects";
import type { Project, ProjectTemplate } from "../types/api";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { PlusIcon, BeakerIcon, ChartBarIcon } from "@heroicons/react/24/solid";

const ProjectsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [showTemplates, setShowTemplates] = useState(false);

  const { projects, loading, error, createProject } = useProjects();
  const { templates, loading: templatesLoading } = useProjectTemplates();

  const filteredProjects = projects.filter(
    (project) =>
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateProject = async (template?: ProjectTemplate) => {
    try {
      const newProject = await createProject({
        name: template ? `${template.name} Study` : "New Genetics Project",
        description: template?.description || "A new genetics research project",
        type: "genetics",
        tags: template?.tags || [],
        from_template: template?.id,
      });

      navigate(`/portal/workspace/${newProject.id}`);
    } catch (err) {
      console.error("Failed to create project:", err);
    }
  };

  const getProjectIcon = (project: Project) => {
    if (project.tools.some((tool) => tool.type === "mendelian")) {
      return BeakerIcon;
    }
    return ChartBarIcon;
  };

  const getProjectColor = (project: Project) => {
    if (project.tools.some((tool) => tool.type === "mendelian")) {
      return "border-l-purple-500";
    }
    return "border-l-blue-500";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "1 day ago";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Error loading projects
          </h3>
          <p className="text-gray-500">{error}</p>
        </div>
      </DashboardLayout>
    );
  }

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
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {showTemplates ? "Hide Templates" : "Browse Templates"}
          </button>
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

        {/* Templates Section */}
        {showTemplates && (
          <div className="bg-gray-50 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Project Templates
            </h2>
            {templatesLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleCreateProject(template)}
                    className="bg-white rounded-lg p-4 border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all duration-200 text-left"
                  >
                    <div className="flex items-center space-x-3 mb-2">
                      <BeakerIcon className="h-6 w-6 text-purple-600" />
                      <h3 className="font-medium text-gray-900">
                        {template.name}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      {template.description}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {template.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {/* Start New Project Card */}
          <button
            onClick={() => handleCreateProject()}
            className="bg-white rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors duration-200 p-6 flex flex-col items-center justify-center text-center cursor-pointer group aspect-[4/3] min-h-[250px] w-full"
          >
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
              <PlusIcon className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Start New Project
            </h3>
            <p className="text-gray-500 text-sm">
              Create a new genomic analysis project
            </p>
          </button>

          {/* Project Cards */}
          {filteredProjects.map((project) => {
            const IconComponent = getProjectIcon(project);
            return (
              <button
                key={project.id}
                onClick={() => navigate(`/portal/workspace/${project.id}`)}
                className={`bg-white rounded-lg shadow-sm border-l-4 ${getProjectColor(
                  project
                )} hover:shadow-md transition-shadow duration-200 cursor-pointer aspect-[4/3] min-h-[250px] flex flex-col w-full text-left`}
              >
                <div className="p-6 flex-1 flex flex-col">
                  {/* Header */}
                  <div className="flex items-center space-x-3 mb-3">
                    <IconComponent className="h-6 w-6 text-purple-600" />
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                      {project.name}
                    </h3>
                  </div>

                  {/* Description */}
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2 flex-1">
                    {project.description || "No description"}
                  </p>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900">
                        {project.tools.length}
                      </div>
                      <div className="text-xs text-gray-500">Tools</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900">
                        {project.tags.length}
                      </div>
                      <div className="text-xs text-gray-500">Tags</div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="border-t pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">
                        {project.updated_at
                          ? formatDate(project.updated_at)
                          : "Never updated"}
                      </span>
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        Active
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {filteredProjects.length === 0 && !loading && (
          <div className="text-center py-12">
            <BeakerIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No projects found
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm
                ? "Try adjusting your search terms."
                : "Get started by creating your first project."}
            </p>
            <button
              onClick={() => handleCreateProject()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create New Project
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ProjectsPage;
