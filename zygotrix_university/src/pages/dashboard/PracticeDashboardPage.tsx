import { FiActivity, FiFlag, FiPlay } from "react-icons/fi";
import AccentButton from "../../components/common/AccentButton";
import PracticeInsightsList from "../../components/dashboard/widgets/PracticeInsightsList";
import { practiceInsights } from "../../data/dashboardData";
import { practiceTopics } from "../../data/universityData";

const PracticeDashboardPage = () => {
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
          {practiceTopics.map((topic) => (
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
                {topic.questions} questions • {topic.timeToComplete}
              </p>
              <div className="mt-4 flex items-center justify-between">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-indigo-100">
                  Accuracy {topic.accuracy}%
                </span>
                <AccentButton to="/practice" variant="ghost" className="px-3 py-1 text-xs">
                  Start set
                </AccentButton>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <PracticeInsightsList insights={practiceInsights} />
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
