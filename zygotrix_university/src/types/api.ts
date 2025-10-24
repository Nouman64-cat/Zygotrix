import type {
  AnalyticsStat,
  CourseProgress,
  CourseModule,
  CourseOutcome,
  Instructor,
  LearningEvent,
  PracticeInsight,
  PracticeSet,
  PracticeSetDetail,
  ResourceItem,
  AssessmentAttempt,
  UserAnswer,
} from "./index";

export interface ApiInstructor extends Instructor {}
export interface ApiCourseOutcome extends CourseOutcome {}
export interface ApiCourseModule extends CourseModule {}

export interface ApiCourseSummary {
  id: string;
  slug: string;
  title: string;
  short_description?: string | null;
  long_description?: string | null;
  category?: string | null;
  level?: string | null;
  duration?: string | null;
  badge_label?: string | null;
  lessons?: number | null;
  students?: number | null;
  rating?: number | null;
  image_url?: string | null;
  modules_count?: number | null;
  outcomes?: ApiCourseOutcome[];
  modules?: ApiCourseModule[];
  instructors?: ApiInstructor[];
  practice_sets?: PracticeSetDetail[];
  enrolled?: boolean;
  content_locked?: boolean;
}

export interface ApiCourseListResponse {
  courses: ApiCourseSummary[];
}

export interface ApiCourseDetailResponse {
  course: ApiCourseSummary;
}

export interface ApiPracticeSet extends PracticeSet {}

export interface ApiPracticeSetListResponse {
  practice_sets: ApiPracticeSet[];
}

export interface ApiDashboardSummary {
  profile: {
    user_id: string;
    name: string;
    role?: string | null;
    cohort?: string | null;
    avatar?: string | null;
    streak?: number | null;
    xp?: number | null;
    next_badge?: string | null;
  };
  courses: Array<{
    course_slug: string;
    title: string;
    instructor?: string | null;
    next_session?: string | null;
    progress: number;
    level?: string | null;
    category?: string | null;
    metrics?: {
      hours_spent?: number | null;
      practice_accuracy?: number | null;
      mcq_attempts?: number | null;
      last_score?: number | null;
      streak?: number | null;
    } | null;
    modules: Array<{
      module_id: string;
      title?: string | null;
      status: "locked" | "in-progress" | "completed";
      duration?: string | null;
      completion: number;
    }>;
  }>;
  stats: AnalyticsStat[];
  insights: PracticeInsight[];
  resources: ResourceItem[];
  schedule: Array<{
    id: string;
    title: string;
    start?: string | null;
    end?: string | null;
    type?: "live" | "async" | "deadline" | null;
    course_slug?: string | null;
  }>;
}

export interface ApiCourseProgressResponse {
  user_id: string;
  course_slug: string;
  progress: number;
  modules: Array<{
    module_id: string;
    title?: string | null;
    status: "locked" | "in-progress" | "completed";
    duration?: string | null;
    completion: number;
    assessment_status?: "not_started" | "attempted" | "passed" | null;
    best_score?: number | null;
    attempt_count?: number | null;
    items?: Array<{
      module_item_id: string;
      title?: string | null;
      completed?: boolean;
    }>;
  }>;
  metrics?: {
    hours_spent?: number | null;
    practice_accuracy?: number | null;
    mcq_attempts?: number | null;
    last_score?: number | null;
    streak?: number | null;
  } | null;
  next_session?: string | null;
  updated_at?: string | null;
  insights?: PracticeInsight[];
  resources?: ResourceItem[];
  schedule?: LearningEvent[];
}

export interface ApiCourseProgressUpdateRequest {
  course_slug: string;
  progress?: number;
  modules?: Array<{
    module_id: string;
    title?: string | null;
    status?: "locked" | "in-progress" | "completed";
    duration?: string | null;
    completion?: number;
    items?: Array<{
      module_item_id: string;
      title?: string | null;
      completed?: boolean;
    }>;
  }>;
  metrics?: {
    hours_spent?: number | null;
    practice_accuracy?: number | null;
    mcq_attempts?: number | null;
    last_score?: number | null;
    streak?: number | null;
  };
  next_session?: string | null;
  insights?: PracticeInsight[];
  resources?: ResourceItem[];
  schedule?: LearningEvent[];
}

export interface ApiCourseProgress extends ApiCourseProgressResponse {}

// Assessment API interfaces
export interface ApiAssessmentSubmission {
  course_slug: string;
  module_id: string;
  answers: UserAnswer[];
}

export interface ApiAssessmentAttempt extends AssessmentAttempt {}

export interface ApiAssessmentResultResponse {
  attempt: ApiAssessmentAttempt;
  passed: boolean;
  score: number;
  total_questions: number;
}

export interface ApiAssessmentHistoryResponse {
  attempts: ApiAssessmentAttempt[];
}

export interface ApiDashboardCourse extends CourseProgress {}
