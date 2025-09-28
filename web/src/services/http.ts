const AUTH_STORAGE_KEY = "zygotrix_auth_token";

let unauthorizedRedirectInFlight = false;

const redirectToSignIn = () => {
  if (unauthorizedRedirectInFlight) {
    return;
  }
  unauthorizedRedirectInFlight = true;
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch (error) {
    console.warn("Failed to clear auth token", error);
  }
  if (window.location.pathname !== "/signin") {
    window.location.replace("/signin");
  }
};

export const parseJsonResponse = async <T>(response: Response): Promise<T> => {
  if (response.ok) {
    if (response.status === 204) {
      return undefined as T;
    }
    return (await response.json()) as T;
  }

  if (response.status === 401 || response.status === 403) {
    redirectToSignIn();
    throw new Error("Not authenticated");
  }

  const body = await response.text();
  throw new Error(body || `Request failed with status ${response.status}`);
};

export const parseVoidResponse = async (response: Response): Promise<void> => {
  if (response.ok) {
    return;
  }

  if (response.status === 401 || response.status === 403) {
    redirectToSignIn();
    throw new Error("Not authenticated");
  }

  const body = await response.text();
  throw new Error(body || `Request failed with status ${response.status}`);
};

export const AUTH_TOKEN_STORAGE_KEY = AUTH_STORAGE_KEY;
