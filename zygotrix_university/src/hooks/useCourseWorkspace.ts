import { useCallback, useEffect, useMemo, useState } from "react";

import type { Course, CourseProgress } from "../types";
import { universityService } from "../services/useCases/universityService";

interface CourseWorkspaceState {
  course: Course | null;
  progress: CourseProgress | null;
  loading: boolean;
  saving: boolean;
  error: Error | null;
  toggleItem: (moduleId: string, itemId: string) => Promise<void>;
  completeModule: (moduleId: string, completed: boolean) => Promise<void>;
  refetch: () => Promise<void>;
  activeLesson: { moduleId: string; itemId: string | null } | null;
  setActiveLesson: (
    lesson: { moduleId: string; itemId: string | null } | null
  ) => void;
}

export const useCourseWorkspace = (
  slug: string | undefined
): CourseWorkspaceState => {
  const [course, setCourse] = useState<Course | null>(null);
  const [progress, setProgress] = useState<CourseProgress | null>(null);
  const [loading, setLoading] = useState(Boolean(slug));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [activeLesson, setActiveLesson] = useState<{
    moduleId: string;
    itemId: string | null;
  } | null>(null);

  const load = useCallback(async () => {
    if (!slug) {
      setCourse(null);
      setProgress(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const courseData = await universityService.getCourseBySlug(slug);
      setCourse((prevCourse) => {
        if (JSON.stringify(prevCourse) === JSON.stringify(courseData)) {
          return prevCourse;
        }
        return courseData;
      });

      setActiveLesson((prevLesson) => {
        if (courseData && prevLesson) {
          const moduleExists = courseData.modules.some(
            (module) => module.id === prevLesson.moduleId
          );
          if (!moduleExists) {
            return null;
          }
        }
        return prevLesson;
      });

      if (!courseData || courseData.contentLocked) {
        setProgress(null);
        return;
      }
      const progressData = await universityService.getCourseProgress(
        slug,
        courseData
      );

      const storageKey = `course-progress-${slug}`;
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        try {
          const storedData = JSON.parse(stored) as CourseProgress;

          if (storedData.modules.length !== progressData.modules.length) {
            localStorage.removeItem(storageKey);

            Object.keys(localStorage).forEach((key) => {
              if (key.includes("course") || key.includes("dashboard")) {
                localStorage.removeItem(key);
              }
            });

            setProgress(progressData);
            return;
          }

          const mergedModules = progressData.modules.map((serverModule) => {
            const storedModule = storedData.modules.find(
              (m) => m.moduleId === serverModule.moduleId
            );
            if (!storedModule) {
              return serverModule;
            }

            const mergedItems = serverModule.items.map((serverItem) => {
              const storedItem = storedModule.items.find(
                (i) => i.moduleItemId === serverItem.moduleItemId
              );
              return {
                ...serverItem,
                completed: storedItem?.completed ?? serverItem.completed,
              };
            });

            const totalItems = mergedItems.length;
            const completedCount = mergedItems.filter(
              (item) => item.completed
            ).length;
            const actualCompletion =
              totalItems > 0
                ? Math.round((completedCount / totalItems) * 100)
                : storedModule.completion;

            if (totalItems === 0) {
            }

            const status: "completed" | "in-progress" | "locked" =
              actualCompletion >= 100
                ? "completed"
                : completedCount > 0
                ? "in-progress"
                : serverModule.status;
            return {
              ...serverModule,
              items: mergedItems,
              completion: actualCompletion,
              status,

              assessmentStatus: serverModule.assessmentStatus,
              bestScore: serverModule.bestScore,
              attemptCount: serverModule.attemptCount,
            };
          });

          const moduleCompletionsWithAssessments = mergedModules.map(
            (module) => {
              const courseModule = courseData.modules.find(
                (m) => m.id === module.moduleId || m.title === module.title
              );

              const hasAssessment = !!courseModule?.assessment;
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

              return totalWithAssessment > 0
                ? Math.round(
                    (completedWithAssessment / totalWithAssessment) * 100
                  )
                : module.completion;
            }
          );

          const overallProgress = Math.round(
            moduleCompletionsWithAssessments.reduce(
              (sum, completion) => sum + completion,
              0
            ) / (moduleCompletionsWithAssessments.length || 1)
          );

          const mergedProgress = {
            ...progressData,
            modules: mergedModules,
            progress: overallProgress,
          };

          localStorage.setItem(storageKey, JSON.stringify(mergedProgress));

          setProgress(mergedProgress);
          return;
        } catch (err) {
          console.error("❌ Error parsing stored progress:", err);
        }
      }

      setProgress(progressData);
    } catch (err) {
      const errorInstance =
        err instanceof Error ? err : new Error("Unable to load course");
      setError(errorInstance);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleItem = useCallback(
    async (moduleId: string, itemId: string) => {
      if (!slug || !progress || !course) {
        return;
      }
      setSaving(true);
      setError(null);
      const nextModules = progress.modules.map((module) => {
        if (module.moduleId !== moduleId) {
          return module;
        }
        const items = module.items.map((item) => {
          if (item.moduleItemId !== itemId) {
            return item;
          }
          return {
            ...item,
            completed: !item.completed,
          };
        });
        const completedCount = items.filter((item) => item.completed).length;
        const totalItems = items.length || 1;
        const completion = Math.round((completedCount / totalItems) * 100);
        const status: "completed" | "in-progress" | "locked" =
          completion >= 100
            ? "completed"
            : completedCount > 0
            ? "in-progress"
            : "locked";
        return {
          ...module,
          items,
          completion,
          status,
        };
      });

      const nextProgress: CourseProgress = {
        ...progress,
        modules: nextModules,
        progress: Math.round(
          nextModules.reduce((sum, module) => sum + module.completion, 0) /
            (nextModules.length || 1)
        ),
      };

      setProgress(nextProgress);

      const storageKey = `course-progress-${slug}`;
      localStorage.setItem(storageKey, JSON.stringify(nextProgress));

      try {
        await universityService.saveCourseProgress(
          {
            course_slug: slug,
            progress: nextProgress.progress,
            modules: nextModules.map((module) => ({
              module_id: module.moduleId,
              title: module.title,
              duration: module.duration ?? undefined,
              completion: module.completion,
              status: module.status,
              items: module.items.map((item) => ({
                module_item_id: item.moduleItemId,
                title: item.title,
                completed: item.completed,
              })),
            })),
          },
          course
        );
      } catch (err) {
        const errorInstance =
          err instanceof Error ? err : new Error("Unable to update module");
        setError(errorInstance);

        console.error("❌ Error updating progress, reloading:", err);
        await load();
      } finally {
        setSaving(false);
      }
    },
    [course, load, progress, slug]
  );

  const completeModule = useCallback(
    async (moduleId: string, completed: boolean) => {
      if (!slug || !progress || !course) {
        return;
      }
      setSaving(true);
      setError(null);
      const nextModules = progress.modules.map((module) => {
        if (module.moduleId !== moduleId) {
          return module;
        }
        const items = module.items.map((item) => ({
          ...item,
          completed,
        }));
        const completion = completed ? 100 : 0;
        const status: "completed" | "in-progress" | "locked" = completed
          ? "completed"
          : "locked";
        return {
          ...module,
          items,
          completion,
          status,
        };
      });

      const nextProgress: CourseProgress = {
        ...progress,
        modules: nextModules,
        progress: Math.round(
          nextModules.reduce((sum, module) => sum + module.completion, 0) /
            (nextModules.length || 1)
        ),
      };

      setProgress(nextProgress);

      const storageKey = `course-progress-${slug}`;
      localStorage.setItem(storageKey, JSON.stringify(nextProgress));

      try {
        await universityService.saveCourseProgress(
          {
            course_slug: slug,
            progress: nextProgress.progress,
            modules: nextModules.map((module) => ({
              module_id: module.moduleId,
              title: module.title,
              duration: module.duration ?? undefined,
              completion: module.completion,
              status: module.status,
              items: module.items.map((item) => ({
                module_item_id: item.moduleItemId,
                title: item.title,
                completed: item.completed,
              })),
            })),
          },
          course
        );
      } catch (err) {
        const errorInstance =
          err instanceof Error ? err : new Error("Unable to update module");
        setError(errorInstance);
        await load();
      } finally {
        setSaving(false);
      }
    },
    [course, load, progress, slug]
  );

  return useMemo(
    () => ({
      course,
      progress,
      loading,
      saving,
      error,
      toggleItem,
      completeModule,
      refetch: load,
      activeLesson,
      setActiveLesson,
    }),
    [
      course,
      progress,
      loading,
      saving,
      error,
      toggleItem,
      completeModule,
      load,
      activeLesson,
    ]
  );
};
