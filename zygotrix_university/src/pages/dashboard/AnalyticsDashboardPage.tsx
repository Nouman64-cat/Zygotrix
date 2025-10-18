import { FiTrendingUp } from "react-icons/fi";
import StatCard from "../../components/dashboard/widgets/StatCard";
import { useDashboardSummary } from "../../hooks/useDashboardSummary";

const AnalyticsDashboardPage = () => {
  const { summary } = useDashboardSummary();

  if (!summary) {
    return (
      <div className="space-y-8">
        <div className="flex h-40 animate-pulse rounded-[1.75rem] border border-white/10 bg-white/5" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-32 animate-pulse rounded-[1.5rem] border border-white/10 bg-white/5"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 rounded-[1.75rem] border border-white/10 bg-white/7 p-6 md:flex-row md:items-center md:justify-between">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-indigo-200">
            <FiTrendingUp /> Performance analytics
          </span>
          <h2 className="mt-3 text-2xl font-semibold text-white">Track your learning momentum</h2>
          <p className="text-sm text-slate-300">
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
        <div className="rounded-[1.75rem] border border-white/10 bg-white/6 p-6">
          <h3 className="text-lg font-semibold text-white">Momentum snapshot</h3>
          <p className="mt-2 text-sm text-indigo-100">
            Based on the last 30 days of activity across lessons, practice sets, and Simulation Studio missions.
          </p>
          <div className="mt-5 space-y-4">
            {summary.insights.map((insight) => (
              <div key={insight.id} className="rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-sm font-semibold text-white">{insight.title}</p>
                <p className="text-xs text-slate-300">{insight.description}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-[1.75rem] border border-white/10 bg-white/6 p-6">
          <h3 className="text-lg font-semibold text-white">Readiness checkpoints</h3>
          <ul className="mt-4 space-y-4 text-sm text-slate-200">
            <li className="flex items-center justify-between rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-3">
              <span>AI product strategy presentation</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-indigo-100">
                85% ready
              </span>
            </li>
            <li className="flex items-center justify-between rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-3">
              <span>Service mesh observability walkthrough</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-indigo-100">
                72% ready
              </span>
            </li>
            <li className="flex items-center justify-between rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-3">
              <span>Mentor-led storytelling review</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-indigo-100">
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
