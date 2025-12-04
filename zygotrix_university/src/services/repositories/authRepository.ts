import apiClient from "../apiClient";
import { API_ROUTES } from "../apiConstants";
import type {
  AuthResponse,
  MessageResponse,
  SignupInitiateResponse,
  UserProfile,
} from "../../types/auth";

interface SignupRequest {
  email: string;
  password: string;
  fullName?: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

export const authRepository = {
  async signup(payload: SignupRequest): Promise<SignupInitiateResponse> {
    const response = await apiClient.post(API_ROUTES.auth.signup, {
      email: payload.email,
      password: payload.password,
      full_name: payload.fullName,
    });
    const data = response.data as { message: string; expires_at: string };
    return {
      message: data.message,
      expiresAt: data.expires_at,
    };
  },

  async verifySignup(email: string, otp: string): Promise<MessageResponse> {
    const response = await apiClient.post(API_ROUTES.auth.signupVerify, {
      email,
      otp,
    });
    return response.data;
  },

  async resendSignup(email: string): Promise<SignupInitiateResponse> {
    const response = await apiClient.post(API_ROUTES.auth.signupResend, {
      email,
    });
    const data = response.data as { message: string; expires_at: string };
    return {
      message: data.message,
      expiresAt: data.expires_at,
    };
  },

  async login(payload: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post(API_ROUTES.auth.login, payload);
    const data = response.data as {
      access_token: string;
      token_type: string;
      user: {
        id: string;
        email: string;
        full_name?: string | null;
        learning_goals?: string[] | null;
        experience_level?: string | null;
        learning_style?: string | null;
        topics_of_interest?: string[] | null;
        time_commitment?: string | null;
        institution?: string | null;
        role?: string | null;
        field_of_study?: string | null;
        university_onboarding_completed?: boolean;
        created_at: string;
      };
    };

    return {
      accessToken: data.access_token,
      tokenType: data.token_type,
      user: {
        id: data.user.id,
        email: data.user.email,
        fullName: data.user.full_name ?? null,
        learningGoals: data.user.learning_goals ?? null,
        experienceLevel: data.user.experience_level ?? null,
        learningStyle: data.user.learning_style ?? null,
        topicsOfInterest: data.user.topics_of_interest ?? null,
        timeCommitment: data.user.time_commitment ?? null,
        institution: data.user.institution ?? null,
        role: data.user.role ?? null,
        fieldOfStudy: data.user.field_of_study ?? null,
        universityOnboardingCompleted:
          data.user.university_onboarding_completed ?? false,
        createdAt: data.user.created_at,
      },
    };
  },

  async currentUser(): Promise<UserProfile> {
    const response = await apiClient.get(API_ROUTES.auth.me);
    const data = response.data as {
      id: string;
      email: string;
      full_name?: string | null;
      learning_goals?: string[] | null;
      experience_level?: string | null;
      learning_style?: string | null;
      topics_of_interest?: string[] | null;
      time_commitment?: string | null;
      institution?: string | null;
      role?: string | null;
      field_of_study?: string | null;
      university_onboarding_completed?: boolean;
      created_at: string;
    };
    return {
      id: data.id,
      email: data.email,
      fullName: data.full_name ?? null,
      learningGoals: data.learning_goals ?? null,
      experienceLevel: data.experience_level ?? null,
      learningStyle: data.learning_style ?? null,
      topicsOfInterest: data.topics_of_interest ?? null,
      timeCommitment: data.time_commitment ?? null,
      institution: data.institution ?? null,
      role: data.role ?? null,
      fieldOfStudy: data.field_of_study ?? null,
      universityOnboardingCompleted:
        data.university_onboarding_completed ?? false,
      createdAt: data.created_at,
    };
  },
};
