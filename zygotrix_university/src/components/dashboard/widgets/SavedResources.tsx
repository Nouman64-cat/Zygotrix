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
    <div className="rounded-[1.75rem] border border-border bg-surface p-6 transition-colors">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Saved resources</h3>
        <a
          href="#"
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-accent transition-colors hover:text-foreground"
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
                "rounded-[1.25rem] border border-border bg-background-subtle px-4 py-3 transition-colors hover:border-accent",
              )}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background-subtle text-accent">
                  <Icon />
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {resource.title}
                  </p>
                  <p className="text-xs text-muted">{resource.description}</p>
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
