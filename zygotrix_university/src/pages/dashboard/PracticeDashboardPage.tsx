import { FiActivity, FiFlag, FiPlay } from "react-icons/fi";
import AccentButton from "../../components/common/AccentButton";
import PracticeInsightsList from "../../components/dashboard/widgets/PracticeInsightsList";
import { usePracticeSets } from "../../hooks/usePracticeSets";
import { useDashboardSummary } from "../../hooks/useDashboardSummary";

const PracticeDashboardPage = () => {
  const { practiceSets, loading } = usePracticeSets();
  const { summary } = useDashboardSummary();

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 rounded-[1.75rem] border border-white/10 bg-white/7 p-6 md:flex-row md:items-center md:justify-between">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-indigo-200">
            <FiActivity /> Practice studio
          </span>
          <h2 className="mt-3 text-2xl font-semibold text-white">Keep your streak going</h2>
          <p className="text-sm text-slate-300">
            Personalized question sets adapt as you answer. Replay missions, review explanations, and bookmark topics to
            revisit with a mentor.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <AccentButton to="/practice" icon={<FiPlay />}>
            Launch latest set
          </AccentButton>
          <AccentButton to="/dashboard/analytics" variant="secondary">
            View detailed stats
          </AccentButton>
        </div>
      </div>

      <div className="rounded-[1.75rem] border border-white/10 bg-white/6 p-6">
        <h3 className="text-lg font-semibold text-white">Recommended topics</h3>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {(loading && practiceSets.length === 0 ? [] : practiceSets).map((topic) => (
            <div
              key={topic.id}
              className="rounded-[1.25rem] border border-white/10 bg-white/5 px-5 py-4"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-white">{topic.title}</p>
                <span className="text-xs font-semibold uppercase tracking-[0.24em] text-indigo-200">
                  {topic.tag}
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-300">
                {topic.questions ?? 0} questions • {topic.estimatedTime ?? "Approx. 20 mins"}
              </p>
              <div className="mt-4 flex items-center justify-between">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-indigo-100">
                  Accuracy {topic.accuracy ?? 0}%
                </span>
                <AccentButton to="/practice" variant="ghost" className="px-3 py-1 text-xs">
                  Start set
                </AccentButton>
              </div>
            </div>
          ))}
          {loading && practiceSets.length === 0 &&
            Array.from({ length: 2 }).map((_, index) => (
              <div
                key={`skeleton-${index}`}
                className="h-40 animate-pulse rounded-[1.25rem] border border-white/10 bg-white/5"
              />
            ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <PracticeInsightsList insights={summary?.insights ?? []} />
        <div className="rounded-[1.75rem] border border-white/10 bg-white/6 p-6">
          <h3 className="text-lg font-semibold text-white">Weekly challenge</h3>
          <p className="mt-2 text-sm text-indigo-100">
            Build an AI readiness canvas for your team. Reference lessons from Module 3 and prepare to present in the
            next mentor circle.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.24em] text-indigo-200">
              <FiFlag /> Bonus XP
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.24em] text-indigo-200">
              Due Jan 28
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PracticeDashboardPage;
