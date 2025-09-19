export type UserProfile = {
  id: string;
  email: string;
  full_name?: string | null;
  created_at: string;
};

export type AuthResponse = {
  access_token: string;
  token_type: string;
  user: UserProfile;
};

export type SignUpPayload = {
  email: string;
  password: string;
  full_name?: string;
};

export type SignInPayload = {
  email: string;
  password: string;
};

export type SignupInitiateResponse = {
  message: string;
  expires_at: string;
};

export type SignupVerifyPayload = {
  email: string;
  otp: string;
};

export type SignupResendPayload = {
  email: string;
};

export type MessageResponse = {
  message: string;
};

export type PortalStatusResponse = {
  message: string;
  accessed_at: string;
};
