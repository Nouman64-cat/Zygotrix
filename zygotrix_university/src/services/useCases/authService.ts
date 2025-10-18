import { authRepository } from "../repositories/authRepository";
import type { MessageResponse, SignupInitiateResponse, UserProfile } from "../../types/auth";
import { clearAuthToken, getAuthToken, setAuthToken } from "../../utils/authToken";

export const authService = {
  async startSignup(email: string, password: string, fullName?: string): Promise<SignupInitiateResponse> {
    return authRepository.signup({ email, password, fullName });
  },

  async verifySignup(email: string, otp: string): Promise<MessageResponse> {
    return authRepository.verifySignup(email, otp);
  },

  async resendSignup(email: string): Promise<SignupInitiateResponse> {
    return authRepository.resendSignup(email);
  },

  async signIn(email: string, password: string): Promise<UserProfile> {
    const result = await authRepository.login({ email, password });
    setAuthToken(result.accessToken);
    return result.user;
  },

  async signOut(): Promise<void> {
    clearAuthToken();
  },

  async getCurrentUser(): Promise<UserProfile | null> {
    const token = getAuthToken();
    if (!token) {
      return null;
    }
    try {
      return await authRepository.currentUser();
    } catch (error) {
      clearAuthToken();
      throw error;
    }
  },
};
