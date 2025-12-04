export interface UserProfile {
  id: string;
  email: string;
  fullName?: string | null;
  // University onboarding fields
  learningGoals?: string[] | null;
  experienceLevel?: string | null;
  learningStyle?: string | null;
  topicsOfInterest?: string[] | null;
  timeCommitment?: string | null;
  institution?: string | null;
  role?: string | null;
  fieldOfStudy?: string | null;
  universityOnboardingCompleted?: boolean;
  createdAt: string;
}

export interface UniversityOnboardingPayload {
  learning_goals?: string[];
  experience_level?: string;
  learning_style?: string;
  topics_of_interest?: string[];
  time_commitment?: string;
  institution?: string;
  role?: string;
  field_of_study?: string;
  university_onboarding_completed: boolean;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  user: UserProfile;
}

export interface SignupInitiateResponse {
  message: string;
  expiresAt: string;
}

export interface MessageResponse {
  message: string;
}
