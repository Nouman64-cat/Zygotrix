/**
 * Claude AI API Integration for Assessment Explanations
 */

const CLAUDE_API_KEY = import.meta.env.VITE_CLAUDE_API_KEY;
const CLAUDE_MODEL =
  import.meta.env.VITE_CLAUDE_MODEL || "claude-3-haiku-20240307";
const CLAUDE_MAX_TOKENS = parseInt(
  import.meta.env.VITE_CLAUDE_MAX_TOKENS || "200"
);
const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";

interface ClaudeMessage {
  role: "user" | "assistant";
  content: string;
}

interface ClaudeRequest {
  model: string;
  max_tokens: number;
  messages: ClaudeMessage[];
}

interface ClaudeResponse {
  id: string;
  type: string;
  role: string;
  content: Array<{
    type: string;
    text: string;
  }>;
  model: string;
  stop_reason: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

/**
 * Get AI-generated explanation for why an answer is correct
 */
export const getAnswerExplanation = async (
  question: string,
  correctAnswer: string,
  userExplanation?: string
): Promise<string> => {
  if (!CLAUDE_API_KEY) {
    console.warn("Claude API key not configured");
    return userExplanation || "No explanation available.";
  }

  try {
    const prompt = userExplanation
      ? `Question: ${question}\n\nCorrect Answer: ${correctAnswer}\n\nProvided Explanation: ${userExplanation}\n\nPlease provide a clear, concise explanation of why this answer is correct in 2-3 sentences.`
      : `Question: ${question}\n\nCorrect Answer: ${correctAnswer}\n\nPlease provide a clear, concise explanation of why this answer is correct in 2-3 sentences.`;

    const requestBody: ClaudeRequest = {
      model: CLAUDE_MODEL,
      max_tokens: CLAUDE_MAX_TOKENS,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    };

    const response = await fetch(CLAUDE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": CLAUDE_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(
        `Claude API error: ${response.status} ${response.statusText}`
      );
    }

    const data: ClaudeResponse = await response.json();

    if (data.content && data.content.length > 0) {
      return data.content[0].text;
    }

    return userExplanation || "No explanation available.";
  } catch (error) {
    console.error("Failed to get AI explanation:", error);
    return userExplanation || "No explanation available.";
  }
};

/**
 * Get AI-generated explanation for multiple answers at once (batch)
 */
export const getBatchAnswerExplanations = async (
  questions: Array<{
    question: string;
    correctAnswer: string;
    explanation?: string;
  }>
): Promise<string[]> => {
  const promises = questions.map((q) =>
    getAnswerExplanation(q.question, q.correctAnswer, q.explanation)
  );

  try {
    return await Promise.all(promises);
  } catch (error) {
    console.error("Failed to get batch explanations:", error);
    return questions.map((q) => q.explanation || "No explanation available.");
  }
};
