import type {
  ApiCourseDetailResponse,
  ApiCourseListResponse,
  ApiCourseProgressResponse,
  ApiDashboardSummary,
  ApiPracticeSetListResponse,
} from "../../types/api";
import type {
  Course,
  CourseProgress,
  CourseProgressMetrics,
  DashboardSummary,
  LearningEvent,
  PracticeInsight,
  PracticeSet,
  ResourceItem,
} from "../../types";
import {
  featuredCourses as fallbackCourses,
  practiceTopics as fallbackPracticeTopics,
} from "../../data/universityData";
import {
  learnerProfile as fallbackLearnerProfile,
  analyticsStats as fallbackStats,
  practiceInsights as fallbackInsights,
  savedResources as fallbackResources,
  learningSchedule as fallbackSchedule,
  activeCourses as fallbackActiveCourses,
} from "../../data/dashboardData";
import {
  fetchCourseBySlug,
  fetchCourseProgress,
  fetchCourses,
  fetchDashboardSummary,
  fetchPracticeSets,
  updateCourseProgress,
  enrollInCourse as repoEnrollInCourse,
  fetchEnrollments,
} from "../repositories/universityRepository";

const mapCourse = (
  apiCourse: ApiCourseListResponse["courses"][number]
): Course => {
  const modulesSource = [...(apiCourse.modules ?? [])].sort((a, b) => {
    const castA = a as unknown as { order?: number | null };
    const castB = b as unknown as { order?: number | null };
    return (castA.order ?? 0) - (castB.order ?? 0);
  });

  return {
    id: apiCourse.id,
    slug: apiCourse.slug,
    title: apiCourse.title,
    shortDescription: apiCourse.short_description ?? null,
    longDescription: apiCourse.long_description ?? null,
    category: apiCourse.category ?? null,
    level: (apiCourse.level as Course["level"]) ?? undefined,
    duration: apiCourse.duration ?? null,
    badgeLabel: apiCourse.badge_label ?? null,
    lessons: apiCourse.lessons ?? null,
    students: apiCourse.students ?? null,
    rating: apiCourse.rating ?? null,
    imageUrl: apiCourse.image_url ?? null,
    modulesCount: apiCourse.modules_count ?? null,
    outcomes: (apiCourse.outcomes ?? []).map((outcome) => ({
      id:
        outcome.id ??
        `${apiCourse.slug}-outcome-${Math.random().toString(36).slice(2)}`,
      text: outcome.text ?? "",
    })),
    instructors: (apiCourse.instructors ?? []).map((instructor) => ({
      id: instructor.id,
      name: instructor.name ?? instructor.title ?? "Instructor",
      title: instructor.title,
      avatar: instructor.avatar,
      bio: instructor.bio,
    })),
    modules: modulesSource.map((module, index) => {
      const moduleId =
        module.id ??
        (module as unknown as { slug?: string }).slug ??
        `${apiCourse.slug}-module-${index}`;
      return {
        id: moduleId,
        title: module.title ?? `Module ${index + 1}`,
        duration: module.duration ?? null,
        description: module.description ?? null,
        items: (module.items ?? []).map((item, itemIndex) => ({
          id: item.id ?? `${moduleId}-item-${itemIndex}`,
          title: item.title,
          description: item.description ?? null,
          content: (() => {
            const rawContent = (item as unknown as { content?: unknown })
              .content;
            if (typeof rawContent === "string") {
              return rawContent;
            }
            if (
              rawContent &&
              typeof rawContent === "object" &&
              ("markdown" in rawContent || "html" in rawContent)
            ) {
              const contentWithFormats = rawContent as {
                markdown?: string | null;
                html?: string | null;
              };
              return (
                contentWithFormats.markdown ?? contentWithFormats.html ?? null
              );
            }
            return null;
          })(),
          video:
            (
              item as unknown as {
                video?: {
                  fileName?: string | null;
                  url?: string | null;
                } | null;
              }
            ).video ?? null,
        })),
        assessment: (() => {
          const assessmentData = module.assessment;
          if (!assessmentData) return null;

          const questions =
            (assessmentData as any).assessmentQuestions ||
            (assessmentData as any).assessment_questions ||
            [];

          return {
            assessmentQuestions: questions,
          };
        })(),
      };
    }),
    enrolled: apiCourse.enrolled ?? false,
    contentLocked: apiCourse.content_locked ?? false,
    practiceSets: apiCourse.practice_sets ?? [],
  };
};

const mapPracticeSets = (response: ApiPracticeSetListResponse): PracticeSet[] =>
  response.practice_sets.map((item) => ({
    id: item.id,
    slug: item.slug,
    title: item.title,
    description: item.description ?? null,
    tag: item.tag ?? null,
    questions: item.questions ?? null,
    accuracy: item.accuracy ?? null,
    trend: item.trend ?? null,
    estimatedTime: item.estimatedTime ?? null,
  }));

