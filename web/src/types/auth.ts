export type UserPreferences = {
  theme?: "light" | "dark" | "auto";
  language?: string;
  dateFormat?: string;
  timeFormat?: string;
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  analysisComplete?: boolean;
  projectUpdates?: boolean;
  systemAlerts?: boolean;
  weeklyDigest?: boolean;
  profileVisibility?: string;
  dataSharing?: boolean;
  analyticsTracking?: boolean;
  autoSave?: boolean;
  compressionLevel?: string;
  maxFileSize?: string;
  defaultDataFormat?: string;
  allowInvitations?: boolean;
  showOnlineStatus?: boolean;
  shareByDefault?: boolean;
};

export type UserProfile = {
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
  preferences?: UserPreferences | null;
  created_at: string;
  // Admin-related fields
  user_role?: string | null;
  is_active?: boolean | null;
  deactivated_at?: string | null;
  deactivated_by?: string | null;
  // Activity tracking fields
  last_accessed_at?: string | null;
  last_ip_address?: string | null;
  last_location?: string | null;
  last_browser?: string | null;
};

export type UpdateProfilePayload = {
  full_name?: string;
  profile_picture_url?: string;
  profile_picture_thumbnail_url?: string;
  phone?: string;
  organization?: string;
  department?: string;
  title?: string;
  bio?: string;
  location?: string;
  timezone?: string;
  preferences?: UserPreferences;
};

export type AuthResponse = {
  access_token: string;
  token_type: string;
  user: UserProfile;
};

export type SignUpPayload = {
  email: string;
  password: string;
  full_name?: string;
};

export type SignInPayload = {
  email: string;
  password: string;
};

export type SignupInitiateResponse = {
  message: string;
  expires_at: string;
};

export type SignupVerifyPayload = {
  email: string;
  otp: string;
};

export type SignupResendPayload = {
  email: string;
};

export type PasswordResetRequestPayload = {
  email: string;
};

export type PasswordResetVerifyPayload = {
  email: string;
  otp: string;
  new_password: string;
};

export type PasswordResetResendPayload = {
  email: string;
};

export type MessageResponse = {
  message: string;
};

export type PortalStatusResponse = {
  message: string;
  accessed_at: string;
};

export type OnboardingPayload = {
  research_interests?: string[];
  experience_level?: string;
  use_case?: string;
  organism_focus?: string[];
  organization?: string;
  title?: string;
  department?: string;
  onboarding_completed: boolean;
};

// Admin types
export type UserRole = "user" | "admin" | "super_admin";

export type LoginHistoryEntry = {
  timestamp: string;
  ip_address: string;
  location: string;
  browser: string;
};

export type AdminUserListItem = {
  id: string;
  email: string;
  full_name?: string | null;
  user_role: string;
  is_active: boolean;
  created_at: string;
  organization?: string | null;
  onboarding_completed?: boolean;
  university_onboarding_completed?: boolean;
  deactivated_at?: string | null;
  // Activity tracking fields
  last_accessed_at?: string | null;
  last_ip_address?: string | null;
  last_location?: string | null;
  last_browser?: string | null;
  login_history?: LoginHistoryEntry[] | null;
};

export type AdminUserListResponse = {
  users: AdminUserListItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
};

export type AdminUserActionResponse = {
  message: string;
  user: UserProfile;
};

export type AdminUserStats = {
  total_users: number;
  active_users: number;
  inactive_users: number;
  by_role: {
    super_admin: number;
    admin: number;
    user: number;
  };
  onboarding: {
    web_completed: number;
    university_completed: number;
  };
};

// Chatbot settings types
export type ChatbotSettings = {
  id?: string;
  token_limit_per_session: number;
  max_tokens: number;
  temperature: number;
  reset_limit_hours: number;
  model: string;
  enabled: boolean;
  response_caching: boolean;
  admin_unlimited_tokens: boolean;
  new_user_registration_email_enabled: boolean;
  created_at?: string;
  updated_at?: string;
  updated_by?: string;
};

export type ChatbotSettingsResponse = {
  message: string;
  settings: ChatbotSettings;
};

export type SettingChange = {
  field_name: string;
  old_value?: string | number | boolean | null;
  new_value?: string | number | boolean | null;
};

export type ChatbotSettingsHistory = {
  id?: string;
  timestamp: string;
  updated_by: string;
  updated_by_name?: string;
  updated_by_email?: string;
  changes: SettingChange[];
  ip_address?: string;
  user_agent?: string;
};

export type ChatbotSettingsHistoryResponse = {
  history: ChatbotSettingsHistory[];
  total_count: number;
};

// Prompt template types
export type PromptType = "system" | "system_verbose" | "simulation";

export type PromptTemplate = {
  id: string;
  prompt_type: PromptType;
  prompt_content: string;
  description?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  updated_by?: string | null;
};

export type PromptTemplateUpdate = {
  prompt_content: string;
  description?: string | null;
  is_active?: boolean;
};

// Prompt history types
export type PromptChange = {
  field_name: string;
  old_value?: string | null;
  new_value?: string | null;
};

export type PromptHistory = {
  id?: string;
  timestamp: string;
  prompt_type: PromptType;
  action: "update" | "reset";
  updated_by: string;
  updated_by_name?: string;
  updated_by_email?: string;
  changes: PromptChange[];
  ip_address?: string;
  user_agent?: string;
};

export type PromptHistoryResponse = {
  history: PromptHistory[];
  total_count: number;
};

// AI Behavior Preferences types
export type ChatPreferences = {
  communication_style: "simple" | "technical" | "conversational";
  answer_length: "brief" | "balanced" | "detailed";
  teaching_aids: string[]; // ["examples", "real_world", "analogies", "step_by_step"]
  visual_aids: string[]; // ["diagrams", "lists", "tables"]
  preference_scores?: Record<string, number>; // Internal scores (0-100)
  auto_learn: boolean; // Enable automatic preference learning
  last_updated?: string | null;
  updated_by?: "system" | "manual" | null;
};

export type UserPreferencesUpdate = {
  communication_style?: "simple" | "technical" | "conversational";
  answer_length?: "brief" | "balanced" | "detailed";
  teaching_aids?: string[];
  visual_aids?: string[];
  auto_learn?: boolean;
};
