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

const mapCourse = (apiCourse: ApiCourseListResponse["courses"][number]): Course => ({
  id: apiCourse.id,
  slug: apiCourse.slug,
  title: apiCourse.title,
  shortDescription: apiCourse.short_description ?? null,
  longDescription: apiCourse.long_description ?? null,
  category: apiCourse.category ?? null,
  level: (apiCourse.level as Course["level"]) ?? null,
  duration: apiCourse.duration ?? null,
  badgeLabel: apiCourse.badge_label ?? null,
  lessons: apiCourse.lessons ?? null,
  students: apiCourse.students ?? null,
  rating: apiCourse.rating ?? null,
  imageUrl: apiCourse.image_url ?? null,
  outcomes: (apiCourse.outcomes ?? []).map((outcome) => ({
    id: outcome.id ?? `${apiCourse.slug}-outcome-${Math.random().toString(36).slice(2)}`,
    text: outcome.text ?? "",
  })),
  instructors: (apiCourse.instructors ?? []).map((instructor) => ({
    id: instructor.id,
    name: instructor.name ?? instructor.title ?? "Instructor",
    title: instructor.title,
    avatar: instructor.avatar,
    bio: instructor.bio,
  })),
  modules: (apiCourse.modules ?? []).map((module, index) => ({
    id: module.id ?? `${apiCourse.slug}-module-${index}`,
    title: module.title ?? `Module ${index + 1}`,
    duration: module.duration ?? null,
    description: module.description ?? null,
    items: (module.items ?? []).map((item, itemIndex) => ({
      id: item.id ?? `${apiCourse.slug}-module-${index}-item-${itemIndex}`,
      title: item.title,
      description: item.description ?? null,
    })),
  })),
  enrolled: apiCourse.enrolled ?? false,
  contentLocked: apiCourse.content_locked ?? false,
});

const mapPracticeSets = (
  response: ApiPracticeSetListResponse,
): PracticeSet[] =>
  response.practice_sets.map((item) => ({
    id: item.id,
    slug: item.slug,
    title: item.title,
    description: item.description ?? null,
    tag: item.tag ?? null,
    questions: item.questions ?? null,
    accuracy: item.accuracy ?? null,
    trend: item.trend ?? null,
    estimatedTime: item.estimated_time ?? null,
  }));

const mapMetrics = (metrics?: ApiDashboardSummary["courses"][number]["metrics"]): CourseProgressMetrics | null => {
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
  modules: ApiDashboardSummary["courses"][number]["modules"],
): CourseProgress["modules"] =>
  modules.map((module) => ({
    moduleId: module.module_id,
    title: module.title ?? null,
    status: module.status ?? "in-progress",
    duration: module.duration ?? null,
    completion: module.completion ?? 0,
  }));

const mapLearningEvents = (events: ApiDashboardSummary["schedule"]): LearningEvent[] =>
  events.map((event) => ({
    id: event.id,
    title: event.title,
    start: event.start ? new Date(event.start).toISOString() : null,
    end: event.end ? new Date(event.end).toISOString() : null,
    type: event.type ?? null,
    courseSlug: event.course_slug ?? null,
  }));

const mapInsights = (insights: ApiDashboardSummary["insights"]): PracticeInsight[] =>
  insights.map((insight) => ({
    id: insight.id,
    title: insight.title,
    delta: insight.delta,
    description: insight.description ?? null,
  }));

const mapResources = (resources: ApiDashboardSummary["resources"]): ResourceItem[] =>
  resources.map((resource) => ({
    id: resource.id,
    title: resource.title,
    description: resource.description ?? null,
    type: resource.type ?? null,
    link: resource.link ?? null,
  }));

const mapDashboardSummary = (
  response: ApiDashboardSummary,
  courseLookup: Record<string, Course>,
): DashboardSummary => {
  const courses: CourseProgress[] = response.courses.map((course) => {
    const courseRef = courseLookup[course.course_slug];
    return {
      courseSlug: course.course_slug,
      title: course.title ?? courseRef?.title ?? course.course_slug,
      instructor: course.instructor ?? courseRef?.instructors?.[0]?.name ?? null,
      nextSession: course.next_session ?? null,
      progress: course.progress ?? 0,
      category: course.category ?? courseRef?.category ?? null,
      level: (course.level ?? courseRef?.level) ?? null,
      metrics: mapMetrics(course.metrics ?? undefined),
      modules: mapModules(course.modules ?? []),
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
      const response: ApiCourseListResponse = await fetchCourses(includeDetails);
      return response.courses.map((course) => mapCourse(course));
    } catch (error) {
      console.warn("Unable to fetch courses from API, falling back to local data", error);
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
        (course) => course.slug === slug || course.id === slug,
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
      const [coursesResponse, dashboard] = await Promise.all([
        fetchCourses(true),
        fetchDashboardSummary(),
      ]);
      const courses = coursesResponse.courses.map((course) => mapCourse(course));
      const courseLookup = courseArrayToLookup(courses);
      return mapDashboardSummary(dashboard, courseLookup);
    } catch (error) {
      console.warn("Unable to load dashboard summary, using fallback data", error);
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

  async getCourseProgress(slug: string): Promise<ApiCourseProgressResponse> {
    return fetchCourseProgress(slug);
  },

  async saveCourseProgress(
    payload: Parameters<typeof updateCourseProgress>[0],
  ): Promise<ApiCourseProgressResponse> {
    return updateCourseProgress(payload);
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
