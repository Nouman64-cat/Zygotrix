import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import DeleteConfirmationModal from "../components/modals/DeleteConfirmationModal";
import { useProjects, useProjectTemplates } from "../hooks/useProjects";
import type { Project, ProjectTemplate } from "../types/api";
import { MagnifyingGlassIcon, TrashIcon } from "@heroicons/react/24/outline";
import { PlusIcon, BeakerIcon, ChartBarIcon } from "@heroicons/react/24/solid";
import { formatDate } from "../components/workspace/helpers/formatHelpers";
import useDocumentTitle from "../hooks/useDocumentTitle";

const ProjectsPage: React.FC = () => {
  useDocumentTitle("Projects");

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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
            Error loading projects
          </h3>
          <p className="text-slate-500 dark:text-slate-400">{error}</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Projects</h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-1">
              Manage your genomic analysis projects
            </p>
          </div>
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className="px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors cursor-pointer shrink-0"
          >
            {showTemplates ? "Hide Templates" : "Browse Templates"}
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
          />
        </div>

        {/* Templates Section */}
        {showTemplates && (
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Project Templates
            </h2>
            {templatesLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleCreateProject(template)}
                    className="bg-white dark:bg-slate-800 rounded-lg p-3 sm:p-4 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-sm transition-all duration-200 text-left"
                  >
                    <div className="flex items-center space-x-3 mb-2">
                      <BeakerIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                      <h3 className="font-medium text-slate-900 dark:text-white">
                        {template.name}
                      </h3>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                      {template.description}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {template.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 text-xs rounded-full"
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
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4">
          {/* Start New Project Card */}
          <button
            onClick={() => handleCreateProject()}
            className="relative bg-gradient-to-br from-white via-blue-50 to-indigo-50 dark:from-slate-800 dark:via-slate-800 dark:to-slate-900 rounded-xl border-2 border-dashed border-blue-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-xl transition-all duration-300 p-3 sm:p-4 flex flex-col items-center justify-center text-center cursor-pointer group aspect-[3/4] min-h-[180px] sm:min-h-[200px] w-full shadow-lg"
          >
            {/* Notebook binding holes - colorful */}
            <div className="absolute left-3 top-4 bottom-4 w-2">
              <div className="flex flex-col justify-start space-y-2 h-full">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 dark:from-blue-500 dark:to-blue-700 group-hover:from-indigo-400 group-hover:to-indigo-600 dark:group-hover:from-indigo-500 dark:group-hover:to-indigo-700 transition-all duration-300 shadow-md"
                  />
                ))}
              </div>
            </div>

            <div className="ml-4 flex flex-col items-center justify-center h-full">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700 rounded-xl sm:rounded-2xl flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <PlusIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white mb-1">
                Start New Project
              </h3>
              <p className="text-gray-600 dark:text-slate-400 text-[10px] sm:text-xs px-1 sm:px-2 line-clamp-2">
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
                className={`relative bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer aspect-[3/4] min-h-[180px] sm:min-h-[200px] flex flex-col w-full text-left border-2 ${variants.border} hover:border-opacity-100 border-opacity-60 group overflow-hidden transform hover:-translate-y-1`}
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
                <div className="p-3 sm:p-4 flex flex-col flex-1 pl-6 sm:pl-7">
                  <div className="flex items-start justify-between mb-2 sm:mb-3">
                    <div
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center bg-gradient-to-br ${variants.gradient} shadow-lg transform group-hover:scale-110 transition-transform duration-300`}
                    >
                      <IconComponent className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openDeleteModal(project, e);
                      }}
                      className="p-1.5 rounded-lg cursor-pointer text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      aria-label={`Delete ${project.name}`}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>

                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-2 leading-tight mb-1 sm:mb-2">
                    {project.name}
                  </h3>

                  <p className="text-slate-600 dark:text-slate-400 text-[10px] sm:text-xs mb-2 sm:mb-3 line-clamp-2 sm:line-clamp-3 flex-1">
                    {project.description ||
                      "Study complex inheritance patterns including codominance and incomplete dominance"}
                  </p>

                  {/* Footer with colorful gradient background */}
                  <div className={`border-t-2 ${variants.border} pt-1.5 sm:pt-2 mt-auto`}>
                    <div className={`text-[10px] sm:text-xs font-medium ${variants.text}`}>
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
            <BeakerIcon className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-500 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
              No projects found
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mb-4">
              {searchTerm
                ? "Try adjusting your search terms."
                : "Get started by creating your first project."}
            </p>
            <button
              onClick={() => handleCreateProject()}
              className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
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
