import LearnerSnapshot from "../../components/dashboard/widgets/LearnerSnapshot";
import CourseProgressCard from "../../components/dashboard/widgets/CourseProgressCard";
import StatCard from "../../components/dashboard/widgets/StatCard";
import ScheduleTimeline from "../../components/dashboard/widgets/ScheduleTimeline";
import PracticeInsightsList from "../../components/dashboard/widgets/PracticeInsightsList";
import { useDashboardSummary } from "../../hooks/useDashboardSummary";

const OverviewDashboardPage = () => {
  const { summary } = useDashboardSummary();

  if (!summary) {
    return (
      <div className="space-y-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
          <div className="h-64 animate-pulse rounded-[1.75rem] border border-border bg-background-subtle" />
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-32 animate-pulse rounded-[1.5rem] border border-border bg-background-subtle"
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

      {/* Learning Analytics Charts */}
      {/* <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-[1.75rem] border border-border bg-surface p-6 transition-colors">
          <div className="mb-4 flex items-center gap-2">
            <FiPieChart className="h-5 w-5 text-accent" />
            <h3 className="text-lg font-semibold text-foreground">
              Course Status
            </h3>
          </div>
          <CourseCompletionChart courses={summary.courses} />
        </div>

        <div className="rounded-[1.75rem] border border-border bg-surface p-6 transition-colors lg:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <FiBarChart2 className="h-5 w-5 text-accent" />
            <h3 className="text-lg font-semibold text-foreground">
              Module Progress
            </h3>
          </div>
          <ModuleProgressChart courses={summary.courses} />
        </div>
      </div> */}

      {/* Learning Trend */}
      {/* <div className="rounded-[1.75rem] border border-border bg-surface p-6 transition-colors">
        <div className="mb-4 flex items-center gap-2">
          <FiTrendingUp className="h-5 w-5 text-accent" />
          <h3 className="text-lg font-semibold text-foreground">
            Learning Momentum
          </h3>
        </div>
        <LearningTrendChart courses={summary.courses} />
      </div> */}

      <div className="grid gap-6 lg:grid-cols-2">
        {summary.courses.map((course) => (
          <CourseProgressCard key={course.courseSlug} course={course} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <ScheduleTimeline events={summary.schedule} />
        <PracticeInsightsList insights={summary.insights} />
      </div>

      {/* <SavedResources resources={summary.resources} /> */}
    </div>
  );
};

export default OverviewDashboardPage;
