import { clearAuthToken } from "./authToken";

/**
 * Handle authentication failures by clearing stored tokens and redirecting to signin
 * This is used by API interceptors when receiving 401 responses
 */
export const handleAuthFailure = (): void => {
  // Clear the invalid auth token from localStorage
  clearAuthToken();

  // Redirect to signin page, preserving the current location for potential redirect back
  const currentPath = window.location.pathname + window.location.search;
  const redirectPath =
    currentPath !== "/signin"
      ? `?redirect=${encodeURIComponent(currentPath)}`
      : "";

  window.location.href = `/signin${redirectPath}`;
};
