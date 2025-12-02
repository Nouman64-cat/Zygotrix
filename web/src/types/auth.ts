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
  created_at: string;
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
