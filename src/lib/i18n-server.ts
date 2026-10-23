import { cookies } from "next/headers";
import {
  LANGUAGE_COOKIE,
  THEME_COOKIE,
  getDictionary,
  parseLanguage,
  parseTheme,
  type Language,
  type Theme,
} from "./i18n";

export async function getServerPreferences(): Promise<{
  language: Language;
  theme: Theme;
  t: ReturnType<typeof getDictionary>["t"];
}> {
  const store = await cookies();
  const language = parseLanguage(store.get(LANGUAGE_COOKIE)?.value);
  const theme = parseTheme(store.get(THEME_COOKIE)?.value);
  return { language, theme, t: getDictionary(language).t };
}
