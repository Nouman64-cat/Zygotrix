import { FiTrendingUp, FiTrendingDown, FiClock } from "react-icons/fi";
import type { PracticeSet } from "../../types";
import { cn } from "../../utils/cn";

interface PracticeCardProps {
  topic: PracticeSet;
  highlighted?: boolean;
}

const PracticeCard = ({ topic, highlighted = false }: PracticeCardProps) => {
  const TrendIcon = topic.trend === "down" ? FiTrendingDown : FiTrendingUp;

  return (
    <div
      className={cn(
        "rounded-3xl border border-border bg-surface p-6 transition duration-300 hover:border-accent hover:shadow-xl hover:shadow-indigo-500/20",
        highlighted && "border-accent",
      )}
    >
      <div className="flex items-start justify-between">
        <span className="rounded-full border border-border bg-background-subtle px-3 py-1 text-xs font-semibold text-accent transition-colors">
          {topic.tag ?? "Practice"}
        </span>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold",
            topic.trend === "down"
              ? "bg-rose-500/12 text-rose-500"
              : "bg-emerald-500/12 text-emerald-500",
          )}
        >
          <TrendIcon />
          {topic.accuracy != null ? `${topic.accuracy}%` : "New"}
        </span>
      </div>
      <h3 className="mt-4 text-lg font-semibold text-foreground">{topic.title}</h3>
      {topic.description && (
        <p className="mt-2 text-xs text-muted line-clamp-2">{topic.description}</p>
      )}
      <p className="mt-2 text-sm text-muted">
        {topic.questions != null ? `${topic.questions} curated MCQs` : "Adaptive MCQs"} •{" "}
        <span className="inline-flex items-center gap-1 text-accent">
          <FiClock />
          {topic.estimatedTime ?? "Approx. 20 mins"}
        </span>
      </p>
      <div className="mt-6 flex items-center justify-between rounded-2xl border border-border bg-background-subtle px-4 py-3 text-xs text-muted transition-colors">
        <span>Adaptive feedback enabled</span>
        <span className="font-semibold text-accent">Try Quiz</span>
      </div>
    </div>
  );
};

export default PracticeCard;
