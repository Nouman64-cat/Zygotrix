export const API_BASE_URL =
  import.meta.env.VITE_ZYGOTRIX_API ?? "http://127.0.0.1:8000";

export const API_ROUTES = {
  auth: {
    signUp: "/api/auth/signup",
    signUpVerify: "/api/auth/signup/verify",
    signUpResend: "/api/auth/signup/resend",
    login: "/api/auth/login",
    me: "/api/auth/me",
  },
  portal: {
    status: "/api/portal/status",
  },
  traits: {
    root: "/api/traits",
    detail: (traitKey: string) => "/api/traits/" + encodeURIComponent(traitKey),
  },
  mendelian: {
    simulate: "/api/mendelian/simulate",
    simulateJoint: "/api/mendelian/simulate-joint",
    genotypes: "/api/mendelian/genotypes",
  },
  polygenic: {
    score: "/api/polygenic/score",
  },
  projects: {
    root: "/api/projects",
    detail: (projectId: string) =>
      "/api/projects/" + encodeURIComponent(projectId),
    notes: (projectId: string) =>
      "/api/projects/" + encodeURIComponent(projectId) + "/notes",
    notesSave: (projectId: string) =>
      "/api/projects/" + encodeURIComponent(projectId) + "/notes/save",
    drawings: (projectId: string) =>
      "/api/projects/" + encodeURIComponent(projectId) + "/drawings",
    drawingsSave: (projectId: string) =>
      "/api/projects/" + encodeURIComponent(projectId) + "/drawings/save",
    lines: (projectId: string) =>
      "/api/projects/" + encodeURIComponent(projectId) + "/lines",
    linesSave: (projectId: string) =>
      "/api/projects/" + encodeURIComponent(projectId) + "/lines/save",
    tools: (projectId: string) =>
      "/api/projects/" + encodeURIComponent(projectId) + "/tools",
    toolDetail: (projectId: string, toolId: string) =>
      "/api/projects/" +
      encodeURIComponent(projectId) +
      "/tools/" +
      encodeURIComponent(toolId),
  },
  projectTemplates: {
    root: "/api/project-templates",
  },
  analytics: {
    root: "/api/analytics",
    global: "/api/analytics/global",
    health: "/api/analytics/health",
  },
} as const;

export type ApiRoutes = typeof API_ROUTES;
