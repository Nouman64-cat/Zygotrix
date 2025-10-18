import type {
  AnalyticsStat,
  CourseProgress,
  LearningEvent,
  PracticeInsight,
  ResourceItem,
  LearnerProfile,
} from "../types";

export const learnerProfile: LearnerProfile = {
  userId: "demo-user",
  name: "Taylor Morgan",
  role: "AI Product Manager",
  cohort: "AI Product Strategist • Winter 2025",
  avatar:
    "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=200&q=60",
  streak: 12,
  xp: 4820,
  nextBadge: "AI Strategy Architect",
};

export const activeCourses: CourseProgress[] = [
  {
    courseSlug: "ai-101",
    title: "Foundations of Artificial Intelligence",
    instructor: "Dr. Hannah Lee",
    nextSession: "Mentor Lab • Jan 24, 09:00 AM PT",
    progress: 64,
    category: "Artificial Intelligence",
    level: "Beginner",
    modules: [
      {
        moduleId: "ai-101-1",
        title: "AI Design Patterns",
        status: "completed",
        duration: "1h 20m",
        completion: 100,
        items: [],
      },
      {
        moduleId: "ai-101-2",
        title: "Model Lifecycle Studio",
        status: "in-progress",
        duration: "1h 05m",
        completion: 45,
        items: [],
      },
      {
        moduleId: "ai-101-3",
        title: "Responsible AI Playbooks",
        status: "locked",
        duration: "55m",
        completion: 0,
        items: [],
      },
    ],
  },
  {
    courseSlug: "cloud-305",
    title: "Cloud Native Architecture Bootcamp",
    instructor: "Miguel Garcia",
    nextSession: "Simulation Studio Mission • Jan 26, 01:00 PM PT",
    progress: 28,
    category: "Cloud Engineering",
    level: "Advanced",
    modules: [
      {
        moduleId: "cloud-305-1",
        title: "Service Mesh Deep Dive",
        status: "in-progress",
        duration: "1h 40m",
        completion: 30,
        items: [],
      },
      {
        moduleId: "cloud-305-2",
        title: "Observability Lab",
        status: "locked",
        duration: "1h 18m",
        completion: 0,
        items: [],
      },
      {
        moduleId: "cloud-305-3",
        title: "Progressive Delivery",
        status: "locked",
        duration: "1h 10m",
        completion: 0,
        items: [],
      },
    ],
  },
];

export const learningSchedule: LearningEvent[] = [
  {
    id: "event-1",
    title: "Simulation Studio: Incident Response Scenario",
    start: "2025-01-22T17:00:00Z",
    end: "2025-01-22T18:00:00Z",
    type: "live",
    courseSlug: "cloud-305",
  },
  {
    id: "event-2",
    title: "Module Quiz: Responsible AI Playbooks",
    start: "2025-01-23T07:00:00Z",
    end: "2025-01-24T07:00:00Z",
    type: "deadline",
    courseSlug: "ai-101",
  },
  {
    id: "event-3",
    title: "Async Review: Service Mesh Deep Dive",
    start: "2025-01-25T16:00:00Z",
    end: "2025-01-25T17:30:00Z",
    type: "async",
    courseSlug: "cloud-305",
  },
];

export const practiceInsights: PracticeInsight[] = [
  {
    id: "insight-1",
    title: "Responsible AI MCQs",
    delta: 14,
    description: "Great momentum. Accuracy climbed after replaying the Simulation Studio lab.",
  },
  {
    id: "insight-2",
    title: "Service Mesh Observability",
    delta: -6,
    description: "Focus on log sampling strategies—review mentor notes before next quiz.",
  },
  {
    id: "insight-3",
    title: "Executive Storytelling",
    delta: 5,
    description: "Story arcs improved. Incorporate more quantitative impact in slide decks.",
  },
];

export const analyticsStats: AnalyticsStat[] = [
  {
    id: "stat-1",
    label: "Weekly learning hours",
    value: "9.5h",
    change: 18,
    timeframe: "vs last week",
  },
  {
    id: "stat-2",
    label: "MCQ accuracy",
    value: "86%",
    change: 6,
    timeframe: "last 30 attempts",
  },
  {
    id: "stat-3",
    label: "Simulation readiness",
    value: "92%",
    change: 4,
    timeframe: "last 3 missions",
  },
  {
    id: "stat-4",
    label: "Cohort rank",
    value: "#4",
    change: 1,
    timeframe: "out of 48 learners",
  },
];

export const savedResources: ResourceItem[] = [
  {
    id: "resource-1",
    title: "AI Launch Risk Checklist",
    description: "Template to align legal, compliance, and engineering before go-live.",
    type: "template",
    link: "#",
  },
  {
    id: "resource-2",
    title: "Service Mesh SLO Models",
    description: "Reference dashboards and alert budgets from mentor office hours.",
    type: "playbook",
    link: "#",
  },
  {
    id: "resource-3",
    title: "Simulation Studio Debrief: Design Systems Clinic",
    description: "Recording from last week’s critique with Emily Jones.",
    type: "recording",
    link: "#",
  },
  {
    id: "resource-4",
    title: "Stakeholder Narrative Canvas",
    description: "Storyboard product updates for executive stakeholders.",
    type: "template",
    link: "#",
  },
];