const mapMetrics = (
  metrics?: ApiDashboardSummary["courses"][number]["metrics"]
): CourseProgressMetrics | null => {
  if (!metrics) {
    return null;
  }
  return {
    hoursSpent: metrics.hours_spent ?? null,
    practiceAccuracy: metrics.practice_accuracy ?? null,
    mcqAttempts: metrics.mcq_attempts ?? null,
    lastScore: metrics.last_score ?? null,
    streak: metrics.streak ?? null,
  };
};

const mapModules = (
  modules: ApiDashboardSummary["courses"][number]["modules"]
): CourseProgress["modules"] =>
  modules.map((module) => {
    const items =
      (
        module as unknown as {
          items?: Array<{
            module_item_id: string;
            title?: string | null;
            completed?: boolean;
          }>;
        }
      ).items ?? [];

    const extendedModule = module as unknown as {
      assessment_status?: "not_started" | "attempted" | "passed" | null;
      best_score?: number | null;
      attempt_count?: number | null;
    };

    return {
      moduleId: module.module_id,
      title: module.title ?? null,
      status: module.status ?? "in-progress",
      duration: module.duration ?? null,
      completion: module.completion ?? 0,
      assessmentStatus:
        extendedModule.assessment_status === null ||
        extendedModule.assessment_status === "not_started" ||
        extendedModule.assessment_status === undefined
          ? "not-attempted"
          : extendedModule.assessment_status,
      bestScore: extendedModule.best_score ?? null,
      attemptCount: extendedModule.attempt_count ?? null,
      items: items.map((item) => ({
        moduleItemId: item.module_item_id,
        title: item.title ?? null,
        completed: Boolean(item.completed),
      })),
    };
  });

const mapProgressModules = (
  modules: ApiCourseProgressResponse["modules"],
  course?: Course | null
): CourseProgress["modules"] => {
  const courseModules = course?.modules ?? [];
  const courseModuleById = new Map<string, (typeof courseModules)[number]>();
  const courseModuleByTitle = new Map<string, (typeof courseModules)[number]>();

  courseModules.forEach((courseModule) => {
    if (courseModule.id) {
      courseModuleById.set(courseModule.id, courseModule);
    }
    if (courseModule.title) {
      courseModuleByTitle.set(courseModule.title, courseModule);
    }
  });

  const mapped = modules.map((module) => {
    const courseModule =
      courseModuleById.get(module.module_id) ??
      (module.title ? courseModuleByTitle.get(module.title) : undefined);

    const progressItems = (module.items ?? []).map((item) => ({
      moduleItemId: item.module_item_id,
      title: item.title ?? null,
      completed: Boolean(item.completed),
    }));

    const mergedItems =
      courseModule?.items.map((courseItem, index) => {
        const fallbackId = `${module.module_id}-item-${index}`;
        const itemId = courseItem.id ?? courseItem.title ?? fallbackId;
        const progressMatch =
          progressItems.find(
            (progressItem) => progressItem.moduleItemId === itemId
          ) ??
          progressItems.find(
            (progressItem) =>
              progressItem.title &&
              courseItem.title &&
              progressItem.title === courseItem.title
          );
        return {
          moduleItemId: progressMatch?.moduleItemId ?? itemId,
          title: progressMatch?.title ?? courseItem.title ?? null,
          completed: progressMatch?.completed ?? false,
        };
      }) ?? progressItems;

    progressItems.forEach((progressItem) => {
      const exists = mergedItems.some(
        (item) => item.moduleItemId === progressItem.moduleItemId
      );
      if (!exists) {
        mergedItems.push(progressItem);
      }
    });

    // Map backend assessment status to frontend format
    // Backend uses: null, "not_started", "attempted", "passed"
    // Frontend uses: "not-attempted", "attempted", "passed"
    console.log(
      `🔍 Module ${module.module_id} assessment_status from backend:`,
      module.assessment_status
    );
    const assessmentStatus: "not-attempted" | "attempted" | "passed" =
      module.assessment_status === null ||
      module.assessment_status === "not_started" ||
      module.assessment_status === undefined
        ? "not-attempted"
        : (module.assessment_status as "attempted" | "passed");
    console.log(`✅ Mapped to frontend assessmentStatus:`, assessmentStatus);
    return {
      moduleId: module.module_id,
      title: module.title ?? courseModule?.title ?? null,
      status: module.status ?? "in-progress",
      duration: module.duration ?? courseModule?.duration ?? null,
      completion: module.completion ?? 0,
      assessmentStatus: assessmentStatus,
      bestScore: module.best_score ?? null,
      attemptCount: module.attempt_count ?? null,
      items: mergedItems,
    };
  });

  // Track both module IDs and titles to prevent duplicates
  const mappedModuleIds = new Set(mapped.map((module) => module.moduleId));
  const mappedModuleTitles = new Set(
    mapped
      .map((module) => module.title)
      .filter((title): title is string => !!title)
  );

  courseModules.forEach((courseModule, index) => {
    const moduleId =
      courseModule.id ?? courseModule.title ?? `course-module-${index}`;
    const moduleTitle = courseModule.title;

    // Skip if we already have this module (by ID or by title to avoid duplicates)
    if (
      mappedModuleIds.has(moduleId) ||
      (moduleTitle && mappedModuleTitles.has(moduleTitle))
    ) {
      return;
    }

    mapped.push({
      moduleId,
      title: courseModule.title ?? null,
      status: "locked",
      duration: courseModule.duration ?? null,
      completion: 0,
      assessmentStatus: "not-attempted",
      bestScore: null,
      attemptCount: null,
      items: courseModule.items.map((courseItem, itemIndex) => ({
        moduleItemId:
          courseItem.id ?? courseItem.title ?? `${moduleId}-item-${itemIndex}`,
        title: courseItem.title ?? null,
        completed: false,
      })),
    });

    // Track the newly added module to prevent further duplicates
    mappedModuleIds.add(moduleId);
    if (moduleTitle) {
      mappedModuleTitles.add(moduleTitle);
    }
  });

  return mapped;
};

