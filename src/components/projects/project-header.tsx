"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeft,
  ClipboardCheck,
  Download,
  FileText,
  LayoutDashboard,
  ListChecks,
  MessagesSquare,
  Workflow,
} from "lucide-react";
import type { ProjectDetail } from "@/lib/types";
import { PRODUCT_TYPE_ICONS } from "@/lib/constants";
import { getTechPresetLabel } from "@/lib/tech-presets";
import { StatusBadge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { usePreferences } from "@/components/preferences-provider";
import { cn } from "@/lib/utils";

const tabs = [
  { segment: "interview", label: "Interview", icon: MessagesSquare },
  { segment: "prd", label: "PRD", icon: FileText },
  { segment: "flow", label: "Flow & wireframes", icon: Workflow },
  { segment: "tasks", label: "Tasks", icon: ListChecks },
  { segment: "review", label: "Review", icon: ClipboardCheck },
  { segment: "export", label: "Export", icon: Download },
];

export function ProjectHeader({ project }: { project: ProjectDetail }) {
  const pathname = usePathname();
  const { t } = usePreferences();
  const base = `/projects/${project.id}`;
  const Icon = PRODUCT_TYPE_ICONS[project.productType] ?? LayoutDashboard;
  const stackLabel = t(getTechPresetLabel(project.techPreset));

  return (
    <header className="sticky top-14 z-20 border-b border-border bg-background/80 backdrop-blur-xl lg:top-0">
      <div className="mx-auto w-full max-w-[1600px] px-5 pt-4 md:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-muted transition-colors hover:text-foreground"
              aria-label={t("Back to projects")}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
            </Link>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-accent/20 bg-accent/[0.08] text-accent">
              <Icon className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-sm font-semibold tracking-tight text-foreground">
                  {project.name}
                </h1>
                <StatusBadge status={project.status} />
              </div>
              <div className="mt-0.5 flex items-center gap-2 text-[10px] text-muted">
                <span>{t(project.productType)}</span>
                <span className="h-0.5 w-0.5 rounded-full bg-muted" />
                <span>{t("Readiness")} {project.readiness}%</span>
                <span className="h-0.5 w-0.5 rounded-full bg-muted" />
                <span>{t("PRD")} v{project.prdVersion ?? "—"}</span>
                <span className="h-0.5 w-0.5 rounded-full bg-muted" />
                <span className="hidden sm:inline">{t("Stack")}: {stackLabel}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`${base}/export`} className={buttonClass("secondary", "sm")}>
              <Download className="h-3.5 w-3.5" />
              {t("Export")}
            </Link>
          </div>
        </div>

        <nav className="no-scrollbar mt-4 flex gap-1 overflow-x-auto">
          {tabs.map((tab) => {
            const href = `${base}/${tab.segment}`;
            const active = pathname.startsWith(href);
            return (
              <Link
                key={tab.segment}
                href={href}
                className={cn(
                  "relative flex h-9 items-center gap-1.5 whitespace-nowrap rounded-t-lg px-3 text-xs font-medium transition-colors",
                  active
                    ? "text-foreground"
                    : "text-muted hover:bg-foreground/[0.03] hover:text-foreground",
                )}
              >
                <tab.icon className={cn("h-3.5 w-3.5", active ? "text-accent" : "text-muted")} />
                {t(tab.label)}
                {active ? (
                  <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-accent" />
                ) : null}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
