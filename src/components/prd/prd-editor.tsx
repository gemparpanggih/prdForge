"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  AlertTriangle,
  BookOpen,
  Calendar,
  CheckCircle2,
  Cpu,
  Eye,
  FileText,
  FlaskConical,
  HelpCircle,
  Layers,
  ListChecks,
  Loader2,
  Palette,
  Plus,
  Route,
  Save,
  ShieldCheck,
  Target,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import type {
  ApiEndpoint,
  DataEntity,
  NFR,
  PRDContent,
  ProductFlow,
  ReadinessReport,
  Requirement,
  Risk,
} from "@/lib/types";
import { renderPrdMarkdown } from "@/lib/markdown";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Input, Label, Select, Switch, Textarea } from "@/components/ui/input";
import { Progress, ScoreRing } from "@/components/ui/progress";
import { cn, formatRelative } from "@/lib/utils";

type SectionKey =
  | "document"
  | "problem"
  | "goals"
  | "personas"
  | "journeys"
  | "scope"
  | "requirements"
  | "nfr"
  | "ux"
  | "technical"
  | "risks"
  | "questions"
  | "release"
  | "qa"
  | "glossary";

const SECTIONS: { key: SectionKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "document", label: "Document", icon: FileText },
  { key: "problem", label: "Problem", icon: Target },
  { key: "goals", label: "Goals & metrics", icon: CheckCircle2 },
  { key: "personas", label: "Personas", icon: Users },
  { key: "journeys", label: "Journeys", icon: Route },
  { key: "scope", label: "Scope", icon: Layers },
  { key: "requirements", label: "Requirements", icon: ListChecks },
  { key: "nfr", label: "Non-functional", icon: ShieldCheck },
  { key: "ux", label: "UX", icon: Palette },
  { key: "technical", label: "Technical", icon: Cpu },
  { key: "risks", label: "Risks", icon: AlertTriangle },
  { key: "questions", label: "Open questions", icon: HelpCircle },
  { key: "release", label: "Release plan", icon: Calendar },
  { key: "qa", label: "QA strategy", icon: FlaskConical },
  { key: "glossary", label: "Glossary", icon: BookOpen },
];

type SaveState = "idle" | "unsaved" | "saving" | "saved" | "error";

