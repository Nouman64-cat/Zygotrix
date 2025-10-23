import { useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { FiChevronLeft, FiCheckCircle, FiBook, FiAward } from "react-icons/fi";
import AccentButton from "../../components/common/AccentButton";
import LessonModal from "../../components/dashboard/LessonModal";
import { useCourseWorkspace } from "../../hooks/useCourseWorkspace";
import { cn } from "../../utils/cn";

const DashboardCourseWorkspacePage = () => {
  const { slug } = useParams<{ slug: string }>();
  const {
    course,
    progress,
    loading,
    saving,
    error,
    toggleItem,
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
        <AccentButton to="/university/courses" variant="secondary">
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
    <div className="flex gap-6 h-full">
      {/* Right Sidebar - Module Navigation */}
      <div className="hidden lg:block w-80 flex-shrink-0">
        <div className="sticky top-24 space-y-4 max-h-[calc(100vh-8rem)] overflow-y-auto rounded-[1.75rem] border border-border bg-surface p-6">
          {/* Course Header */}
          <div className="space-y-2 pb-4 border-b border-border">
            <h2 className="text-lg font-bold text-foreground line-clamp-2">
              {course.title}
            </h2>
            <div className="flex items-center gap-2 text-xs text-muted">
              <span className="font-semibold text-accent">
                {completionSummary}%
              </span>
              <span>Complete</span>
            </div>
            <div className="relative h-2 rounded-full bg-accent-soft">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500"
                style={{ width: `${completionSummary}%` }}
              />
            </div>
          </div>

          {/* Modules List */}
          <div className="space-y-3">
            {progress &&
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
                const actualCompletion =
                  totalItems > 0
                    ? Math.round((completedItems / totalItems) * 100)
                    : module.completion;

                return (
                  <div key={module.moduleId} className="space-y-2">
                    {/* Module Header */}
                    <div className="flex items-start gap-2">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-accent-soft text-xs font-bold text-accent flex-shrink-0">
                        {moduleIndex + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-foreground line-clamp-2">
                          {module.title}
                        </h3>
                        <p className="text-xs text-muted">
                          {completedItems}/{totalItems} lessons ·{" "}
                          {actualCompletion}%
                        </p>
                      </div>
                    </div>

                    {/* Module Items */}
                    <div className="ml-8 space-y-1">
                      {module.items.map((item) => {
                        const isActive =
                          activeLesson?.moduleId === module.moduleId &&
                          activeLesson?.itemId === item.moduleItemId;
                        const metaItem = metaModule?.items.find(
                          (baseItem) =>
                            baseItem.id === item.moduleItemId ||
                            baseItem.title === item.title
                        );

                        return (
                          <button
                            key={item.moduleItemId}
                            type="button"
                            onClick={() => {
                              if (metaItem?.content) {
                                setActiveLesson({
                                  moduleId: module.moduleId,
                                  itemId: item.moduleItemId,
                                });
                              }
                            }}
                            disabled={!metaItem?.content}
                            className={cn(
                              "w-full text-left px-3 py-2 rounded-lg text-xs transition-all cursor-pointer",
                              isActive
                                ? "bg-accent text-white font-semibold"
                                : item.completed
                                ? "text-foreground hover:bg-accent-soft"
                                : "text-muted hover:bg-background-subtle",
                              !metaItem?.content &&
                                "cursor-not-allowed opacity-50"
                            )}
                          >
                            <div className="flex items-center gap-2">
                              {item.completed ? (
                                <FiCheckCircle className="h-3 w-3 flex-shrink-0 text-emerald-400" />
                              ) : (
                                <div className="h-3 w-3 flex-shrink-0 rounded-full border-2 border-current" />
                              )}
                              <span className="line-clamp-2">{item.title}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 space-y-6">
        {/* Page Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <AccentButton
              to="/university/courses"
              variant="secondary"
              icon={<FiChevronLeft />}
            >
              Back to courses
            </AccentButton>
            {course.slug && (
              <AccentButton to={`/courses/${course.slug}`} variant="secondary">
                Course overview
              </AccentButton>
            )}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
              Course Workspace
            </p>
            <h1 className="text-3xl font-bold text-foreground mt-2">
              {course.title}
            </h1>
            {course.shortDescription && (
              <p className="text-sm text-muted mt-2 leading-relaxed">
                {course.shortDescription}
              </p>
            )}
          </div>
        </div>

        {error && (
          <div
            className="rounded-2xl border-2 border-rose-500/30 bg-rose-500/10 px-6 py-4 text-sm text-rose-500"
            role="alert"
            aria-live="assertive"
          >
            <p className="font-semibold">Error</p>
            <p>{error.message}</p>
          </div>
        )}

        {/* Lesson Content or Module Overview */}
        {activeLessonMeta && activeLesson ? (
          <div className="space-y-6">
            {/* Lesson Header */}
            <div className="rounded-[1.75rem] border border-border bg-surface p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <span className="inline-flex items-center gap-2 rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold uppercase tracking-wider text-accent">
                    <FiBook className="h-3 w-3" />
                    Lesson
                  </span>
                  <h2 className="text-2xl font-bold text-foreground mt-3">
                    {activeLessonMeta.lesson.title}
                  </h2>
                  {activeLessonMeta.lesson.description && (
                    <p className="text-sm text-muted mt-2 leading-relaxed">
                      {activeLessonMeta.lesson.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {activeLessonProgress?.lesson && (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={activeLessonProgress.lesson.completed}
                        onChange={() =>
                          toggleItem(activeLesson.moduleId, activeLesson.itemId)
                        }
                        disabled={saving}
                        className="h-5 w-5 rounded border-2 border-accent bg-background-subtle text-accent transition-all hover:scale-110 focus:ring-2 focus:ring-accent disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                      />
                      <span className="text-sm font-medium text-foreground">
                        {activeLessonProgress.lesson.completed
                          ? "Completed"
                          : "Mark complete"}
                      </span>
                    </label>
                  )}
                </div>
              </div>
            </div>

            {/* Lesson Content */}
            <div className="rounded-[1.75rem] border border-border bg-surface p-8">
              <div
                className="prose prose-slate max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-muted prose-a:text-accent prose-strong:text-foreground prose-code:text-accent prose-pre:bg-background-subtle prose-pre:border prose-pre:border-border"
                dangerouslySetInnerHTML={{
                  __html:
                    activeLessonMeta.lesson.content ||
                    '<p class="text-muted">No content available for this lesson yet.</p>',
                }}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Welcome Message */}
            <div className="rounded-[1.75rem] border border-border bg-surface p-12 text-center">
              <FiBook className="mx-auto h-16 w-16 text-accent/50 mb-4" />
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Select a lesson to get started
              </h2>
              <p className="text-muted">
                Choose a lesson from the sidebar to view its content and track
                your progress.
              </p>
            </div>

            {/* Quick Module Overview */}
            {progress && progress.modules.length > 0 && (
              <div className="grid gap-4 md:grid-cols-2">
                {progress.modules.map((module, moduleIndex) => {
                  const totalItems = module.items.length;
                  const completedItems = module.items.filter(
                    (item) => item.completed
                  ).length;
                  const actualCompletion =
                    totalItems > 0
                      ? Math.round((completedItems / totalItems) * 100)
                      : module.completion;

                  return (
                    <div
                      key={module.moduleId}
                      className="rounded-[1.75rem] border border-border bg-surface p-6"
                    >
                      <div className="flex items-start gap-3">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-accent-soft text-sm font-bold text-accent flex-shrink-0">
                          {moduleIndex + 1}
                        </span>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-foreground">
                            {module.title}
                          </h3>
                          <p className="text-xs text-muted mt-1">
                            {completedItems} of {totalItems} lessons completed
                          </p>
                          <div className="mt-3 relative h-2 rounded-full bg-accent-soft">
                            <div
                              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500"
                              style={{ width: `${actualCompletion}%` }}
                            />
                          </div>
                          <p className="text-xs text-right text-accent font-semibold mt-1">
                            {actualCompletion}%
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Lesson Modal - Keep for compatibility */}
      <LessonModal
        isOpen={false}
        onClose={() => {}}
        lesson={null}
        module={null}
        isCompleted={false}
        onToggleComplete={undefined}
        isSaving={saving}
      />
    </div>
  );
};

export default DashboardCourseWorkspacePage;