const mapCourseProgressResponse = (
  response: ApiCourseProgressResponse,
  course?: Course | null
): CourseProgress => ({
  courseSlug: response.course_slug,
  title: course?.title ?? response.course_slug,
  instructor: course?.instructors?.[0]?.name ?? null,
  nextSession: response.next_session ?? null,
  progress:
    response.progress ??
    (response.modules && response.modules.length
      ? Math.round(
          response.modules.reduce(
            (sum, module) => sum + (module.completion ?? 0),
            0
          ) / response.modules.length
        )
      : 0),
  category: course?.category ?? null,
  level: course?.level ?? undefined,
  metrics: response.metrics
    ? {
        hoursSpent: response.metrics.hours_spent ?? null,
        practiceAccuracy: response.metrics.practice_accuracy ?? null,
        mcqAttempts: response.metrics.mcq_attempts ?? null,
        lastScore: response.metrics.last_score ?? null,
        streak: response.metrics.streak ?? null,
      }
    : null,
  modules: mapProgressModules(response.modules ?? [], course),
});

const mapLearningEvents = (
  events: ApiDashboardSummary["schedule"]
): LearningEvent[] =>
  events.map((event) => ({
    id: event.id,
    title: event.title,
    start: event.start ? new Date(event.start).toISOString() : null,
    end: event.end ? new Date(event.end).toISOString() : null,
    type: event.type ?? null,
    courseSlug: event.course_slug ?? null,
  }));

const mapInsights = (
  insights: ApiDashboardSummary["insights"]
): PracticeInsight[] =>
  insights.map((insight) => ({
    id: insight.id,
    title: insight.title,
    delta: insight.delta,
    description: insight.description ?? null,
  }));

const mapResources = (
  resources: ApiDashboardSummary["resources"]
): ResourceItem[] =>
  resources.map((resource) => ({
    id: resource.id,
    title: resource.title,
    description: resource.description ?? null,
    type: resource.type ?? null,
    link: resource.link ?? null,
  }));

