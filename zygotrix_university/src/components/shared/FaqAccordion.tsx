import { useState } from "react";
import { FiChevronDown } from "react-icons/fi";
import type { FaqItem } from "../../types";
import { cn } from "../../utils/cn";

interface FaqAccordionProps {
  items: FaqItem[];
}

const FaqAccordion = ({ items }: FaqAccordionProps) => {
  const [activeId, setActiveId] = useState<string | null>(items[0]?.id ?? null);

  return (
    <div className="space-y-4">
      {items.map((item) => {
        const isOpen = activeId === item.id;
        return (
          <div
            key={item.id}
            className={cn(
              "rounded-3xl border border-white/10 bg-white/[0.04] p-5 transition duration-200",
              isOpen && "border-indigo-400/60 bg-indigo-500/[0.08]",
            )}
          >
            <button
              className="flex w-full items-center justify-between gap-3 text-left"
              onClick={() => setActiveId(isOpen ? null : item.id)}
            >
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-200">
                  {item.category}
                </p>
                <p className="mt-2 text-base font-semibold text-white">{item.question}</p>
              </div>
              <span
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white transition",
                  isOpen && "rotate-180 border-indigo-400",
                )}
              >
                <FiChevronDown />
              </span>
            </button>
            {isOpen && (
              <p className="mt-4 text-sm text-slate-200">{item.answer}</p>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default FaqAccordion;
