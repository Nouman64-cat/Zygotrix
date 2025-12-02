import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
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
  const isManuallySetRef = React.useRef(false); // Track if theme was manually changed

  const [theme, setThemeState] = useState<Theme>(() => {
    // Check user preferences first
    console.log("[ThemeContext] Initializing theme...");
    console.log("[ThemeContext] User preferences:", user?.preferences?.theme);
    if (user?.preferences?.theme) {
      console.log("[ThemeContext] Using user preference:", user.preferences.theme);
      return user.preferences.theme;
    }
    // Fall back to localStorage
    const stored = localStorage.getItem("zygotrix_theme");
    console.log("[ThemeContext] localStorage theme:", stored);
    const initialTheme = (stored as Theme) || "dark";
    console.log("[ThemeContext] Initial theme:", initialTheme);
    return initialTheme;
  });

  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("light");

  console.log("[ThemeContext] Current theme state:", theme);
  console.log("[ThemeContext] Current resolved theme:", resolvedTheme);

  // Detect system preference
  const getSystemTheme = useCallback((): ResolvedTheme => {
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
    console.log("[ThemeContext] setTheme called with:", newTheme);
    isManuallySetRef.current = true; // Mark as manually set
    setThemeState(newTheme);
    localStorage.setItem("zygotrix_theme", newTheme);
    console.log("[ThemeContext] Theme saved to localStorage:", newTheme);

    // Reset the flag after a short delay to allow user preferences to sync
    setTimeout(() => {
      isManuallySetRef.current = false;
      console.log("[ThemeContext] Manual set flag cleared");
    }, 1000);
  }, []);

  // Apply theme to document
  useEffect(() => {
    console.log("[ThemeContext] Applying theme effect, current theme:", theme);
    const resolved = resolveTheme(theme);
    console.log("[ThemeContext] Resolved theme:", resolved);
    setResolvedTheme(resolved);

    if (resolved === "dark") {
      console.log("[ThemeContext] Adding 'dark' class to document.documentElement");
      document.documentElement.classList.add("dark");
      console.log("[ThemeContext] document.documentElement.classList:", Array.from(document.documentElement.classList));
    } else {
      console.log("[ThemeContext] Removing 'dark' class from document.documentElement");
      document.documentElement.classList.remove("dark");
      console.log("[ThemeContext] document.documentElement.classList:", Array.from(document.documentElement.classList));
    }
  }, [theme, resolveTheme]);

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== "auto") return;

    console.log("[ThemeContext] Setting up system theme listener");
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      console.log("[ThemeContext] System theme changed");
      const resolved = resolveTheme("auto");
      console.log("[ThemeContext] New resolved theme:", resolved);
      setResolvedTheme(resolved);

      if (resolved === "dark") {
        console.log("[ThemeContext] Adding 'dark' class (system change)");
        document.documentElement.classList.add("dark");
      } else {
        console.log("[ThemeContext] Removing 'dark' class (system change)");
        document.documentElement.classList.remove("dark");
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme, resolveTheme]);

  // Update theme when user preferences change
  useEffect(() => {
    console.log("[ThemeContext] User preferences effect triggered");
    console.log("[ThemeContext] user?.preferences?.theme:", user?.preferences?.theme);
    console.log("[ThemeContext] current theme:", theme);
    console.log("[ThemeContext] isManuallySet:", isManuallySetRef.current);

    // Only sync from user preferences if not manually set
    if (!isManuallySetRef.current && user?.preferences?.theme && user.preferences.theme !== theme) {
      console.log("[ThemeContext] Updating theme from user preferences:", user.preferences.theme);
      setTheme(user.preferences.theme);
    } else if (isManuallySetRef.current) {
      console.log("[ThemeContext] Skipping user preferences sync - theme was manually set");
    }
  }, [user?.preferences?.theme, theme, setTheme]);

  const value = {
    theme,
    resolvedTheme,
    setTheme,
  };

  console.log("[ThemeContext] Rendering with value:", value);

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
