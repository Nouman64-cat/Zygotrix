import { FiExternalLink, FiFileText, FiHeadphones, FiLayers } from "react-icons/fi";
import type { ResourceItem } from "../../../types";
import { cn } from "../../../utils/cn";

interface SavedResourcesProps {
  resources: ResourceItem[];
}

const iconByType: Record<ResourceItem["type"], typeof FiLayers> = {
  playbook: FiLayers,
  template: FiFileText,
  recording: FiHeadphones,
  article: FiFileText,
};

const SavedResources = ({ resources }: SavedResourcesProps) => {
  return (
    <div className="rounded-[1.75rem] border border-white/10 bg-white/6 p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Saved resources</h3>
        <a
          href="#"
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-indigo-200 hover:text-white"
        >
          View all
          <FiExternalLink />
        </a>
      </div>
      <ul className="mt-5 space-y-4">
        {resources.map((resource) => {
          const Icon = iconByType[resource.type];
          return (
            <li
              key={resource.id}
              className={cn(
                "rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-3 transition hover:border-indigo-400/40",
              )}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/6 text-indigo-200">
                  <Icon />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">{resource.title}</p>
                  <p className="text-xs text-slate-300">{resource.description}</p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default SavedResources;
