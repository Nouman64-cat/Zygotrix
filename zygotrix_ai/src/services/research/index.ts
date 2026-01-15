/**
 * Deep Research API Service
 *
 * Provides methods to interact with the deep research backend API.
 */

import authService from "../auth/auth.service";
import type {
  DeepResearchRequest,
  DeepResearchResponse,
  StreamingResearchChunk,
  DeepResearchServiceStatus,
  DeepResearchCapabilities,
} from "../../types/research.types";

// API base URL
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

/**
 * Get authorization headers
 */
const getHeaders = (): Record<string, string> => {
  const token = authService.getStoredToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
};

/**
 * Execute deep research
 */
export async function executeDeepResearch(
  request: DeepResearchRequest
): Promise<DeepResearchResponse> {
  const response = await fetch(`${API_BASE}/deep-research`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `Research failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Execute deep research with streaming updates
 *
 * Returns an async generator that yields StreamingResearchChunk objects
 */
export async function* executeDeepResearchStream(
  request: DeepResearchRequest
): AsyncGenerator<StreamingResearchChunk, void, unknown> {
  const response = await fetch(`${API_BASE}/deep-research/stream`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      error.detail || `Research stream failed: ${response.status}`
    );
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("No response body");
  }

  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });

      // Process complete SSE messages
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6).trim();
          if (data) {
            try {
              const chunk: StreamingResearchChunk = JSON.parse(data);
              yield chunk;

              // Stop if we get a done or error event
              if (chunk.type === "done" || chunk.type === "error") {
                return;
              }
            } catch (e) {
              console.error("Failed to parse SSE chunk:", e);
            }
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Check deep research service status
 */
export async function checkDeepResearchStatus(): Promise<DeepResearchServiceStatus> {
  const response = await fetch(`${API_BASE}/deep-research/status`, {
    method: "GET",
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Status check failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Get deep research capabilities
 */
export async function getDeepResearchCapabilities(): Promise<DeepResearchCapabilities> {
  const response = await fetch(`${API_BASE}/deep-research/capabilities`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Capabilities fetch failed: ${response.status}`);
  }

  return response.json();
}
