export const API_ENDPOINTS = {
  // Zygotrix AI endpoints (MongoDB persisted)
  ZYGOTRIX_AI: {
    CHAT: "/api/zygotrix-ai/chat",
    CONVERSATIONS: "/api/zygotrix-ai/conversations",
    CONVERSATION: (id: string) => `/api/zygotrix-ai/conversations/${id}`,
    MESSAGES: (conversationId: string) =>
      `/api/zygotrix-ai/conversations/${conversationId}/messages`,
    FOLDERS: "/api/zygotrix-ai/folders",
    ANALYTICS: "/api/zygotrix-ai/analytics",
    RATE_LIMIT: "/api/zygotrix-ai/rate-limit",
  },
  // Legacy chatbot endpoints (in-memory only - for backwards compatibility)
  CHATBOT: {
    CHAT: "/api/chatbot/chat",
    STATUS: "/api/chatbot/status",
    CACHE_STATS: "/api/chatbot/cache/stats",
    CACHE_CLEAR: "/api/chatbot/cache/clear",
    ADMIN: {
      TOKEN_USAGE: "/api/chatbot/admin/token-usage",
      TOKEN_USAGE_BY_USER: (userId: string) =>
        `/api/chatbot/admin/token-usage/${userId}`,
      TOKEN_USAGE_DAILY: "/api/chatbot/admin/token-usage-daily",
    },
  },
  AUTH: {
    LOGIN: "/api/auth/login",
    REGISTER: "/api/auth/signup",
    VERIFY_OTP: "/api/auth/signup/verify",
    RESEND_OTP: "/api/auth/signup/resend",
    LOGOUT: "/api/auth/logout",
    REFRESH_TOKEN: "/api/auth/refresh",
    VERIFY: "/api/auth/verify",
    PASSWORD_RESET_REQUEST: "/api/auth/password-reset/request",
    PASSWORD_RESET_VERIFY_OTP: "/api/auth/password-reset/verify-otp",
    PASSWORD_RESET_VERIFY: "/api/auth/password-reset/verify",
    PASSWORD_RESET_RESEND: "/api/auth/password-reset/resend",
    PREFERENCES: "/api/auth/me/preferences",
    PREFERENCES_RESET: "/api/auth/me/preferences/reset",
  },
  USER: {
    GET_PROFILE: "/api/user/profile",
    UPDATE_PROFILE: "/api/user/profile",
    GET_SETTINGS: "/api/user/settings",
    UPDATE_SETTINGS: "/api/user/settings",
  },
} as const;

export const API_BASE_URL = import.meta.env.VITE_BASE_URL;
