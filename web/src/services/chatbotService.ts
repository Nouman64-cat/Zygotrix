// Chatbot service - calls backend API to avoid CORS issues

// Backend API URL - defaults to localhost for development
const API_BASE_URL = import.meta.env.VITE_ZYGOTRIX_API;

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface PageContext {
  pageName: string;
  description: string;
  features: string[];
}

// Main chatbot function - calls backend API
export async function sendMessage(
  message: string, 
  pageContext?: PageContext, 
  userName?: string,
  userId?: string
): Promise<string> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/chatbot/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: message,
        pageContext: pageContext,
        userName: userName,
        userId: userId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Chatbot API error:', errorData);
      return "I'm having trouble connecting right now. Please try again in a moment!";
    }

    const data = await response.json();

    if (data.response) {
      return data.response;
    }

    return "I'm sorry, I couldn't generate a response. Please try again!";
  } catch (error) {
    console.error('Chatbot error:', error);
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
    const response = await fetch(`${API_BASE_URL}/api/chatbot/admin/token-usage`);
    if (!response.ok) {
      console.error('Failed to fetch token usage stats');
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching token usage stats:', error);
    return null;
  }
}
