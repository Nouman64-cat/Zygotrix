import LearnerSnapshot from "../../components/dashboard/widgets/LearnerSnapshot";
import CourseProgressCard from "../../components/dashboard/widgets/CourseProgressCard";
import StatCard from "../../components/dashboard/widgets/StatCard";
import ScheduleTimeline from "../../components/dashboard/widgets/ScheduleTimeline";
import PracticeInsightsList from "../../components/dashboard/widgets/PracticeInsightsList";
import SavedResources from "../../components/dashboard/widgets/SavedResources";
import {
  activeCourses,
  analyticsStats,
  learningSchedule,
  practiceInsights,
  savedResources,
} from "../../data/dashboardData";

const OverviewDashboardPage = () => {
  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <LearnerSnapshot />
        <div className="grid gap-4 sm:grid-cols-2">
          {analyticsStats.map((stat) => (
            <StatCard key={stat.id} stat={stat} />
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {activeCourses.map((course) => (
          <CourseProgressCard key={course.id} course={course} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <ScheduleTimeline events={learningSchedule} />
        <PracticeInsightsList insights={practiceInsights} />
      </div>

      <SavedResources resources={savedResources} />
    </div>
  );
};

export default OverviewDashboardPage;
