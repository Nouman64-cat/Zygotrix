"use client";

import React, {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
    useRef,
} from "react";
import { useAuth } from "./AuthContext";

type Theme = "light" | "dark" | "auto";
type ResolvedTheme = "light" | "dark";

type ThemeContextValue = {
    theme: Theme;
    resolvedTheme: ResolvedTheme;
    setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const { user } = useAuth();
    const isManuallySetRef = useRef(false);

    const [theme, setThemeState] = useState<Theme>("dark"); // Default to dark or handle hydration awareness

    useEffect(() => {
        // Hydration safe init
        const stored = localStorage.getItem("zygotrix_theme");
        if (stored) {
            setThemeState(stored as Theme);
        }
    }, []);

    const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("light");

    // Detect system preference
    const getSystemTheme = useCallback((): ResolvedTheme => {
        if (typeof window === 'undefined') return 'light';
        if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
            return "dark";
        }
        return "light";
    }, []);

    // Resolve the actual theme to apply
    const resolveTheme = useCallback(
        (themeValue: Theme): ResolvedTheme => {
            if (themeValue === "auto") {
                return getSystemTheme();
            }
            return themeValue;
        },
        [getSystemTheme]
    );

    // Update theme
    const setTheme = useCallback((newTheme: Theme) => {
        isManuallySetRef.current = true; // Mark as manually set
        setThemeState(newTheme);
        localStorage.setItem("zygotrix_theme", newTheme);

        // Reset the flag after a short delay
        setTimeout(() => {
            isManuallySetRef.current = false;
        }, 1000);
    }, []);

    // Apply theme to document
    useEffect(() => {
        const resolved = resolveTheme(theme);
        setResolvedTheme(resolved);

        if (resolved === "dark") {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
    }, [theme, resolveTheme]);

    // Listen for system theme changes
    useEffect(() => {
        if (theme !== "auto") return;

        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        const handleChange = () => {
            const resolved = resolveTheme("auto");
            setResolvedTheme(resolved);

            if (resolved === "dark") {
                document.documentElement.classList.add("dark");
            } else {
                document.documentElement.classList.remove("dark");
            }
        };

        mediaQuery.addEventListener("change", handleChange);
        return () => mediaQuery.removeEventListener("change", handleChange);
    }, [theme, resolveTheme]);

    const value = {
        theme,
        resolvedTheme,
        setTheme,
    };

    return (
        <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
    );
};

export const useTheme = (): ThemeContextValue => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
};
