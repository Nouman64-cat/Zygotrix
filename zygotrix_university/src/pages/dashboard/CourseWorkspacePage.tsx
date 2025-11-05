import { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FiChevronLeft,
  FiCheckCircle,
  FiBook,
  FiAward,
  FiFileText,
} from "react-icons/fi";
import { IoMdClose } from "react-icons/io";
import AccentButton from "../../components/common/AccentButton";
import MarkdownContent from "../../components/common/MarkdownContent";
import LessonModal from "../../components/dashboard/LessonModal";
import CourseCertificate from "../../components/certificates/CourseCertificate";
import { useCourseWorkspace } from "../../hooks/useCourseWorkspace";
import { generateCertificate } from "../../services/repositories/universityRepository";
import type { ApiCertificateResponse } from "../../types/api";
import { cn } from "../../utils/cn";

const DashboardCourseWorkspacePage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
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

  const [certificateData, setCertificateData] =
    useState<ApiCertificateResponse | null>(null);
  const [isCertificateModalOpen, setIsCertificateModalOpen] = useState(false);
  const [isGeneratingCertificate, setIsGeneratingCertificate] = useState(false);

  const completionSummary = useMemo(() => {
    if (!progress || progress.modules.length === 0 || !course) {
      return 0;
    }

    const moduleCompletions = progress.modules.map((module) => {
      const metaModule = course.modules.find(
        (m) => m.id === module.moduleId || m.title === module.title
      );

      const hasAssessment = !!metaModule?.assessment;
      const totalItems = module.items.length;
      const completedItems = module.items.filter(
        (item) => item.completed
      ).length;

      const totalWithAssessment = hasAssessment ? totalItems + 1 : totalItems;
      const completedWithAssessment =
        hasAssessment && module.assessmentStatus === "passed"
          ? completedItems + 1
          : completedItems;

      return totalWithAssessment > 0
        ? Math.round((completedWithAssessment / totalWithAssessment) * 100)
        : module.completion;
    });

    return Math.round(
      moduleCompletions.reduce((sum, completion) => sum + completion, 0) /
        moduleCompletions.length
    );
  }, [progress, course]);

  const activeLessonMeta = useMemo(() => {
    if (!course || !activeLesson) {
      return null;
    }

    const isModuleOverview = activeLesson.itemId === null;

    const progressModule = progress?.modules.find(
      (module) => module.moduleId === activeLesson.moduleId
    );
    const progressLesson = !isModuleOverview
      ? progressModule?.items.find(
          (item) => item.moduleItemId === activeLesson.itemId
        )
      : undefined;

    const module =
      course.modules.find(
        (item) =>
          item.id === activeLesson.moduleId ||
          item.title === activeLesson.moduleId ||
          (progressModule?.title && item.title === progressModule.title)
      ) ??
      (!isModuleOverview
        ? course.modules.find((item) =>
            item.items.some(
              (lesson) =>
                lesson.id === activeLesson.itemId ||
                lesson.title === activeLesson.itemId ||
                (progressLesson?.title && lesson.title === progressLesson.title)
            )
          )
        : undefined);

    if (!module) {
      return null;
    }

    if (isModuleOverview) {
      return {
        module,
        lesson: {
          id: module.id,
          title: module.title,
          description: module.description,
          content: module.description,
          video: null,
        },
        isModuleOverview: true,
      };
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
    return { module, lesson, isModuleOverview: false };
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

    if (activeLesson.itemId === null) {
      return { module, lesson: null };
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

  const handleOpenAssessment = (moduleId: string) => {
    const module = course?.modules?.find((m) => m.id === moduleId);
    if (!module || !course) return;

    navigate(`/university/courses/${slug}/assessment/${moduleId}`, {
      state: {
        module,
        courseTitle: course.title,
      },
    });
  };

  const handleGenerateCertificate = async () => {
    if (!slug || !course) return;

    setIsGeneratingCertificate(true);
    try {
      const cert = await generateCertificate(slug);
      setCertificateData(cert);
      setIsCertificateModalOpen(true);
    } catch (error: any) {
      console.error("Failed to generate certificate:", error);
      alert(
        error?.response?.data?.detail ||
          "Failed to generate certificate. Please ensure you've completed all modules and assessments."
      );
    } finally {
      setIsGeneratingCertificate(false);
    }
  };

  const handleCloseCertificateModal = () => {
    setIsCertificateModalOpen(false);
  };

  if (loading) {
    return (
      <div className="space-y-12">
        <div className="space-y-4">
          <div className="h-4 w-32 animate-pulse rounded bg-accent-soft" />
          <div className="h-10 w-3/4 animate-pulse rounded-lg bg-surface" />
          <div className="h-6 w-1/2 animate-pulse rounded bg-background-subtle" />
        </div>

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
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 min-w-0 h-full overflow-y-auto">
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between gap-4 pb-4 border-b border-border">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-foreground truncate">
                {course.title}
              </h1>
              {course.shortDescription && (
                <p className="text-xs text-muted mt-1 line-clamp-1">
                  {course.shortDescription}
                </p>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center">
                <svg className="w-14 h-14 transform -rotate-90">
                  <circle
                    cx="28"
                    cy="28"
                    r="24"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    className="text-accent-soft"
                  />
                  <circle
                    cx="28"
                    cy="28"
                    r="24"
                    stroke="url(#gradient)"
                    strokeWidth="4"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 24}`}
                    strokeDashoffset={`${
                      2 * Math.PI * 24 * (1 - completionSummary / 100)
                    }`}
                    className="transition-all duration-500"
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient
                      id="gradient"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="50%" stopColor="#a855f7" />
                      <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold text-accent">
                    {completionSummary}%
                  </span>
                </div>
              </div>

              {completionSummary === 100 && (
                <button
                  onClick={handleGenerateCertificate}
                  disabled={isGeneratingCertificate}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 dark:text-white text-sm font-semibold rounded-full transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  title="View your certificate"
                >
                  <FiAward className="w-4 h-4" />
                  <span className="hidden sm:inline">Certificate</span>
                </button>
              )}
            </div>
          </div>

          {error && (
            <div
              className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-500"
              role="alert"
              aria-live="assertive"
            >
              <p className="font-semibold">Error</p>
              <p>{error.message}</p>
            </div>
          )}

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
                    {activeLessonProgress?.lesson && activeLesson?.itemId && (
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={activeLessonProgress.lesson.completed}
                          onChange={() =>
                            toggleItem(
                              activeLesson.moduleId,
                              activeLesson.itemId!
                            )
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

              {activeLessonMeta.lesson.video?.url && (
                <div className="rounded-[1.75rem] border border-border bg-black overflow-hidden shadow-lg">
                  <video
                    src={activeLessonMeta.lesson.video.url}
                    controls
                    controlsList="nodownload"
                    className="w-full aspect-video"
                    preload="metadata"
                    playsInline
                  >
                    <track kind="captions" />
                    Your browser does not support the video tag.
                  </video>
                  {activeLessonMeta.lesson.video.fileName && (
                    <div className="px-6 py-3 bg-surface/90 border-t border-border">
                      <p className="text-xs text-muted">
                        <span className="font-semibold text-foreground">
                          Video:
                        </span>{" "}
                        {activeLessonMeta.lesson.video.fileName}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeLessonMeta.isModuleOverview &&
                activeLessonMeta.module.description && (
                  <div className="rounded-[1.75rem] border-2 border-accent/20 bg-accent-soft p-6">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                        <FiBook className="h-5 w-5 text-accent" />
                        Module Overview
                      </h3>
                      {activeLessonProgress?.module &&
                        activeLessonProgress.module.items.length === 0 && (
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={
                                activeLessonProgress.module.completion === 100
                              }
                              onChange={() => {
                                const isCurrentlyComplete =
                                  activeLessonProgress.module.completion ===
                                  100;
                                completeModule(
                                  activeLesson!.moduleId,
                                  !isCurrentlyComplete
                                );
                              }}
                              disabled={saving}
                              className="h-5 w-5 rounded border-2 border-accent bg-background-subtle text-accent transition-all hover:scale-110 focus:ring-2 focus:ring-accent disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                            />
                            <span className="text-sm font-medium text-foreground">
                              {activeLessonProgress.module.completion === 100
                                ? "Completed"
                                : "Mark complete"}
                            </span>
                          </label>
                        )}
                    </div>
                    <MarkdownContent>
                      {activeLessonMeta.module.description}
                    </MarkdownContent>
                  </div>
                )}

              <div className="rounded-[1.75rem] border border-border bg-surface p-8">
                {activeLessonMeta.lesson.content ? (
                  <MarkdownContent>
                    {activeLessonMeta.lesson.content}
                  </MarkdownContent>
                ) : (
                  <p className="text-sm text-muted">
                    No content available for this lesson yet.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
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
            </div>
          )}
        </div>
      </div>

      <div className="hidden lg:block w-80 flex-shrink-0 h-full overflow-y-auto border-l border-border bg-surface">
        <div className="p-6 space-y-4">
          <div className="space-y-2 pb-4 border-b border-border">
            <h2 className="text-lg font-bold text-foreground line-clamp-2">
              {course.title}
            </h2>
          </div>

          <div className="space-y-3">
            {progress &&
              progress.modules.map((module, moduleIndex) => {
                const metaModule = course.modules.find(
                  (baseModule) =>
                    baseModule.id === module.moduleId ||
                    baseModule.title === module.title
                );

                const hasAssessment = !!metaModule?.assessment;
                const totalItems = module.items.length;
                const completedItems = module.items.filter(
                  (item) => item.completed
                ).length;

                const totalWithAssessment = hasAssessment
                  ? totalItems + 1
                  : totalItems;
                const completedWithAssessment =
                  hasAssessment && module.assessmentStatus === "passed"
                    ? completedItems + 1
                    : completedItems;

                const actualCompletion =
                  totalWithAssessment > 0
                    ? Math.round(
                        (completedWithAssessment / totalWithAssessment) * 100
                      )
                    : module.completion;

                return (
                  <div key={module.moduleId} className="space-y-2">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveLesson({
                          moduleId: module.moduleId,
                          itemId: null,
                        });
                      }}
                      className={cn(
                        "w-full flex items-start gap-2 px-2 py-1.5 rounded-lg transition-colors cursor-pointer text-left",
                        activeLesson?.moduleId === module.moduleId &&
                          activeLesson?.itemId === null
                          ? "bg-accent text-white"
                          : "hover:bg-accent-soft"
                      )}
                    >
                      <span
                        className={cn(
                          "inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold flex-shrink-0",
                          activeLesson?.moduleId === module.moduleId &&
                            activeLesson?.itemId === null
                            ? "bg-white text-accent"
                            : "bg-accent-soft text-accent"
                        )}
                      >
                        {moduleIndex + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <h3
                          className={cn(
                            "text-sm font-semibold line-clamp-2",
                            activeLesson?.moduleId === module.moduleId &&
                              activeLesson?.itemId === null
                              ? "text-white"
                              : "text-foreground"
                          )}
                        >
                          {module.title}
                        </h3>
                        <p
                          className={cn(
                            "text-xs",
                            activeLesson?.moduleId === module.moduleId &&
                              activeLesson?.itemId === null
                              ? "text-white/80"
                              : "text-muted"
                          )}
                        >
                          {completedWithAssessment}/{totalWithAssessment} items
                          · {actualCompletion}%
                        </p>
                      </div>
                    </button>

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

                      {metaModule?.assessment && (
                        <div className="mt-3 pt-2 border-t border-border">
                          <button
                            type="button"
                            onClick={() =>
                              handleOpenAssessment(module.moduleId)
                            }
                            disabled={completedItems < totalItems}
                            className={cn(
                              "w-full text-left px-3 py-2.5 rounded-lg text-xs font-medium transition-all",
                              module.assessmentStatus === "passed"
                                ? "bg-green-500/10 text-green-400 border border-green-500/30"
                                : completedItems === totalItems
                                ? "bg-accent/10 text-accent hover:bg-accent/20 cursor-pointer border border-accent/30"
                                : "bg-background-subtle text-muted cursor-not-allowed opacity-50"
                            )}
                          >
                            <div className="flex items-center gap-2">
                              {module.assessmentStatus === "passed" ? (
                                <FiCheckCircle className="h-3.5 w-3.5 flex-shrink-0 text-green-400" />
                              ) : (
                                <FiFileText className="h-3.5 w-3.5 flex-shrink-0" />
                              )}
                              <div className="flex-1">
                                <div className="font-semibold">
                                  Module Assessment
                                </div>
                                {module.assessmentStatus === "passed" && (
                                  <div className="text-[10px] text-green-400 mt-0.5">
                                    Passed ({module.bestScore}%)
                                  </div>
                                )}
                                {module.assessmentStatus === "attempted" && (
                                  <div className="text-[10px] text-amber-400 mt-0.5">
                                    Not passed - Try again ({module.bestScore}%)
                                  </div>
                                )}
                                {completedItems < totalItems && (
                                  <div className="text-[10px] mt-0.5">
                                    Complete all lessons first
                                  </div>
                                )}
                              </div>
                            </div>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      <LessonModal
        isOpen={false}
        onClose={() => {}}
        lesson={null}
        module={null}
        isCompleted={false}
        onToggleComplete={undefined}
        isSaving={saving}
      />

      {isCertificateModalOpen && certificateData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-5xl max-h-[90vh] overflow-auto bg-background rounded-2xl shadow-2xl">
            <button
              onClick={handleCloseCertificateModal}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-surface hover:bg-border transition-colors cursor-pointer"
            >
              <IoMdClose className="w-6 h-6 text-foreground rotate-180" />
            </button>
            <div className="p-8">
              <CourseCertificate
                userName={certificateData.userName}
                courseName={certificateData.courseName}
                completedAt={new Date(certificateData.completedAt)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardCourseWorkspacePage;
