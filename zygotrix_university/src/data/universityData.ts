import type {
  Course,
  FaqItem,
  LearningPath,
  PracticeTopic,
  Testimonial,
} from "../types";

export const featuredCourses: Course[] = [
  {
    id: "ai-101",
    title: "Foundations of Artificial Intelligence",
    description:
      "Build a rock-solid understanding of AI systems, machine learning pipelines, and responsible deployment practices.",
    category: "Artificial Intelligence",
    level: "Beginner",
    duration: "6 weeks",
    badge: "Most Popular",
    lessons: 48,
    students: 12640,
    rating: 4.9,
    image:
      "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80",
    instructors: [
      {
        id: "instructor-lee",
        name: "Dr. Hannah Lee",
        title: "AI Research Lead, Zygotrix Labs",
        avatar:
          "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=200&q=60",
        bio: "Hands-on researcher focused on explainable AI and adaptive learning systems.",
      },
    ],
    outcomes: [
      "Translate business challenges into AI-ready problem statements.",
      "Compose machine learning experiments and evaluate model performance.",
      "Adopt responsible AI frameworks that protect learners and organizations.",
    ],
    modules: [
      {
        id: "ai-101-1",
        title: "AI Design Patterns",
        duration: "1 hr 20 min",
        description: "Recognize when and how to apply classic AI problem-solving patterns.",
        items: [
          "Mapping user goals to model objectives",
          "Hybrid symbolic-neural architectures",
          "Bias detection and mitigation checklist",
        ],
      },
      {
        id: "ai-101-2",
        title: "Model Lifecycle Studio",
        duration: "1 hr 05 min",
        description:
          "Walk through the end-to-end lifecycle, from dataset curation to production handoff.",
        items: [
          "Data readiness scorecard",
          "Experiment orchestration in the Simulation Studio",
          "Human-in-the-loop evaluation strategies",
        ],
      },
    ],
  },
  {
    id: "ui-204",
    title: "Product Design Systems with Figma",
    description:
      "Craft cohesive design systems and ship pixel-perfect experiences across web and mobile touchpoints.",
    category: "Product Design",
    level: "Intermediate",
    duration: "4 weeks",
    badge: "Design Track",
    lessons: 32,
    students: 9862,
    rating: 4.8,
    image:
      "https://images.unsplash.com/photo-1559028012-481c04fa702d?auto=format&fit=crop&w=800&q=80",
    instructors: [
      {
        id: "instructor-jones",
        name: "Emily Jones",
        title: "Principal Product Designer, CourFactory",
        avatar:
          "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=200&q=60",
        bio: "Builder of cross-platform design languages for global teams.",
      },
    ],
    outcomes: [
      "Establish visual foundations, tokens, and reusable components.",
      "Prototype advanced interactions and motion states.",
      "Ship accessible, internationalized experiences faster.",
    ],
    modules: [
      {
        id: "ui-204-1",
        title: "Design Token Architecture",
        duration: "58 min",
        description: "Define scalable design tokens linked to product DNA.",
        items: [
          "Color and typography systems",
          "Adaptive components for responsive grids",
          "Global vs. local token governance",
        ],
      },
      {
        id: "ui-204-2",
        title: "High-Fidelity Prototyping",
        duration: "1 hr 12 min",
        description: "Transform static mockups into immersive prototypes with interaction depth.",
        items: [
          "Motion principles and timeline editing",
          "Component variants and smart animations",
          "Developer handoff workflow",
        ],
      },
    ],
  },
  {
    id: "cloud-305",
    title: "Cloud Native Architecture Bootcamp",
    description:
      "Design and deploy resilient cloud-native platforms with Kubernetes, service meshes, and observability built-in.",
    category: "Cloud Engineering",
    level: "Advanced",
    duration: "8 weeks",
    badge: "Career Accelerator",
    lessons: 64,
    students: 7241,
    rating: 4.95,
    image:
      "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=800&q=80",
    instructors: [
      {
        id: "instructor-garcia",
        name: "Miguel Garcia",
        title: "Principal Cloud Architect, RenderWorks",
        avatar:
          "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=200&q=60",
        bio: "Works with global teams to modernize infrastructure with zero-downtime ambitions.",
      },
    ],
    outcomes: [
      "Spin up cloud-native platforms with policy-driven automation.",
      "Instrument services for full-stack observability and resilience.",
      "Guide platform adoption with documentation and enablement kits.",
    ],
    modules: [
      {
        id: "cloud-305-1",
        title: "Service Mesh Deep Dive",
        duration: "1 hr 40 min",
        description: "Navigate multi-cluster deployments with canary and blue/green release strategies.",
        items: [
          "Istio configuration best practices",
          "Traffic mirroring in Simulation Studio",
          "Progressive delivery patterns",
        ],
      },
      {
        id: "cloud-305-2",
        title: "Observability Lab",
        duration: "1 hr 18 min",
        description: "Instrument distributed systems for actionable insights.",
        items: [
          "Tracing with OpenTelemetry",
          "SLO crafting and alert budget analysis",
          "Dashboard storytelling for exec reviews",
        ],
      },
    ],
  },
];

