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
  activeLesson: { moduleId: string; itemId: string } | null;
  setActiveLesson: (lesson: { moduleId: string; itemId: string } | null) => void;
}

export const useCourseWorkspace = (slug: string | undefined): CourseWorkspaceState => {
  const [course, setCourse] = useState<Course | null>(null);
  const [progress, setProgress] = useState<CourseProgress | null>(null);
  const [loading, setLoading] = useState(Boolean(slug));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [activeLesson, setActiveLesson] = useState<{ moduleId: string; itemId: string } | null>(null);

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
      setCourse(courseData);
      if (courseData && activeLesson) {
        const moduleExists = courseData.modules.some((module) => module.id === activeLesson.moduleId);
        if (!moduleExists) {
          setActiveLesson(null);
        }
      }
      if (!courseData || courseData.contentLocked) {
        setProgress(null);
        return;
      }
      const progressData = await universityService.getCourseProgress(slug, courseData);
      setProgress(progressData);
    } catch (err) {
      const errorInstance = err instanceof Error ? err : new Error("Unable to load course");
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
        const status = completion >= 100 ? "completed" : completedCount > 0 ? "in-progress" : "locked";
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
          nextModules.reduce((sum, module) => sum + module.completion, 0) / (nextModules.length || 1),
        ),
      };

      setProgress(nextProgress);

     try {
        const updated = await universityService.saveCourseProgress(
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
          course,
        );
        setProgress(updated);
      } catch (err) {
        const errorInstance = err instanceof Error ? err : new Error("Unable to update module");
        setError(errorInstance);
        // revert optimistic update by reloading
        await load();
      } finally {
        setSaving(false);
      }
    },
    [course, load, progress, slug],
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
        const status = completed ? "completed" : "locked";
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
            (nextModules.length || 1),
        ),
      };

      setProgress(nextProgress);

      try {
        const updated = await universityService.saveCourseProgress(
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
          course,
        );
        setProgress(updated);
      } catch (err) {
        const errorInstance = err instanceof Error ? err : new Error("Unable to update module");
        setError(errorInstance);
        await load();
      } finally {
        setSaving(false);
      }
    },
    [course, load, progress, slug],
  );

  return useMemo(
    () => ({ course, progress, loading, saving, error, toggleItem, completeModule, refetch: load, activeLesson, setActiveLesson }),
    [course, progress, loading, saving, error, toggleItem, completeModule, load, activeLesson],
  );
};
