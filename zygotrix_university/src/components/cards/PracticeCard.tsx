import { FiTrendingUp, FiTrendingDown, FiClock } from "react-icons/fi";
import type { PracticeTopic } from "../../types";
import { cn } from "../../utils/cn";

interface PracticeCardProps {
  topic: PracticeTopic;
}

const PracticeCard = ({ topic }: PracticeCardProps) => {
  const TrendIcon = topic.trend === "up" ? FiTrendingUp : FiTrendingDown;

  return (
    <div className="rounded-3xl border border-white/8 bg-white/5 p-6 transition duration-300 hover:border-indigo-400/50 hover:shadow-xl hover:shadow-indigo-500/20">
      <div className="flex items-start justify-between">
        <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold text-indigo-100">
          {topic.tag}
        </span>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold",
            topic.trend === "up"
              ? "bg-emerald-500/15 text-emerald-300"
              : "bg-rose-500/15 text-rose-300",
          )}
        >
          <TrendIcon />
          {topic.accuracy}%
        </span>
      </div>
      <h3 className="mt-4 text-lg font-semibold text-white">{topic.title}</h3>
      <p className="mt-2 text-sm text-slate-300">
        {topic.questions} curated MCQs •{" "}
        <span className="inline-flex items-center gap-1 text-indigo-100">
          <FiClock />
          {topic.timeToComplete}
        </span>
      </p>
      <div className="mt-6 flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs text-slate-300">
        <span>Adaptive feedback enabled</span>
        <span className="font-semibold text-indigo-200">Try Quiz</span>
      </div>
    </div>
  );
};

export default PracticeCard;