export const learningPaths: LearningPath[] = [
  {
    id: "lp-ai-product",
    title: "AI Product Strategist",
    description:
      "Blend customer discovery, model design, and ethical guardrails to ship AI-assisted experiences.",
    focus: ["Applied AI", "Product Discovery", "Responsible AI"],
    estimatedTime: "12 weeks • 6 hrs/week",
    courses: ["Foundations of Artificial Intelligence", "Simulation Studio Playbook", "Voice of Customer Sprints"],
  },
  {
    id: "lp-fullstack",
    title: "Modern Full-Stack Engineer",
    description:
      "Master high-velocity product delivery with TypeScript, cloud-native services, and automated QA.",
    focus: ["TypeScript", "Cloud Native", "Quality Automation"],
    estimatedTime: "16 weeks • 7 hrs/week",
    courses: [
      "TypeScript for Production Systems",
      "Cloud Native Architecture Bootcamp",
      "Continuous Testing with Simulation Studio",
    ],
  },
  {
    id: "lp-design-leader",
    title: "Design Systems Leader",
    description:
      "Scale consistent product experiences across multi-platform organizations while mentoring teams.",
    focus: ["System Thinking", "Design Leadership", "Accessibility"],
    estimatedTime: "10 weeks • 5 hrs/week",
    courses: ["Product Design Systems with Figma", "Inclusive Design Sprints", "Storytelling for Design Leaders"],
  },
];

export const practiceTopics: PracticeTopic[] = [
  {
    id: "practice-ai-ethics",
    title: "Responsible AI Frameworks",
    questions: 36,
    accuracy: 82,
    trend: "up",
    tag: "AI Governance",
    timeToComplete: "Approx. 25 mins",
  },
  {
    id: "practice-react-patterns",
    title: "Advanced React Patterns",
    questions: 42,
    accuracy: 74,
    trend: "up",
    tag: "Front-end",
    timeToComplete: "Approx. 30 mins",
  },
  {
    id: "practice-secure-cloud",
    title: "Secure Cloud Deployments",
    questions: 28,
    accuracy: 68,
    trend: "down",
    tag: "Cloud",
    timeToComplete: "Approx. 20 mins",
  },
  {
    id: "practice-ui-accessibility",
    title: "UI Accessibility Checkpoints",
    questions: 24,
    accuracy: 91,
    trend: "up",
    tag: "Design",
    timeToComplete: "Approx. 18 mins",
  },
];

export const testimonials: Testimonial[] = [
  {
    id: "testimonial-1",
    name: "Alex Morgan",
    role: "AI Product Manager",
    company: "Orbit Labs",
    message:
      "Zygotrix University blends learner empathy with deep technical rigor. The Simulation Studio labs let my team rehearse real-world launches before we hit production.",
    avatar:
      "https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=200&q=60",
  },
  {
    id: "testimonial-2",
    name: "Priya Desai",
    role: "Lead UX Designer",
    company: "Canvas Eight",
    message:
      "The practice MCQs surface blind spots I didn’t know I had. The adaptive recommendations are eerily spot-on and keep me engaged after work hours.",
    avatar:
      "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=200&q=60",
  },
  {
    id: "testimonial-3",
    name: "Jordan Edwards",
    role: "Senior Platform Engineer",
    company: "Nebula Systems",
    message:
      "Courses feel handcrafted for practitioners. The instructors share production stories, failure modes, and playbooks we can deploy immediately.",
    avatar:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=200&q=60",
  },
];

export const faqs: FaqItem[] = [
  {
    id: "faq-1",
    question: "How does the Simulation Studio accelerate learning?",
    answer:
      "Simulation Studio mirrors real-world projects with guided labs and branching scenarios. Learners complete missions that adapt to their decisions, accelerating retention and confidence.",
    category: "Learning Experience",
  },
  {
    id: "faq-2",
    question: "Are the courses self-paced or live?",
    answer:
      "Most flagship programs offer a hybrid approach: self-paced core lessons paired with weekly live design critiques, code reviews, and office hours with instructors.",
    category: "Scheduling",
  },
  {
    id: "faq-3",
    question: "Do you offer completion certificates?",
    answer:
      "Yes. Each course awards a verifiable certificate and skill badge. Learners on career tracks earn milestone credentials that integrate with LinkedIn and professional portfolios.",
    category: "Credentials",
  },
  {
    id: "faq-4",
    question: "Can teams onboard together?",
    answer:
      "Absolutely. Zygotrix for Teams unlocks cohort analytics, tailored practice sets, and change-management resources designed for enterprise rollouts.",
    category: "Teams",
  },
];

export const partnerLogos = [
  "ClariSight",
  "Orbit Labs",
  "Canvas Eight",
  "Nebula Systems",
  "Drifted",
  "CoreLayer",
];

export const highlights = [
  {
    id: "highlight-community",
    label: "Global Community",
    metric: "48K+",
    description: "Learners driving outcomes across 92 countries.",
  },
  {
    id: "highlight-job-ready",
    label: "Job-Ready Projects",
    metric: "320+",
    description: "Curated capstones reviewed by industry mentors.",
  },
  {
    id: "highlight-practice",
    label: "Adaptive Practice",
    metric: "12K",
    description: "MCQs and simulations tuned to your skill gaps.",
  },
];
