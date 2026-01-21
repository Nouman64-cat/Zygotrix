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
const SESSION_STORAGE_KEY = "zygotrix_chat_session_id";

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
  userId?: string,
  userRole?: string
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
        userRole: userRole,
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
  prompt_cache_savings?: number;
  response_cache_savings?: number;
}

export interface DailyUsageSummary {
  total_tokens: number;
  total_cost: number;
  avg_daily_tokens: number;
  avg_daily_cost: number;
  projected_monthly_tokens: number;
  projected_monthly_cost: number;
  projected_monthly_savings?: number;
  total_prompt_cache_savings?: number;
  total_response_cache_savings?: number;
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

// Get current user's rate limit status (public endpoint)
export async function getUserRateLimit(
  userId?: string,
  userRole?: string
): Promise<UsageInfo | null> {
  try {
    const url = new URL(`${API_BASE_URL}/api/chatbot/rate-limit`);
    if (userId) {
      url.searchParams.append("userId", userId);
    }
    if (userRole) {
      url.searchParams.append("userRole", userRole);
    }

    const response = await fetch(url.toString());
    if (!response.ok) {
      console.error("Failed to fetch rate limit status");
      return null;
    }

    const data = await response.json();

    // Convert to UsageInfo format
    const usageInfo: UsageInfo = {
      tokens_used: data.tokens_used,
      tokens_remaining: data.tokens_remaining,
      reset_time: data.reset_time,
      is_limited: data.is_limited,
    };

    // Update the cached usage info
    _latestUsage = usageInfo;

    return usageInfo;
  } catch (error) {
    console.error("Error fetching rate limit status:", error);
    return null;
  }
}

// ==================== EMBEDDING USAGE ====================

export interface EmbeddingUsageUser {
  user_id: string;
  user_name: string;
  total_tokens: number;
  total_cost: number;
  request_count: number;
  avg_tokens_per_request: number;
  last_request: string | null;
}

export interface EmbeddingUsageStats {
  total_tokens: number;
  total_cost: number;
  total_requests: number;
  avg_tokens_per_request: number;
  user_count: number;
  users: EmbeddingUsageUser[];
  error?: string;
}

export interface EmbeddingDailyUsage {
  date: string;
  total_tokens: number;
  total_cost: number;
  request_count: number;
  unique_users: number;
  avg_tokens_per_request: number;
  models: Record<
    string,
    {
      tokens: number;
      cost: number;
      requests: number;
    }
  >;
}

export interface EmbeddingDailyUsageSummary {
  total_tokens: number;
  total_cost: number;
  total_requests: number;
  avg_daily_tokens: number;
  avg_daily_cost: number;
  projected_monthly_tokens: number;
  projected_monthly_cost: number;
  days_with_data: number;
}

export interface EmbeddingDailyUsageResponse {
  daily_usage: EmbeddingDailyUsage[];
  summary: EmbeddingDailyUsageSummary;
  error?: string;
}

// Fetch embedding usage stats for admin dashboard
export async function getEmbeddingUsageStats(): Promise<EmbeddingUsageStats | null> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/chatbot/admin/embedding-usage`
    );
    if (!response.ok) {
      console.error("Failed to fetch embedding usage stats");
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching embedding usage stats:", error);
    return null;
  }
}

// Fetch daily embedding usage for line chart
export async function getDailyEmbeddingUsage(
  days: number = 30
): Promise<EmbeddingDailyUsageResponse | null> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/chatbot/admin/embedding-usage-daily?days=${days}`
    );
    if (!response.ok) {
      console.error("Failed to fetch daily embedding usage");
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching daily embedding usage:", error);
    return null;
  }
}

// ==================== DEEP RESEARCH ANALYTICS ====================

export interface DeepResearchUser {
  user_id: string;
  user_name: string;
  total_queries: number;
  openai_tokens: number;
  claude_tokens: number;
  cohere_searches: number;
  total_cost: number;
  last_query: string | null;
}

export interface DeepResearchStats {
  total_queries: number;
  completed_queries: number;
  failed_queries: number;
  success_rate: string;
  total_openai_input_tokens: number;
  total_openai_output_tokens: number;
  total_claude_input_tokens: number;
  total_claude_output_tokens: number;
  total_cohere_searches: number;
  total_sources_retrieved: number;
  total_openai_cost: number;
  total_claude_cost: number;
  total_cohere_cost: number;
  total_cost: number;
  avg_processing_time_ms: number;
  user_count: number;
  users: DeepResearchUser[];
  error?: string;
}

export interface DeepResearchDailyUsage {
  date: string;
  queries: number;
  completed: number;
  openai_tokens: number;
  claude_tokens: number;
  cohere_searches: number;
  openai_cost: number;
  claude_cost: number;
  cohere_cost: number;
  total_cost: number;
  avg_time_ms: number;
}

