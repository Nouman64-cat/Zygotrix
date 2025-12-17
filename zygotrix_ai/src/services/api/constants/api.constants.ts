export const API_ENDPOINTS = {
  CHAT: {
    SEND_MESSAGE: '/api/chat/message',
    GET_CONVERSATIONS: '/api/chat/conversations',
    GET_CONVERSATION: (id: string) => `/api/chat/conversations/${id}`,
    CREATE_CONVERSATION: '/api/chat/conversations',
    DELETE_CONVERSATION: (id: string) => `/api/chat/conversations/${id}`,
    CLEAR_HISTORY: '/api/chat/clear',
    STREAM_MESSAGE: '/api/chat/stream',
  },
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    REFRESH_TOKEN: '/api/auth/refresh',
    VERIFY: '/api/auth/verify',
  },
  USER: {
    GET_PROFILE: '/api/user/profile',
    UPDATE_PROFILE: '/api/user/profile',
    GET_SETTINGS: '/api/user/settings',
    UPDATE_SETTINGS: '/api/user/settings',
  },
} as const;

export const API_BASE_URL = 'http://localhost:8000';
