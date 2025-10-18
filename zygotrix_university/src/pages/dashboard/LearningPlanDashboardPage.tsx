import { FiCheckCircle, FiList, FiTarget } from "react-icons/fi";
import AccentButton from "../../components/common/AccentButton";
import ScheduleTimeline from "../../components/dashboard/widgets/ScheduleTimeline";
import { useDashboardSummary } from "../../hooks/useDashboardSummary";

const milestones = [
  {
    id: "milestone-1",
    title: "Complete Model Lifecycle Studio module",
    status: "In progress",
    due: "Jan 24",
  },
  {
    id: "milestone-2",
    title: "Submit Simulation Studio incident response debrief",
    status: "Upcoming",
    due: "Jan 27",
  },
  {
    id: "milestone-3",
    title: "Upload portfolio artifact for AI product strategy",
    status: "Upcoming",
    due: "Jan 31",
  },
];

const LearningPlanDashboardPage = () => {
  const { summary } = useDashboardSummary();

  if (!summary) {
    return (
      <div className="space-y-8">
        <div className="flex h-40 animate-pulse rounded-[1.75rem] border border-white/10 bg-white/5" />
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="h-64 animate-pulse rounded-[1.75rem] border border-white/10 bg-white/5" />
          <div className="h-64 animate-pulse rounded-[1.75rem] border border-white/10 bg-white/5" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 rounded-[1.75rem] border border-white/10 bg-white/7 p-6 md:flex-row md:items-center md:justify-between">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-indigo-200">
            <FiList /> Personal plan
          </span>
          <h2 className="mt-3 text-2xl font-semibold text-white">This week’s learning sprint</h2>
          <p className="text-sm text-slate-300">
            Keep momentum with curated milestones and Simulation Studio missions. Update completion status after each
            learning block to maintain your streak.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <AccentButton to="/dashboard/practice" variant="secondary">
            Review practice sets
          </AccentButton>
          <AccentButton to="/dashboard/analytics" icon={<FiTarget />}>
            Check readiness
          </AccentButton>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <ScheduleTimeline events={summary.schedule} />
        <div className="rounded-[1.75rem] border border-white/10 bg-white/6 p-6">
          <h3 className="text-lg font-semibold text-white">Milestones</h3>
          <ul className="mt-4 space-y-4">
            {milestones.map((item) => (
              <li
                key={item.id}
                className="flex items-start gap-3 rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-3"
              >
                <span className="mt-1 text-indigo-200">
                  <FiCheckCircle />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                  <p className="text-xs text-indigo-100">
                    {item.status} • Due {item.due}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default LearningPlanDashboardPage;
