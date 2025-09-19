import { API_BASE_URL } from "./zygotrixApi";
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
} from "../types/auth";

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Request failed with status ${response.status}`);
  }
  return (await response.json()) as T;
};

export const requestSignupOtp = async (payload: SignUpPayload): Promise<SignupInitiateResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse<SignupInitiateResponse>(response);
};

export const verifySignupOtp = async (payload: SignupVerifyPayload): Promise<MessageResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/auth/signup/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse<MessageResponse>(response);
};

export const resendSignupOtp = async (payload: SignupResendPayload): Promise<SignupInitiateResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/auth/signup/resend`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse<SignupInitiateResponse>(response);
};

export const signIn = async (payload: SignInPayload): Promise<AuthResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse<AuthResponse>(response);
};

export const fetchCurrentUser = async (token: string): Promise<UserProfile> => {
  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse<UserProfile>(response);
};

export const fetchPortalStatus = async (token: string): Promise<PortalStatusResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/portal/status`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse<PortalStatusResponse>(response);
};
