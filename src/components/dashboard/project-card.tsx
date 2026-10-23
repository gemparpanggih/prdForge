"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowUpRight, FileText, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { ProjectSummary } from "@/lib/types";
import { PRODUCT_TYPE_ICONS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { usePreferences } from "@/components/preferences-provider";
import { formatRelative } from "@/lib/utils";

export function ProjectCard({ project, index }: { project: ProjectSummary; index: number }) {
  const router = useRouter();
  const { language, t } = usePreferences();
  const [deleting, setDeleting] = useState(false);
  const Icon = PRODUCT_TYPE_ICONS[project.productType] ?? FileText;

  async function handleDelete() {
    if (!window.confirm(t('Delete "{name}" and all of its versions? This cannot be undone.', { name: project.name }))) {
      return;
    }
    setDeleting(true);
    try {
      const response = await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error || t("Could not delete the project."));
      }
      toast.success(t("Project deleted."));
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("Could not delete the project."));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div
      className="group relative animate-fade-up overflow-hidden rounded-2xl border border-border bg-surface/80 transition-all hover:border-border-strong hover:bg-surface"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <Link href={`/projects/${project.id}`} className="block p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface-raised text-accent">
              <Icon className="h-4 w-4" />
            </span>
            <div>
              <div className="text-[10px] uppercase tracking-[0.16em] text-muted">{t(project.productType)}</div>
              <h3 className="mt-0.5 line-clamp-1 text-sm font-semibold text-foreground">
                {project.name}
              </h3>
            </div>
          </div>
          <StatusBadge status={project.status} />
        </div>

        <p className="mt-3 line-clamp-2 min-h-[2.6rem] text-xs leading-relaxed text-muted">
          {project.summary}
        </p>

        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-[10px]">
            <span className="text-muted">{t("Readiness")}</span>
            <span className="font-medium text-muted-strong">{project.readiness}%</span>
          </div>
          <Progress
            value={project.readiness}
            indicatorClassName={project.readiness >= 80 ? "bg-accent" : "bg-warning"}
          />
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-[10px] text-muted">
            {t("Updated")} {formatRelative(project.updatedAt, language)}
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-accent opacity-0 transition-opacity group-hover:opacity-100">
            {project.status === "interview" ? t("Continue interview") : t("Open blueprint")}
            <ArrowUpRight className="h-3 w-3" />
          </span>
        </div>
      </Link>
      <div className="absolute right-3 top-16 opacity-0 transition-opacity group-hover:opacity-100">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleDelete}
          disabled={deleting}
          aria-label={t("Delete project") + " " + project.name}
          className="text-muted hover:text-danger"
        >
          {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
        </Button>
      </div>
    </div>
  );
}
