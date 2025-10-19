import { FiTrendingUp } from "react-icons/fi";
import StatCard from "../../components/dashboard/widgets/StatCard";
import { useDashboardSummary } from "../../hooks/useDashboardSummary";

const AnalyticsDashboardPage = () => {
  const { summary } = useDashboardSummary();

  if (!summary) {
    return (
      <div className="space-y-8">
        <div className="flex h-40 animate-pulse rounded-[1.75rem] border border-border bg-background-subtle" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-32 animate-pulse rounded-[1.5rem] border border-border bg-background-subtle"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 rounded-[1.75rem] border border-border bg-surface p-6 transition-colors md:flex-row md:items-center md:justify-between">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background-subtle px-3 py-1 text-xs text-accent transition-colors">
            <FiTrendingUp /> Performance analytics
          </span>
          <h2 className="mt-3 text-2xl font-semibold text-foreground">
            Track your learning momentum
          </h2>
          <p className="text-sm text-muted">
            Each metric calibrates against your cohort’s median. Use these insights to plan study blocks and coordinate
            with mentors.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summary.stats.map((stat) => (
          <StatCard key={stat.id} stat={stat} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[1.75rem] border border-border bg-surface p-6 transition-colors">
          <h3 className="text-lg font-semibold text-foreground">Momentum snapshot</h3>
          <p className="mt-2 text-sm text-muted">
            Based on the last 30 days of activity across lessons, practice sets, and Simulation Studio missions.
          </p>
          <div className="mt-5 space-y-4">
            {summary.insights.map((insight) => (
              <div
                key={insight.id}
                className="rounded-[1.25rem] border border-border bg-background-subtle px-4 py-3 transition-colors"
              >
                <p className="text-sm font-semibold text-foreground">{insight.title}</p>
                <p className="text-xs text-muted">{insight.description}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-[1.75rem] border border-border bg-surface p-6 transition-colors">
          <h3 className="text-lg font-semibold text-foreground">Readiness checkpoints</h3>
          <ul className="mt-4 space-y-4 text-sm text-muted">
            <li className="flex items-center justify-between rounded-[1.25rem] border border-border bg-background-subtle px-4 py-3 transition-colors">
              <span>AI product strategy presentation</span>
              <span className="rounded-full border border-border bg-background-subtle px-3 py-1 text-xs text-accent transition-colors">
                85% ready
              </span>
            </li>
            <li className="flex items-center justify-between rounded-[1.25rem] border border-border bg-background-subtle px-4 py-3 transition-colors">
              <span>Service mesh observability walkthrough</span>
              <span className="rounded-full border border-border bg-background-subtle px-3 py-1 text-xs text-accent transition-colors">
                72% ready
              </span>
            </li>
            <li className="flex items-center justify-between rounded-[1.25rem] border border-border bg-background-subtle px-4 py-3 transition-colors">
              <span>Mentor-led storytelling review</span>
              <span className="rounded-full border border-border bg-background-subtle px-3 py-1 text-xs text-accent transition-colors">
                93% ready
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboardPage;
