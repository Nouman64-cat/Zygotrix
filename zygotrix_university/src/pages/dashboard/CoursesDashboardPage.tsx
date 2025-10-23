import { FiBookOpen, FiDownloadCloud, FiExternalLink } from "react-icons/fi";
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

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 rounded-[1.75rem] border border-border bg-surface p-6 transition-colors md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
            My programs
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-foreground">
            Stay on track this week
          </h2>
          <p className="text-sm text-muted">
            Review the modules in progress, download resources, and join
            upcoming live sessions from this dashboard.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <AccentButton to="/practice" variant="secondary">
            Launch practice studio
          </AccentButton>
          <AccentButton to="/resources" icon={<FiExternalLink />}>
            Browse resource hub
          </AccentButton>
        </div>
      </div>

      <div className="space-y-6">
        {summary.courses.map((course) => (
          <div
            key={course.courseSlug}
            className="rounded-[1.75rem] border border-border bg-surface p-6 transition-colors"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background-subtle px-3 py-1 text-xs text-accent transition-colors">
                  <FiBookOpen /> {course.category}
                </span>
                <h3 className="mt-3 text-xl font-semibold text-foreground">
                  {course.title}
                </h3>
                {course.instructor && (
                  <p className="text-xs text-muted">
                    Instructor · {course.instructor}
                  </p>
                )}
              </div>
              <div className="rounded-[1.25rem] border border-border bg-background-subtle px-4 py-3 text-sm text-muted transition-colors">
                <p className="font-semibold text-foreground">Next session</p>
                <p className="text-xs text-muted">
                  {course.nextSession ?? "TBA"}
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {course.modules.map((module) => (
                <a
                  key={module.moduleId}
                  href={`/dashboard/courses/${course.courseSlug}`}
                  className="block no-underline"
                >
                  <div className="flex flex-col gap-4 rounded-[1.25rem] border border-border bg-background-subtle px-4 py-3 transition-all cursor-pointer hover:border-accent hover:bg-accent-soft hover:shadow-md hover:scale-[1.01] sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-2 flex-1">
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
                        {module.status === "completed"
                          ? "Completed"
                          : module.status === "in-progress"
                          ? "In progress"
                          : "Locked"}
                      </p>
                      <h4 className="text-sm font-semibold text-foreground group-hover:text-accent transition-colors">
                        {module.title}
                      </h4>
                      <p className="text-xs text-muted">
                        Estimated · {module.duration}
                      </p>
                    </div>
                    <div className="flex flex-col gap-3 sm:w-56">
                      <div className="relative h-2 rounded-full bg-accent-soft">
                        <div
                          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-indigo-400 via-blue-400 to-purple-400 transition-all"
                          style={{ width: `${module.completion}%` }}
                        />
                      </div>
                      <p className="text-xs text-right text-muted">
                        {module.completion}%
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        // Handle download resources
                      }}
                      className="flex items-center gap-2 text-xs text-accent cursor-pointer hover:text-foreground transition-colors"
                    >
                      <FiDownloadCloud /> Download resources
                    </button>
                  </div>
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CoursesDashboardPage;
