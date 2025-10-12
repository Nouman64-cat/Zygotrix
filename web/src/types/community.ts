export interface AuthorInfo {
  id: string;
  email: string;
  full_name?: string;
  profile_picture_url?: string | null;
  profile_picture_thumbnail_url?: string | null;
}

export interface Question {
  id: string;
  title: string;
  content: string;
  tags: string[];
  author: AuthorInfo;
  upvotes: number;
  downvotes: number;
  view_count: number;
  answer_count: number;
  comment_count: number;
  image_url?: string | null;
  image_thumbnail_url?: string | null;
  created_at: string;
  updated_at?: string;
  user_vote?: number | null; // -1, 0, 1 or null
}

export interface Answer {
  id: string;
  question_id: string;
  content: string;
  author: AuthorInfo;
  upvotes: number;
  downvotes: number;
  is_accepted: boolean;
  created_at: string;
  updated_at?: string;
  user_vote?: number | null; // -1, 0, 1 or null
}

export interface Comment {
  id: string;
  question_id: string;
  content: string;
  author: AuthorInfo;
  upvotes: number;
  downvotes: number;
  created_at: string;
  updated_at?: string;
  user_vote?: number | null; // -1, 0, 1 or null
  parent_id?: string | null; // Parent comment ID for replies
  replies?: Comment[]; // Nested replies
}

export interface QuestionDetail extends Question {
  answers: Answer[];
  comments: Comment[];
}

export interface QuestionListResponse {
  questions: Question[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface QuestionCreateRequest {
  title: string;
  content: string;
  tags: string[];
  image_url?: string | null;
  image_thumbnail_url?: string | null;
}

export interface QuestionUpdateRequest {
  title?: string;
  content?: string;
  tags?: string[];
  image_url?: string | null;
  image_thumbnail_url?: string | null;
}

export interface AnswerCreateRequest {
  content: string;
}

export interface AnswerUpdateRequest {
  content: string;
}

export interface VoteRequest {
  vote_type: number; // -1, 0, or 1
}

export interface PopularTag {
  tag: string;
  count: number;
}

export type SortOption =
  | "newest"
  | "oldest"
  | "most_voted"
  | "most_viewed"
  | "most_answered";
