import axiosInstance from '../api/config/axios.config';
import { API_ENDPOINTS } from '../api/constants/api.constants';
import { storage, STORAGE_KEYS } from '../../utils';
import type { LoginRequest, AuthResponse, UserProfile } from '../../types';

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

  async logout(): Promise<void> {
    try {
      await axiosInstance.post(API_ENDPOINTS.AUTH.LOGOUT);
    } catch (error) {
      console.error('Logout error:', error);
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
}

export default new AuthService();
