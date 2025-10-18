export interface Instructor {
  id: string;
  name: string;
  title: string;
  avatar: string;
  bio: string;
}

export interface CourseModule {
  id: string;
  title: string;
  duration: string;
  description: string;
  items: string[];
}

export interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  duration: string;
  badge: string;
  lessons: number;
  students: number;
  rating: number;
  image: string;
  instructors: Instructor[];
  outcomes: string[];
  modules: CourseModule[];
}

export interface LearningPath {
  id: string;
  title: string;
  description: string;
  focus: string[];
  estimatedTime: string;
  courses: string[];
}

export interface PracticeTopic {
  id: string;
  title: string;
  questions: number;
  accuracy: number;
  trend: "up" | "down";
  tag: string;
  timeToComplete: string;
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
  id: string;
  title: string;
  status: "locked" | "in-progress" | "completed";
  duration: string;
  completion: number;
}

export interface CourseProgress {
  id: string;
  title: string;
  instructor: string;
  nextSession: string;
  progress: number;
  category: string;
  level: Course["level"];
  modules: ModuleProgress[];
}

export interface LearningEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  type: "live" | "async" | "deadline";
  courseId: string;
}

export interface PracticeInsight {
  id: string;
  title: string;
  delta: number;
  description: string;
}

export interface ResourceItem {
  id: string;
  title: string;
  description: string;
  type: "playbook" | "template" | "recording" | "article";
  link: string;
}

export interface AnalyticsStat {
  id: string;
  label: string;
  value: string;
  change: number;
  timeframe: string;
}
