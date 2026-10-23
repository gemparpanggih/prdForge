"use client";

import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { usePreferences } from "@/components/preferences-provider";

export function ReviewRefresh() {
  const router = useRouter();
  const { t } = usePreferences();
  const [refreshing, setRefreshing] = useState(false);
  return (
    <Button
      variant="secondary"
      size="sm"
      disabled={refreshing}
      onClick={() => {
        setRefreshing(true);
        router.refresh();
        setTimeout(() => {
          setRefreshing(false);
          toast.success(t("Review refreshed."));
        }, 500);
      }}
    >
      <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
      {t("Re-run review")}
    </Button>
  );
}