export function PrdEditor({
  projectId,
  projectName,
  initialContent,
  flow,
  initialReadiness,
  versions,
}: {
  projectId: string;
  projectName: string;
  initialContent: PRDContent;
  flow: ProductFlow;
  initialReadiness: ReadinessReport;
  versions: { version: number; createdAt: string; status: string; readiness: number }[];
}) {
  const router = useRouter();
  const [content, setContent] = useState(initialContent);
  const [active, setActive] = useState<SectionKey>("document");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [readiness, setReadiness] = useState(initialReadiness);
  const [previewOpen, setPreviewOpen] = useState(false);
  const dirty = useRef(false);
  const contentRef = useRef(content);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  const save = useCallback(
    async (createVersion = false) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setSaveState("saving");
      try {
        const response = await fetch(`/api/projects/${projectId}/prd`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: contentRef.current, createVersion }),
        });
        const payload = (await response.json()) as {
          version?: number;
          readiness?: ReadinessReport;
          error?: string;
        };
        if (!response.ok) throw new Error(payload.error || "Could not save the PRD.");
        dirty.current = false;
        setSaveState("saved");
        if (payload.readiness) setReadiness(payload.readiness);
        if (createVersion) {
          toast.success(`Saved as version ${payload.version}.`);
          router.refresh();
        }
      } catch (error) {
        setSaveState("error");
        toast.error(error instanceof Error ? error.message : "Could not save the PRD.");
      }
    },
    [projectId, router],
  );

  useEffect(() => {
    if (!dirty.current) return;
    setSaveState("unsaved");
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      void save(false);
    }, 1600);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [content, save]);

  function mutate(updater: (current: PRDContent) => PRDContent) {
    dirty.current = true;
    setContent((current) => updater(current));
  }

  const counts = useMemo(
    () => ({
      requirements: content.functionalRequirements.length,
      nfrs: content.nonFunctionalRequirements.length,
      risks: content.risks.length,
      questions: content.openQuestions.length,
    }),
    [content],
  );

  const saveLabel =
    saveState === "saving"
      ? "Saving…"
      : saveState === "saved"
        ? "Saved"
        : saveState === "unsaved"
          ? "Unsaved changes"
          : saveState === "error"
            ? "Save failed"
            : "All changes saved";

  return (
    <div className="mx-auto w-full max-w-[1500px] px-4 py-5 md:px-6">
      <div className="grid gap-4 lg:grid-cols-[230px_minmax(0,1fr)_280px]">
        <aside className="order-2 lg:order-1">
          <div className="sticky top-32 space-y-3">
            <Card className="p-2">
              <nav className="space-y-0.5">
                {SECTIONS.map((section) => {
                  const activeSection = active === section.key;
                  const count =
                    section.key === "requirements"
                      ? counts.requirements
                      : section.key === "nfr"
                        ? counts.nfrs
                        : section.key === "risks"
                          ? counts.risks
                          : section.key === "questions"
                            ? counts.questions
                            : null;
                  return (
                    <button
                      key={section.key}
                      type="button"
                      onClick={() => setActive(section.key)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[11px] transition-colors",
                        activeSection
                          ? "bg-accent/[0.08] text-foreground"
                          : "text-muted hover:bg-white/[0.03] hover:text-foreground",
                      )}
                    >
                      <section.icon
                        className={cn("h-3.5 w-3.5", activeSection ? "text-accent" : "text-muted")}
                      />
                      <span className="flex-1">{section.label}</span>
                      {count !== null ? (
                        <span className="rounded-full bg-white/[0.05] px-1.5 py-0.5 text-[9px] text-muted">
                          {count}
                        </span>
                      ) : null}
                      {activeSection ? <span className="h-1 w-1 rounded-full bg-accent" /> : null}
                    </button>
                  );
                })}
              </nav>
            </Card>
            <div className="px-1 text-[10px] leading-relaxed text-muted">
              Autosaves to the current version. Use <span className="text-muted-strong">Save version</span> to
              create an immutable snapshot.
            </div>
          </div>
        </aside>

        <main className="order-1 min-w-0 lg:order-2">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface/70 px-4 py-3">
            <div>
              <div className="text-sm font-semibold tracking-tight">
                {SECTIONS.find((section) => section.key === active)?.label}
              </div>
              <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-muted">
                {saveState === "saving" ? (
                  <Loader2 className="h-2.5 w-2.5 animate-spin" />
                ) : saveState === "error" ? (
                  <AlertTriangle className="h-2.5 w-2.5 text-danger" />
                ) : (
                  <span className={cn("h-1.5 w-1.5 rounded-full", saveState === "saved" ? "bg-success" : "bg-muted/50")} />
                )}
                {saveLabel}
                <span className="text-muted/40">·</span>
                v{content.metadata.version}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setPreviewOpen(true)}>
                <Eye className="h-3.5 w-3.5" />
                Preview
              </Button>
              <Button variant="secondary" size="sm" onClick={() => save(false)} disabled={saveState === "saving"}>
                <Save className="h-3.5 w-3.5" />
                Save
              </Button>
              <Button size="sm" onClick={() => save(true)} disabled={saveState === "saving"}>
                Save version
              </Button>
            </div>
          </div>

          <SectionBody
            section={active}
            content={content}
            mutate={mutate}
            projectName={projectName}
          />
        </main>

        <aside className="order-3">
          <div className="sticky top-32 space-y-3">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted">
                    Document health
                  </div>
                  <div className="mt-0.5 text-[10px] text-muted">
                    {readiness.canExport ? "Ready to export" : "Needs attention"}
                  </div>
                </div>
                <ScoreRing score={readiness.score} size={64} label="Score" />
              </div>
              <Progress
                value={readiness.score}
                className="mt-2"
                indicatorClassName={readiness.canExport ? "bg-accent" : "bg-warning"}
              />
              <div className="mt-3 grid grid-cols-2 gap-2 text-center">
                <Stat label="Requirements" value={counts.requirements} />
                <Stat label="NFRs" value={counts.nfrs} />
                <Stat label="Risks" value={counts.risks} />
                <Stat label="Questions" value={counts.questions} />
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Badge variant="outline">{readiness.stats.coveredRequirements}/{readiness.stats.requirements} traced</Badge>
                {readiness.issues.filter((issue) => issue.severity === "blocker").length ? (
                  <Badge variant="danger">
                    {readiness.issues.filter((issue) => issue.severity === "blocker").length} blockers
                  </Badge>
                ) : (
                  <Badge variant="success">No blockers</Badge>
                )}
              </div>
            </Card>

            <Card className="p-4">
              <div className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted">
                Version history
              </div>
              <div className="mt-3 space-y-2">
                {versions.slice(0, 6).map((version) => (
                  <div key={version.version} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-muted-strong">v{version.version}</span>
                      <span className="text-[10px] text-muted">{formatRelative(version.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-muted">{version.readiness}%</span>
                      <StatusBadge status={version.status === "draft" ? "draft" : version.status} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <div className="rounded-2xl border border-border bg-surface/40 p-4 text-[10px] leading-relaxed text-muted">
              Requirement IDs and flow links stay stable across edits. The readiness score updates
              after each save and again on the Review page.
            </div>
          </div>
        </aside>
      </div>

      <Dialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        title="PRD preview"
        description="Rendered from the structured content and current product flow."
        size="xl"
      >
        <div className="markdown-preview max-h-[65vh] overflow-y-auto pr-2">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {renderPrdMarkdown(content, flow)}
          </ReactMarkdown>
        </div>
      </Dialog>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-background/40 px-2 py-1.5">
      <div className="text-sm font-semibold leading-none">{value}</div>
      <div className="mt-1 text-[9px] uppercase tracking-wide text-muted">{label}</div>
    </div>
  );
}

function SectionBody({
  section,
  content,
  mutate,
  projectName,
}: {
  section: SectionKey;
  content: PRDContent;
  mutate: (updater: (current: PRDContent) => PRDContent) => void;
  projectName: string;
}) {
  switch (section) {
    case "document":
      return (
        <SectionShell title="Document" description="Identity, status, and the one-paragraph summary a busy reader needs.">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Title">
              <Input
                value={content.metadata.title}
                onChange={(event) =>
                  mutate((current) => ({
                    ...current,
                    metadata: { ...current.metadata, title: event.target.value },
                  }))
                }
              />
            </Field>
            <Field label="Owner">
              <Input
                value={content.metadata.owner}
                onChange={(event) =>
                  mutate((current) => ({
                    ...current,
                    metadata: { ...current.metadata, owner: event.target.value },
                  }))
                }
              />
            </Field>
            <Field label="Status">
              <Select
                value={content.metadata.status}
                onChange={(event) =>
                  mutate((current) => ({
                    ...current,
                    metadata: {
                      ...current.metadata,
                      status: event.target.value as PRDContent["metadata"]["status"],
                    },
                  }))
                }
              >
                <option value="draft">Draft</option>
                <option value="in-review">In review</option>
                <option value="approved">Approved</option>
              </Select>
            </Field>
            <Field label="Version / date">
              <div className="flex h-10 items-center rounded-xl border border-border bg-background/40 px-3 text-xs text-muted">
                v{content.metadata.version} · {content.metadata.date}
              </div>
            </Field>
          </div>
          <Field label="Executive summary">
            <Textarea
              rows={6}
              value={content.executiveSummary}
              onChange={(event) =>
                mutate((current) => ({ ...current, executiveSummary: event.target.value }))
              }
            />
          </Field>
          <div className="rounded-xl border border-border bg-background/30 p-3 text-[11px] leading-relaxed text-muted">
            {projectName} · {content.functionalRequirements.length} requirements ·{" "}
            {content.nonFunctionalRequirements.length} NFRs · {content.releasePlan.length} milestones
          </div>
        </SectionShell>
      );

    case "problem":
      return (
        <SectionShell title="Problem & background" description="Make the pain concrete and the evidence inspectable.">
          <Field label="Problem statement">
            <Textarea
              rows={4}
              value={content.problem.statement}
              onChange={(event) =>
                mutate((current) => ({
                  ...current,
                  problem: { ...current.problem, statement: event.target.value },
                }))
              }
            />
          </Field>
          <Field label="Current state">
            <Textarea
              rows={4}
              value={content.problem.currentState}
              onChange={(event) =>
                mutate((current) => ({
                  ...current,
                  problem: { ...current.problem, currentState: event.target.value },
                }))
              }
            />
          </Field>
          <ListEditor
            label="Evidence and context"
            items={content.problem.evidence}
            onChange={(items) =>
              mutate((current) => ({
                ...current,
                problem: { ...current.problem, evidence: items },
              }))
            }
            hint="One evidence item per line. Prefer observations, ticket counts, or interview quotes."
          />
        </SectionShell>
      );

    case "goals":
      return (
        <SectionShell
          title="Goals & success metrics"
          description="Outcomes, measurable targets, and the things you deliberately will not optimize."
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                mutate((current) => ({
                  ...current,
                  goals: {
                    ...current.goals,
                    objectives: [
                      ...current.goals.objectives,
                      { id: `goal-${Date.now()}`, statement: "", metric: "", target: "" },
                    ],
                  },
                }))
              }
            >
              <Plus className="h-3.5 w-3.5" /> Objective
            </Button>
          }
        >
          <GoalList
            label="Objectives"
            items={content.goals.objectives}
            onChange={(items) => mutate((current) => ({ ...current, goals: { ...current.goals, objectives: items } }))}
          />
          <GoalList
            label="Success metrics"
            items={content.goals.successMetrics}
            onChange={(items) => mutate((current) => ({ ...current, goals: { ...current.goals, successMetrics: items } }))}
          />
          <ListEditor
            label="Non-goals"
            items={content.goals.nonGoals}
            onChange={(items) => mutate((current) => ({ ...current, goals: { ...current.goals, nonGoals: items } }))}
            hint="Explicit exclusions protect the first release from scope creep."
          />
        </SectionShell>
      );

    case "personas":
      return (
        <SectionShell
          title="Personas"
          description="Roles with goals and friction. Keep them grounded in the discovery answers."
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                mutate((current) => ({
                  ...current,
                  personas: [
                    ...current.personas,
                    { id: `persona-${Date.now()}`, name: "", role: "", goals: [], painPoints: [] },
                  ],
                }))
              }
            >
              <Plus className="h-3.5 w-3.5" /> Persona
            </Button>
          }
        >
          {content.personas.map((persona, index) => (
            <Card key={persona.id} className="space-y-3 p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[10px] text-muted">Persona {index + 1}</span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() =>
                    mutate((current) => ({
                      ...current,
                      personas: current.personas.filter((item) => item.id !== persona.id),
                    }))
                  }
                  aria-label="Remove persona"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Name">
                  <Input
                    value={persona.name}
                    onChange={(event) =>
                      mutate((current) => ({
                        ...current,
                        personas: current.personas.map((item) =>
                          item.id === persona.id ? { ...item, name: event.target.value } : item,
                        ),
                      }))
                    }
                  />
                </Field>
                <Field label="Role">
                  <Input
                    value={persona.role}
                    onChange={(event) =>
                      mutate((current) => ({
                        ...current,
                        personas: current.personas.map((item) =>
                          item.id === persona.id ? { ...item, role: event.target.value } : item,
                        ),
                      }))
                    }
                  />
                </Field>
              </div>
              <ListEditor
                label="Goals"
                items={persona.goals}
                onChange={(items) =>
                  mutate((current) => ({
                    ...current,
                    personas: current.personas.map((item) =>
                      item.id === persona.id ? { ...item, goals: items } : item,
                    ),
                  }))
                }
                compact
              />
              <ListEditor
                label="Pain points"
                items={persona.painPoints}
                onChange={(items) =>
                  mutate((current) => ({
                    ...current,
                    personas: current.personas.map((item) =>
                      item.id === persona.id ? { ...item, painPoints: items } : item,
                    ),
                  }))
                }
                compact
              />
            </Card>
          ))}
        </SectionShell>
      );

    case "journeys":
      return (
        <SectionShell
          title="User journeys"
          description="The end-to-end path, including the trigger and the successful outcome."
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                mutate((current) => ({
                  ...current,
                  journeys: [
                    ...current.journeys,
                    { id: `journey-${Date.now()}`, name: "", persona: "", steps: [] },
                  ],
                }))
              }
            >
              <Plus className="h-3.5 w-3.5" /> Journey
            </Button>
          }
        >
          {content.journeys.map((journey) => (
            <Card key={journey.id} className="space-y-3 p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="grid flex-1 gap-3 md:grid-cols-2">
                  <Field label="Journey name">
                    <Input
                      value={journey.name}
                      onChange={(event) =>
                        mutate((current) => ({
                          ...current,
                          journeys: current.journeys.map((item) =>
                            item.id === journey.id ? { ...item, name: event.target.value } : item,
                          ),
                        }))
                      }
                    />
                  </Field>
                  <Field label="Persona">
                    <Input
                      value={journey.persona}
                      onChange={(event) =>
                        mutate((current) => ({
                          ...current,
                          journeys: current.journeys.map((item) =>
                            item.id === journey.id ? { ...item, persona: event.target.value } : item,
                          ),
                        }))
                      }
                    />
                  </Field>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() =>
                    mutate((current) => ({
                      ...current,
                      journeys: current.journeys.filter((item) => item.id !== journey.id),
                    }))
                  }
                  aria-label="Remove journey"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              <StepEditor
                steps={journey.steps}
                onChange={(steps) =>
                  mutate((current) => ({
                    ...current,
                    journeys: current.journeys.map((item) =>
                      item.id === journey.id ? { ...item, steps } : item,
                    ),
                  }))
                }
              />
            </Card>
          ))}
        </SectionShell>
      );

    case "scope":
      return (
        <SectionShell title="Scope & constraints" description="What ships, what does not, and what the plan assumes to be true.">
          <div className="grid gap-4 md:grid-cols-2">
            <ListEditor
              label="In scope"
              items={content.scope.inScope}
              onChange={(items) => mutate((current) => ({ ...current, scope: { ...current.scope, inScope: items } }))}
            />
            <ListEditor
              label="Out of scope"
              items={content.scope.outOfScope}
              onChange={(items) => mutate((current) => ({ ...current, scope: { ...current.scope, outOfScope: items } }))}
            />
            <ListEditor
              label="Assumptions"
              items={content.scope.assumptions}
              onChange={(items) => mutate((current) => ({ ...current, scope: { ...current.scope, assumptions: items } }))}
              hint="Anything the AI inferred belongs here."
            />
            <ListEditor
              label="Constraints"
              items={content.scope.constraints}
              onChange={(items) => mutate((current) => ({ ...current, scope: { ...current.scope, constraints: items } }))}
            />
            <ListEditor
              label="Dependencies"
              items={content.scope.dependencies}
              onChange={(items) => mutate((current) => ({ ...current, scope: { ...current.scope, dependencies: items } }))}
            />
          </div>
        </SectionShell>
      );

    case "requirements":
      return (
        <SectionShell
          title="Functional requirements"
          description="Every requirement needs observable acceptance criteria. IDs are stable references for tasks and flow nodes."
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                mutate((current) => {
                  const requirement: Requirement = {
                    id: nextNumericId(
                      "FR",
                      current.functionalRequirements.map((item) => item.id),
                    ),
                    title: "",
                    description: "",
                    priority: "should",
                    acceptanceCriteria: [],
                    edgeCases: [],
                    source: "user",
                    flowNodeIds: [],
                    status: "draft",
                  };
                  return {
                    ...current,
                    functionalRequirements: [...current.functionalRequirements, requirement],
                  };
                })
              }
            >
              <Plus className="h-3.5 w-3.5" /> Requirement
            </Button>
          }
        >
          {content.functionalRequirements.map((requirement) => (
            <Card key={requirement.id} className="space-y-3 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-accent">{requirement.id}</span>
                  <Badge variant="outline">{requirement.source}</Badge>
                  {requirement.flowNodeIds.length ? (
                    <Badge variant="info">{requirement.flowNodeIds.length} flow links</Badge>
                  ) : null}
                </div>
                <div className="flex items-center gap-1">
                  <Select
                    className="h-7 w-[92px] text-[10px]"
                    value={requirement.priority}
                    onChange={(event) =>
                      mutate((current) => ({
                        ...current,
                        functionalRequirements: current.functionalRequirements.map((item) =>
                          item.id === requirement.id
                            ? { ...item, priority: event.target.value as Requirement["priority"] }
                            : item,
                        ),
                      }))
                    }
                  >
                    <option value="must">Must</option>
                    <option value="should">Should</option>
                    <option value="could">Could</option>
                    <option value="wont">Won&apos;t</option>
                  </Select>
                  <StatusBadge status={requirement.status} />
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() =>
                      mutate((current) => ({
                        ...current,
                        functionalRequirements: current.functionalRequirements.filter(
                          (item) => item.id !== requirement.id,
                        ),
                      }))
                    }
                    aria-label="Remove requirement"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <Field label="Title">
                <Input
                  value={requirement.title}
                  onChange={(event) =>
                    mutate((current) => ({
                      ...current,
                      functionalRequirements: current.functionalRequirements.map((item) =>
                        item.id === requirement.id ? { ...item, title: event.target.value } : item,
                      ),
                    }))
                  }
                />
              </Field>
              <Field label="Description">
                <Textarea
                  rows={3}
                  value={requirement.description}
                  onChange={(event) =>
                    mutate((current) => ({
                      ...current,
                      functionalRequirements: current.functionalRequirements.map((item) =>
                        item.id === requirement.id ? { ...item, description: event.target.value } : item,
                      ),
                    }))
                  }
                />
              </Field>
              <div className="grid gap-3 md:grid-cols-2">
                <ListEditor
                  label="Acceptance criteria"
                  items={requirement.acceptanceCriteria}
                  onChange={(items) =>
                    mutate((current) => ({
                      ...current,
                      functionalRequirements: current.functionalRequirements.map((item) =>
                        item.id === requirement.id ? { ...item, acceptanceCriteria: items } : item,
                      ),
                    }))
                  }
                  compact
                />
                <ListEditor
                  label="Edge cases"
                  items={requirement.edgeCases}
                  onChange={(items) =>
                    mutate((current) => ({
                      ...current,
                      functionalRequirements: current.functionalRequirements.map((item) =>
                        item.id === requirement.id ? { ...item, edgeCases: items } : item,
                      ),
                    }))
                  }
                  compact
                />
              </div>
            </Card>
          ))}
        </SectionShell>
      );

    case "nfr":
      return (
        <SectionShell
          title="Non-functional requirements"
          description="Security, performance, reliability, accessibility, privacy, and operations with measurable targets."
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                mutate((current) => ({
                  ...current,
                  nonFunctionalRequirements: [
                    ...current.nonFunctionalRequirements,
                    {
                      id: nextNumericId(
                        "NFR",
                        current.nonFunctionalRequirements.map((item) => item.id),
                      ),
                      category: "performance",
                      title: "",
                      requirement: "",
                      target: "",
                      priority: "should",
                    } satisfies NFR,
                  ],
                }))
              }
            >
              <Plus className="h-3.5 w-3.5" /> NFR
            </Button>
          }
        >
          {content.nonFunctionalRequirements.map((nfr) => (
            <Card key={nfr.id} className="space-y-3 p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[10px] text-accent">{nfr.id}</span>
                <div className="flex items-center gap-1">
                  <Select
                    className="h-7 w-[120px] text-[10px]"
                    value={nfr.category}
                    onChange={(event) =>
                      mutate((current) => ({
                        ...current,
                        nonFunctionalRequirements: current.nonFunctionalRequirements.map((item) =>
                          item.id === nfr.id
                            ? { ...item, category: event.target.value as NFR["category"] }
                            : item,
                        ),
                      }))
                    }
                  >
                    {["security", "performance", "reliability", "accessibility", "privacy", "observability", "scalability", "compliance"].map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </Select>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() =>
                      mutate((current) => ({
                        ...current,
                        nonFunctionalRequirements: current.nonFunctionalRequirements.filter(
                          (item) => item.id !== nfr.id,
                        ),
                      }))
                    }
                    aria-label="Remove NFR"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Title">
                  <Input
                    value={nfr.title}
                    onChange={(event) =>
                      mutate((current) => ({
                        ...current,
                        nonFunctionalRequirements: current.nonFunctionalRequirements.map((item) =>
                          item.id === nfr.id ? { ...item, title: event.target.value } : item,
                        ),
                      }))
                    }
                  />
                </Field>
                <Field label="Priority">
                  <Select
                    value={nfr.priority}
                    onChange={(event) =>
                      mutate((current) => ({
                        ...current,
                        nonFunctionalRequirements: current.nonFunctionalRequirements.map((item) =>
                          item.id === nfr.id
                            ? { ...item, priority: event.target.value as NFR["priority"] }
                            : item,
                        ),
                      }))
                    }
                  >
                    <option value="must">Must</option>
                    <option value="should">Should</option>
                    <option value="could">Could</option>
                  </Select>
                </Field>
              </div>
              <Field label="Requirement">
                <Textarea
                  rows={3}
                  value={nfr.requirement}
                  onChange={(event) =>
                    mutate((current) => ({
                      ...current,
                      nonFunctionalRequirements: current.nonFunctionalRequirements.map((item) =>
                        item.id === nfr.id ? { ...item, requirement: event.target.value } : item,
                      ),
                    }))
                  }
                />
              </Field>
              <Field label="Measurable target">
                <Input
                  value={nfr.target}
                  onChange={(event) =>
                    mutate((current) => ({
                      ...current,
                      nonFunctionalRequirements: current.nonFunctionalRequirements.map((item) =>
                        item.id === nfr.id ? { ...item, target: event.target.value } : item,
                      ),
                    }))
                  }
                />
              </Field>
            </Card>
          ))}
        </SectionShell>
      );

    case "ux":
      return (
        <SectionShell title="UX requirements" description="Principles, required states, accessibility, and the flows a builder must preserve.">
          <div className="grid gap-4 md:grid-cols-3">
            <ListEditor label="Principles" items={content.ux.principles} onChange={(items) => mutate((current) => ({ ...current, ux: { ...current.ux, principles: items } }))} compact />
            <ListEditor label="Required states" items={content.ux.states} onChange={(items) => mutate((current) => ({ ...current, ux: { ...current.ux, states: items } }))} compact />
            <ListEditor label="Accessibility" items={content.ux.accessibility} onChange={(items) => mutate((current) => ({ ...current, ux: { ...current.ux, accessibility: items } }))} compact />
          </div>
          {content.ux.flows.map((uxFlow, flowIndex) => (
            <Card key={`ux-flow-${flowIndex}`} className="space-y-3 p-4">
              <Field label="UX flow name">
                <Input
                  value={uxFlow.name}
                  onChange={(event) =>
                    mutate((current) => ({
                      ...current,
                      ux: {
                        ...current.ux,
                        flows: current.ux.flows.map((item, itemIndex) =>
                          itemIndex === flowIndex ? { ...item, name: event.target.value } : item,
                        ),
                      },
                    }))
                  }
                />
              </Field>
              <ListEditor
                label="Steps"
                items={uxFlow.steps}
                onChange={(items) =>
                  mutate((current) => ({
                    ...current,
                    ux: {
                      ...current.ux,
                      flows: current.ux.flows.map((item, itemIndex) =>
                        itemIndex === flowIndex ? { ...item, steps: items } : item,
                      ),
                    },
                  }))
                }
                compact
              />
            </Card>
          ))}
        </SectionShell>
      );

    case "technical":
      return (
        <SectionShell title="Technical blueprint" description="Stack, entities, API contracts, security controls, and deployment expectations.">
          <Field label="Overview">
            <Textarea
              rows={4}
              value={content.technical.overview}
              onChange={(event) => mutate((current) => ({ ...current, technical: { ...current.technical, overview: event.target.value } }))}
            />
          </Field>
          <Field label="Deployment">
            <Textarea
              rows={3}
              value={content.technical.deployment}
              onChange={(event) => mutate((current) => ({ ...current, technical: { ...current.technical, deployment: event.target.value } }))}
            />
          </Field>
          <div className="grid gap-4 md:grid-cols-2">
            <ListEditor label="Integrations" items={content.technical.integrations} onChange={(items) => mutate((current) => ({ ...current, technical: { ...current.technical, integrations: items } }))} />
            <ListEditor label="Security controls" items={content.technical.security} onChange={(items) => mutate((current) => ({ ...current, technical: { ...current.technical, security: items } }))} />
          </div>

          <Subsection
            title={`Stack (${content.technical.stack.length})`}
            action={
              <Button variant="ghost" size="sm" onClick={() => mutate((current) => ({ ...current, technical: { ...current.technical, stack: [...current.technical.stack, { layer: "", choice: "", rationale: "" }] } }))}>
                <Plus className="h-3.5 w-3.5" /> Add
              </Button>
            }
          >
            {content.technical.stack.map((item, index) => (
              <div key={`stack-${index}`} className="grid gap-2 rounded-xl border border-border bg-background/30 p-3 md:grid-cols-[0.7fr_1fr_1.3fr_auto]">
                <Input placeholder="Layer" value={item.layer} onChange={(event) => mutate((current) => ({ ...current, technical: { ...current.technical, stack: current.technical.stack.map((entry, entryIndex) => entryIndex === index ? { ...entry, layer: event.target.value } : entry) } }))} />
                <Input placeholder="Choice" value={item.choice} onChange={(event) => mutate((current) => ({ ...current, technical: { ...current.technical, stack: current.technical.stack.map((entry, entryIndex) => entryIndex === index ? { ...entry, choice: event.target.value } : entry) } }))} />
                <Input placeholder="Rationale" value={item.rationale} onChange={(event) => mutate((current) => ({ ...current, technical: { ...current.technical, stack: current.technical.stack.map((entry, entryIndex) => entryIndex === index ? { ...entry, rationale: event.target.value } : entry) } }))} />
                <Button variant="ghost" size="icon-sm" onClick={() => mutate((current) => ({ ...current, technical: { ...current.technical, stack: current.technical.stack.filter((_, entryIndex) => entryIndex !== index) } }))} aria-label="Remove stack item"><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            ))}
          </Subsection>

          <Subsection
            title={`Data model (${content.technical.dataModel.length})`}
            action={
              <Button variant="ghost" size="sm" onClick={() => mutate((current) => ({ ...current, technical: { ...current.technical, dataModel: [...current.technical.dataModel, { name: "", description: "", fields: [], relationships: [] }] } }))}>
                <Plus className="h-3.5 w-3.5" /> Entity
              </Button>
            }
          >
            {content.technical.dataModel.map((entity, index) => (
              <DataEntityEditor
                key={`entity-${index}`}
                entity={entity}
                onChange={(next) => mutate((current) => ({ ...current, technical: { ...current.technical, dataModel: current.technical.dataModel.map((entry, entryIndex) => entryIndex === index ? next : entry) } }))}
                onRemove={() => mutate((current) => ({ ...current, technical: { ...current.technical, dataModel: current.technical.dataModel.filter((_, entryIndex) => entryIndex !== index) } }))}
              />
            ))}
          </Subsection>

          <Subsection
            title={`API endpoints (${content.technical.apiEndpoints.length})`}
            action={
              <Button variant="ghost" size="sm" onClick={() => mutate((current) => ({ ...current, technical: { ...current.technical, apiEndpoints: [...current.technical.apiEndpoints, { method: "GET", path: "", purpose: "", auth: "", request: "", response: "" }] } }))}>
                <Plus className="h-3.5 w-3.5" /> Endpoint
              </Button>
            }
          >
            {content.technical.apiEndpoints.map((endpoint, index) => (
              <ApiEndpointEditor
                key={`endpoint-${index}`}
                endpoint={endpoint}
                onChange={(next) => mutate((current) => ({ ...current, technical: { ...current.technical, apiEndpoints: current.technical.apiEndpoints.map((entry, entryIndex) => entryIndex === index ? next : entry) } }))}
                onRemove={() => mutate((current) => ({ ...current, technical: { ...current.technical, apiEndpoints: current.technical.apiEndpoints.filter((_, entryIndex) => entryIndex !== index) } }))}
              />
            ))}
          </Subsection>
        </SectionShell>
      );

    case "risks":
      return (
        <SectionShell
          title="Risks"
          description="Likelihood, impact, mitigation, and an accountable owner."
          action={
            <Button variant="secondary" size="sm" onClick={() => mutate((current) => ({ ...current, risks: [...current.risks, { id: nextNumericId("RISK", current.risks.map((item) => item.id)), title: "", likelihood: "medium", impact: "medium", mitigation: "", owner: "" } satisfies Risk] }))}>
              <Plus className="h-3.5 w-3.5" /> Risk
            </Button>
          }
        >
          {content.risks.map((risk) => (
            <Card key={risk.id} className="space-y-3 p-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-accent">{risk.id}</span>
                <Button variant="ghost" size="icon-sm" onClick={() => mutate((current) => ({ ...current, risks: current.risks.filter((item) => item.id !== risk.id) }))} aria-label="Remove risk"><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
              <Field label="Risk">
                <Input value={risk.title} onChange={(event) => mutate((current) => ({ ...current, risks: current.risks.map((item) => item.id === risk.id ? { ...item, title: event.target.value } : item) }))} />
              </Field>
              <div className="grid gap-3 md:grid-cols-3">
                <Field label="Likelihood">
                  <Select value={risk.likelihood} onChange={(event) => mutate((current) => ({ ...current, risks: current.risks.map((item) => item.id === risk.id ? { ...item, likelihood: event.target.value as Risk["likelihood"] } : item) }))}>
                    <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
                  </Select>
                </Field>
                <Field label="Impact">
                  <Select value={risk.impact} onChange={(event) => mutate((current) => ({ ...current, risks: current.risks.map((item) => item.id === risk.id ? { ...item, impact: event.target.value as Risk["impact"] } : item) }))}>
                    <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
                  </Select>
                </Field>
                <Field label="Owner">
                  <Input value={risk.owner} onChange={(event) => mutate((current) => ({ ...current, risks: current.risks.map((item) => item.id === risk.id ? { ...item, owner: event.target.value } : item) }))} />
                </Field>
              </div>
              <Field label="Mitigation">
                <Textarea rows={2} value={risk.mitigation} onChange={(event) => mutate((current) => ({ ...current, risks: current.risks.map((item) => item.id === risk.id ? { ...item, mitigation: event.target.value } : item) }))} />
              </Field>
            </Card>
          ))}
        </SectionShell>
      );

    case "questions":
      return (
        <SectionShell
          title="Open questions"
          description="Unknowns stay visible. A blocking question prevents export until it is resolved or explicitly downgraded."
          action={
            <Button variant="secondary" size="sm" onClick={() => mutate((current) => ({ ...current, openQuestions: [...current.openQuestions, { id: nextNumericId("OQ", current.openQuestions.map((item) => item.id)), question: "", owner: "", blocking: false, resolution: "" }] }))}>
              <Plus className="h-3.5 w-3.5" /> Question
            </Button>
          }
        >
          {content.openQuestions.map((question) => (
            <Card key={question.id} className="space-y-3 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-accent">{question.id}</span>
                  {question.blocking ? <Badge variant="danger">Blocking</Badge> : <Badge variant="muted">Non-blocking</Badge>}
                </div>
                <Button variant="ghost" size="icon-sm" onClick={() => mutate((current) => ({ ...current, openQuestions: current.openQuestions.filter((item) => item.id !== question.id) }))} aria-label="Remove question"><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
              <Field label="Question">
                <Textarea rows={2} value={question.question} onChange={(event) => mutate((current) => ({ ...current, openQuestions: current.openQuestions.map((item) => item.id === question.id ? { ...item, question: event.target.value } : item) }))} />
              </Field>
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Owner">
                  <Input value={question.owner} onChange={(event) => mutate((current) => ({ ...current, openQuestions: current.openQuestions.map((item) => item.id === question.id ? { ...item, owner: event.target.value } : item) }))} />
                </Field>
                <Field label="Resolution">
                  <Input value={question.resolution} onChange={(event) => mutate((current) => ({ ...current, openQuestions: current.openQuestions.map((item) => item.id === question.id ? { ...item, resolution: event.target.value } : item) }))} />
                </Field>
              </div>
              <Switch checked={question.blocking} onChange={(checked) => mutate((current) => ({ ...current, openQuestions: current.openQuestions.map((item) => item.id === question.id ? { ...item, blocking: checked } : item) }))} label="Blocking release" />
            </Card>
          ))}
        </SectionShell>
      );

    case "release":
      return (
        <SectionShell title="Release plan" description="Milestones and task assignments. Task IDs are synchronized from the execution plan.">
          {content.releasePlan.map((milestone) => (
            <Card key={milestone.id} className="space-y-3 p-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-accent">{milestone.id}</span>
                <Badge variant="outline">{milestone.taskIds.length} tasks</Badge>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Name">
                  <Input value={milestone.name} onChange={(event) => mutate((current) => ({ ...current, releasePlan: current.releasePlan.map((item) => item.id === milestone.id ? { ...item, name: event.target.value } : item) }))} />
                </Field>
                <Field label="Outcome">
                  <Input value={milestone.outcome} onChange={(event) => mutate((current) => ({ ...current, releasePlan: current.releasePlan.map((item) => item.id === milestone.id ? { ...item, outcome: event.target.value } : item) }))} />
                </Field>
              </div>
              <div className="flex flex-wrap gap-1">
                {milestone.taskIds.map((taskId) => <Badge key={taskId} variant="muted">{taskId}</Badge>)}
              </div>
            </Card>
          ))}
        </SectionShell>
      );

    case "qa":
      return (
        <SectionShell title="QA strategy" description="How the team will prove the product works, and what blocks release.">
          <Field label="Strategy">
            <Textarea rows={5} value={content.qa.strategy} onChange={(event) => mutate((current) => ({ ...current, qa: { ...current.qa, strategy: event.target.value } }))} />
          </Field>
          <div className="grid gap-4 md:grid-cols-2">
            <ListEditor label="Test levels" items={content.qa.testLevels} onChange={(items) => mutate((current) => ({ ...current, qa: { ...current.qa, testLevels: items } }))} />
            <ListEditor label="Exit criteria" items={content.qa.exitCriteria} onChange={(items) => mutate((current) => ({ ...current, qa: { ...current.qa, exitCriteria: items } }))} />
          </div>
        </SectionShell>
      );

    case "glossary":
      return (
        <SectionShell title="Glossary" description="Shared language for humans and coding agents.">
          {content.glossary.map((entry, index) => (
            <div key={`glossary-${index}`} className="grid gap-2 rounded-xl border border-border bg-background/30 p-3 md:grid-cols-[0.6fr_1.4fr_auto]">
              <Input placeholder="Term" value={entry.term} onChange={(event) => mutate((current) => ({ ...current, glossary: current.glossary.map((item, itemIndex) => itemIndex === index ? { ...item, term: event.target.value } : item) }))} />
              <Input placeholder="Definition" value={entry.definition} onChange={(event) => mutate((current) => ({ ...current, glossary: current.glossary.map((item, itemIndex) => itemIndex === index ? { ...item, definition: event.target.value } : item) }))} />
              <Button variant="ghost" size="icon-sm" onClick={() => mutate((current) => ({ ...current, glossary: current.glossary.filter((_, itemIndex) => itemIndex !== index) }))} aria-label="Remove glossary entry"><Trash2 className="h-3.5 w-3.5" /></Button>
            </div>
          ))}
          <Button variant="secondary" size="sm" onClick={() => mutate((current) => ({ ...current, glossary: [...current.glossary, { term: "", definition: "" }] }))}><Plus className="h-3.5 w-3.5" /> Add term</Button>
        </SectionShell>
      );

    default:
      return null;
  }
}

