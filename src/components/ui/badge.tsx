"use client";

import * as React from "react";
import { usePreferences } from "@/components/preferences-provider";
import { cn } from "@/lib/utils";

type Variant = "default" | "accent" | "success" | "warning" | "danger" | "muted" | "info" | "outline";

const variants: Record<Variant, string> = {
  default: "bg-surface-raised text-muted-strong border-border",
  accent: "bg-accent/12 text-accent border-accent/25",
  success: "bg-success/10 text-success border-success/25",
  warning: "bg-warning/10 text-warning border-warning/25",
  danger: "bg-danger/10 text-danger border-danger/25",
  muted: "bg-foreground/[0.03] text-muted border-border",
  info: "bg-info/10 text-info border-info/25",
  outline: "bg-transparent text-muted-strong border-border-strong",
};

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: Variant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-wide",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}

export function StatusBadge({ status }: { status: string }) {
  const { t } = usePreferences();
  const map: Record<string, Variant> = {
    interview: "info",
    generating: "warning",
    draft: "default",
    review: "warning",
    ready: "success",
    approved: "success",
    exported: "accent",
    todo: "muted",
    in_progress: "info",
    blocked: "danger",
    done: "success",
    must: "danger",
    should: "warning",
    could: "info",
    wont: "muted",
    blocker: "danger",
    major: "warning",
    minor: "info",
    low: "muted",
    medium: "warning",
    high: "danger",
  };
  return (
    <Badge variant={map[status] ?? "default"} className="capitalize">
      {t(status.replace(/_/g, " "))}
    </Badge>
  );
}
