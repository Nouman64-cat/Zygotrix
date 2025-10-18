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
