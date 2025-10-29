import {
  FiBookOpen,
  FiClock,
  FiUsers,
  FiCheckCircle,
  FiLayers,
  FiBook,
} from "react-icons/fi";
import { Link } from "react-router-dom";
import AccentButton from "../../components/common/AccentButton";
import { useDashboardSummary } from "../../hooks/useDashboardSummary";

const CoursesDashboardPage = () => {
  const { summary } = useDashboardSummary();

  if (!summary) {
    return (
      <div className="space-y-8">
        <div className="flex h-40 animate-pulse rounded-[1.75rem] border border-border bg-background-subtle" />
        <div className="space-y-6">
          {Array.from({ length: 2 }).map((_, index) => (
            <div
              key={index}
              className="h-72 animate-pulse rounded-[1.75rem] border border-border bg-background-subtle"
            />
          ))}
        </div>
      </div>
    );
  }

  if (!summary.courses || summary.courses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <FiBookOpen className="h-16 w-16 text-accent mb-6" />
        <h2 className="text-3xl font-bold text-foreground mb-4">
          Start Your Learning!
        </h2>
        <p className="text-lg text-muted mb-6 max-w-xl">
          Join a vibrant community of learners and take the next step in your
          journey today!
        </p>
        <AccentButton to="/university/browse-courses" variant="primary">
          Browse Courses
        </AccentButton>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 rounded-[1.75rem] border border-border bg-surface p-6 transition-colors md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
            My Learning
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-foreground">
            Enrolled Courses
          </h2>
          <p className="text-sm text-muted">
            Continue your learning journey. Select a course to access modules
            and track your progress.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <AccentButton to="/university/practice" variant="primary">
            Launch practice studio
          </AccentButton>
        </div>
      </div>

      {/* Course Cards Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {summary.courses.map((course) => {
          const totalModules = course.modules.length;
          const completedModules = course.modules.filter(
            (m) => m.status === "completed"
          ).length;
          const inProgressModules = course.modules.filter(
            (m) => m.status === "in-progress"
          ).length;

          // Calculate total duration (sum of all module durations)
          const totalDuration = course.modules[0]?.duration || "Self-paced";

          return (
            <Link
              key={course.courseSlug}
              to={`/university/courses/${course.courseSlug}`}
              className="group block rounded-[1.75rem] border border-border bg-surface p-6 transition-all hover:border-accent hover:shadow-lg hover:scale-[1.02] no-underline"
            >
              <div className="w-full h-40 mb-4 rounded-xl overflow-hidden bg-background-subtle flex items-center justify-center">
                {course.image_url ? (
                  <img
                    src={course.image_url ?? ""}
                    alt={course.title}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted text-2xl">
                    <FiBook />
                  </div>
                )}
              </div>
              {/* Course Category Badge */}
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background-subtle px-3 py-1.5 text-xs font-medium text-accent transition-colors group-hover:border-accent group-hover:bg-accent-soft">
                  <FiBookOpen className="h-3 w-3" />
                  {course.category || course.level || "Course"}
                </span>
                {course.progress >= 100 && (
                  <FiCheckCircle className="h-5 w-5 text-emerald-400" />
                )}
              </div>

              {/* Course Title */}
              <h3 className="text-lg font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-accent transition-colors">
                {course.title}
              </h3>

              {/* Instructor */}
              {course.instructor && (
                <p className="text-xs text-muted mb-4">
                  Instructor: {course.instructor}
                </p>
              )}

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted">
                    Progress
                  </span>
                  <span className="text-xs font-semibold text-accent">
                    {course.progress}%
                  </span>
                </div>
                <div className="relative h-2 rounded-full bg-accent-soft overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500 transition-all duration-500"
                    style={{ width: `${course.progress}%` }}
                  />
                </div>
              </div>

              {/* Course Stats */}
              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border">
                {/* Total Modules */}
                <div className="flex items-center gap-2">
                  <FiLayers className="h-4 w-4 text-muted" />
                  <div>
                    <p className="text-xs text-muted">Modules</p>
                    <p className="text-sm font-semibold text-foreground">
                      {totalModules}
                    </p>
                  </div>
                </div>

                {/* Duration */}
                <div className="flex items-center gap-2">
                  <FiClock className="h-4 w-4 text-muted" />
                  <div>
                    <p className="text-xs text-muted">Duration</p>
                    <p className="text-sm font-semibold text-foreground">
                      {totalDuration}
                    </p>
                  </div>
                </div>

                {/* Completed */}
                <div className="flex items-center gap-2">
                  <FiCheckCircle className="h-4 w-4 text-emerald-400" />
                  <div>
                    <p className="text-xs text-muted">Completed</p>
                    <p className="text-sm font-semibold text-foreground">
                      {completedModules}/{totalModules}
                    </p>
                  </div>
                </div>

                {/* In Progress */}
                <div className="flex items-center gap-2">
                  <FiUsers className="h-4 w-4 text-muted" />
                  <div>
                    <p className="text-xs text-muted">In Progress</p>
                    <p className="text-sm font-semibold text-foreground">
                      {inProgressModules}
                    </p>
                  </div>
                </div>
              </div>

              {/* Next Session Badge */}
              {course.nextSession && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs text-muted mb-1">Next Session</p>
                  <p className="text-sm font-medium text-foreground">
                    {course.nextSession}
                  </p>
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default CoursesDashboardPage;
