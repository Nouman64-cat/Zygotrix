import { useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { FiChevronLeft, FiCheckCircle } from "react-icons/fi";
import ReactMarkdown from "react-markdown";
import PageHeader from "../../components/common/PageHeader";
import Container from "../../components/common/Container";
import AccentButton from "../../components/common/AccentButton";
import { useCourseWorkspace } from "../../hooks/useCourseWorkspace";
import { cn } from "../../utils/cn";

const ModuleProgressBar = ({ completion }: { completion: number }) => (
  <div className="h-2 rounded-full bg-accent-soft">
    <div
      className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500 transition-all"
      style={{ width: `${completion}%` }}
    />
  </div>
);

const DashboardCourseWorkspacePage = () => {
  const { slug } = useParams<{ slug: string }>();
  const {
    course,
    progress,
    loading,
    saving,
    error,
    toggleItem,
    completeModule,
    activeLesson,
    setActiveLesson,
  } = useCourseWorkspace(slug);

  const completionSummary = useMemo(() => {
    if (!progress || progress.modules.length === 0) {
      return 0;
    }
    return Math.round(
      progress.modules.reduce((sum, module) => sum + module.completion, 0) /
        progress.modules.length,
    );
  }, [progress]);

  const activeLessonMeta = useMemo(() => {
    if (!course || !activeLesson) {
      return null;
    }
    const progressModule = progress?.modules.find(
      (module) => module.moduleId === activeLesson.moduleId,
    );
    const progressLesson = progressModule?.items.find(
      (item) => item.moduleItemId === activeLesson.itemId,
    );
    const module =
      course.modules.find(
        (item) =>
          item.id === activeLesson.moduleId ||
          item.title === activeLesson.moduleId ||
          (progressModule?.title && item.title === progressModule.title),
      ) ??
      course.modules.find((item) =>
        item.items.some(
          (lesson) =>
            lesson.id === activeLesson.itemId ||
            lesson.title === activeLesson.itemId ||
            (progressLesson?.title && lesson.title === progressLesson.title),
        ),
      );
    if (!module) {
      return null;
    }
    const lesson =
      module.items.find(
        (item) =>
          item.id === activeLesson.itemId ||
          item.title === activeLesson.itemId ||
          (progressLesson?.title && item.title === progressLesson.title),
      ) ??
      (progressLesson?.title
        ? module.items.find((item) => item.title === progressLesson.title)
        : undefined);
    if (!lesson) {
      return null;
    }
    return { module, lesson };
  }, [course, progress, activeLesson]);

  const activeLessonProgress = useMemo(() => {
    if (!progress || !activeLesson) {
      return null;
    }
    const module =
      progress.modules.find((item) => item.moduleId === activeLesson.moduleId) ??
      (activeLessonMeta
        ? progress.modules.find(
            (item) => item.title && item.title === activeLessonMeta.module.title,
          )
        : null);
    if (!module) {
      return null;
    }
    const lesson =
      module.items.find((item) => item.moduleItemId === activeLesson.itemId) ??
      (activeLessonMeta
        ? module.items.find(
            (item) => item.title && item.title === activeLessonMeta.lesson.title,
          )
        : null);
    if (!lesson) {
      return null;
    }
    return { module, lesson };
  }, [progress, activeLesson, activeLessonMeta]);

  const renderContent = (content?: string | null) => {
    if (!content || !content.trim()) {
      return <p className="text-sm text-muted">Lesson content will appear here soon.</p>;
    }
    return (
      <ReactMarkdown
        className="space-y-4 text-sm leading-6 text-muted [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:text-foreground [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-foreground [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-foreground [&_strong]:text-foreground"
        components={{
          p: ({ children }) => <p className="text-sm leading-6 text-muted">{children}</p>,
          ul: ({ children }) => (
            <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-muted">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal space-y-2 pl-5 text-sm leading-6 text-muted">
              {children}
            </ol>
          ),
          li: ({ children }) => <li>{children}</li>,
          a: ({ children, href }) => (
            <a
              href={href}
              className="text-accent underline transition-colors hover:text-foreground"
              target="_blank"
              rel="noreferrer"
            >
              {children}
            </a>
          ),
          code: ({ children }) => (
            <code className="rounded border border-border bg-background-subtle px-1 py-0.5 text-xs text-accent">
              {children}
            </code>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    );
  };

  useEffect(() => {
    if (!course || !progress) {
      return;
    }
    const hasMatchingProgress =
      Boolean(activeLesson) &&
      progress.modules.some(
        (module) =>
          module.moduleId === activeLesson?.moduleId &&
          module.items.some((item) => item.moduleItemId === activeLesson?.itemId),
      );
    if (hasMatchingProgress) {
      return;
    }
    const firstModule = course.modules.find((module) => module.items.some((item) => item.content));
    if (!firstModule) {
      return;
    }
    const firstLesson = firstModule.items.find((item) => item.content);
    if (!firstLesson) {
      return;
    }
    const progressModule =
      progress?.modules.find(
        (module) =>
          module.moduleId === firstModule.id ||
          module.moduleId === firstModule.title ||
          (module.title && module.title === firstModule.title),
      ) ?? null;
    const progressLesson = progressModule?.items.find(
      (item) =>
        item.moduleItemId === firstLesson.id ||
        item.moduleItemId === firstLesson.title ||
        (item.title && item.title === firstLesson.title),
    );
    setActiveLesson({
      moduleId: progressModule?.moduleId ?? firstModule.id ?? firstModule.title,
      itemId: progressLesson?.moduleItemId ?? firstLesson.id ?? firstLesson.title,
    });
  }, [course, progress, activeLesson, setActiveLesson]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-muted">
        Loading workspace…
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-muted">
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
        <div className="rounded-[2.5rem] border border-accent bg-accent-soft p-8 text-foreground transition-colors">
          <h1 className="text-3xl font-semibold text-foreground">
            Enroll to unlock your workspace
          </h1>
          <p className="mt-2 text-sm text-muted">
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
          <div className="space-y-3 text-sm text-muted">
            {course.shortDescription && <p>{course.shortDescription}</p>}
            <p className="text-xs uppercase tracking-[0.3em] text-accent">
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
        <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-500">
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
                className="space-y-4 rounded-[2.5rem] border border-border bg-surface p-6 transition-colors"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">
                      Module
                    </p>
                  <h2 className="text-lg font-semibold text-foreground">{module.title}</h2>
                  <div className="mt-2 flex items-center gap-3 text-xs text-muted">
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
                  <p className="mt-2 text-right text-xs text-muted">{module.completion}%</p>
                </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {isCompleted ? (
                    <button
                      onClick={() => completeModule(module.moduleId, false)}
                      disabled={saving}
                      className="inline-flex items-center gap-2 rounded-full border border-secondary-button bg-secondary-button px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-secondary-button transition-colors hover:bg-secondary-button-hover disabled:cursor-not-allowed disabled:opacity-60"
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
                    <p className="rounded-2xl border border-border bg-background-subtle px-4 py-3 text-xs text-muted transition-colors">
                      Lesson details will appear here as they’re released.
                    </p>
                  )}
                  {module.items.map((item) => {
                    const metaItem = metaModule?.items.find(
                      (baseItem) =>
                        baseItem.id === item.moduleItemId ||
                        baseItem.title === item.title,
                    );
                    const isActive =
                      activeLesson?.moduleId === module.moduleId &&
                      activeLesson?.itemId === item.moduleItemId;
                    return (
                      <div
                        key={item.moduleItemId}
                        className={cn(
                          "rounded-2xl border border-border bg-background-subtle px-4 py-3 text-sm text-muted transition-colors hover:border-accent",
                          isActive && "border-accent",
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            className="mt-1 h-4 w-4 rounded border-accent bg-background-subtle text-accent transition-colors"
                            checked={item.completed}
                            onChange={() => toggleItem(module.moduleId, item.moduleItemId)}
                            disabled={saving}
                          />
                          <div className="flex-1 space-y-1">
                            <button
                              type="button"
                              onClick={() => setActiveLesson({ moduleId: module.moduleId, itemId: item.moduleItemId })}
                              className="w-full text-left font-medium text-foreground transition-colors hover:text-accent"
                            >
                              {item.title}
                            </button>
                            {metaItem?.description && (
                              <p className="text-xs text-muted">{metaItem.description}</p>
                            )}
                            {metaItem?.content && (
                              <button
                                type="button"
                                onClick={() => setActiveLesson({ moduleId: module.moduleId, itemId: item.moduleItemId })}
                                className="text-xs font-semibold uppercase tracking-[0.3em] text-accent transition-colors hover:text-foreground"
                              >
                                {isActive ? "Viewing lesson" : "Read lesson"}
                              </button>
                            )}
                          </div>
                          {item.completed && (
                            <span className="text-emerald-400">
                              <FiCheckCircle />
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-[2.5rem] border border-border bg-surface p-8 text-sm text-muted transition-colors">
            Modules for this course will appear here once they are available.
          </div>
        )}
      </Container>

      {course.practiceSets && course.practiceSets.length > 0 && (
        <Container className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Practice Sets</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {course.practiceSets.map((practice) => (
              <div
                key={practice.id}
                className="space-y-3 rounded-[2.5rem] border border-border bg-surface p-6 text-sm text-muted transition-colors"
              >
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">
                    Practice
                  </span>
                  <h3 className="text-lg font-semibold text-foreground">
                    {practice.title}
                  </h3>
                  {practice.description && (
                    <p className="text-xs text-muted">{practice.description}</p>
                  )}
                </div>
                <div className="rounded-2xl border border-border bg-background-subtle px-4 py-3 text-xs text-muted transition-colors">
                  {practice.questions.length} question
                  {practice.questions.length === 1 ? "" : "s"} • Mix of{" "}
                  {Array.from(new Set(practice.questions.map((q) => q.difficulty || "core"))).join(", ")}
                </div>
                <AccentButton
                  to={`/practice?set=${practice.slug ?? practice.id}`}
                  variant="secondary"
                >
                  Practice now
                </AccentButton>
              </div>
            ))}
          </div>
        </Container>
      )}

      {activeLessonMeta && (
        <Container>
          <div className="space-y-4 rounded-[2.5rem] border border-border bg-surface p-6 transition-colors">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">
                  Lesson
                </p>
                <h3 className="text-lg font-semibold text-foreground">
                  {activeLessonMeta.lesson.title}
                </h3>
                <p className="text-xs text-muted">{activeLessonMeta.module.title}</p>
              </div>
              <div className="flex gap-3">
                {activeLessonProgress?.lesson && (
                  <button
                    type="button"
                    onClick={() => toggleItem(activeLesson.moduleId, activeLesson.itemId)}
                    className="inline-flex items-center gap-2 rounded-full border border-secondary-button bg-secondary-button px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-secondary-button transition-colors hover:bg-secondary-button-hover"
                    disabled={saving}
                  >
                    {activeLessonProgress.lesson.completed ? "Mark incomplete" : "Mark complete"}
                  </button>
                )}
              </div>
            </div>
            <div className="space-y-3 text-muted">
              {renderContent(activeLessonMeta.lesson.content ?? activeLessonMeta.lesson.description)}
            </div>
          </div>
        </Container>
      )}
    </div>
  );
};

export default DashboardCourseWorkspacePage;
