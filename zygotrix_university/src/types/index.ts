export interface Instructor {
  id?: string;
  name: string;
  title?: string;
  avatar?: string;
  bio?: string;
}

export interface CourseOutcome {
  id?: string;
  text: string;
}

export interface Video {
  fileName?: string | null;
  url?: string | null;
}

export interface CourseModuleItem {
  id?: string;
  title: string;
  description?: string | null;
  content?: string | null;
  video?: Video | null;
}

export interface CourseModule {
  id?: string;
  title: string;
  duration?: string | null;
  description?: string | null;
  items: CourseModuleItem[];
  assessment?: Assessment | null;
}

export interface AssessmentQuestionOption {
  text: string;
  isCorrect: boolean | null;
}

export interface MarkdownContent {
  markdown: string;
}

export interface AssessmentQuestion {
  prompt: MarkdownContent;
  explanation: MarkdownContent;
  options: AssessmentQuestionOption[];
}

export interface Assessment {
  assessmentQuestions: AssessmentQuestion[];
}

export interface AssessmentAttempt {
  id: string;
  userId: string;
  courseSlug: string;
  moduleId: string;
  attemptNumber: number;
  answers: UserAnswer[];
  score: number;
  totalQuestions: number;
  passed: boolean;
  completedAt: string;
}

export interface UserAnswer {
  questionIndex: number;
  selectedOptionIndex: number;
  isCorrect: boolean;
}

export interface AssessmentResult {
  attempt: AssessmentAttempt;
  questions: AssessmentQuestion[];
}

export type CourseLevel = "Beginner" | "Intermediate" | "Advanced" | string;

export interface PracticeAnswer {
  label?: string | null;
  body?: string | null;
  isCorrect?: boolean;
}

export interface PracticeQuestionDetail {
  topic?: string | null;
  difficulty?: string | null;
  prompt?: string | null;
  answers: PracticeAnswer[];
  correctAnswer: PracticeAnswer;
}

export interface PracticeSetDetail {
  id: string;
  slug?: string | null;
  title: string;
  description?: string | null;
  questions: PracticeQuestionDetail[];
}

export interface Course {
  id: string;
  slug: string;
  title: string;
  shortDescription?: string | null;
  longDescription?: string | null;
  category?: string | null;
  level?: CourseLevel;
  duration?: string | null;
  badgeLabel?: string | null;
  lessons?: number | null;
  students?: number | null;
  rating?: number | null;
  imageUrl?: string | null;
  modulesCount?: number | null;
  instructors: Instructor[];
  outcomes: CourseOutcome[];
  modules: CourseModule[];
  enrolled?: boolean;
  contentLocked?: boolean;
  practiceSets?: PracticeSetDetail[];
}

export interface LearningPath {
  id: string;
  title: string;
  description: string;
  focus: string[];
  estimatedTime: string;
  courses: string[];
}

export interface PracticeSet {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  tag?: string | null;
  questions?: number | null;
  accuracy?: number | null;
  trend?: "up" | "down" | null;
  estimatedTime?: string | null;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  message: string;
  avatar: string;
  company: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export interface ModuleProgress {
  moduleId: string;
  title?: string | null;
  status: "locked" | "in-progress" | "completed";
  duration?: string | null;
  completion: number;
  items: ModuleProgressItem[];
  assessmentStatus?: "not-attempted" | "attempted" | "passed";
  bestScore?: number | null;
  attemptCount?: number | null;
}

export interface ModuleProgressItem {
  moduleItemId: string;
  title?: string | null;
  completed: boolean;
}

export interface CourseProgressMetrics {
  hoursSpent?: number | null;
  practiceAccuracy?: number | null;
  mcqAttempts?: number | null;
  lastScore?: number | null;
  streak?: number | null;
}

export interface CourseProgress {
  courseSlug: string;
  title: string;
  instructor?: string | null;
  nextSession?: string | null;
  progress: number;
  category?: string | null;
  level?: CourseLevel;
  metrics?: CourseProgressMetrics | null;
  modules: ModuleProgress[];
}

export interface LearningEvent {
  id: string;
  title: string;
  start?: string | null;
  end?: string | null;
  type?: "live" | "async" | "deadline" | null;
  courseSlug?: string | null;
}

export interface PracticeInsight {
  id: string;
  title: string;
  delta: number;
  description?: string | null;
}

export interface ResourceItem {
  id: string;
  title: string;
  description?: string | null;
  type?: "playbook" | "template" | "recording" | "article" | string | null;
  link?: string | null;
}

export interface AnalyticsStat {
  id: string;
  label: string;
  value: string;
  change: number;
  timeframe: string;
}

export interface LearnerProfile {
  userId: string;
  name: string;
  role?: string | null;
  cohort?: string | null;
  avatar?: string | null;
  streak: number;
  xp: number;
  nextBadge?: string | null;
}

export interface DashboardSummary {
  profile: LearnerProfile;
  courses: CourseProgress[];
  stats: AnalyticsStat[];
  insights: PracticeInsight[];
  resources: ResourceItem[];
  schedule: LearningEvent[];
}
