import apiClient from "../apiClient";
import { API_ROUTES } from "../apiConstants";
import type {
  ApiCourseDetailResponse,
  ApiCourseListResponse,
  ApiCourseProgressResponse,
  ApiCourseProgressUpdateRequest,
  ApiDashboardSummary,
  ApiPracticeSetListResponse,
  ApiAssessmentSubmission,
  ApiAssessmentResultResponse,
  ApiAssessmentHistoryResponse,
  ApiCertificateResponse,
} from "../../types/api";

export const fetchCourses = async (
  includeDetails = false
): Promise<ApiCourseListResponse> => {
  const response = await apiClient.get<ApiCourseListResponse>(
    API_ROUTES.university.courses,
    {
      params: {
        detail: includeDetails,
        _t: Date.now(),
      },
    }
  );
  return response.data;
};

export const fetchCourseBySlug = async (
  slug: string
): Promise<ApiCourseDetailResponse> => {
  const response = await apiClient.get<ApiCourseDetailResponse>(
    API_ROUTES.university.courseDetail(slug),
    {
      params: {
        detail: true,
        _t: Date.now(),
      },
    }
  );
  return response.data;
};

export const fetchPracticeSets =
  async (): Promise<ApiPracticeSetListResponse> => {
    const response = await apiClient.get<ApiPracticeSetListResponse>(
      API_ROUTES.university.practiceSets,
      {
        params: {
          _t: Date.now(),
        },
      }
    );
    return response.data;
  };

export const fetchDashboardSummary = async (): Promise<ApiDashboardSummary> => {
  const response = await apiClient.get<ApiDashboardSummary>(
    API_ROUTES.university.dashboard,
    {
      params: {
        _t: Date.now(),
      },
    }
  );
  return response.data;
};

export const fetchCourseProgress = async (
  slug: string
): Promise<ApiCourseProgressResponse> => {
  const response = await apiClient.get<ApiCourseProgressResponse>(
    API_ROUTES.university.courseProgress(slug),
    {
      params: {
        _t: Date.now(),
      },
    }
  );
  return response.data;
};

export const updateCourseProgress = async (
  payload: ApiCourseProgressUpdateRequest
): Promise<ApiCourseProgressResponse> => {
  const response = await apiClient.put<ApiCourseProgressResponse>(
    API_ROUTES.university.updateProgress,
    payload
  );
  return response.data;
};

export const enrollInCourse = async (slug: string): Promise<void> => {
  await apiClient.post(API_ROUTES.university.enroll, { course_slug: slug });
};

export const fetchEnrollments = async (): Promise<string[]> => {
  const response = await apiClient.get<string[]>(
    API_ROUTES.university.enrollments,
    {
      params: {
        _t: Date.now(),
      },
    }
  );
  return response.data;
};

export const submitAssessment = async (
  payload: ApiAssessmentSubmission
): Promise<ApiAssessmentResultResponse> => {
  const response = await apiClient.post<ApiAssessmentResultResponse>(
    API_ROUTES.university.submitAssessment,
    payload
  );

  return response.data;
};

export const fetchAssessmentHistory = async (
  courseSlug: string,
  moduleId?: string
): Promise<ApiAssessmentHistoryResponse> => {
  const response = await apiClient.get<ApiAssessmentHistoryResponse>(
    API_ROUTES.university.assessmentHistory(courseSlug),
    {
      params: {
        module_id: moduleId,
        _t: Date.now(),
      },
    }
  );
  return response.data;
};

export const generateCertificate = async (
  courseSlug: string
): Promise<ApiCertificateResponse> => {
  const response = await apiClient.post<ApiCertificateResponse>(
    API_ROUTES.university.certificate(courseSlug)
  );
  return response.data;
};

export const completeUniversityOnboarding = async (
  payload: import("../../types/auth").UniversityOnboardingPayload
): Promise<import("../../types/auth").UserProfile> => {
  const response = await apiClient.post<import("../../types/auth").UserProfile>(
    API_ROUTES.university.onboarding,
    payload
  );
  return response.data;
};
