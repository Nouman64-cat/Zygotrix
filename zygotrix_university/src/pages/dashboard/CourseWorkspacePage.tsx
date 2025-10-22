import { useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import {
  FiChevronLeft,
  FiCheckCircle,
  FiBook,
  FiClock,
  FiAward,
} from "react-icons/fi";
import PageHeader from "../../components/common/PageHeader";
import Container from "../../components/common/Container";
import AccentButton from "../../components/common/AccentButton";
import LessonModal from "../../components/dashboard/LessonModal";
import { useCourseWorkspace } from "../../hooks/useCourseWorkspace";
import { cn } from "../../utils/cn";

const ModuleProgressBar = ({ completion }: { completion: number }) => (
  <div
    className="h-2.5 rounded-full bg-accent-soft relative overflow-hidden"
    role="progressbar"
    aria-valuenow={completion}
    aria-valuemin={0}
    aria-valuemax={100}
    aria-label={`Module completion: ${completion}%`}
  >
    <div
      className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500 transition-all duration-500 ease-out"
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
        progress.modules.length
    );
  }, [progress]);

  const activeLessonMeta = useMemo(() => {
    if (!course || !activeLesson) {
      return null;
    }
    const progressModule = progress?.modules.find(
      (module) => module.moduleId === activeLesson.moduleId
    );
    const progressLesson = progressModule?.items.find(
      (item) => item.moduleItemId === activeLesson.itemId
    );
    const module =
      course.modules.find(
        (item) =>
          item.id === activeLesson.moduleId ||
          item.title === activeLesson.moduleId ||
          (progressModule?.title && item.title === progressModule.title)
      ) ??
      course.modules.find((item) =>
        item.items.some(
          (lesson) =>
            lesson.id === activeLesson.itemId ||
            lesson.title === activeLesson.itemId ||
            (progressLesson?.title && lesson.title === progressLesson.title)
        )
      );
    if (!module) {
      return null;
    }
    const lesson =
      module.items.find(
        (item) =>
          item.id === activeLesson.itemId ||
          item.title === activeLesson.itemId ||
          (progressLesson?.title && item.title === progressLesson.title)
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
      progress.modules.find(
        (item) => item.moduleId === activeLesson.moduleId
      ) ??
      (activeLessonMeta
        ? progress.modules.find(
            (item) => item.title && item.title === activeLessonMeta.module.title
          )
        : null);
    if (!module) {
      return null;
    }
    const lesson =
      module.items.find((item) => item.moduleItemId === activeLesson.itemId) ??
      (activeLessonMeta
        ? module.items.find(
            (item) => item.title && item.title === activeLessonMeta.lesson.title
          )
        : null);
    if (!lesson) {
      return null;
    }
    return { module, lesson };
  }, [progress, activeLesson, activeLessonMeta]);

  useEffect(() => {
    // AUTO-OPEN DISABLED: Users should manually click "READ LESSON" to open lessons
    // This prevents unwanted modal popups, especially for completed lessons
    // The commented code below was auto-opening the first lesson on page load
    // Keeping it here in case we want to re-enable it in the future
    /*
    if (!course || !progress) {
      return;
    }
    // Only auto-set active lesson once on initial load
    // This prevents re-opening the modal after user closes it
    if (hasInitialized.current || activeLesson !== null) {
      return;
    }

    const firstModule = course.modules.find((module) =>
      module.items.some((item) => item.content)
    );
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
          (module.title && module.title === firstModule.title)
      ) ?? null;
    const progressLesson = progressModule?.items.find(
      (item) =>
        item.moduleItemId === firstLesson.id ||
        item.moduleItemId === firstLesson.title ||
        (item.title && item.title === firstLesson.title)
    );
    setActiveLesson({
      moduleId: progressModule?.moduleId ?? firstModule.id ?? firstModule.title,
      itemId:
        progressLesson?.moduleItemId ?? firstLesson.id ?? firstLesson.title,
    });
    hasInitialized.current = true;
    */
  }, [course, progress, activeLesson, setActiveLesson]);

  // Debug: Log when completion state changes
  useEffect(() => {
    if (activeLessonProgress?.lesson) {
      console.log("📝 Lesson completion state updated:", {
        title: activeLessonMeta?.lesson.title,
        completed: activeLessonProgress.lesson.completed,
        moduleId: activeLesson?.moduleId,
        itemId: activeLesson?.itemId,
      });
    }
  }, [activeLessonProgress, activeLessonMeta, activeLesson]);

  if (loading) {
    return (
      <div className="space-y-12">
        {/* Header Skeleton */}
        <div className="space-y-4">
          <div className="h-4 w-32 animate-pulse rounded bg-accent-soft" />
          <div className="h-10 w-3/4 animate-pulse rounded-lg bg-surface" />
          <div className="h-6 w-1/2 animate-pulse rounded bg-background-subtle" />
        </div>

        {/* Modules Skeleton */}
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="space-y-4 rounded-[2.5rem] border border-border bg-surface p-8 transition-colors"
            >
              <div className="h-6 w-48 animate-pulse rounded bg-background-subtle" />
              <div className="h-3 w-full animate-pulse rounded-full bg-accent-soft" />
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-16 w-full animate-pulse rounded-2xl bg-background-subtle"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-muted">
        <FiBook className="h-16 w-16 text-accent/30" aria-hidden="true" />
        <p className="text-lg font-medium">Course not found</p>
        <p className="text-sm">We couldn't find that course.</p>
        <AccentButton to="/dashboard/courses" variant="secondary">
          Back to courses
        </AccentButton>
      </div>
    );
  }

  if (course.contentLocked) {
    return (
      <div className="space-y-6">
        <div className="rounded-[2.5rem] border-2 border-accent bg-accent-soft p-10 text-foreground transition-colors">
          <FiAward className="mb-4 h-12 w-12 text-accent" aria-hidden="true" />
          <h1 className="text-3xl font-bold text-foreground">
            Enroll to unlock your workspace
          </h1>
          <p className="mt-3 text-base text-muted leading-relaxed">
            You need to enroll in this course before accessing the detailed
            modules and lessons.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <AccentButton
              to={`/courses/${course.slug}`}
              icon={<FiChevronLeft />}
            >
              View course details
            </AccentButton>
            <AccentButton
              to={`/signin?redirect=/courses/${course.slug}`}
              variant="secondary"
            >
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
            {course.shortDescription && (
              <p className="text-base leading-relaxed">
                {course.shortDescription}
              </p>
            )}
            <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-accent">
              <span>Overall progress</span>
              <span className="text-lg">{completionSummary}%</span>
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
        <div
          className="rounded-3xl border-2 border-rose-500/30 bg-rose-500/10 px-6 py-4 text-sm text-rose-500"
          role="alert"
          aria-live="assertive"
        >
          <p className="font-semibold">Error</p>
          <p>{error.message}</p>
        </div>
      )}

      <Container className="space-y-8">
        {progress && progress.modules.length > 0 ? (
          progress.modules.map((module, moduleIndex) => {
            const metaModule = course.modules.find(
              (baseModule) =>
                baseModule.id === module.moduleId ||
                baseModule.title === module.title
            );
            const totalItems = module.items.length;
            const completedItems = module.items.filter(
              (item) => item.completed
            ).length;
            // Calculate actual completion based on items, not server's completion field
            // For modules with no items, use the module.completion field instead
            const actualCompletion =
              totalItems > 0
                ? Math.round((completedItems / totalItems) * 100)
                : module.completion; // Use module completion for empty modules
            const isCompleted = actualCompletion >= 100;

            // Debug: Log inconsistencies between server and actual completion
            // Only warn for modules with items (empty modules use module.completion directly)
            if (totalItems > 0 && module.completion !== actualCompletion) {
              console.warn(
                `⚠️ Completion mismatch in module "${module.title}":`,
                {
                  serverCompletion: module.completion,
                  actualCompletion,
                  completedItems,
                  totalItems,
                  items: module.items.map((item) => ({
                    title: item.title,
                    completed: item.completed,
                  })),
                }
              );
            }

            return (
              <article
                key={module.moduleId}
                className="space-y-6 rounded-[2.5rem] border border-border bg-surface p-8 shadow-sm transition-all hover:shadow-md"
                aria-labelledby={`module-${moduleIndex}-title`}
              >
                {/* Module Header */}
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold uppercase tracking-wider text-accent">
                        <FiBook className="h-3 w-3" aria-hidden="true" />
                        Module {moduleIndex + 1}
                      </span>
                      {isCompleted && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
                          <FiCheckCircle
                            className="h-3 w-3"
                            aria-hidden="true"
                          />
                          Completed
                        </span>
                      )}
                    </div>
                    <h2
                      id={`module-${moduleIndex}-title`}
                      className="text-xl font-bold text-foreground lg:text-2xl"
                    >
                      {module.title}
                    </h2>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted">
                      {module.duration && (
                        <span className="flex items-center gap-1.5">
                          <FiClock className="h-4 w-4" aria-hidden="true" />
                          {module.duration}
                        </span>
                      )}
                      {totalItems > 0 && (
                        <span
                          aria-label={`${completedItems} of ${totalItems} lessons completed`}
                        >
                          {completedItems} / {totalItems} lessons
                        </span>
                      )}
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-xs font-medium",
                          actualCompletion >= 100 &&
                            "bg-emerald-500/10 text-emerald-400",
                          actualCompletion > 0 &&
                            actualCompletion < 100 &&
                            "bg-blue-500/10 text-blue-400",
                          actualCompletion === 0 && "bg-muted/10 text-muted"
                        )}
                      >
                        {actualCompletion >= 100
                          ? "Completed"
                          : actualCompletion > 0
                          ? "In progress"
                          : "Not started"}
                      </span>
                    </div>
                  </div>

                  {/* Progress Section */}
                  <div className="w-full space-y-3 lg:w-64">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-foreground">
                        Progress
                      </span>
                      <span
                        className="font-semibold text-accent"
                        aria-live="polite"
                      >
                        {actualCompletion}%
                      </span>
                    </div>
                    <ModuleProgressBar completion={actualCompletion} />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3">
                  {isCompleted ? (
                    <button
                      onClick={() => completeModule(module.moduleId, false)}
                      disabled={saving}
                      className="inline-flex items-center gap-2 rounded-full border-2 border-secondary-button bg-secondary-button px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-secondary-button transition-all hover:bg-secondary-button-hover focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-60"
                      aria-label="Reset this module progress"
                    >
                      <FiCheckCircle className="h-4 w-4" aria-hidden="true" />
                      Reset module
                    </button>
                  ) : (
                    <button
                      onClick={() => completeModule(module.moduleId, true)}
                      disabled={saving || completedItems < totalItems}
                      className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-white shadow-lg transition-all hover:brightness-110 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-60"
                      aria-label="Mark this module as complete"
                      title={
                        completedItems < totalItems
                          ? "Complete all lessons first"
                          : "Mark module as complete"
                      }
                    >
                      <FiCheckCircle className="h-4 w-4" aria-hidden="true" />
                      Mark module complete
                    </button>
                  )}
                </div>

                {/* Lessons List */}
                <div
                  className="space-y-3"
                  role="list"
                  aria-label={`Lessons in ${module.title}`}
                >
                  {module.items.length === 0 && (
                    <div className="rounded-2xl border border-border bg-background-subtle p-6 text-center text-sm text-muted transition-colors">
                      <p>
                        Lesson details will appear here as they're released.
                      </p>
                    </div>
                  )}
                  {module.items.map((item, itemIndex) => {
                    const metaItem = metaModule?.items.find(
                      (baseItem) =>
                        baseItem.id === item.moduleItemId ||
                        baseItem.title === item.title
                    );
                    const isActive =
                      activeLesson?.moduleId === module.moduleId &&
                      activeLesson?.itemId === item.moduleItemId;
                    return (
                      <div
                        key={item.moduleItemId}
                        role="listitem"
                        className={cn(
                          "group rounded-2xl border-2 transition-all",
                          isActive
                            ? "border-accent bg-accent-soft shadow-md"
                            : "border-border bg-background-subtle hover:border-accent/50 hover:bg-background-subtle/80"
                        )}
                      >
                        <div className="flex items-start gap-4 p-5">
                          {/* Checkbox */}
                          <div className="relative flex items-center pt-1">
                            <input
                              id={`lesson-${module.moduleId}-${item.moduleItemId}`}
                              type="checkbox"
                              className="h-5 w-5 cursor-pointer rounded border-2 border-accent bg-background-subtle text-accent transition-all hover:scale-110 focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background-subtle disabled:cursor-not-allowed disabled:opacity-50"
                              checked={item.completed}
                              onChange={() =>
                                toggleItem(module.moduleId, item.moduleItemId)
                              }
                              disabled={saving}
                              aria-label={`Mark "${item.title}" as ${
                                item.completed ? "incomplete" : "complete"
                              }`}
                            />
                          </div>

                          {/* Lesson Content */}
                          <div className="flex-1 space-y-2">
                            <div className="flex items-start justify-between gap-3">
                              <button
                                type="button"
                                onClick={() =>
                                  setActiveLesson({
                                    moduleId: module.moduleId,
                                    itemId: item.moduleItemId,
                                  })
                                }
                                className="flex-1 text-left text-base font-semibold text-foreground transition-colors hover:text-accent focus:text-accent focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background-subtle group-hover:text-accent"
                              >
                                <span className="flex items-baseline gap-2">
                                  <span className="text-xs text-muted font-normal">
                                    {itemIndex + 1}.
                                  </span>
                                  <span>{item.title}</span>
                                </span>
                              </button>
                              {item.completed && (
                                <span
                                  className="mt-1 flex-shrink-0 text-emerald-400"
                                  aria-label="Completed"
                                >
                                  <FiCheckCircle
                                    className="h-5 w-5"
                                    aria-hidden="true"
                                  />
                                </span>
                              )}
                            </div>

                            {metaItem?.description && (
                              <p className="text-sm leading-relaxed text-muted">
                                {metaItem.description}
                              </p>
                            )}

                            {metaItem?.content && (
                              <button
                                type="button"
                                onClick={() =>
                                  setActiveLesson({
                                    moduleId: module.moduleId,
                                    itemId: item.moduleItemId,
                                  })
                                }
                                className={cn(
                                  "inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider transition-all focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background-subtle rounded-full px-3 py-1",
                                  isActive
                                    ? "text-accent bg-accent/10"
                                    : "text-muted hover:text-accent hover:bg-accent/5"
                                )}
                                aria-label={
                                  isActive
                                    ? "Currently viewing this lesson"
                                    : `View lesson: ${item.title}`
                                }
                              >
                                {isActive ? (
                                  <>
                                    <span
                                      className="h-2 w-2 animate-pulse rounded-full bg-accent"
                                      aria-hidden="true"
                                    />
                                    Viewing lesson
                                  </>
                                ) : (
                                  "Read lesson →"
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </article>
            );
          })
        ) : (
          <div className="rounded-[2.5rem] border-2 border-dashed border-border bg-surface p-12 text-center text-muted transition-colors">
            <FiBook
              className="mx-auto mb-4 h-12 w-12 text-accent/50"
              aria-hidden="true"
            />
            <p className="text-lg font-medium">No modules available yet</p>
            <p className="mt-2 text-sm">
              Modules for this course will appear here once they are available.
            </p>
          </div>
        )}
      </Container>

      {course.practiceSets && course.practiceSets.length > 0 && (
        <Container>
          <h2 className="mb-6 text-2xl font-bold text-foreground">
            Practice Sets
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            {course.practiceSets.map((practice) => (
              <div
                key={practice.id}
                className="space-y-4 rounded-[2.5rem] border border-border bg-surface p-6 transition-all hover:shadow-md"
              >
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-accent">
                    Practice
                  </span>
                  <h3 className="text-lg font-semibold text-foreground">
                    {practice.title}
                  </h3>
                  {practice.description && (
                    <p className="text-sm text-muted leading-relaxed">
                      {practice.description}
                    </p>
                  )}
                </div>
                <div className="rounded-2xl border border-border bg-background-subtle px-4 py-3 text-xs text-muted transition-colors">
                  {practice.questions.length} question
                  {practice.questions.length === 1 ? "" : "s"} • Mix of{" "}
                  {Array.from(
                    new Set(
                      practice.questions.map((q) => q.difficulty || "core")
                    )
                  ).join(", ")}
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

      {/* Lesson Modal */}
      <LessonModal
        isOpen={Boolean(activeLessonMeta && activeLesson)}
        onClose={() => setActiveLesson(null)}
        lesson={activeLessonMeta?.lesson ?? null}
        module={activeLessonMeta?.module ?? null}
        isCompleted={activeLessonProgress?.lesson.completed ?? false}
        onToggleComplete={
          activeLessonProgress?.lesson && activeLesson
            ? () => {
                console.log("🎯 Toggle called for lesson:", activeLesson);
                console.log(
                  "📊 Current completed state:",
                  activeLessonProgress.lesson.completed
                );
                toggleItem(activeLesson.moduleId, activeLesson.itemId);
              }
            : undefined
        }
        isSaving={saving}
      />
    </div>
  );
};

export default DashboardCourseWorkspacePage;
