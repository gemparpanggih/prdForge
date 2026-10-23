"use client";

import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function ReviewRefresh() {
  const router = useRouter();
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
          toast.success("Review refreshed.");
        }, 500);
      }}
    >
      <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
      Re-run review
    </Button>
  );
}
