import type { TokenUsage } from './auth.types';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  isStreaming?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

export interface PageContext {
  pageName?: string;
  description?: string;
  features?: string[];
}

export interface ChatRequest {
  message: string;
  pageContext?: PageContext;
  userName?: string;
  userId?: string;
  sessionId?: string;
}

export interface ChatResponse {
  response: string;
  usage: TokenUsage;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: unknown;
}
