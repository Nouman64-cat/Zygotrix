export interface UserPreferences {
  [key: string]: unknown;
}

export interface ChatPreferences {
  communication_style: "simple" | "technical" | "conversational";
  answer_length: "brief" | "balanced" | "detailed";
  teaching_aids: string[];
  visual_aids: string[];
  preference_scores?: Record<string, number>;
  auto_learn: boolean;
  last_updated?: string | null;
  updated_by?: "system" | "manual" | null;
}

export interface UserPreferencesUpdate {
  communication_style?: "simple" | "technical" | "conversational";
  answer_length?: "brief" | "balanced" | "detailed";
  teaching_aids?: string[];
  visual_aids?: string[];
  auto_learn?: boolean;
}

export interface LoginHistoryEntry {
  timestamp: string;
  ip_address: string;
  location: string;
  browser: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string | null;
  profile_picture_url?: string | null;
  profile_picture_thumbnail_url?: string | null;
  phone?: string | null;
  organization?: string | null;
  department?: string | null;
  title?: string | null;
  bio?: string | null;
  location?: string | null;
  timezone?: string | null;
  research_interests?: string[] | null;
  experience_level?: string | null;
  use_case?: string | null;
  organism_focus?: string[] | null;
  onboarding_completed?: boolean | null;
  learning_goals?: string[] | null;
  learning_style?: string | null;
  topics_of_interest?: string[] | null;
  time_commitment?: string | null;
  institution?: string | null;
  role?: string | null;
  field_of_study?: string | null;
  university_onboarding_completed?: boolean | null;
  preferences?: UserPreferences | null;
  created_at: string;
  user_role?: string | null;
  is_active?: boolean | null;
  deactivated_at?: string | null;
  deactivated_by?: string | null;
  last_accessed_at?: string | null;
  last_ip_address?: string | null;
  last_location?: string | null;
  last_browser?: string | null;
  login_history?: LoginHistoryEntry[] | null;
  // Subscription status
  subscription_status?: "free" | "pro";
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: UserProfile;
}

export interface TokenUsage {
  tokens_used: number;
  tokens_remaining: number;
  reset_time?: string | null;
  is_limited: boolean;
  cooldown_active: boolean;
}

// Signup types
export interface SignupRequest {
  email: string;
  password: string;
  full_name?: string;
}

export interface SignupResponse {
  message: string;
  expires_at: string;
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
}

export interface VerifyOtpResponse {
  message: string;
}

export interface ResendOtpRequest {
  email: string;
}

export interface ResendOtpResponse {
  message: string;
  expires_at: string;
}
