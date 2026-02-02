import { API_URL } from "../config";

export const API_BASE_URL = API_URL;

export const API_ROUTES = {
  auth: {
    signUp: "/api/auth/signup",
    signUpVerify: "/api/auth/signup/verify",
    signUpResend: "/api/auth/signup/resend",
    login: "/api/auth/login",
    me: "/api/auth/me",
    updateProfile: "/api/auth/profile",
    onboarding: "/api/auth/onboarding",
    passwordResetRequest: "/api/auth/password-reset/request",
    passwordResetVerifyOtp: "/api/auth/password-reset/verify-otp",
    passwordResetVerify: "/api/auth/password-reset/verify",
    passwordResetResend: "/api/auth/password-reset/resend",
    preferences: "/api/auth/me/preferences",
    preferencesReset: "/api/auth/me/preferences/reset",
  },
  portal: {
    status: "/api/portal/status",
  },
  traits: {
    root: "/api/traits",
    detail: (traitKey: string) => "/api/traits/" + encodeURIComponent(traitKey),
    byKey: (traitKey: string) =>
      "/api/traits/by-key/" + encodeURIComponent(traitKey),
  },
  gwas: {
    search: "/api/search-traits",
    trait: (traitName: string) => "/api/trait/" + encodeURIComponent(traitName),
  },
  mendelian: {
    simulate: "/api/mendelian/simulate",
    simulateJoint: "/api/mendelian/simulate-joint",
    genotypes: "/api/mendelian/genotypes",
    preview: "/api/mendelian/preview",
  },
  data: {
    importFile: "/api/data/import",
  },
  population: {
    simulate: "/api/population/simulate",
  },
  pgs: {
    demo: "/api/pgs/demo",
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
  admin: {
    users: "/api/admin/users",
    userDetail: (userId: string) =>
      "/api/admin/users/" + encodeURIComponent(userId),
    deactivateUser: (userId: string) =>
      "/api/admin/users/" + encodeURIComponent(userId) + "/deactivate",
    reactivateUser: (userId: string) =>
      "/api/admin/users/" + encodeURIComponent(userId) + "/reactivate",
    updateUserRole: (userId: string) =>
      "/api/admin/users/" + encodeURIComponent(userId) + "/role",
    stats: "/api/admin/stats",
    chatbotSettings: "/api/admin/chatbot/settings",
    updateChatbotSettings: "/api/admin/chatbot/settings",
    prompts: "/api/admin/prompts",
    promptDetail: (promptType: string) =>
      "/api/admin/prompts/" + encodeURIComponent(promptType),
    updatePrompt: (promptType: string) =>
      "/api/admin/prompts/" + encodeURIComponent(promptType),
    resetPrompt: (promptType: string) =>
      "/api/admin/prompts/" + encodeURIComponent(promptType) + "/reset",
  },
  newsletter: {
    subscribe: "/api/newsletter/subscribe",
    subscriptions: "/api/newsletter/subscriptions",
    recipients: "/api/newsletter/recipients",
    unsubscribe: (email: string) =>
      "/api/newsletter/unsubscribe/" + encodeURIComponent(email),
    send: "/api/newsletter/send",
    generateTemplate: "/api/newsletter/generate-template",
    templates: "/api/newsletter/templates",
    deleteTemplate: (templateId: string) =>
      "/api/newsletter/templates/" + encodeURIComponent(templateId),
  },
  contact: {
    submit: "/api/contact/submit",
    submissions: "/api/contact/submissions",
    markAsRead: (submissionId: string) =>
      "/api/contact/submissions/" + encodeURIComponent(submissionId) + "/read",
    deleteSubmission: (submissionId: string) =>
      "/api/contact/submissions/" + encodeURIComponent(submissionId),
  },
} as const;

export type ApiRoutes = typeof API_ROUTES;
