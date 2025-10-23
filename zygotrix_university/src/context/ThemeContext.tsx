import {
  type PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ThemeContext, type ThemeMode } from "./themeContext";

const STORAGE_KEY = "zygotrix-theme";

const getPreferredTheme = (): ThemeMode => {
  if (typeof window === "undefined") {
    return "light";
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    if (stored === "light" || stored === "dark") {
      return stored;
    }
  } catch {
    // ignore storage access issues
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

export const ThemeProvider = ({ children }: PropsWithChildren) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => getPreferredTheme());

  const setTheme = useCallback((value: ThemeMode) => {
    setThemeState(value);
    try {
      window.localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // ignore storage access issues
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "light" ? "dark" : "light");
  }, [setTheme, theme]);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const syncWithSystemPreference = () => {
      try {
        if (window.localStorage.getItem(STORAGE_KEY)) {
          return;
        }
      } catch {
        // ignore storage access issues
      }
      setThemeState(media.matches ? "dark" : "light");
    };

    media.addEventListener("change", syncWithSystemPreference);

    return () => media.removeEventListener("change", syncWithSystemPreference);
  }, []);

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme,
    }),
    [theme, setTheme, toggleTheme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};