const mapDashboardSummary = (
  response: ApiDashboardSummary,
  courseLookup: Record<string, Course>
): DashboardSummary => {
  const courses: CourseProgress[] = response.courses.map((course) => {
    const courseRef = courseLookup[course.course_slug];

    // If we have course reference with modules, use those instead of dashboard's stale data
    // This ensures we show the most up-to-date module list from the course detail endpoint
    const dashboardModules = mapModules(course.modules ?? []);
    const modules = courseRef?.modules
      ? courseRef.modules.map((refModule) => {
          // Try to find matching module in dashboard data to get progress
          const dashboardModule = dashboardModules.find(
            (dm) => dm.moduleId === refModule.id || dm.title === refModule.title
          );
          return {
            moduleId:
              refModule.id ?? refModule.title ?? `module-${Math.random()}`,
            title: refModule.title ?? null,
            status: (dashboardModule?.status ?? "locked") as
              | "locked"
              | "in-progress"
              | "completed",
            duration: refModule.duration ?? null,
            completion: dashboardModule?.completion ?? 0,
            items: [], // Dashboard doesn't need item-level details
          };
        })
      : dashboardModules;

    return {
      courseSlug: course.course_slug,
      title: course.title ?? courseRef?.title ?? course.course_slug,
      instructor:
        course.instructor ?? courseRef?.instructors?.[0]?.name ?? null,
      nextSession: course.next_session ?? null,
      progress: course.progress ?? 0,
      category: course.category ?? courseRef?.category ?? null,
      level: course.level ?? courseRef?.level ?? undefined,
      metrics: mapMetrics(course.metrics ?? undefined),
      modules,
    };
  });
  return {
    profile: {
      userId: response.profile.user_id,
      name: response.profile.name,
      role: response.profile.role ?? null,
      cohort: response.profile.cohort ?? null,
      avatar: response.profile.avatar ?? null,
      streak: response.profile.streak ?? 0,
      xp: response.profile.xp ?? 0,
      nextBadge: response.profile.next_badge ?? null,
    },
    courses,
    stats: response.stats.map((stat) => ({
      ...stat,
      change: stat.change ?? 0,
    })),
    insights: mapInsights(response.insights ?? []),
    resources: mapResources(response.resources ?? []),
    schedule: mapLearningEvents(response.schedule ?? []),
  };
};

const courseArrayToLookup = (courses: Course[]): Record<string, Course> =>
  courses.reduce<Record<string, Course>>((acc, course) => {
    acc[course.slug] = course;
    return acc;
  }, {});

export const universityService = {
  async getCourses(includeDetails = false): Promise<Course[]> {
    try {
      const response: ApiCourseListResponse = await fetchCourses(
        includeDetails
      );
      return response.courses.map((course) => mapCourse(course));
    } catch (error) {
      console.warn(
        "Unable to fetch courses from API, falling back to local data",
        error
      );
      return fallbackCourses;
    }
  },

  async getCourseBySlug(slug: string): Promise<Course | null> {
    try {
      const response: ApiCourseDetailResponse = await fetchCourseBySlug(slug);
      return mapCourse(response.course);
    } catch (error) {
      console.warn(`Unable to fetch course ${slug}, using fallback`, error);
      const fallback = fallbackCourses.find(
        (course) => course.slug === slug || course.id === slug
      );
      if (!fallback) {
        return null;
      }
      return {
        ...fallback,
        enrolled: false,
        contentLocked: true,
      };
    }
  },

  async getPracticeSets(): Promise<PracticeSet[]> {
    try {
      const response: ApiPracticeSetListResponse = await fetchPracticeSets();
      return mapPracticeSets(response);
    } catch (error) {
      console.warn("Unable to fetch practice sets, using fallback", error);
      return fallbackPracticeTopics;
    }
  },

  async getDashboardSummary(): Promise<DashboardSummary> {
    try {
      const dashboard = await fetchDashboardSummary();

      // Fetch individual course details for each enrolled course to get accurate module lists
      // The dashboard API may have cached/stale module data, but individual course endpoints are fresh
      const courseDetailsPromises = dashboard.courses.map((course) =>
        fetchCourseBySlug(course.course_slug)
          .then((response) => mapCourse(response.course))
          .catch((err) => {
            console.warn(
              `Failed to fetch details for ${course.course_slug}:`,
              err
            );
            return null;
          })
      );

      const courseDetails = await Promise.all(courseDetailsPromises);
      const courseLookup = courseArrayToLookup(
        courseDetails.filter((c): c is Course => c !== null)
      );

      return mapDashboardSummary(dashboard, courseLookup);
    } catch (error) {
      console.warn(
        "Unable to load dashboard summary, using fallback data",
        error
      );
      return {
        profile: fallbackLearnerProfile,
        courses: fallbackActiveCourses,
        stats: fallbackStats,
        insights: fallbackInsights,
        resources: fallbackResources,
        schedule: fallbackSchedule,
      };
    }
  },

  async getCourseProgress(
    slug: string,
    course?: Course | null
  ): Promise<CourseProgress> {
    const response = await fetchCourseProgress(slug);
    return mapCourseProgressResponse(response, course);
  },

  async saveCourseProgress(
    payload: Parameters<typeof updateCourseProgress>[0],
    course?: Course | null
  ): Promise<CourseProgress> {
    const response = await updateCourseProgress(payload);
    return mapCourseProgressResponse(response, course);
  },

  async enrollInCourse(courseSlug: string): Promise<void> {
    await repoEnrollInCourse(courseSlug);
  },

  async getEnrollments(): Promise<string[]> {
    try {
      return await fetchEnrollments();
    } catch (error) {
      console.warn("Unable to load enrollments", error);
      return [];
    }
  },
};
