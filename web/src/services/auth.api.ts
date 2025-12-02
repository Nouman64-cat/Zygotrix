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
