import React from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  FolderIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";

interface ProjectsSidebarProject {
  id: string;
  name: string;
  color: string;
  icon: React.ComponentType<{ className?: string }>;
  type: string;
  // formatted created date or fallback
  createdAt?: string;
  toolCount: number;
}

interface ProjectsSidebarProps {
  isProjectsCollapsed: boolean;
  setIsProjectsCollapsed: (collapsed: boolean) => void;
  existingProjects: ProjectsSidebarProject[];
  projectsLoading: boolean;
}

const ProjectsSidebar: React.FC<ProjectsSidebarProps> = ({
  isProjectsCollapsed,
  setIsProjectsCollapsed,
  existingProjects,
  projectsLoading,
}) => {
  const navigate = useNavigate();

  return (
    <div
      className={`${
        isProjectsCollapsed ? "w-12 min-w-[3rem]" : "w-64 min-w-[16rem]"
      } bg-white border-l border-gray-200 flex-shrink-0 overflow-hidden transition-all duration-300`}
    >
      {/* Collapse/Expand Button */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <button
          onClick={() => setIsProjectsCollapsed(!isProjectsCollapsed)}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
          title={isProjectsCollapsed ? "Expand Projects" : "Collapse Projects"}
        >
          {isProjectsCollapsed ? (
            <ChevronLeftIcon className="h-4 w-4 text-gray-600" />
          ) : (
            <ChevronRightIcon className="h-4 w-4 text-gray-600" />
          )}
        </button>
        {!isProjectsCollapsed && (
          <h3 className="font-semibold">Existing Projects</h3>
        )}
      </div>

      {!isProjectsCollapsed ? (
        <div className="p-4 overflow-y-auto">
          <div className="space-y-3 ">
            {projectsLoading ? (
              // Loading state
              <div className="space-y-3 ">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse ">
                    <div className="flex items-start space-x-3 p-3">
                      <div className="w-8 h-8 bg-gray-200 rounded"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-2/3 mb-1"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : existingProjects.length > 0 ? (
              // Real projects
              existingProjects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => navigate(`/portal/workspace/${project.id}`)}
                  className="relative w-full text-left p-3 cursor-pointer rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all group overflow-hidden"
                >
                  {/* Mini notebook binding holes */}
                  <div className="absolute left-2 top-3 bottom-3 w-1">
                    <div className="flex flex-col justify-start space-y-2 h-full">
                      {[...Array(4)].map((_, i) => (
                        <div
                          key={i}
                          className="w-1 h-1 rounded-full bg-gray-300"
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 ml-2">
                    <div
                      className={`w-8 h-8 ${project.color} rounded flex items-center justify-center flex-shrink-0`}
                    >
                      <project.icon className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm text-gray-900 truncate">
                        {project.name}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">
                        {project.type}
                        {project.toolCount > 0 && (
                          <span className="ml-1 text-gray-400">
                            • {project.toolCount} tool
                            {project.toolCount !== 1 ? "s" : ""}
                          </span>
                        )}
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-gray-400">
                          Created: {project.createdAt || "Unknown"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Subtle lined effect for mini notebook */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute left-8 right-2 top-6 bottom-2 opacity-5">
                      {[...Array(3)].map((_, i) => (
                        <div
                          key={i}
                          className="border-b border-gray-300 h-2"
                          style={{ marginTop: i === 0 ? 0 : "6px" }}
                        />
                      ))}
                    </div>
                  </div>
                </button>
              ))
            ) : (
              // Empty state
              <div className="text-center py-6">
                <div className="text-gray-400 text-sm">
                  No other projects found
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={() => navigate("/portal/projects")}
              className="w-full text-left p-2 text-sm text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
            >
              View All Projects →
            </button>
          </div>
        </div>
      ) : (
        <div className="p-2 overflow-y-auto">
          <div className="space-y-2">
            {projectsLoading ? (
              // Loading state for collapsed
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 bg-gray-200 rounded animate-pulse"
                  ></div>
                ))}
              </div>
            ) : existingProjects.length > 0 ? (
              // Real projects as icons
              existingProjects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => navigate(`/portal/workspace/${project.id}`)}
                  className={`w-8 h-8 ${project.color} rounded flex items-center justify-center transition-all cursor-pointer hover:scale-110`}
                  title={`${project.name} - ${project.type}`}
                >
                  <project.icon className="h-4 w-4 text-white" />
                </button>
              ))
            ) : (
              // Empty state for collapsed
              <div
                className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center"
                title="No projects"
              >
                <FolderIcon className="h-4 w-4 text-gray-400" />
              </div>
            )}

            {/* View All Projects button as icon */}
            <div className="border-t border-gray-200 pt-2 mt-2">
              <button
                onClick={() => navigate("/portal/projects")}
                className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center transition-all cursor-pointer hover:scale-110"
                title="View All Projects"
              >
                <ArrowLeftIcon className="h-4 w-4 text-blue-600 rotate-180" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsSidebar;
