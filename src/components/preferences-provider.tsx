"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  LANGUAGE_COOKIE,
  THEME_COOKIE,
  translate,
  type Language,
  type Theme,
} from "@/lib/i18n";

type Preferences = {
  language: Language;
  theme: Theme;
  t: (text: string, vars?: Record<string, string | number>) => string;
  setLanguage: (language: Language) => void;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const PreferencesContext = createContext<Preferences | null>(null);

const fallbackPreferences: Preferences = {
  language: "en",
  theme: "dark",
  t: (text, vars) => translate("en", text, vars),
  setLanguage: () => undefined,
  setTheme: () => undefined,
  toggleTheme: () => undefined,
};

function writeCookie(name: string, value: string) {
  document.cookie = `${name}=${value}; path=/; max-age=31536000; SameSite=Lax`;
}

export function PreferencesProvider({
  initialLanguage,
  initialTheme,
  children,
}: {
  initialLanguage: Language;
  initialTheme: Theme;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [language, setLanguageState] = useState<Language>(initialLanguage);
  const [theme, setThemeState] = useState<Theme>(initialTheme);

  const t = useCallback(
    (text: string, vars?: Record<string, string | number>) =>
      translate(language, text, vars),
    [language],
  );

  const setLanguage = useCallback(
    (next: Language) => {
      setLanguageState(next);
      writeCookie(LANGUAGE_COOKIE, next);
      document.documentElement.lang = next;
      router.refresh();
    },
    [router],
  );

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    writeCookie(THEME_COOKIE, next);
    document.documentElement.dataset.theme = next;
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [setTheme, theme]);

  const value = useMemo(
    () => ({ language, theme, t, setLanguage, setTheme, toggleTheme }),
    [language, theme, t, setLanguage, setTheme, toggleTheme],
  );

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences(): Preferences {
  return useContext(PreferencesContext) ?? fallbackPreferences;
}
