import { FiBookOpen, FiDownloadCloud, FiExternalLink } from "react-icons/fi";
import AccentButton from "../../components/common/AccentButton";
import { useDashboardSummary } from "../../hooks/useDashboardSummary";

const CoursesDashboardPage = () => {
  const { summary } = useDashboardSummary();

  if (!summary) {
    return (
      <div className="space-y-8">
        <div className="flex h-40 animate-pulse rounded-[1.75rem] border border-white/10 bg-white/5" />
        <div className="space-y-6">
          {Array.from({ length: 2 }).map((_, index) => (
            <div
              key={index}
              className="h-72 animate-pulse rounded-[1.75rem] border border-white/10 bg-white/5"
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
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-indigo-200">
            My programs
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Stay on track this week</h2>
          <p className="text-sm text-slate-300">
            Review the modules in progress, download resources, and join upcoming live sessions from this dashboard.
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
            className="rounded-[1.75rem] border border-white/10 bg-white/6 p-6"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-indigo-100">
                  <FiBookOpen /> {course.category}
                </span>
                <h3 className="mt-3 text-xl font-semibold text-white">{course.title}</h3>
                {course.instructor && (
                  <p className="text-xs text-indigo-100">Instructor · {course.instructor}</p>
                )}
              </div>
              <div className="rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                <p className="font-semibold text-white">Next session</p>
                <p className="text-xs text-indigo-100">{course.nextSession ?? "TBA"}</p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {course.modules.map((module) => (
                <div
                  key={module.moduleId}
                  className="flex flex-col gap-4 rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-indigo-200">
                      {module.status === "completed"
                        ? "Completed"
                        : module.status === "in-progress"
                          ? "In progress"
                          : "Locked"}
                    </p>
                    <h4 className="text-sm font-semibold text-white">{module.title}</h4>
                    <p className="text-xs text-slate-300">Estimated · {module.duration}</p>
                  </div>
                    <div className="flex flex-col gap-3 sm:w-56">
                      <div className="relative h-2 rounded-full bg-white/10">
                        <div
                          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-indigo-400 via-blue-400 to-purple-400"
                          style={{ width: `${module.completion}%` }}
                      />
                    </div>
                    <p className="text-xs text-right text-indigo-100">{module.completion}%</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-indigo-200">
                    <FiDownloadCloud /> Download resources
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CoursesDashboardPage;
