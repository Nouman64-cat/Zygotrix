import { useCallback, useEffect, useMemo, useState } from "react";

import type { Course, CourseProgress } from "../types";
import { universityService } from "../services/useCases/universityService";

/**
 * PROGRESS PERSISTENCE WORKAROUND:
 *
 * Problem: The backend API doesn't return the `items` array with completion states
 * in the GET /progress or PUT /progress responses. This causes lesson completion
 * checkboxes to reset to unchecked after page refresh.
 *
 * Solution: Use localStorage to persist the full progress state (including items)
 * on the frontend. When loading, merge the stored item completion states with the
 * server's module-level data.
 *
 * Ideal Fix: Backend should:
 * 1. Persist the items array with completed states in the database
 * 2. Return the full items array in GET/PUT /progress responses
 */

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
        // Only update if course data actually changed
        if (JSON.stringify(prevCourse) === JSON.stringify(courseData)) {
          return prevCourse;
        }
        return courseData;
      });

      // Check active lesson separately (don't include in useCallback deps)
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
      console.log(
        "🔍 Progress data loaded:",
        JSON.stringify(progressData, null, 2)
      );

      // Apply locally stored completion states
      const storageKey = `course-progress-${slug}`;
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        try {
          const storedData = JSON.parse(stored) as CourseProgress;
          console.log("📦 Found stored progress data");

          // Validate that stored data matches current course structure
          // If number of modules changed, clear localStorage and use fresh server data
          if (storedData.modules.length !== progressData.modules.length) {
            console.warn(
              `⚠️ Course structure changed! Stored: ${storedData.modules.length} modules, Server: ${progressData.modules.length} modules. Clearing localStorage.`
            );
            localStorage.removeItem(storageKey);

            // Also clear any dashboard-related cache to ensure consistency
            console.log("🧹 Clearing all course-related cache...");
            Object.keys(localStorage).forEach((key) => {
              if (key.includes("course") || key.includes("dashboard")) {
                console.log(`  Removing: ${key}`);
                localStorage.removeItem(key);
              }
            });

            setProgress(progressData);
            return;
          }

          // Merge stored item completion states with server data
          const mergedModules = progressData.modules.map((serverModule) => {
            const storedModule = storedData.modules.find(
              (m) => m.moduleId === serverModule.moduleId
            );
            if (!storedModule) {
              return serverModule;
            }

            // Merge item completion states
            const mergedItems = serverModule.items.map((serverItem) => {
              const storedItem = storedModule.items.find(
                (i) => i.moduleItemId === serverItem.moduleItemId
              );
              return {
                ...serverItem,
                completed: storedItem?.completed ?? serverItem.completed,
              };
            });

            // Recalculate completion based on actual item states
            // For empty modules, use stored completion instead of recalculating
            const totalItems = mergedItems.length;
            const completedCount = mergedItems.filter(
              (item) => item.completed
            ).length;
            const actualCompletion =
              totalItems > 0
                ? Math.round((completedCount / totalItems) * 100)
                : storedModule.completion; // Use stored completion for empty modules

            if (totalItems === 0) {
              console.log(
                `📝 Empty module "${serverModule.title}": using stored completion ${storedModule.completion}%`
              );
            }

            const status: "completed" | "in-progress" | "locked" =
              actualCompletion >= 100
                ? "completed"
                : completedCount > 0
                ? "in-progress"
                : serverModule.status; // Keep server status if no progress

            console.log(`🔀 Merging module "${serverModule.title}":`, {
              serverAssessmentStatus: serverModule.assessmentStatus,
              serverBestScore: serverModule.bestScore,
              willUse: "server values (not from localStorage)",
            });

            return {
              ...serverModule,
              items: mergedItems,
              completion: actualCompletion,
              status,
              // Explicitly keep server assessment data (don't let it be overridden)
              assessmentStatus: serverModule.assessmentStatus,
              bestScore: serverModule.bestScore,
              attemptCount: serverModule.attemptCount,
            };
          });

          const mergedProgress = {
            ...progressData,
            modules: mergedModules,
            progress: Math.round(
              mergedModules.reduce(
                (sum, module) => sum + module.completion,
                0
              ) / (mergedModules.length || 1)
            ),
          };

          console.log("✅ Merged with stored data");
          setProgress(mergedProgress);
          return;
        } catch (err) {
          console.error("❌ Error parsing stored progress:", err);
          // Fall through to use server data
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

      // Save to localStorage for persistence across refreshes
      const storageKey = `course-progress-${slug}`;
      localStorage.setItem(storageKey, JSON.stringify(nextProgress));
      console.log("💾 Saved progress to localStorage (toggleItem)");

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
        console.log("✅ API call successful - keeping optimistic update");
        // Keep the optimistic update since we know it's correct
        // Don't overwrite with potentially stale server data
      } catch (err) {
        const errorInstance =
          err instanceof Error ? err : new Error("Unable to update module");
        setError(errorInstance);
        // revert optimistic update by reloading
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

      // Save to localStorage for persistence across refreshes
      const storageKey = `course-progress-${slug}`;
      localStorage.setItem(storageKey, JSON.stringify(nextProgress));
      console.log("💾 Saved progress to localStorage (completeModule)");

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
        // Keep the optimistic update - don't overwrite with server data
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
