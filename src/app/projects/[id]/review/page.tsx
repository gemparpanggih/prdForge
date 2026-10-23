import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Circle,
  ClipboardCheck,
  Download,
  ExternalLink,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import {
  calculateReadiness,
  getProject,
} from "@/server/projects";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Progress, ScoreRing } from "@/components/ui/progress";
import { ReviewRefresh } from "@/components/review/review-refresh";
import { getServerPreferences } from "@/lib/i18n-server";

export const metadata = {
  title: "Review — PRD Forge",
};

const categoryLink: Record<string, string> = {
  completeness: "prd",
  testability: "prd",
  consistency: "prd",
  traceability: "tasks",
  dependency: "tasks",
  nfr: "prd",
  ambiguity: "prd",
};

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { t } = await getServerPreferences();
  const project = await getProject(id);
  if (!project) return null;
  const { report, prd, tasks, flow } = await calculateReadiness(id);

  if (!prd) {
    return (
      <div className="mx-auto w-full max-w-3xl px-5 py-12 md:px-8">
        <EmptyState
          icon={ClipboardCheck}
          title={t("Nothing to review yet")}
          description={t("Generate the blueprint to run completeness, testability, traceability, and dependency checks.")}
          action={
            <Link href={`/projects/${id}/interview`} className={buttonClass("primary", "md")}>
              {t("Go to discovery")}
            </Link>
          }
        />
      </div>
    );
  }

  const blockers = report.issues.filter((issue) => issue.severity === "blocker");
  const majors = report.issues.filter((issue) => issue.severity === "major");
  const minors = report.issues.filter((issue) => issue.severity === "minor");

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-5 md:px-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/[0.06] px-3 py-1 text-[10px] font-medium text-accent">
            <ShieldCheck className="h-3 w-3" />
            {t("Readiness review")}
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-[-0.035em]">{t("Is it ready to build?")}</h1>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">
            {t("The review checks completeness, observable acceptance criteria, traceability, flow coverage, dependency integrity, and unresolved decisions.")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ReviewRefresh />
          <Link
            href={`/projects/${id}/export`}
            className={buttonClass(report.canExport ? "primary" : "secondary", "sm")}
          >
            <Download className="h-3.5 w-3.5" />
            {t("Export")}
          </Link>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
        <div className="space-y-3">
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted">
                  {t("Readiness score")}
                </div>
                <div className="mt-1 text-xs text-muted">
                  {report.canExport ? t("The export gate is open.") : t("Resolve blockers before export.")}
                </div>
              </div>
              <ScoreRing score={report.score} size={84} label={t("Score")} />
            </div>
            <Progress
              value={report.score}
              className="mt-3"
              indicatorClassName={report.canExport ? "bg-accent" : "bg-warning"}
            />
            <div className="mt-4 flex flex-wrap gap-1.5">
              <Badge variant={report.canExport ? "success" : "danger"}>
                {report.canExport ? t("Gate passed") : t("Gate blocked")}
              </Badge>
              <Badge variant="outline">{report.stats.requirements} requirements</Badge>
              <Badge variant="outline">{report.stats.tasks} tasks</Badge>
            </div>
          </Card>

          <Card className="p-4">
            <div className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted">
              {t("Findings")}
            </div>
            <div className="mt-3 space-y-2">
              <FindingRow label={t("Blockers")} value={blockers.length} tone="danger" />
              <FindingRow label={t("Major")} value={majors.length} tone="warning" />
              <FindingRow label={t("Minor")} value={minors.length} tone="info" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted">
              {t("Traceability")}
            </div>
            <div className="mt-3 space-y-2 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-muted">{t("Requirements covered")}</span>
                <span className="font-medium">{report.stats.coveredRequirements}/{report.stats.requirements}</span>
              </div>
              <Progress value={report.stats.requirements ? (report.stats.coveredRequirements / report.stats.requirements) * 100 : 0} />
              <div className="flex items-center justify-between pt-1">
                <span className="text-muted">{t("Flow nodes")}</span>
                <span className="font-medium">{flow.nodes.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">{t("Open blockers")}</span>
                <span className="font-medium text-danger">{report.stats.openBlockers}</span>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-xs font-semibold">{t("Quality gates")}</div>
              <span className="text-[10px] text-muted">{report.checks.filter((check) => check.passed).length}/{report.checks.length} {t("passed")}</span>
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              {report.checks.map((check) => (
                <div key={check.label} className="flex items-start gap-2 rounded-xl border border-border bg-background/30 p-3">
                  {check.passed ? (
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                  ) : (
                    <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-danger" />
                  )}
                  <div>
                    <div className="text-[11px] font-medium text-muted-strong">{check.label}</div>
                    <div className="mt-0.5 text-[10px] leading-relaxed text-muted">{check.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="text-xs font-semibold">{t("Issues to resolve")}</div>
              <div className="text-[10px] text-muted">{report.issues.length} total</div>
            </div>
            {report.issues.length === 0 ? (
              <div className="flex items-center gap-2 p-5 text-xs text-muted">
                <CheckCircle2 className="h-4 w-4 text-accent" />
                {t("No issues detected. The blueprint is internally consistent.")}
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {report.issues.map((issue) => (
                  <div key={issue.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-2.5">
                      {issue.severity === "blocker" ? (
                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-danger" />
                      ) : issue.severity === "major" ? (
                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
                      ) : (
                        <Circle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-info" />
                      )}
                      <div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <StatusBadge status={issue.severity} />
                          <Badge variant="outline">{issue.category}</Badge>
                          <span className="text-[9px] text-muted">{issue.location}</span>
                        </div>
                        <div className="mt-1 text-[11px] text-muted-strong">{issue.message}</div>
                        <div className="mt-0.5 text-[10px] text-muted">{issue.fixHint}</div>
                      </div>
                    </div>
                    <Link
                      href={`/projects/${id}/${categoryLink[issue.category] ?? "prd"}`}
                      className="inline-flex shrink-0 items-center gap-1 text-[10px] text-accent hover:underline"
                    >
                      {t("Fix")} <ExternalLink className="h-2.5 w-2.5" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="text-xs font-semibold">{t("Traceability matrix")}</div>
              <span className="text-[10px] text-muted">{t("Requirement → tasks → flow")}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left">
                <thead>
                  <tr className="border-b border-border bg-background/30 text-[9px] uppercase tracking-[0.12em] text-muted">
                    <th className="px-4 py-2 font-medium">{t("Requirement")}</th>
                    <th className="px-3 py-2 font-medium">{t("Priority")}</th>
                    <th className="px-3 py-2 font-medium">{t("Tasks")}</th>
                    <th className="px-3 py-2 font-medium">{t("Flow nodes")}</th>
                    <th className="px-3 py-2 font-medium">{t("Source")}</th>
                  </tr>
                </thead>
                <tbody>
                  {prd.functionalRequirements.map((requirement) => {
                    const linkedTasks = tasks.filter((task) => task.requirementIds.includes(requirement.id));
                    const linkedNodes = flow.nodes.filter((node) => node.requirementIds.includes(requirement.id));
                    return (
                      <tr key={requirement.id} className="border-b border-border/50 last:border-0">
                        <td className="px-4 py-2.5">
                          <div className="font-mono text-[9px] text-accent">{requirement.id}</div>
                          <div className="mt-0.5 max-w-[280px] truncate text-[11px] text-muted-strong">{requirement.title}</div>
                        </td>
                        <td className="px-3 py-2.5"><StatusBadge status={requirement.priority} /></td>
                        <td className="px-3 py-2.5">
                          <div className="flex flex-wrap gap-1">
                            {linkedTasks.length ? linkedTasks.slice(0, 3).map((task) => <Badge key={task.id} variant="muted">{task.id}</Badge>) : <span className="text-[10px] text-danger">{t("None")}</span>}
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex flex-wrap gap-1">
                            {linkedNodes.length ? linkedNodes.slice(0, 2).map((node) => <Badge key={node.id} variant="outline">{node.label}</Badge>) : <span className="text-[10px] text-muted">—</span>}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-[10px] text-muted">{requirement.source}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {report.canExport ? (
            <div className="flex flex-col items-start justify-between gap-3 rounded-2xl border border-accent/20 bg-accent/[0.04] p-4 sm:flex-row sm:items-center">
              <div>
                <div className="text-xs font-medium text-foreground">{t("Ready to export")}</div>
                <p className="mt-0.5 text-[11px] text-muted">
                  {t("The bundle will include PRD.md, TASKS.md, AGENTS.md, diagrams, and machine-readable JSON.")}
                </p>
              </div>
              <Link href={`/projects/${id}/export`} className={buttonClass("primary", "sm")}>
                {t("Open export center")} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function FindingRow({ label, value, tone }: { label: string; value: number; tone: "danger" | "warning" | "info" }) {
  const color = tone === "danger" ? "text-danger" : tone === "warning" ? "text-warning" : "text-info";
  return (
    <div className="flex items-center justify-between text-[11px]">
      <span className="text-muted">{label}</span>
      <span className={`font-semibold ${color}`}>{value}</span>
    </div>
  );
}