export interface DeepResearchDailyResponse {
  period_days: number;
  total_queries: number;
  total_cost: number;
  avg_daily_cost: number;
  projected_monthly_cost: number;
  daily_usage: DeepResearchDailyUsage[];
  error?: string;
}

// Fetch deep research analytics stats for admin dashboard
export async function getDeepResearchStats(): Promise<DeepResearchStats | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/deep-research/analytics`);
    if (!response.ok) {
      console.error("Failed to fetch deep research stats");
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching deep research stats:", error);
    return null;
  }
}

// Fetch daily deep research analytics for line chart
export async function getDailyDeepResearchUsage(
  days: number = 30
): Promise<DeepResearchDailyResponse | null> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/deep-research/analytics/daily?days=${days}`
    );
    if (!response.ok) {
      console.error("Failed to fetch daily deep research usage");
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching daily deep research usage:", error);
    return null;
  }
}

// ==================== WEB SEARCH ANALYTICS ====================

export interface WebSearchUser {
  user_id: string;
  user_name: string;
  total_searches: number;
  input_tokens: number;
  output_tokens: number;
  search_cost: number;
  token_cost: number;
  total_cost: number;
  request_count: number;
  last_search: string | null;
}

export interface WebSearchStats {
  total_searches: number;
  total_input_tokens: number;
  total_output_tokens: number;
  total_search_cost: number;
  total_token_cost: number;
  total_cost: number;
  total_requests: number;
  user_count: number;
  avg_searches_per_request: number;
  avg_cost_per_search: number;
  cost_breakdown: {
    search_api_cost: number;
    claude_token_cost: number;
    total: number;
  };
  users: WebSearchUser[];
  error?: string;
}

export interface WebSearchDailyUsage {
  date: string;
  searches: number;
  input_tokens: number;
  output_tokens: number;
  search_cost: number;
  token_cost: number;
  total_cost: number;
  requests: number;
  unique_users: number;
}

export interface WebSearchDailyResponse {
  period_days: number;
  total_searches: number;
  total_cost: number;
  avg_daily_cost: number;
  projected_monthly_cost: number;
  days_with_data: number;
  daily_usage: WebSearchDailyUsage[];
  error?: string;
}

// Fetch web search analytics stats for admin dashboard
export async function getWebSearchStats(): Promise<WebSearchStats | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/web-search/analytics`);
    if (!response.ok) {
      console.error("Failed to fetch web search stats");
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching web search stats:", error);
    return null;
  }
}

// Fetch daily web search analytics for line chart
export async function getDailyWebSearchUsage(
  days: number = 30
): Promise<WebSearchDailyResponse | null> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/web-search/analytics/daily?days=${days}`
    );
    if (!response.ok) {
      console.error("Failed to fetch daily web search usage");
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching daily web search usage:", error);
    return null;
  }
}

// ==================== SCHOLAR MODE ANALYTICS ====================

export interface ScholarModeUser {
  user_id: string;
  user_name: string;
  total_queries: number;
  input_tokens: number;
  output_tokens: number;
  deep_research_sources: number;
  web_search_sources: number;
  total_cost: number;
  last_query: string | null;
}

export interface ScholarModeStats {
  total_queries: number;
  total_input_tokens: number;
  total_output_tokens: number;
  total_deep_research_sources: number;
  total_web_search_sources: number;
  total_token_cost: number;
  total_source_cost: number;
  total_cost: number;
  avg_tokens_per_query: number;
  avg_cost_per_query: number;
  user_count: number;
  users: ScholarModeUser[];
  error?: string;
}

export interface ScholarModeDailyUsage {
  date: string;
  queries: number;
  input_tokens: number;
  output_tokens: number;
  deep_research_sources: number;
  web_search_sources: number;
  token_cost: number;
  source_cost: number;
  total_cost: number;
  unique_users: number;
}

export interface ScholarModeDailyResponse {
  period_days: number;
  total_queries: number;
  total_cost: number;
  avg_daily_cost: number;
  projected_monthly_cost: number;
  days_with_data: number;
  daily_usage: ScholarModeDailyUsage[];
  error?: string;
}

// Fetch Scholar Mode analytics stats for admin dashboard
export async function getScholarModeStats(): Promise<ScholarModeStats | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/scholar/analytics`);
    if (!response.ok) {
      console.error("Failed to fetch scholar mode stats");
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching scholar mode stats:", error);
    return null;
  }
}

// Fetch daily Scholar Mode analytics for line chart
export async function getDailyScholarModeUsage(
  days: number = 30
): Promise<ScholarModeDailyResponse | null> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/scholar/analytics/daily?days=${days}`
    );
    if (!response.ok) {
      console.error("Failed to fetch daily scholar mode usage");
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching daily scholar mode usage:", error);
    return null;
  }
}
