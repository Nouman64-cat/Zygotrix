import { FiTrendingDown, FiTrendingUp } from "react-icons/fi";
import type { PracticeInsight } from "../../../types";
import { cn } from "../../../utils/cn";

interface PracticeInsightsListProps {
  insights: PracticeInsight[];
}

const PracticeInsightsList = ({ insights }: PracticeInsightsListProps) => {
  return (
    <div className="rounded-[1.75rem] border border-border bg-surface p-6 transition-colors">
      <h3 className="text-lg font-semibold text-foreground">Practice insights</h3>
      <ul className="mt-4 space-y-4">
        {insights.map((insight) => {
          const positive = insight.delta >= 0;
          const Icon = positive ? FiTrendingUp : FiTrendingDown;

          return (
            <li
              key={insight.id}
              className="rounded-[1.25rem] border border-border bg-background-subtle px-4 py-3 transition-colors"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-foreground">
                  {insight.title}
                </p>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold",
                    positive
                      ? "bg-emerald-500/15 text-emerald-300"
                      : "bg-rose-500/15 text-rose-300",
                  )}
                >
                  <Icon />
                  {positive ? "+" : ""}
                  {insight.delta}%
                </span>
              </div>
              <p className="mt-2 text-xs text-muted">{insight.description}</p>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default PracticeInsightsList;
