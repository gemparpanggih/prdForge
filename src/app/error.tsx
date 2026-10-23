"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePreferences } from "@/components/preferences-provider";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = usePreferences();
  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-2xl flex-col items-center justify-center px-5 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-danger/25 bg-danger/[0.06] text-danger">
        <AlertTriangle className="h-5 w-5" />
      </div>
      <h1 className="mt-4 text-2xl font-semibold tracking-[-0.03em]">{t("Something broke.")}</h1>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
        {error.message || t("The local operation failed. Check the server console for details.")}
      </p>
      <Button className="mt-5" onClick={reset}>
        <RotateCcw className="h-4 w-4" />
        {t("Try again")}
      </Button>
    </div>
  );
}
