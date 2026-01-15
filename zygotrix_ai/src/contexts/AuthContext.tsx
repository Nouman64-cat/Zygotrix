import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { authService } from '../services';
import type { UserProfile, LoginRequest } from '../types';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

// Refresh user profile every 2 minutes to catch admin updates (e.g., subscription changes)
const USER_REFRESH_INTERVAL = 2 * 60 * 1000;

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Refresh user profile from server
  const refreshUser = useCallback(async () => {
    if (!authService.isAuthenticated()) return;

    const freshUser = await authService.getCurrentUser();
    if (freshUser) {
      setUser(freshUser);
    }
  }, []);

  useEffect(() => {
    const storedUser = authService.getStoredUser();
    const token = authService.getStoredToken();

    if (storedUser && token) {
      setUser(storedUser);
      // Fetch fresh user data in background after initial load
      refreshUser();
    }

    setIsLoading(false);
  }, [refreshUser]);

  // Periodic refresh to catch admin updates
  useEffect(() => {
    if (!user) return;

    const intervalId = setInterval(() => {
      refreshUser();
    }, USER_REFRESH_INTERVAL);

    return () => clearInterval(intervalId);
  }, [user, refreshUser]);

  const login = async (credentials: LoginRequest) => {
    const response = await authService.login(credentials);
    setUser(response.user);
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
