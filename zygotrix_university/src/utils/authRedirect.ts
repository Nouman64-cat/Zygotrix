import { clearAuthToken } from "./authToken";

/**
 * Handle authentication failures by clearing stored tokens and redirecting to signin.
 */
export const handleAuthFailure = (): void => {
  clearAuthToken();

  const currentPath = window.location.pathname + window.location.search;
  const redirectPath =
    currentPath !== "/signin"
      ? `?redirect=${encodeURIComponent(currentPath)}`
      : "";

  window.location.href = `/signin${redirectPath}`;
};
