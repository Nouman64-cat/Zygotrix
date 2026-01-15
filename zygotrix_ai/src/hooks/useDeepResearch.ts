/**
 * useDeepResearch Hook
 *
 * React hook for managing deep research state and operations.
 */

import { useState, useCallback, useRef } from "react";
import {
  executeDeepResearch,
  executeDeepResearchStream,
} from "../services/research";
import type {
  DeepResearchSession,
  DeepResearchRequest,
  ClarificationAnswer,
  ResearchSource,
  ResearchPhase,
  ResearchStatus,
  StreamingResearchChunk,
} from "../types/research.types";

// Initial session state
const initialSession: DeepResearchSession = {
  query: "",
  status: "pending",
  phase: "clarification",
  clarificationQuestions: [],
  userAnswers: [],
  sources: [],
  isLoading: false,
};

export interface UseDeepResearchOptions {
  streaming?: boolean;
  onPhaseChange?: (phase: ResearchPhase) => void;
  onSourceFound?: (source: ResearchSource) => void;
  onComplete?: (response: string, sources: ResearchSource[]) => void;
  onError?: (error: string) => void;
}

export interface UseDeepResearchReturn {
  session: DeepResearchSession;
  startResearch: (query: string, skipClarification?: boolean) => Promise<void>;
  submitClarificationAnswers: (answers: ClarificationAnswer[]) => Promise<void>;
  reset: () => void;
  isLoading: boolean;
  needsClarification: boolean;
  isComplete: boolean;
  hasError: boolean;
}

export function useDeepResearch(
  options: UseDeepResearchOptions = {}
): UseDeepResearchReturn {
  const {
    streaming = true,
    onPhaseChange,
    onSourceFound,
    onComplete,
    onError,
  } = options;

  const [session, setSession] = useState<DeepResearchSession>(initialSession);
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Start a new research session
   */
  const startResearch = useCallback(
    async (query: string, skipClarification: boolean = false) => {
      // Cancel any existing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      // Reset session with new query
      setSession({
        ...initialSession,
        query,
        isLoading: true,
        status: "pending",
      });

      try {
        const request: DeepResearchRequest = {
          query,
          skip_clarification: skipClarification,
        };

        if (streaming) {
          await processStreamingResearch(request);
        } else {
          await processNonStreamingResearch(request);
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Research failed";
        setSession((prev) => ({
          ...prev,
          isLoading: false,
          status: "failed",
          phase: "error",
          error: errorMessage,
        }));
        onError?.(errorMessage);
      }
    },
    [streaming, onError]
  );

  /**
   * Submit answers to clarification questions
   */
  const submitClarificationAnswers = useCallback(
    async (answers: ClarificationAnswer[]) => {
      setSession((prev) => ({
        ...prev,
        userAnswers: answers,
        isLoading: true,
        status: "in_progress",
      }));

      try {
        const request: DeepResearchRequest = {
          query: session.query,
          clarification_answers: answers,
        };

        if (streaming) {
          await processStreamingResearch(request);
        } else {
          await processNonStreamingResearch(request);
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Research failed";
        setSession((prev) => ({
          ...prev,
          isLoading: false,
          status: "failed",
          phase: "error",
          error: errorMessage,
        }));
        onError?.(errorMessage);
      }
    },
    [session.query, streaming, onError]
  );

  /**
   * Process non-streaming research
   */
  const processNonStreamingResearch = async (request: DeepResearchRequest) => {
    const response = await executeDeepResearch(request);

    setSession((prev) => ({
      ...prev,
      sessionId: response.session_id,
      status: response.status as ResearchStatus,
      phase: response.phase as ResearchPhase,
      clarificationQuestions: response.clarification_questions,
      response: response.response || undefined,
      sources: response.sources,
      isLoading: false,
      processingTimeMs: response.processing_time_ms,
      tokenUsage: response.token_usage,
      error: response.error_message || undefined,
    }));

    if (response.status === "completed" && response.response) {
      onComplete?.(response.response, response.sources);
    }
  };

  /**
   * Process streaming research
   */
  const processStreamingResearch = async (request: DeepResearchRequest) => {
    let content = "";
    const sources: ResearchSource[] = [];

    for await (const chunk of executeDeepResearchStream(request)) {
      processStreamingChunk(chunk, content, sources);

      if (chunk.type === "content" && chunk.content) {
        content += chunk.content;
      }

      if (chunk.type === "source" && chunk.source) {
        sources.push(chunk.source);
      }

      if (chunk.type === "done" || chunk.type === "error") {
        break;
      }
    }
  };

  /**
   * Process a single streaming chunk
   */
  const processStreamingChunk = (
    chunk: StreamingResearchChunk,
    currentContent: string,
    currentSources: ResearchSource[]
  ) => {
    switch (chunk.type) {
      case "phase_update":
        if (chunk.phase) {
          setSession((prev) => ({
            ...prev,
            phase: chunk.phase!,
          }));
          onPhaseChange?.(chunk.phase);
        }
        break;

      case "clarification":
        if (chunk.clarification) {
          setSession((prev) => ({
            ...prev,
            clarificationQuestions: [
              ...prev.clarificationQuestions,
              chunk.clarification!,
            ],
            status: "needs_clarification",
            isLoading: false,
          }));
        }
        break;

      case "source":
        if (chunk.source) {
          setSession((prev) => ({
            ...prev,
            sources: [...prev.sources, chunk.source!],
          }));
          onSourceFound?.(chunk.source);
        }
        break;

      case "content":
        if (chunk.content) {
          setSession((prev) => ({
            ...prev,
            response: (prev.response || "") + chunk.content,
          }));
        }
        break;

      case "done":
        setSession((prev) => ({
          ...prev,
          status: "completed",
          phase: "completed",
          isLoading: false,
          processingTimeMs: (chunk.metadata?.processing_time_ms as number) || 0,
          tokenUsage: chunk.metadata?.token_usage as Record<
            string,
            { input_tokens: number; output_tokens: number }
          >,
        }));

        if (currentContent && chunk.metadata?.status === "completed") {
          onComplete?.(currentContent, currentSources);
        }
        break;

      case "error":
        setSession((prev) => ({
          ...prev,
          status: "failed",
          phase: "error",
          isLoading: false,
          error: chunk.error || "Unknown error",
        }));
        onError?.(chunk.error || "Unknown error");
        break;
    }
  };

  /**
   * Reset the session
   */
  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setSession(initialSession);
  }, []);

  return {
    session,
    startResearch,
    submitClarificationAnswers,
    reset,
    isLoading: session.isLoading,
    needsClarification: session.status === "needs_clarification",
    isComplete: session.status === "completed",
    hasError: session.status === "failed",
  };
}

export default useDeepResearch;
