import type {
  Question,
  QuestionDetail,
  QuestionListResponse,
  QuestionCreateRequest,
  QuestionUpdateRequest,
  Answer,
  AnswerCreateRequest,
  AnswerUpdateRequest,
  VoteRequest,
  PopularTag,
  SortOption,
} from "../types/community";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

interface MessageResponse {
  message: string;
}

// Helper function to get auth headers
function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("zygotrix_auth_token");
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
}

// Question API functions

export async function listQuestions(
  page: number = 1,
  pageSize: number = 20,
  sortBy: SortOption = "newest",
  tag?: string,
  search?: string
): Promise<QuestionListResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString(),
    sort_by: sortBy,
  });

  if (tag) params.append("tag", tag);
  if (search) params.append("search", search);

  const response = await fetch(
    `${API_BASE_URL}/api/community/questions?${params}`,
    {
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch questions: ${response.statusText}`);
  }

  return response.json();
}

export async function getQuestion(questionId: string): Promise<QuestionDetail> {
  const response = await fetch(
    `${API_BASE_URL}/api/community/questions/${questionId}`,
    {
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch question: ${response.statusText}`);
  }

  return response.json();
}

export async function createQuestion(
  data: QuestionCreateRequest
): Promise<Question> {
  console.log("Creating question with data:", JSON.stringify(data, null, 2));

  const response = await fetch(`${API_BASE_URL}/api/community/questions`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ detail: response.statusText }));
    console.error("Create question failed:", error);
    console.error("Status:", response.status, response.statusText);

    // Format validation errors nicely
    if (error.detail && Array.isArray(error.detail)) {
      const messages = error.detail.map((err: any) => err.msg).join(", ");
      throw new Error(messages);
    }

    throw new Error(error.detail || "Failed to create question");
  }

  return response.json();
}

export async function updateQuestion(
  questionId: string,
  data: QuestionUpdateRequest
): Promise<Question> {
  const response = await fetch(
    `${API_BASE_URL}/api/community/questions/${questionId}`,
    {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || "Failed to update question");
  }

  return response.json();
}

export async function deleteQuestion(questionId: string): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/api/community/questions/${questionId}`,
    {
      method: "DELETE",
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || "Failed to delete question");
  }
}

export async function voteQuestion(
  questionId: string,
  voteType: number
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/api/community/questions/${questionId}/vote`,
    {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ vote_type: voteType } as VoteRequest),
    }
  );

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || "Failed to vote on question");
  }
}

// Answer API functions

export async function createAnswer(
  questionId: string,
  data: AnswerCreateRequest
): Promise<Answer> {
  const response = await fetch(
    `${API_BASE_URL}/api/community/questions/${questionId}/answers`,
    {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || "Failed to create answer");
  }

  return response.json();
}

export async function updateAnswer(
  answerId: string,
  data: AnswerUpdateRequest
): Promise<MessageResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/community/answers/${answerId}`,
    {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || "Failed to update answer");
  }

  return response.json();
}

export async function deleteAnswer(answerId: string): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/api/community/answers/${answerId}`,
    {
      method: "DELETE",
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || "Failed to delete answer");
  }
}

export async function acceptAnswer(
  questionId: string,
  answerId: string
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/api/community/questions/${questionId}/answers/${answerId}/accept`,
    {
      method: "POST",
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || "Failed to accept answer");
  }
}

export async function voteAnswer(
  answerId: string,
  voteType: number
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/api/community/answers/${answerId}/vote`,
    {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ vote_type: voteType } as VoteRequest),
    }
  );

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || "Failed to vote on answer");
  }
}

// Tag API function

export async function getPopularTags(
  limit: number = 20
): Promise<PopularTag[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/community/tags?limit=${limit}`,
    {
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch tags: ${response.statusText}`);
  }

  return response.json();
}
