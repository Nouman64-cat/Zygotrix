import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import DeleteConfirmationModal from "../components/modals/DeleteConfirmationModal";
import { useProjects, useProjectTemplates } from "../hooks/useProjects";
import type { Project, ProjectTemplate } from "../types/api";
import { MagnifyingGlassIcon, TrashIcon } from "@heroicons/react/24/outline";
import { PlusIcon, BeakerIcon, ChartBarIcon } from "@heroicons/react/24/solid";
import { formatDate } from "../components/workspace/helpers/formatHelpers";

const ProjectsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [showTemplates, setShowTemplates] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { projects, loading, error, createProject, deleteProject } =
    useProjects();
  const { templates, loading: templatesLoading } = useProjectTemplates();

  const filteredProjects = projects.filter(
    (project) =>
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateProject = async (template?: ProjectTemplate) => {
    try {
      const timestamp = new Date();
      const pad = (n: number) => n.toString().padStart(2, "0");
      const formattedTs = `${timestamp.getFullYear()}-${pad(
        timestamp.getMonth() + 1
      )}-${pad(timestamp.getDate())} ${pad(timestamp.getHours())}:${pad(
        timestamp.getMinutes()
      )}`;

      const defaultName = template
        ? `${template.name} Study`
        : `New Genetics Project - ${formattedTs}`;

      const newProject = await createProject({
        name: defaultName,
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

  const handleDeleteProject = async () => {
    if (!projectToDelete?.id) return;

    try {
      setIsDeleting(true);
      await deleteProject(projectToDelete.id);
      setProjectToDelete(null);
    } catch (err) {
      console.error("Failed to delete project:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const openDeleteModal = (project: Project, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    setProjectToDelete(project);
  };

  const closeDeleteModal = () => {
    if (!isDeleting) {
      setProjectToDelete(null);
    }
  };

  const getProjectIcon = (project: Project) => {
    if (project.tools.some((tool) => tool.type === "mendelian")) {
      return BeakerIcon;
    }
    return ChartBarIcon;
  };

  // Derive light/background and text color classes from a Tailwind `bg-...-500` class
  const deriveColorVariants = (bgClass?: string) => {
    if (!bgClass || !bgClass.startsWith("bg-")) {
      return { tab: "bg-blue-500", bg: "bg-blue-100", text: "text-blue-600" };
    }

    // Expecting format like 'bg-blue-500' -> extract color and produce variants
    const parts = bgClass.split("-");
    if (parts.length >= 3) {
      const color = parts[1];
      return {
        tab: `bg-${color}-500`,
        bg: `bg-${color}-100`,
        text: `text-${color}-600`,
      };
    }

    return { tab: bgClass, bg: "bg-blue-100", text: "text-blue-600" };
  };

  // Use shared formatDate helper for absolute formatted dates

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
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
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
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
          {/* Start New Project Card */}
          <button
            onClick={() => handleCreateProject()}
            className="relative bg-gradient-to-br from-white to-gray-50 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-400 transition-all duration-200 p-3 flex flex-col items-center justify-center text-center cursor-pointer group aspect-[3/4] min-h-[180px] w-full shadow-sm hover:shadow-md"
          >
            {/* Notebook binding holes */}
            <div className="absolute left-2 top-3 bottom-3 w-1">
              <div className="flex flex-col justify-start space-y-1.5 h-full">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1 h-1 rounded-full bg-gray-200 group-hover:bg-blue-200 transition-colors"
                  />
                ))}
              </div>
            </div>

            <div className="ml-3 flex flex-col items-center justify-center h-full">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mb-2 group-hover:bg-blue-200 transition-colors">
                <PlusIcon className="h-4 w-4 text-blue-600" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">
                Start New Project
              </h3>
              <p className="text-gray-500 text-xs">
                Create a new genomic analysis project
              </p>
            </div>
          </button>{" "}
          {/* Project Cards */}
          {filteredProjects.map((project) => {
            const IconComponent = getProjectIcon(project);

            return (
              <button
                key={project.id}
                onClick={() => navigate(`/portal/workspace/${project.id}`)}
                className="relative bg-gradient-to-br from-white to-gray-50 rounded-lg shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer aspect-[3/4] min-h-[180px] flex flex-col w-full text-left border border-gray-200 hover:border-gray-300 group overflow-hidden"
              >
                {/* Notebook binding holes */}
                <div className="absolute left-2 top-3 bottom-3 w-1 z-10">
                  <div className="flex flex-col justify-start space-y-1.5 h-full">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className="w-1 h-1 rounded-full bg-gray-300 shadow-inner"
                      />
                    ))}
                  </div>
                </div>

                {/* Color tab on the side */}
                {(() => {
                  const variants = deriveColorVariants(project.color);
                  return (
                    <div
                      className={`absolute right-0 top-3 w-1 h-6 ${variants.tab} rounded-l-md`}
                    />
                  );
                })()}

                {/* Top row: icon, status, actions */}
                <div className="p-3 flex flex-col flex-1">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <div
                        className={`w-5 h-5 rounded-lg flex items-center justify-center ${
                          deriveColorVariants(project.color).bg
                        }`}
                      >
                        <IconComponent
                          className={`h-3 w-3 ${
                            deriveColorVariants(project.color).text
                          }`}
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => openDeleteModal(project, e)}
                        className="p-1 cursor-pointer text-gray-400 hover:text-red-600"
                        aria-label={`Delete ${project.name}`}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-sm mt-9 font-semibold text-gray-900 line-clamp-2 leading-tight mt-3">
                    {project.name}
                  </h3>
                  {/* Description */}
                  <p className="text-gray-600 text-xs mb-2 line-clamp-3 flex-1">
                    {project.description ||
                      "Study complex inheritance patterns including codominance and incomplete dominance"}
                  </p>

                  {/* Footer with date */}
                  <div className="border-t border-gray-100 pt-1.5 mt-auto">
                    <div className="text-xs text-gray-500">
                      Created:{" "}
                      {project.created_at
                        ? formatDate(project.created_at)
                        : project.updated_at
                        ? formatDate(project.updated_at)
                        : "Unknown"}
                    </div>
                  </div>
                </div>

                {/* Subtle lined paper effect */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute left-6 right-2 top-8 bottom-6 opacity-10">
                    {[...Array(6)].map((_, i) => (
                      <div
                        key={i}
                        className="border-b border-blue-200 h-2.5"
                        style={{ marginTop: i === 0 ? 0 : "6px" }}
                      />
                    ))}
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

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={!!projectToDelete}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteProject}
        projectName={projectToDelete?.name || ""}
        isDeleting={isDeleting}
      />
    </DashboardLayout>
  );
};

export default ProjectsPage;
