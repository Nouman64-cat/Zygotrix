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

      navigate(`/studio/workspace/${newProject.id}`);
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
    e.stopPropagation();
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

  // Enhanced color variants with more vibrant gradients
  const deriveColorVariants = (bgClass?: string) => {
    if (!bgClass || !bgClass.startsWith("bg-")) {
      return {
        gradient: "from-blue-400 via-blue-500 to-blue-600",
        bg: "bg-blue-100",
        bgHover: "bg-blue-200",
        text: "text-blue-700",
        border: "border-blue-300",
        shadow: "shadow-blue-200",
        ring: "ring-blue-400",
      };
    }

    const parts = bgClass.split("-");
    if (parts.length >= 3) {
      const color = parts[1];
      return {
        gradient: `from-${color}-400 via-${color}-500 to-${color}-600`,
        bg: `bg-${color}-100`,
        bgHover: `bg-${color}-200`,
        text: `text-${color}-700`,
        border: `border-${color}-300`,
        shadow: `shadow-${color}-200`,
        ring: `ring-${color}-400`,
      };
    }

    return {
      gradient: "from-blue-400 via-blue-500 to-blue-600",
      bg: "bg-blue-100",
      bgHover: "bg-blue-200",
      text: "text-blue-700",
      border: "border-blue-300",
      shadow: "shadow-blue-200",
      ring: "ring-blue-400",
    };
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
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
          {/* Start New Project Card */}
          <button
            onClick={() => handleCreateProject()}
            className="relative bg-gradient-to-br from-white via-blue-50 to-indigo-50 rounded-xl border-2 border-dashed border-blue-300 hover:border-blue-400 hover:shadow-xl transition-all duration-300 p-4 flex flex-col items-center justify-center text-center cursor-pointer group aspect-[3/4] min-h-[200px] w-full shadow-lg"
          >
            {/* Notebook binding holes - colorful */}
            <div className="absolute left-3 top-4 bottom-4 w-2">
              <div className="flex flex-col justify-start space-y-2 h-full">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 group-hover:from-indigo-400 group-hover:to-indigo-600 transition-all duration-300 shadow-md"
                  />
                ))}
              </div>
            </div>

            <div className="ml-4 flex flex-col items-center justify-center h-full">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <PlusIcon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-1">
                Start New Project
              </h3>
              <p className="text-gray-600 text-xs px-2">
                Create a new genomic analysis project
              </p>
            </div>
          </button>

          {/* Project Cards */}
          {filteredProjects.map((project) => {
            const IconComponent = getProjectIcon(project);
            const variants = deriveColorVariants(project.color);

            return (
              <div
                key={project.id}
                onClick={() => navigate(`/studio/workspace/${project.id}`)}
                role="button"
                tabIndex={0}
                className={`relative bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer aspect-[3/4] min-h-[200px] flex flex-col w-full text-left border-2 ${variants.border} hover:border-opacity-100 border-opacity-60 group overflow-hidden transform hover:-translate-y-1`}
                onKeyPress={(e) => {
                  if (e.key === "Enter" || e.key === " ")
                    navigate(`/studio/workspace/${project.id}`);
                }}
              >
                {/* Notebook binding holes - colorful */}
                <div className="absolute left-3 top-4 bottom-4 w-2 z-10">
                  <div className="flex flex-col justify-start space-y-2 h-full">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`w-2 h-2 rounded-full bg-gradient-to-br ${variants.gradient} shadow-md`}
                      />
                    ))}
                  </div>
                </div>

                {/* Colorful tab on the side */}
                <div
                  className={`absolute right-0 top-4 w-2 h-12 bg-gradient-to-b ${variants.gradient} rounded-l-lg shadow-lg`}
                />

                {/* Main content */}
                <div className="p-4 flex flex-col flex-1 pl-7">
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center bg-gradient-to-br ${variants.gradient} shadow-lg transform group-hover:scale-110 transition-transform duration-300`}
                    >
                      <IconComponent className="h-4 w-4 text-white" />
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openDeleteModal(project, e);
                      }}
                      className="p-1.5 rounded-lg cursor-pointer text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      aria-label={`Delete ${project.name}`}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>

                  <h3 className="text-sm font-bold text-gray-900 line-clamp-2 leading-tight mb-2">
                    {project.name}
                  </h3>

                  <p className="text-gray-600 text-xs mb-3 line-clamp-3 flex-1">
                    {project.description ||
                      "Study complex inheritance patterns including codominance and incomplete dominance"}
                  </p>

                  {/* Footer with colorful gradient background */}
                  <div className={`border-t-2 ${variants.border} pt-2 mt-auto`}>
                    <div className={`text-xs font-medium ${variants.text}`}>
                      {project.created_at
                        ? formatDate(project.created_at)
                        : project.updated_at
                        ? formatDate(project.updated_at)
                        : "Unknown"}
                    </div>
                  </div>
                </div>

                {/* Subtle lined paper effect with color */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute left-8 right-3 top-12 bottom-8 opacity-5">
                    {[...Array(6)].map((_, i) => (
                      <div
                        key={i}
                        className={`border-b-2 ${variants.border} h-3`}
                        style={{ marginTop: i === 0 ? 0 : "8px" }}
                      />
                    ))}
                  </div>
                </div>

                {/* Gradient overlay on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${variants.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none`} />
              </div>
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
