// Chatbot service - calls backend API to avoid CORS issues

// Backend API URL - defaults to localhost for development
const API_BASE_URL = import.meta.env.VITE_ZYGOTRIX_API;

export interface ChatMessageAction {
  description: string;
  status: "pending" | "in_progress" | "completed" | "failed";
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  actions?: ChatMessageAction[];
}

export interface PageContext {
  pageName: string;
  description: string;
  features: string[];
}

// Main chatbot function - calls backend API
// Session ID for conversation memory - persists across messages and page navigation
const SESSION_STORAGE_KEY = 'zygotrix_chat_session_id';

function getSessionId(): string {
  // Try to get existing session ID from sessionStorage
  let sessionId = sessionStorage.getItem(SESSION_STORAGE_KEY);

  if (!sessionId) {
    // Generate a new unique session ID
    sessionId = `session_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 11)}`;

    // Store it in sessionStorage so it persists across page navigation
    sessionStorage.setItem(SESSION_STORAGE_KEY, sessionId);
  }

  return sessionId;
}

// Call this to start a new conversation (clears memory on backend and frontend)
export function resetSession(): void {
  sessionStorage.removeItem(SESSION_STORAGE_KEY);
}

// Usage info returned from the API
export interface UsageInfo {
  tokens_used: number;
  tokens_remaining: number;
  reset_time: string | null;
  is_limited: boolean;
}

// Response with usage info
export interface ChatResponseWithUsage {
  response: string;
  usage: UsageInfo | null;
}

// Store latest usage info for UI display
let _latestUsage: UsageInfo | null = null;

export function getLatestUsage(): UsageInfo | null {
  return _latestUsage;
}

export async function sendMessage(
  message: string,
  pageContext?: PageContext,
  userName?: string,
  userId?: string
): Promise<string> {
  try {
    const sessionId = getSessionId();

    const response = await fetch(`${API_BASE_URL}/api/chatbot/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: message,
        pageContext: pageContext,
        userName: userName,
        userId: userId,
        sessionId: sessionId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Chatbot API error:", errorData);
      return "I'm having trouble connecting right now. Please try again in a moment!";
    }

    const data = await response.json();

    // Store usage info for UI display
    if (data.usage) {
      _latestUsage = data.usage;
    }

    if (data.response) {
      return data.response;
    }

    return "I'm sorry, I couldn't generate a response. Please try again!";
  } catch (error) {
    console.error("Chatbot error:", error);
    return "Sorry, I encountered an error. Please try again!";
  }
}

// Fetch token usage stats for admin dashboard
export async function getTokenUsageStats(): Promise<{
  total_tokens: number;
  total_requests: number;
  cached_requests: number;
  cache_hit_rate: string;
  user_count: number;
  users: Array<{
    user_id: string;
    user_name: string;
    total_tokens: number;
    request_count: number;
    cached_count: number;
    cache_hit_rate: string;
    last_request: string | null;
  }>;
} | null> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/chatbot/admin/token-usage`
    );
    if (!response.ok) {
      console.error("Failed to fetch token usage stats");
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching token usage stats:", error);
    return null;
  }
}

// Interface for daily usage data
export interface DailyUsage {
  date: string;
  total_tokens: number;
  input_tokens: number;
  output_tokens: number;
  request_count: number;
  cached_count: number;
  unique_users: number;
  cost: number;
}

export interface DailyUsageSummary {
  total_tokens: number;
  total_cost: number;
  avg_daily_tokens: number;
  avg_daily_cost: number;
  projected_monthly_tokens: number;
  projected_monthly_cost: number;
  days_with_data: number;
}

export interface DailyUsageResponse {
  daily_usage: DailyUsage[];
  summary: DailyUsageSummary;
  error?: string;
}

// Fetch daily token usage for line chart
export async function getDailyTokenUsage(
  days: number = 30
): Promise<DailyUsageResponse | null> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/chatbot/admin/token-usage-daily?days=${days}`
    );
    if (!response.ok) {
      console.error("Failed to fetch daily token usage");
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching daily token usage:", error);
    return null;
  }
}

// Check if chatbot is enabled (public endpoint)
export async function getChatbotStatus(): Promise<{ enabled: boolean }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/chatbot/status`);
    if (!response.ok) {
      console.error("Failed to fetch chatbot status");
      return { enabled: true }; // Default to enabled
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching chatbot status:", error);
    return { enabled: true }; // Default to enabled
  }
}
