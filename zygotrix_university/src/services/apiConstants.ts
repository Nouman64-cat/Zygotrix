export const API_BASE_URL =
  import.meta.env.VITE_ZYGOTRIX_API ?? "http://127.0.0.1:8000";

export const API_ROUTES = {
  university: {
    courses: "/api/university/courses",
    courseDetail: (slug: string) => `/api/university/courses/${encodeURIComponent(slug)}`,
    practiceSets: "/api/university/practice-sets",
    dashboard: "/api/university/dashboard",
    courseProgress: (slug: string) => `/api/university/progress/${encodeURIComponent(slug)}`,
    updateProgress: "/api/university/progress",
  },
} as const;

export type ApiRoutes = typeof API_ROUTES;
