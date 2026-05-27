import { useCallback, useEffect, useState } from "react";
import { getStrictContext } from "@/lib/get-strict-context";

// ===== TYPES =====
type Theme = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
}

// ===== CONSTANTS =====
const STORAGE_KEY = "coinpulse-theme";

// ===== CONTEXT =====
const [ThemeProvider, useTheme] =
  getStrictContext<ThemeContextValue>("ThemeContext");

function getSystemTheme(): ResolvedTheme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function readStoredTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark" || stored === "system") {
    return stored;
  }
  return "system";
}

function ThemeContextProvider({ children }: { children: React.ReactNode }) {
  // ===== STATE =====
  const [theme, setThemeState] = useState<Theme>(() => readStoredTheme());
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() =>
    readStoredTheme() === "system"
      ? getSystemTheme()
      : (readStoredTheme() as ResolvedTheme),
  );

  // ===== EFFECTS =====
  // Apply resolvedTheme to <html> and persist theme preference
  useEffect(() => {
    const next: ResolvedTheme =
      theme === "system" ? getSystemTheme() : theme;
    setResolvedTheme(next);

    const root = document.documentElement;
    root.classList.toggle("dark", next === "dark");

    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  // Listen to OS theme changes while in "system" mode
  useEffect(() => {
    if (theme !== "system") return;

    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      const next: ResolvedTheme = e.matches ? "dark" : "light";
      setResolvedTheme(next);
      document.documentElement.classList.toggle("dark", next === "dark");
    };

    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [theme]);

  const setTheme = useCallback((next: Theme) => setThemeState(next), []);

  return (
    <ThemeProvider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeProvider>
  );
}

export { ThemeContextProvider, useTheme };
