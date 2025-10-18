import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { FiChevronLeft, FiCheckCircle } from "react-icons/fi";
import PageHeader from "../../components/common/PageHeader";
import Container from "../../components/common/Container";
import AccentButton from "../../components/common/AccentButton";
import { useCourseWorkspace } from "../../hooks/useCourseWorkspace";

const ModuleProgressBar = ({ completion }: { completion: number }) => (
  <div className="h-2 rounded-full bg-white/10">
    <div
      className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500 transition-all"
      style={{ width: `${completion}%` }}
    />
  </div>
);

const DashboardCourseWorkspacePage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { course, progress, loading, saving, error, toggleItem, completeModule } = useCourseWorkspace(slug);

  const completionSummary = useMemo(() => {
    if (!progress || progress.modules.length === 0) {
      return 0;
    }
    return Math.round(
      progress.modules.reduce((sum, module) => sum + module.completion, 0) /
        progress.modules.length,
    );
  }, [progress]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-indigo-200">
        Loading workspace…
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-indigo-200">
        <p>We couldn’t find that course.</p>
        <AccentButton to="/dashboard/courses" variant="secondary">
          Back to courses
        </AccentButton>
      </div>
    );
  }

  if (course.contentLocked) {
    return (
      <div className="space-y-6">
        <div className="rounded-[2.5rem] border border-indigo-400/30 bg-indigo-500/10 p-8 text-indigo-100">
          <h1 className="text-3xl font-semibold text-white">Enroll to unlock your workspace</h1>
          <p className="mt-2 text-sm text-indigo-100">
            You need to enroll in this course before accessing the detailed modules and lessons.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <AccentButton to={`/courses/${course.slug}`} icon={<FiChevronLeft />}>
              View course details
            </AccentButton>
            <AccentButton to={`/signin?redirect=/courses/${course.slug}`} variant="secondary">
              Sign in to enroll
            </AccentButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <PageHeader
        eyebrow="Course Workspace"
        title={course.title}
        description={
          <div className="space-y-3 text-sm text-indigo-100">
            {course.shortDescription && <p>{course.shortDescription}</p>}
            <p className="text-xs uppercase tracking-[0.3em] text-indigo-200">
              Overall progress • {completionSummary}%
            </p>
          </div>
        }
        actions={
          <AccentButton to={`/courses/${course.slug}`} variant="secondary">
            Course overview
          </AccentButton>
        }
      />

      {error && (
        <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error.message}
        </div>
      )}

      <Container className="space-y-6">
        {progress && progress.modules.length > 0 ? (
          progress.modules.map((module) => {
            const metaModule = course.modules.find(
              (baseModule) =>
                baseModule.id === module.moduleId ||
                baseModule.title === module.title,
            );
            const totalItems = module.items.length;
            const completedItems = module.items.filter((item) => item.completed).length;
            const isCompleted = module.completion >= 100;
            return (
              <div
                key={module.moduleId}
                className="space-y-4 rounded-[2.5rem] border border-white/10 bg-white/5 p-6"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-200">
                      Module
                    </p>
                  <h2 className="text-lg font-semibold text-white">{module.title}</h2>
                  <div className="mt-2 flex items-center gap-3 text-xs text-indigo-100">
                    <span>{module.status === "completed" ? "Completed" : module.status === "in-progress" ? "In progress" : "Not started"}</span>
                    {module.duration && <span>• {module.duration}</span>}
                    {totalItems > 0 && (
                      <span>
                        • {completedItems}/{totalItems} lessons complete
                      </span>
                    )}
                  </div>
                </div>
                <div className="w-full sm:w-48">
                  <ModuleProgressBar completion={module.completion} />
                  <p className="mt-2 text-right text-xs text-indigo-100">{module.completion}%</p>
                </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {isCompleted ? (
                    <button
                      onClick={() => completeModule(module.moduleId, false)}
                      disabled={saving}
                      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-indigo-200 transition hover:border-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Reset module
                    </button>
                  ) : (
                    <button
                      onClick={() => completeModule(module.moduleId, true)}
                      disabled={saving}
                      className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Mark module complete
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  {module.items.length === 0 && (
                    <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-slate-300">
                      Lesson details will appear here as they’re released.
                    </p>
                  )}
                  {module.items.map((item) => {
                    const metaItem = metaModule?.items.find(
                      (baseItem) =>
                        baseItem.id === item.moduleItemId ||
                        baseItem.title === item.title,
                    );
                    return (
                      <label
                        key={item.moduleItemId}
                        className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 transition hover:border-indigo-400"
                      >
                        <input
                          type="checkbox"
                          className="mt-1 h-4 w-4 rounded border-indigo-400 bg-[#0b1020] text-indigo-400"
                          checked={item.completed}
                          onChange={() => toggleItem(module.moduleId, item.moduleItemId)}
                          disabled={saving}
                        />
                        <span className="flex-1">
                          <span className="font-medium text-white">{item.title}</span>
                          {metaItem?.description && (
                            <p className="mt-1 text-xs text-slate-400">{metaItem.description}</p>
                          )}
                        </span>
                        {item.completed && (
                          <span className="text-emerald-300">
                            <FiCheckCircle />
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-[2.5rem] border border-white/10 bg-white/5 p-8 text-sm text-slate-200">
            Modules for this course will appear here once they are available.
          </div>
        )}
      </Container>
    </div>
  );
};

export default DashboardCourseWorkspacePage;