function nextNumericId(prefix: string, ids: string[]): string {
  const max = ids.reduce((current, id) => {
    const value = Number(id.split("-")[1]);
    return Number.isFinite(value) ? Math.max(current, value) : current;
  }, 0);
  return `${prefix}-${String(max + 1).padStart(3, "0")}`;
}

function SectionShell({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-[-0.02em]">{title}</h2>
          <p className="mt-0.5 max-w-xl text-[11px] leading-relaxed text-muted">{description}</p>
        </div>
        {action}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function ListEditor({
  label,
  items,
  onChange,
  hint,
  compact = false,
}: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  hint?: string;
  compact?: boolean;
}) {
  const [text, setText] = useState(items.join("\n"));
  const currentItems = useRef(items);

  useEffect(() => {
    if (items !== currentItems.current) {
      currentItems.current = items;
      setText(items.join("\n"));
    }
  }, [items]);

  return (
    <div>
      <Label>{label}</Label>
      <Textarea
        rows={compact ? 3 : Math.min(7, Math.max(3, text.split("\n").length + 1))}
        value={text}
        onChange={(event) => {
          setText(event.target.value);
          const next = event.target.value.split("\n");
          currentItems.current = next;
          onChange(next);
        }}
        placeholder="One item per line"
      />
      {hint ? <p className="mt-1.5 text-[10px] leading-relaxed text-muted">{hint}</p> : null}
    </div>
  );
}

function GoalList({
  label,
  items,
  onChange,
}: {
  label: string;
  items: PRDContent["goals"]["objectives"];
  onChange: (items: PRDContent["goals"]["objectives"]) => void;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <Label className="mb-0">{label}</Label>
        <span className="text-[10px] text-muted">{items.length}</span>
      </div>
      <div className="space-y-2">
        {items.map((goal, index) => (
          <div key={goal.id} className="grid gap-2 rounded-xl border border-border bg-background/30 p-3 md:grid-cols-[1.4fr_0.8fr_0.8fr_auto]">
            <Input placeholder="Outcome statement" value={goal.statement} onChange={(event) => onChange(items.map((item, itemIndex) => itemIndex === index ? { ...item, statement: event.target.value } : item))} />
            <Input placeholder="Metric" value={goal.metric} onChange={(event) => onChange(items.map((item, itemIndex) => itemIndex === index ? { ...item, metric: event.target.value } : item))} />
            <Input placeholder="Target" value={goal.target} onChange={(event) => onChange(items.map((item, itemIndex) => itemIndex === index ? { ...item, target: event.target.value } : item))} />
            <Button variant="ghost" size="icon-sm" onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))} aria-label="Remove goal"><Trash2 className="h-3.5 w-3.5" /></Button>
          </div>
        ))}
        <Button variant="ghost" size="sm" onClick={() => onChange([...items, { id: `goal-${Date.now()}`, statement: "", metric: "", target: "" }])}><Plus className="h-3.5 w-3.5" /> Add {label.toLowerCase()}</Button>
      </div>
    </div>
  );
}

