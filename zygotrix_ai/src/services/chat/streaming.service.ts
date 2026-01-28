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
      const raw = JSON.parse(data);

      // Adapt Backend Event Types to Frontend Types
      if (raw.type === "token") {
        return {
          type: "content",
          content: raw.content
        };
      }

      if (raw.type === "usage") {
        return {
          type: "metadata",
          metadata: raw.usage // Map usage object to metadata
        };
      }

      if (raw.type === "error") {
        return {
          type: "error",
          error: raw.message || "Unknown error"
        };
      }

      // Pass through other types if they match
      return raw as StreamChunk;
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



  /**
   * Try to parse raw text as a complete ChatResponse and convert to chunks
   */
  function parseChatResponseToChunks(text: string): StreamChunk[] | null {
    try {
      const parsed = JSON.parse(text);
      // Check if it looks like a standard ChatRequest response
      if (parsed.message) {
        const chunks: StreamChunk[] = [];

        // 1. Content Chunk
        chunks.push({
          type: "content",
          content: parsed.message.content || "",
          conversation_id: parsed.conversation_id,
          message_id: parsed.message.id,
        });

        // 2. Metadata Chunk (Critical for widgets)
        if (parsed.message.metadata) {
          chunks.push({
            type: "metadata",
            metadata: parsed.message.metadata,
          });
        }

        return chunks;
      }
    } catch {
      // Not valid JSON or not expected format
    }
    return null;
  }

  // ... (keep streamChatResponse signature) ...

  // If the response is not SSE, handle it as a regular JSON response
  if (!contentType.includes("text/event-stream") && !contentType.includes("text/plain")) {
    const text = await response.text();

    const chunks = parseChatResponseToChunks(text);
    if (chunks) {
      for (const chunk of chunks) {
        yield chunk;
      }
      // Yield done using info from first chunk
      yield {
        type: "done",
        conversation_id: chunks[0].conversation_id,
        message_id: chunks[0].message_id
      };
    } else {
      const chunk = tryParseDirectJSON(text);
      if (chunk) {
        yield chunk;
        yield { type: "done", conversation_id: chunk.conversation_id, message_id: chunk.message_id };
      } else {
        throw new Error("Failed to parse non-streaming response");
      }
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
        // Process any remaining data in the buffer when stream ends
        if (buffer.trim()) {
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
