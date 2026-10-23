"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCopy,
  Download,
  Eye,
  FileArchive,
  FileJson,
  FileText,
  Loader2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import type { ProjectDetail, ReadinessReport } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Progress, ScoreRing } from "@/components/ui/progress";
import { cn, downloadBlob, formatDate, formatRelative } from "@/lib/utils";

type FileEntry = { path: string; size: number };
type ExportHistory = { id: string; prdVersion: number; createdAt: string; files: number };

const FILE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  md: FileText,
  json: FileJson,
  mmd: Sparkles,
};

export function ExportCenter({
  project,
  prdVersion,
  readiness,
  files,
  history,
}: {
  project: ProjectDetail;
  prdVersion: number;
  readiness: ReadinessReport;
  files: FileEntry[];
  history: ExportHistory[];
}) {
  const router = useRouter();
  const [downloading, setDownloading] = useState(false);
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<{ path: string; content: string } | null>(null);
  const [previewLoading, setPreviewLoading] = useState<string | null>(null);
  const majorIssues = readiness.issues.filter((issue) => issue.severity === "major").length;

  async function download(force = false) {
    setDownloading(true);
    try {
      const response = await fetch(
        `/api/projects/${project.id}/export${force ? "?force=1&includeIssues=1" : ""}`,
      );
      if (response.status === 409) {
        const payload = (await response.json()) as { error?: string };
        setOverrideOpen(true);
        toast.warning(payload.error || "Readiness issues must be resolved or explicitly overridden.");
        return;
      }
      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error || "Export failed.");
      }
      const blob = await response.blob();
      const disposition = response.headers.get("Content-Disposition") ?? "";
      const match = disposition.match(/filename="([^"]+)"/);
      const filename = match?.[1] ?? `${project.slug}-prd-v${prdVersion}.zip`;
      downloadBlob(blob, filename);
      setOverrideOpen(false);
      toast.success("Export bundle downloaded.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Export failed.");
    } finally {
      setDownloading(false);
    }
  }

  async function preview(path: string) {
    setPreviewLoading(path);
    try {
      const response = await fetch(
        `/api/projects/${project.id}/export?file=${encodeURIComponent(path)}&includeIssues=1`,
      );
      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error || "Could not load the file.");
      }
      const content = await response.text();
      setPreviewFile({ path, content });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load the file.");
    } finally {
      setPreviewLoading(null);
    }
  }

  async function copyPrompt() {
    const prompt = `You are implementing "${project.name}". Read AGENTS.md first, then PRD.md, ARCHITECTURE.md, DATA_MODEL.md, API_SPEC.md, and TASKS.md. Execute the first unblocked task in TASKS.md. Follow its acceptance criteria and Definition of Done. Run the repository's documented checks. Do not add scope. Report changed files, commands run, results, and risks.`;
    try {
      await navigator.clipboard.writeText(prompt);
      toast.success("AI execution prompt copied.");
    } catch {
      toast.error("Clipboard permission was denied.");
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1300px] px-4 py-5 md:px-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/[0.06] px-3 py-1 text-[10px] font-medium text-accent">
            <FileArchive className="h-3 w-3" />
            Execution bundle · PRD v{prdVersion}
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-[-0.035em]">Export center</h1>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">
            A validated Markdown bundle plus machine-readable JSON. The coding agent reads{" "}
            <span className="text-muted-strong">AGENTS.md</span>, then follows{" "}
            <span className="text-muted-strong">TASKS.md</span> in dependency order.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={copyPrompt}>
            <ClipboardCopy className="h-4 w-4" />
            Copy AI prompt
          </Button>
          <Button onClick={() => download(false)} disabled={downloading}>
            {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Download bundle
          </Button>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div>
                <div className="text-xs font-semibold">Bundle contents</div>
                <div className="mt-0.5 text-[10px] text-muted">{files.length} files · generated from the latest PRD version</div>
              </div>
              <Badge variant="outline">ZIP</Badge>
            </div>
            <div className="divide-y divide-border/60">
              {files.map((file) => {
                const extension = file.path.split(".").pop() ?? "";
                const Icon = FILE_ICONS[extension] ?? FileText;
                return (
                  <div key={file.path} className="group flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-white/[0.02]">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-background/50 text-muted-strong">
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-mono text-[11px] text-muted-strong">{file.path}</div>
                      <div className="text-[9px] text-muted">{(file.size / 1024).toFixed(1)} KB</div>
                    </div>
                    <div className="flex items-center gap-1 opacity-70 transition-opacity group-hover:opacity-100">
                      <Button variant="ghost" size="icon-sm" onClick={() => preview(file.path)} disabled={previewLoading === file.path} aria-label={`Preview ${file.path}`}>
                        {previewLoading === file.path ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Eye className="h-3.5 w-3.5" />}
                      </Button>
                      <a
                        href={`/api/projects/${project.id}/export?file=${encodeURIComponent(file.path)}&includeIssues=1`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-surface-raised hover:text-foreground"
                        aria-label={`Download ${file.path}`}
                      >
                        <Download className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold">Export history</div>
                <div className="mt-0.5 text-[10px] text-muted">Every download is recorded locally.</div>
              </div>
              <Badge variant="outline">{history.length}</Badge>
            </div>
            {history.length === 0 ? (
              <p className="mt-3 text-[11px] text-muted">No exports yet.</p>
            ) : (
              <div className="mt-3 divide-y divide-border/60">
                {history.slice(0, 8).map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between py-2 text-[11px]">
                    <div>
                      <span className="font-mono text-accent">v{entry.prdVersion}</span>
                      <span className="ml-2 text-muted">{formatDate(entry.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-muted">
                      <span>{entry.files} files</span>
                      <span>{formatRelative(entry.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-3">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted">Export gate</div>
                <div className="mt-0.5 text-xs text-muted">
                  {readiness.canExport ? "All checks passed." : "Review issues remain."}
                </div>
              </div>
              <ScoreRing score={readiness.score} size={70} label="Score" />
            </div>
            <Progress value={readiness.score} className="mt-2" indicatorClassName={readiness.canExport ? "bg-accent" : "bg-warning"} />
            <div className="mt-3 space-y-1.5 text-[10px]">
              {readiness.checks.slice(0, 4).map((check) => (
                <div key={check.label} className="flex items-start gap-1.5">
                  {check.passed ? <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-accent" /> : <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-warning" />}
                  <span className="text-muted">{check.label}</span>
                </div>
              ))}
            </div>
            {!readiness.canExport ? (
              <div className="mt-3 rounded-lg border border-warning/25 bg-warning/[0.05] p-2.5 text-[10px] leading-relaxed text-muted">
                Export is blocked by {readiness.stats.openBlockers} blocker(s), {majorIssues} major
                issue(s), and a score of {readiness.score}. You can override and include{" "}
                <span className="text-muted-strong">OPEN_ISSUES.md</span>.
              </div>
            ) : null}
            <Button className="mt-3 w-full" size="sm" onClick={() => download(false)} disabled={downloading}>
              {downloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
              Download ZIP
            </Button>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 text-xs font-semibold">
              <ShieldCheck className="h-3.5 w-3.5 text-accent" />
              What the agent gets
            </div>
            <ul className="mt-2.5 space-y-1.5 text-[10px] leading-relaxed text-muted">
              <li>• A single ordered task plan with dependencies</li>
              <li>• Acceptance criteria and Definition of Done</li>
              <li>• Architecture, data model, and API contracts</li>
              <li>• Mermaid diagrams for flow and task graph</li>
              <li>• Execution rules and scope guardrails</li>
            </ul>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 text-xs font-semibold">
              <FileJson className="h-3.5 w-3.5 text-info" />
              Machine-readable
            </div>
            <p className="mt-1.5 text-[10px] leading-relaxed text-muted">
              Use <span className="font-mono text-muted-strong">TASKS.json</span> or{" "}
              <span className="font-mono text-muted-strong">prd.json</span> to sync the plan into
              your own tooling without parsing Markdown.
            </p>
          </Card>
        </div>
      </div>

      <Dialog
        open={overrideOpen}
        onOpenChange={setOverrideOpen}
        title="Export with open issues?"
        description="The bundle will include OPEN_ISSUES.md so the implementation agent can see the unresolved findings."
        footer={
          <>
            <Button variant="ghost" onClick={() => setOverrideOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={() => download(true)} disabled={downloading}>
              {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Download with issues
            </Button>
          </>
        }
      >
        <div className="space-y-2">
          {readiness.issues.slice(0, 8).map((issue) => (
            <div key={issue.id} className="flex items-start gap-2 rounded-lg border border-border bg-background/40 p-2.5">
              <AlertTriangle className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", issue.severity === "blocker" ? "text-danger" : "text-warning")} />
              <div>
                <div className="text-[11px] text-muted-strong">{issue.message}</div>
                <div className="text-[10px] text-muted">{issue.fixHint}</div>
              </div>
            </div>
          ))}
          {readiness.issues.length > 8 ? (
            <div className="text-[10px] text-muted">And {readiness.issues.length - 8} more in OPEN_ISSUES.md.</div>
          ) : null}
        </div>
      </Dialog>

      <Dialog
        open={Boolean(previewFile)}
        onOpenChange={() => setPreviewFile(null)}
        title={previewFile?.path ?? "File preview"}
        description="Preview of the generated export file."
        size="xl"
        footer={
          previewFile ? (
            <>
              <Button variant="ghost" onClick={() => setPreviewFile(null)}>Close</Button>
              <Button
                variant="secondary"
                onClick={async () => {
                  await navigator.clipboard.writeText(previewFile.content);
                  toast.success("File copied.");
                }}
              >
                <ClipboardCopy className="h-4 w-4" /> Copy
              </Button>
            </>
          ) : null
        }
      >
        <pre className="max-h-[60vh] overflow-auto whitespace-pre-wrap rounded-xl border border-border bg-background/60 p-4 font-mono text-[10px] leading-relaxed text-muted-strong">
          {previewFile?.content}
        </pre>
      </Dialog>
    </div>
  );
}
