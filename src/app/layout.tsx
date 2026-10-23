import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppShell } from "@/components/app-shell";
import { PreferencesProvider } from "@/components/preferences-provider";
import { ThemeToaster } from "@/components/theme-toaster";
import { getServerPreferences } from "@/lib/i18n-server";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PRD Forge — AI Product Blueprint Studio",
  description:
    "Turn a rough product idea into a rigorous PRD, editable product flow, wireframes, and an AI-ready task plan.",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { language, theme } = await getServerPreferences();
  return (
    <html
      lang={language}
      data-theme={theme}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full">
        <PreferencesProvider initialLanguage={language} initialTheme={theme}>
          <AppShell>{children}</AppShell>
          <ThemeToaster />
        </PreferencesProvider>
      </body>
    </html>
  );
}
