import LearnerSnapshot from "../../components/dashboard/widgets/LearnerSnapshot";
import CourseProgressCard from "../../components/dashboard/widgets/CourseProgressCard";
import StatCard from "../../components/dashboard/widgets/StatCard";
import ScheduleTimeline from "../../components/dashboard/widgets/ScheduleTimeline";
import PracticeInsightsList from "../../components/dashboard/widgets/PracticeInsightsList";
import SavedResources from "../../components/dashboard/widgets/SavedResources";
import { useDashboardSummary } from "../../hooks/useDashboardSummary";

const OverviewDashboardPage = () => {
  const { summary, loading } = useDashboardSummary();

  if (!summary) {
    return (
      <div className="space-y-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
          <div className="h-64 animate-pulse rounded-[1.75rem] border border-white/10 bg-white/5" />
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-32 animate-pulse rounded-[1.5rem] border border-white/10 bg-white/5"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <LearnerSnapshot profile={summary.profile} />
        <div className="grid gap-4 sm:grid-cols-2">
          {summary.stats.map((stat) => (
            <StatCard key={stat.id} stat={stat} />
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {summary.courses.map((course) => (
          <CourseProgressCard key={course.courseSlug} course={course} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <ScheduleTimeline events={summary.schedule} />
        <PracticeInsightsList insights={summary.insights} />
      </div>

      <SavedResources resources={summary.resources} />
    </div>
  );
};

export default OverviewDashboardPage;
