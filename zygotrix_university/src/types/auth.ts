export interface UserProfile {
  id: string;
  email: string;
  fullName?: string | null;
  createdAt: string;
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
