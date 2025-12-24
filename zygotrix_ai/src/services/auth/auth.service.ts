import axiosInstance from "../api/config/axios.config";
import { API_ENDPOINTS } from "../api/constants/api.constants";
import { storage, STORAGE_KEYS } from "../../utils";
import type {
  LoginRequest,
  AuthResponse,
  UserProfile,
  SignupRequest,
  SignupResponse,
  VerifyOtpRequest,
  VerifyOtpResponse,
  ResendOtpRequest,
  ResendOtpResponse,
} from "../../types";

class AuthService {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await axiosInstance.post<AuthResponse>(
      API_ENDPOINTS.AUTH.LOGIN,
      credentials
    );

    const { access_token, user } = response.data;

    storage.set(STORAGE_KEYS.AUTH_TOKEN, access_token);
    storage.set(STORAGE_KEYS.USER_PROFILE, user);

    return response.data;
  }

  async signup(data: SignupRequest): Promise<SignupResponse> {
    const response = await axiosInstance.post<SignupResponse>(
      API_ENDPOINTS.AUTH.REGISTER,
      data
    );
    return response.data;
  }

  async verifyOtp(data: VerifyOtpRequest): Promise<VerifyOtpResponse> {
    const response = await axiosInstance.post<VerifyOtpResponse>(
      API_ENDPOINTS.AUTH.VERIFY_OTP,
      data
    );
    return response.data;
  }

  async resendOtp(data: ResendOtpRequest): Promise<ResendOtpResponse> {
    const response = await axiosInstance.post<ResendOtpResponse>(
      API_ENDPOINTS.AUTH.RESEND_OTP,
      data
    );
    return response.data;
  }

  async logout(): Promise<void> {
    try {
      await axiosInstance.post(API_ENDPOINTS.AUTH.LOGOUT);
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      storage.remove(STORAGE_KEYS.AUTH_TOKEN);
      storage.remove(STORAGE_KEYS.USER_PROFILE);
      storage.remove(STORAGE_KEYS.CONVERSATIONS);
      storage.remove(STORAGE_KEYS.CURRENT_CONVERSATION);
    }
  }

  getStoredUser(): UserProfile | null {
    return storage.get<UserProfile>(STORAGE_KEYS.USER_PROFILE);
  }

  getStoredToken(): string | null {
    return storage.get<string>(STORAGE_KEYS.AUTH_TOKEN);
  }

  isAuthenticated(): boolean {
    return !!this.getStoredToken();
  }

  async requestPasswordReset(email: string): Promise<SignupResponse> {
    const response = await axiosInstance.post<SignupResponse>(
      API_ENDPOINTS.AUTH.PASSWORD_RESET_REQUEST,
      { email }
    );
    return response.data;
  }

  async verifyPasswordResetOtpOnly(data: {
    email: string;
    otp: string;
  }): Promise<VerifyOtpResponse> {
    const response = await axiosInstance.post<VerifyOtpResponse>(
      API_ENDPOINTS.AUTH.PASSWORD_RESET_VERIFY_OTP,
      data
    );
    return response.data;
  }

  async verifyPasswordReset(data: {
    email: string;
    otp: string;
    new_password: string;
  }): Promise<VerifyOtpResponse> {
    const response = await axiosInstance.post<VerifyOtpResponse>(
      API_ENDPOINTS.AUTH.PASSWORD_RESET_VERIFY,
      data
    );
    return response.data;
  }

  async resendPasswordResetOtp(email: string): Promise<ResendOtpResponse> {
    const response = await axiosInstance.post<ResendOtpResponse>(
      API_ENDPOINTS.AUTH.PASSWORD_RESET_RESEND,
      { email }
    );
    return response.data;
  }
}

export default new AuthService();
