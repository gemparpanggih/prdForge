"use client";

import { Toaster } from "sonner";
import { usePreferences } from "./preferences-provider";

export function ThemeToaster() {
  const { theme } = usePreferences();
  return (
    <Toaster
      theme={theme}
      position="bottom-right"
      richColors
      closeButton
      toastOptions={{
        style: {
          background: "var(--surface-raised)",
          border: "1px solid var(--border)",
          color: "var(--foreground)",
        },
      }}
    />
  );
}
