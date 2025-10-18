import apiClient from "../apiClient";
import { API_ROUTES } from "../apiConstants";
import type {
  ApiCourseDetailResponse,
  ApiCourseListResponse,
  ApiCourseProgressResponse,
  ApiCourseProgressUpdateRequest,
  ApiDashboardSummary,
  ApiPracticeSetListResponse,
} from "../../types/api";

export const fetchCourses = async (
  includeDetails = false,
): Promise<ApiCourseListResponse> => {
  const response = await apiClient.get<ApiCourseListResponse>(
    API_ROUTES.university.courses,
    { params: { detail: includeDetails } },
  );
  return response.data;
};

export const fetchCourseBySlug = async (
  slug: string,
): Promise<ApiCourseDetailResponse> => {
  const response = await apiClient.get<ApiCourseDetailResponse>(
    API_ROUTES.university.courseDetail(slug),
  );
  return response.data;
};

export const fetchPracticeSets = async (): Promise<ApiPracticeSetListResponse> => {
  const response = await apiClient.get<ApiPracticeSetListResponse>(
    API_ROUTES.university.practiceSets,
  );
  return response.data;
};

export const fetchDashboardSummary = async (): Promise<ApiDashboardSummary> => {
  const response = await apiClient.get<ApiDashboardSummary>(
    API_ROUTES.university.dashboard,
  );
  return response.data;
};

export const fetchCourseProgress = async (
  slug: string,
): Promise<ApiCourseProgressResponse> => {
  const response = await apiClient.get<ApiCourseProgressResponse>(
    API_ROUTES.university.courseProgress(slug),
  );
  return response.data;
};

export const updateCourseProgress = async (
  payload: ApiCourseProgressUpdateRequest,
): Promise<ApiCourseProgressResponse> => {
  const response = await apiClient.put<ApiCourseProgressResponse>(
    API_ROUTES.university.updateProgress,
    payload,
  );
  return response.data;
};

export const enrollInCourse = async (slug: string): Promise<void> => {
  await apiClient.post(API_ROUTES.university.enroll, { course_slug: slug });
};

export const fetchEnrollments = async (): Promise<string[]> => {
  const response = await apiClient.get<string[]>(API_ROUTES.university.enrollments);
  return response.data;
};
