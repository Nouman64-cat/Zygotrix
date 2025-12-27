import API from "./api";
import { API_ROUTES } from "./apiConstants";
import type {
  AuthResponse,
  MessageResponse,
  PortalStatusResponse,
  SignInPayload,
  SignUpPayload,
  SignupInitiateResponse,
  SignupResendPayload,
  SignupVerifyPayload,
  UserProfile,
  UpdateProfilePayload,
  OnboardingPayload,
  PasswordResetRequestPayload,
  PasswordResetVerifyPayload,
  PasswordResetResendPayload,
  ChatPreferences,
  UserPreferencesUpdate,
} from "../types/auth";

export const requestSignupOtp = async (
  payload: SignUpPayload
): Promise<SignupInitiateResponse> => {
  const response = await API.post<SignupInitiateResponse>(
    API_ROUTES.auth.signUp,
    payload
  );
  return response.data;
};

export const verifySignupOtp = async (
  payload: SignupVerifyPayload
): Promise<MessageResponse> => {
  const response = await API.post<MessageResponse>(
    API_ROUTES.auth.signUpVerify,
    payload
  );
  return response.data;
};

export const resendSignupOtp = async (
  payload: SignupResendPayload
): Promise<SignupInitiateResponse> => {
  const response = await API.post<SignupInitiateResponse>(
    API_ROUTES.auth.signUpResend,
    payload
  );
  return response.data;
};

export const signIn = async (payload: SignInPayload): Promise<AuthResponse> => {
  const response = await API.post<AuthResponse>(API_ROUTES.auth.login, payload);
  return response.data;
};

export const fetchCurrentUser = async (
  token?: string
): Promise<UserProfile> => {
  const response = await API.get<UserProfile>(
    API_ROUTES.auth.me,
    token ? { headers: { Authorization: "Bearer " + token } } : undefined
  );
  return response.data;
};

export const fetchPortalStatus = async (
  token?: string
): Promise<PortalStatusResponse> => {
  const response = await API.get<PortalStatusResponse>(
    API_ROUTES.portal.status,
    token ? { headers: { Authorization: "Bearer " + token } } : undefined
  );
  return response.data;
};

export const updateProfilePicture = async (
  profilePictureUrl: string,
  thumbnailUrl: string
): Promise<UserProfile> => {
  const response = await API.patch<UserProfile>(API_ROUTES.auth.updateProfile, {
    profile_picture_url: profilePictureUrl,
    profile_picture_thumbnail_url: thumbnailUrl,
  });
  return response.data;
};

export const updateProfile = async (
  payload: UpdateProfilePayload
): Promise<UserProfile> => {
  const response = await API.patch<UserProfile>(
    API_ROUTES.auth.updateProfile,
    payload
  );
  return response.data;
};

export const completeOnboarding = async (
  payload: OnboardingPayload
): Promise<UserProfile> => {
  const response = await API.post<UserProfile>(
    API_ROUTES.auth.onboarding,
    payload
  );
  return response.data;
};

export const requestPasswordResetOtp = async (
  payload: PasswordResetRequestPayload
): Promise<SignupInitiateResponse> => {
  const response = await API.post<SignupInitiateResponse>(
    API_ROUTES.auth.passwordResetRequest,
    payload
  );
  return response.data;
};

export const verifyPasswordResetOtpOnly = async (
  payload: { email: string; otp: string }
): Promise<MessageResponse> => {
  const response = await API.post<MessageResponse>(
    API_ROUTES.auth.passwordResetVerifyOtp,
    payload
  );
  return response.data;
};

export const verifyPasswordResetOtp = async (
  payload: PasswordResetVerifyPayload
): Promise<MessageResponse> => {
  const response = await API.post<MessageResponse>(
    API_ROUTES.auth.passwordResetVerify,
    payload
  );
  return response.data;
};

export const resendPasswordResetOtp = async (
  payload: PasswordResetResendPayload
): Promise<SignupInitiateResponse> => {
  const response = await API.post<SignupInitiateResponse>(
    API_ROUTES.auth.passwordResetResend,
    payload
  );
  return response.data;
};

// AI Behavior Preferences API
export const getUserPreferences = async (): Promise<ChatPreferences> => {
  const response = await API.get<ChatPreferences>(API_ROUTES.auth.preferences);
  return response.data;
};

export const updateUserPreferences = async (
  payload: UserPreferencesUpdate
): Promise<ChatPreferences> => {
  const response = await API.patch<ChatPreferences>(
    API_ROUTES.auth.preferences,
    payload
  );
  return response.data;
};

export const resetUserPreferences = async (): Promise<ChatPreferences> => {
  const response = await API.post<ChatPreferences>(
    API_ROUTES.auth.preferencesReset,
    {}
  );
  return response.data;
};
