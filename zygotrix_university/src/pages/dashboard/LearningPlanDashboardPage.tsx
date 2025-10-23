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
        <div className="flex h-40 animate-pulse rounded-[1.75rem] border border-border bg-background-subtle" />
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="h-64 animate-pulse rounded-[1.75rem] border border-border bg-background-subtle" />
          <div className="h-64 animate-pulse rounded-[1.75rem] border border-border bg-background-subtle" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 rounded-[1.75rem] border border-border bg-surface p-6 transition-colors md:flex-row md:items-center md:justify-between">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background-subtle px-3 py-1 text-xs text-accent transition-colors">
            <FiList /> Personal plan
          </span>
          <h2 className="mt-3 text-2xl font-semibold text-foreground">
            This week’s learning sprint
          </h2>
          <p className="text-sm text-muted">
            Keep momentum with curated milestones and Simulation Studio
            missions. Update completion status after each learning block to
            maintain your streak.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <AccentButton to="/university/practice" variant="secondary">
            Review practice sets
          </AccentButton>
          <AccentButton to="/university/analytics" icon={<FiTarget />}>
            Check readiness
          </AccentButton>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <ScheduleTimeline events={summary.schedule} />
        <div className="rounded-[1.75rem] border border-border bg-surface p-6 transition-colors">
          <h3 className="text-lg font-semibold text-foreground">Milestones</h3>
          <ul className="mt-4 space-y-4">
            {milestones.map((item) => (
              <li
                key={item.id}
                className="flex items-start gap-3 rounded-[1.25rem] border border-border bg-background-subtle px-4 py-3 transition-colors"
              >
                <span className="mt-1 text-accent">
                  <FiCheckCircle />
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {item.title}
                  </p>
                  <p className="text-xs text-muted">
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
