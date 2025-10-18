import type { ReactNode } from "react";
import { cn } from "../../utils/cn";

interface SectionHeadingProps {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  className?: string;
}

const SectionHeading = ({
  eyebrow,
  title,
  description,
  align = "left",
  className,
}: SectionHeadingProps) => {
  return (
    <div
      className={cn(
        "flex flex-col gap-3",
        align === "center" ? "text-center items-center" : "text-left",
        className,
      )}
    >
      {eyebrow && (
        <span className="inline-block rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-indigo-200">
          {eyebrow}
        </span>
      )}
      <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
        {title}
      </h2>
      {description && (
        <p className="max-w-3xl text-base text-slate-300">{description}</p>
      )}
    </div>
  );
};

export default SectionHeading;
