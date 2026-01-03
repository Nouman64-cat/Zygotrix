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
  ChatPreferences,
  UserPreferencesUpdate,
} from "../../types";

// Cache keys for preferences
const PREFERENCES_CACHE_KEY = "zygotrix_preferences";
const PREFERENCES_CACHE_TIME_KEY = "zygotrix_preferences_time";
const PREFERENCES_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

class AuthService {
  // Track if a revalidation is in progress to prevent duplicates
  private _revalidating = false;

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
      // Clear preferences cache on logout
      this.clearPreferencesCache();
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

  // ===== AI Behavior Preferences with Caching =====

  /**
   * Clear the preferences cache.
   * Call this after updates to ensure fresh data on next fetch.
   */
  clearPreferencesCache(): void {
    try {
      localStorage.removeItem(PREFERENCES_CACHE_KEY);
      localStorage.removeItem(PREFERENCES_CACHE_TIME_KEY);
    } catch (e) {
      console.warn("Failed to clear preferences cache", e);
    }
  }

  /**
   * Check if cached preferences are still valid.
   */
  private isCacheValid(): boolean {
    try {
      const cacheTime = localStorage.getItem(PREFERENCES_CACHE_TIME_KEY);
      if (!cacheTime) return false;
      return Date.now() - parseInt(cacheTime, 10) < PREFERENCES_CACHE_TTL;
    } catch {
      return false;
    }
  }

  /**
   * Get cached preferences if available.
   */
  private getCachedPreferences(): ChatPreferences | null {
    try {
      const cached = localStorage.getItem(PREFERENCES_CACHE_KEY);
      if (cached && this.isCacheValid()) {
        return JSON.parse(cached) as ChatPreferences;
      }
    } catch (e) {
      console.warn("Failed to read preferences cache", e);
    }
    return null;
  }

  /**
   * Store preferences in cache.
   */
  private cachePreferences(preferences: ChatPreferences): void {
    try {
      localStorage.setItem(PREFERENCES_CACHE_KEY, JSON.stringify(preferences));
      localStorage.setItem(PREFERENCES_CACHE_TIME_KEY, Date.now().toString());
    } catch (e) {
      console.warn("Failed to cache preferences", e);
    }
  }

  /**
   * Revalidate preferences in the background.
   * Uses stale-while-revalidate pattern.
   */
  private async revalidatePreferences(): Promise<void> {
    if (this._revalidating) return;
    this._revalidating = true;

    try {
      const response = await axiosInstance.get<ChatPreferences>(
        API_ENDPOINTS.AUTH.PREFERENCES
      );
      this.cachePreferences(response.data);
    } catch (e) {
      console.warn("Background preferences revalidation failed", e);
    } finally {
      this._revalidating = false;
    }
  }

  /**
   * Get user preferences with caching.
   * Returns cached data immediately if valid, then revalidates in background.
   */
  async getUserPreferences(): Promise<ChatPreferences> {
    // Check cache first
    const cached = this.getCachedPreferences();

    if (cached) {
      // Return cached immediately, revalidate in background
      this.revalidatePreferences();
      return cached;
    }

    // No valid cache, fetch fresh
    const response = await axiosInstance.get<ChatPreferences>(
      API_ENDPOINTS.AUTH.PREFERENCES
    );

    // Cache the result
    this.cachePreferences(response.data);

    return response.data;
  }

  /**
   * Update user preferences.
   * Clears cache to ensure consistency.
   */
  async updateUserPreferences(
    payload: UserPreferencesUpdate
  ): Promise<ChatPreferences> {
    const response = await axiosInstance.patch<ChatPreferences>(
      API_ENDPOINTS.AUTH.PREFERENCES,
      payload
    );

    // Update cache with new preferences
    this.cachePreferences(response.data);

    return response.data;
  }

  /**
   * Reset user preferences to defaults.
   * Clears cache to ensure consistency.
   */
  async resetUserPreferences(): Promise<ChatPreferences> {
    const response = await axiosInstance.post<ChatPreferences>(
      API_ENDPOINTS.AUTH.PREFERENCES_RESET,
      {}
    );

    // Update cache with default preferences
    this.cachePreferences(response.data);

    return response.data;
  }
}

export default new AuthService();
