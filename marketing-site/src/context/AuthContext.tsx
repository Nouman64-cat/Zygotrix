"use client";

import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";

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
    const [token, setToken] = useState<string | null>(null);
    const [user, setUser] = useState<UserProfile | null>(null);
    const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);

    useEffect(() => {
        // Client-side only logic for reading storage
        if (typeof window !== "undefined") {
            const storedToken = localStorage.getItem(STORAGE_KEY);
            if (storedToken) {
                setToken(storedToken);
                // In a real app, verify token here
            }
        }
    }, []);

    const clearSession = useCallback(() => {
        setToken(null);
        setUser(null);
        if (typeof window !== "undefined") {
            try {
                localStorage.removeItem(STORAGE_KEY);
            } catch (error) {
                console.warn("Unable to clear persisted auth token", error);
            }
        }
    }, []);

    const signIn = useCallback(
        async (payload: SignInPayload) => {
            setIsAuthenticating(true);
            try {
                // Mock sign in or redirect to main app
                console.log("Sign in requested", payload);
            } catch (error) {
                clearSession();
                throw error;
            } finally {
                setIsAuthenticating(false);
            }
        },
        [clearSession],
    );

    const signOut = useCallback(() => {
        clearSession();
    }, [clearSession]);

    const refreshUser = useCallback(async () => {
        // No-op for marketing site
    }, []);

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
