import { FiLayers, FiClock } from "react-icons/fi";
import type { LearningPath } from "../../types";
import AccentButton from "../common/AccentButton";

interface LearningPathCardProps {
  path: LearningPath;
}

const LearningPathCard = ({ path }: LearningPathCardProps) => {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/8 bg-gradient-to-b from-indigo-500/10 via-transparent to-white/5 p-6 transition duration-300 hover:border-indigo-400/40">
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-indigo-500/15 via-indigo-500/5 to-transparent" />
      <div className="relative space-y-5">
        <span className="inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-100">
          <FiLayers />
          Career Track
        </span>
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-white">{path.title}</h3>
          <p className="text-sm text-slate-300">{path.description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {path.focus.map((item) => (
            <span
              key={item}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-200"
            >
              {item}
            </span>
          ))}
        </div>
        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
          <span className="inline-flex items-center gap-2">
            <FiClock />
            {path.estimatedTime}
          </span>
          <span>{path.courses.length} programs</span>
        </div>
        <AccentButton to="/paths" variant="secondary">
          View Path
        </AccentButton>
      </div>
    </div>
  );
};

export default LearningPathCard;
