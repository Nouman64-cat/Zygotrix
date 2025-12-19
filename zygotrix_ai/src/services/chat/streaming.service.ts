import { API_BASE_URL, API_ENDPOINTS } from "../api/constants/api.constants";
import authService from "../auth/auth.service";
import type { ChatRequest, MessageMetadata } from "../../types";

/**
 * SSE Stream chunk types from backend
 */
export interface StreamChunk {
  type: "content" | "metadata" | "error" | "done";
  content?: string;
  metadata?: MessageMetadata;
  error?: string;
  conversation_id?: string;
  message_id?: string;
}

/**
 * Parse a line of SSE data
 */
function parseSSELine(line: string): StreamChunk | null {
  // SSE format: "data: {json}"
  if (line.startsWith("data: ")) {
    const data = line.slice(6).trim();

    // Skip empty data or done signal
    if (!data || data === "[DONE]") {
      return null;
    }

    try {
      return JSON.parse(data) as StreamChunk;
    } catch (error) {
      console.error("Failed to parse SSE chunk:", error, "Data:", data);
      return null;
    }
  }
  return null;
}

/**
 * Try to parse raw text as a direct JSON response (fallback for non-SSE)
 */
function tryParseDirectJSON(text: string): StreamChunk | null {
  try {
    const parsed = JSON.parse(text);
    // Check if it looks like a chat response
    if (parsed.message && parsed.message.content) {
      return {
        type: "content",
        content: parsed.message.content,
        conversation_id: parsed.conversation_id,
        message_id: parsed.message.id,
      };
    }
    // Check if it already has the StreamChunk format
    if (parsed.type) {
      return parsed as StreamChunk;
    }
    // Check if it's just content
    if (parsed.content) {
      return {
        type: "content",
        content: parsed.content,
      };
    }
  } catch {
    // Not valid JSON
  }
  return null;
}

/**
 * Streams chat response using Server-Sent Events (SSE)
 * @param request Chat request with stream: true
 * @returns AsyncGenerator yielding StreamChunk objects
 */
export async function* streamChatResponse(
  request: ChatRequest
): AsyncGenerator<StreamChunk, void, unknown> {
  const token = authService.getStoredToken();

  if (!token) {
    throw new Error("Authentication token not found");
  }

  const url = `${API_BASE_URL}${API_ENDPOINTS.ZYGOTRIX_AI.CHAT}`;

  console.log("[Streaming] Starting request to:", url);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      ...request,
      stream: true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `HTTP ${response.status}: ${response.statusText} - ${errorText}`
    );
  }

  const contentType = response.headers.get("content-type") || "";
  console.log("[Streaming] Response content-type:", contentType);

  // If the response is not SSE, handle it as a regular JSON response
  if (!contentType.includes("text/event-stream") && !contentType.includes("text/plain")) {
    console.log("[Streaming] Non-SSE response detected, parsing as JSON");
    const text = await response.text();
    console.log("[Streaming] Response text:", text.substring(0, 200));

    const chunk = tryParseDirectJSON(text);
    if (chunk) {
      yield chunk;
      yield { type: "done", conversation_id: chunk.conversation_id, message_id: chunk.message_id };
    } else {
      throw new Error("Failed to parse non-streaming response");
    }
    return;
  }

  if (!response.body) {
    throw new Error("Response body is null");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let processedChunks = 0;
  let allRawData = ""; // Collect all raw data for fallback parsing

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        console.log("[Streaming] Stream ended. Processed chunks:", processedChunks);

        // Process any remaining data in the buffer when stream ends
        if (buffer.trim()) {
          console.log("[Streaming] Processing remaining buffer:", buffer.substring(0, 100));
          const remainingLines = buffer.split("\n");
          for (const line of remainingLines) {
            const chunk = parseSSELine(line);
            if (chunk) {
              processedChunks++;
              yield chunk;
            }
          }
        }

        // If no chunks were processed, try to parse all data as direct JSON
        if (processedChunks === 0 && allRawData.trim()) {
          console.log("[Streaming] No SSE chunks found, trying direct JSON parse");
          const chunk = tryParseDirectJSON(allRawData);
          if (chunk) {
            yield chunk;
            yield { type: "done", conversation_id: chunk.conversation_id, message_id: chunk.message_id };
          }
        }

        break;
      }

      // Decode the chunk and add to buffer
      const decoded = decoder.decode(value, { stream: true });
      buffer += decoded;
      allRawData += decoded;

      // Split by newlines to process complete SSE events
      const lines = buffer.split("\n");

      // Keep the last incomplete line in the buffer
      buffer = lines.pop() || "";

      for (const line of lines) {
        // Check for [DONE] signal
        if (line.trim() === "data: [DONE]") {
          console.log("[Streaming] Received [DONE] signal");
          return;
        }

        const chunk = parseSSELine(line);
        if (chunk) {
          processedChunks++;
          yield chunk;
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Check if streaming is supported by the browser
 */
export function isStreamingSupported(): boolean {
  return typeof ReadableStream !== "undefined" && typeof fetch !== "undefined";
}