function StepEditor({
  steps,
  onChange,
}: {
  steps: PRDContent["journeys"][number]["steps"];
  onChange: (steps: PRDContent["journeys"][number]["steps"]) => void;
}) {
  const [text, setText] = useState(steps.map((step) => `${step.actor} | ${step.action} | ${step.outcome}`).join("\n"));
  return (
    <div>
      <Label>Steps — one per line: actor | action | outcome</Label>
      <Textarea
        rows={Math.min(7, Math.max(3, text.split("\n").length + 1))}
        value={text}
        onChange={(event) => {
          const next = event.target.value;
          setText(next);
          onChange(
            next
              .split("\n")
              .filter((line) => line.trim())
              .map((line) => {
                const [actor = "", action = "", outcome = ""] = line.split("|").map((part) => part.trim());
                return { actor, action, outcome };
              }),
          );
        }}
      />
    </div>
  );
}

function Subsection({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2 border-t border-border pt-4">
      <div className="flex items-center justify-between">
        <div className="text-xs font-medium text-muted-strong">{title}</div>
        {action}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function DataEntityEditor({
  entity,
  onChange,
  onRemove,
}: {
  entity: DataEntity;
  onChange: (entity: DataEntity) => void;
  onRemove: () => void;
}) {
  const [fieldsText, setFieldsText] = useState(
    entity.fields.map((field) => `${field.name} | ${field.type} | ${field.required ? "yes" : "no"} | ${field.notes}`).join("\n"),
  );
  return (
    <div className="space-y-3 rounded-xl border border-border bg-background/30 p-3">
      <div className="flex items-center gap-2">
        <Input placeholder="Entity name" value={entity.name} onChange={(event) => onChange({ ...entity, name: event.target.value })} />
        <Button variant="ghost" size="icon-sm" onClick={onRemove} aria-label="Remove entity"><Trash2 className="h-3.5 w-3.5" /></Button>
      </div>
      <Input placeholder="Description" value={entity.description} onChange={(event) => onChange({ ...entity, description: event.target.value })} />
      <div>
        <Label>Fields — name | type | required | notes</Label>
        <Textarea
          rows={Math.min(8, Math.max(3, fieldsText.split("\n").length + 1))}
          value={fieldsText}
          onChange={(event) => {
            const next = event.target.value;
            setFieldsText(next);
            onChange({
              ...entity,
              fields: next
                .split("\n")
                .filter((line) => line.trim())
                .map((line) => {
                  const [name = "", type = "string", required = "yes", notes = ""] = line.split("|").map((part) => part.trim());
                  return { name, type, required: required.toLowerCase() !== "no", notes };
                }),
            });
          }}
        />
      </div>
      <ListEditor label="Relationships" items={entity.relationships} onChange={(relationships) => onChange({ ...entity, relationships })} compact />
    </div>
  );
}

function ApiEndpointEditor({
  endpoint,
  onChange,
  onRemove,
}: {
  endpoint: ApiEndpoint;
  onChange: (endpoint: ApiEndpoint) => void;
  onRemove: () => void;
}) {
  return (
    <div className="space-y-2 rounded-xl border border-border bg-background/30 p-3">
      <div className="grid gap-2 md:grid-cols-[110px_1fr_auto]">
        <Select value={endpoint.method} onChange={(event) => onChange({ ...endpoint, method: event.target.value as ApiEndpoint["method"] })}>
          {["GET", "POST", "PATCH", "PUT", "DELETE"].map((method) => <option key={method} value={method}>{method}</option>)}
        </Select>
        <Input placeholder="/api/v1/resource" value={endpoint.path} onChange={(event) => onChange({ ...endpoint, path: event.target.value })} />
        <Button variant="ghost" size="icon-sm" onClick={onRemove} aria-label="Remove endpoint"><Trash2 className="h-3.5 w-3.5" /></Button>
      </div>
      <Input placeholder="Purpose" value={endpoint.purpose} onChange={(event) => onChange({ ...endpoint, purpose: event.target.value })} />
      <div className="grid gap-2 md:grid-cols-3">
        <Input placeholder="Auth" value={endpoint.auth} onChange={(event) => onChange({ ...endpoint, auth: event.target.value })} />
        <Input placeholder="Request" value={endpoint.request} onChange={(event) => onChange({ ...endpoint, request: event.target.value })} />
        <Input placeholder="Response" value={endpoint.response} onChange={(event) => onChange({ ...endpoint, response: event.target.value })} />
      </div>
    </div>
  );
}
