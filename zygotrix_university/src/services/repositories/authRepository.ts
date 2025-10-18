import apiClient from "../apiClient";
import { API_ROUTES } from "../apiConstants";
import type { AuthResponse, MessageResponse, SignupInitiateResponse, UserProfile } from "../../types/auth";

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
    const response = await apiClient.post(API_ROUTES.auth.signupResend, { email });
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
      created_at: string;
    };
    return {
      id: data.id,
      email: data.email,
      fullName: data.full_name ?? null,
      createdAt: data.created_at,
    };
  },
};
