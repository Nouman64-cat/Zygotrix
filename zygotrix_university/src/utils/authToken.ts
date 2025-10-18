const AUTH_TOKEN_STORAGE_KEY = "zygotrix_auth_token";

export const getAuthToken = (): string | null => {
  try {
    return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  } catch (error) {
    console.warn("Unable to read auth token from storage", error);
    return null;
  }
};

export const setAuthToken = (token: string): void => {
  try {
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
  } catch (error) {
    console.warn("Unable to persist auth token", error);
  }
};

export const clearAuthToken = (): void => {
  try {
    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  } catch (error) {
    console.warn("Unable to clear auth token", error);
  }
};

export const getAuthHeaders = (): Record<string, string> => {
  const token = getAuthToken();
  return token ? { Authorization: "Bearer " + token } : {};
};
