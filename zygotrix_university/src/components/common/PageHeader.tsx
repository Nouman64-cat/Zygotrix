import type { ReactNode } from "react";
import { cn } from "../../utils/cn";

interface PageHeaderProps {
  title: string;
  description: ReactNode;
  eyebrow?: string;
  actions?: ReactNode;
  className?: string;
}

const PageHeader = ({ title, description, eyebrow, actions, className }: PageHeaderProps) => {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-8 sm:p-12",
        className,
      )}
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-4">
          {eyebrow && (
            <span className="inline-block rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.32em] text-indigo-200">
              {eyebrow}
            </span>
          )}
          <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">{title}</h1>
          <div className="text-base text-slate-200">{description}</div>
        </div>
        {actions && <div className="flex shrink-0 flex-col items-start gap-3">{actions}</div>}
      </div>
    </div>
  );
};

export default PageHeader;
