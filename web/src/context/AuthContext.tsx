import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { fetchCurrentUser, signIn as signInRequest } from "../services/auth.api";
import type { AuthResponse, SignInPayload, UserProfile } from "../types/auth";

const STORAGE_KEY = "zygotrix_auth_token";

type AuthContextValue = {
  user: UserProfile | null;
  token: string | null;
  isAuthenticating: boolean;
  signIn: (payload: SignInPayload) => Promise<void>;
  signOut: () => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (error) {
      console.warn("Unable to read persisted auth token", error);
      return null;
    }
  });
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(true);

  const clearSession = useCallback(() => {
    setToken(null);
    setUser(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.warn("Unable to clear persisted auth token", error);
    }
  }, []);

  const persistAuth = useCallback((auth: AuthResponse) => {
    setToken(auth.access_token);
    setUser(auth.user);
    try {
      localStorage.setItem(STORAGE_KEY, auth.access_token);
    } catch (error) {
      console.warn("Unable to persist auth token", error);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const bootstrap = async () => {
      if (!token) {
        setIsAuthenticating(false);
        return;
      }

      try {
        const profile = await fetchCurrentUser(token);
        if (isMounted) {
          setUser(profile);
        }
      } catch (error) {
        if (isMounted) {
          clearSession();
        }
      } finally {
        if (isMounted) {
          setIsAuthenticating(false);
        }
      }
    };

    bootstrap();

    return () => {
      isMounted = false;
    };
  }, [token, clearSession]);

  const signIn = useCallback(
    async (payload: SignInPayload) => {
      setIsAuthenticating(true);
      try {
        const auth = await signInRequest(payload);
        persistAuth(auth);
      } catch (error) {
        clearSession();
        throw error;
      } finally {
        setIsAuthenticating(false);
      }
    },
    [clearSession, persistAuth],
  );

  const signOut = useCallback(() => {
    clearSession();
  }, [clearSession]);

  const refreshUser = useCallback(async () => {
    if (!token) {
      clearSession();
      return;
    }
    try {
      const profile = await fetchCurrentUser(token);
      setUser(profile);
    } catch (error) {
      clearSession();
      throw error;
    }
  }, [token, clearSession]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, token, isAuthenticating, signIn, signOut, refreshUser }),
    [user, token, isAuthenticating, signIn, signOut, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
