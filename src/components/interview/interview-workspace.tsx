"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  Check,
  CheckCircle2,
  ChevronUp,
  Circle,
  Database,
  Loader2,
  MessagesSquare,
  Sparkles,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";
import type {
  BlueprintResult,
  CoverageDimension,
  InterviewState,
  ProjectDetail,
} from "@/lib/types";
import { COVERAGE_DIMENSIONS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const STAGES = [
  "Synthesizing product requirements",
  "Building the technical baseline",
  "Designing the product flow",
  "Drafting low-fidelity wireframes",
  "Planning implementation tasks",
  "Running the readiness review",
];

type AnswerDraft = { text: string; assumed: boolean };

export function InterviewWorkspace({
  project,
  initial,
}: {
  project: ProjectDetail;
  initial: InterviewState;
}) {
  const router = useRouter();
  const [state, setState] = useState(initial);
  const [drafts, setDrafts] = useState<Record<string, AnswerDraft>>(() =>
    Object.fromEntries(initial.questions.map((question) => [question.id, { text: "", assumed: false }])),
  );
  const [submitting, setSubmitting] = useState(false);
  const [showGenerate, setShowGenerate] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [stageIndex, setStageIndex] = useState(0);
  const [result, setResult] = useState<BlueprintResult | null>(null);
  const [showLog, setShowLog] = useState(false);
  const questionsRef = useRef<HTMLDivElement>(null);

  const answeredDimensions = useMemo(
    () => COVERAGE_DIMENSIONS.filter((dimension) => state.coverage[dimension.key]).length,
    [state.coverage],
  );

  useEffect(() => {
    if (!generating) return;
    const timer = setInterval(() => {
      setStageIndex((current) => Math.min(current + 1, STAGES.length - 1));
    }, 2400);
    return () => clearInterval(timer);
  }, [generating]);

  function setDraft(questionId: string, patch: Partial<AnswerDraft>) {
    setDrafts((current) => ({
      ...current,
      [questionId]: { ...(current[questionId] ?? { text: "", assumed: false }), ...patch },
    }));
  }

  async function submitAnswers(allAssumed = false) {
    if (!state.questions.length) return;
    const answers = state.questions.map((question) => {
      const draft = drafts[question.id] ?? { text: "", assumed: false };
      const assumed = allAssumed || draft.assumed;
      return {
        questionId: question.id,
        dimension: question.dimension,
        question: question.question,
        answer: assumed ? "" : draft.text.trim(),
        assumed,
      };
    });
    const unanswered = answers.filter((answer) => !answer.answer && !answer.assumed);
    if (unanswered.length) {
      toast.error(
        `${unanswered.length} question${unanswered.length > 1 ? "s are" : " is"} unanswered. Answer or use an assumption.`,
      );
      questionsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/projects/${project.id}/interview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      const payload = (await response.json()) as InterviewState & { error?: string };
      if (!response.ok) throw new Error(payload.error || "Could not save your answers.");
      setState(payload);
      setDrafts(
        Object.fromEntries(
          payload.questions.map((question) => [question.id, { text: "", assumed: false }]),
        ),
      );
      toast.success(
        payload.questions.length
          ? `Round saved. ${payload.questions.length} new questions.`
          : "Discovery complete. Your blueprint is ready to generate.",
      );
      questionsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save your answers.");
    } finally {
      setSubmitting(false);
    }
  }

  async function generate() {
    setShowGenerate(false);
    setGenerating(true);
    setStageIndex(0);
    try {
      const response = await fetch(`/api/projects/${project.id}/generate`, {
        method: "POST",
      });
      const payload = (await response.json()) as BlueprintResult & { error?: string };
      if (!response.ok) throw new Error(payload.error || "Blueprint generation failed.");
      setResult(payload);
      setGenerating(false);
      router.refresh();
    } catch (error) {
      setGenerating(false);
      toast.error(error instanceof Error ? error.message : "Blueprint generation failed.");
    }
  }

  const history = state.messages.slice(0, -1);
  const modeLabel = state.mode === "ai" ? "AI interview" : "Local question bank";

  return (
    <div className="mx-auto w-full max-w-7xl px-5 py-7 md:px-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant={state.mode === "ai" ? "accent" : "muted"}>
              {state.mode === "ai" ? <Bot className="h-3 w-3" /> : <Database className="h-3 w-3" />}
              {modeLabel}
            </Badge>
            <Badge variant="outline">Round {state.round}</Badge>
            <Badge variant="outline">{answeredDimensions}/12 dimensions</Badge>
          </div>
          <h1 className="mt-3 text-2xl font-semibold tracking-[-0.035em] text-foreground md:text-3xl">
            Discovery interview
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted">
            Answer the highest-leverage questions first. Anything you skip becomes an explicit
            assumption in the blueprint, never a hidden guess.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => setShowLog((value) => !value)}>
            <MessagesSquare className="h-4 w-4" />
            {showLog ? "Hide" : "View"} discovery log
          </Button>
        </div>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_330px]">
        <div className="min-w-0 space-y-5">
          {state.questions.length ? (
            <div ref={questionsRef} className="space-y-3">
              {state.questions.map((question, index) => {
                const dimension = COVERAGE_DIMENSIONS.find((item) => item.key === question.dimension);
                const draft = drafts[question.id] ?? { text: "", assumed: false };
                return (
                  <Card key={question.id} className="animate-fade-up p-5" style={{ animationDelay: `${index * 45}ms` }}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-muted">Q{String(index + 1).padStart(2, "0")}</span>
                        <Badge variant="accent">{dimension?.label ?? question.dimension}</Badge>
                      </div>
                      <button
                        type="button"
                        onClick={() => setDraft(question.id, { assumed: !draft.assumed })}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] transition-colors",
                          draft.assumed
                            ? "border-warning/30 bg-warning/10 text-warning"
                            : "border-border text-muted hover:text-foreground",
                        )}
                      >
                        <Wand2 className="h-3 w-3" />
                        {draft.assumed ? "Using assumption" : "Use AI assumption"}
                      </button>
                    </div>
                    <h2 className="mt-3 text-sm font-medium leading-relaxed text-foreground">
                      {question.question}
                    </h2>
                    <p className="mt-1 text-[11px] leading-relaxed text-muted">{question.hint}</p>
                    <Textarea
                      className="mt-3"
                      rows={3}
                      value={draft.text}
                      disabled={draft.assumed}
                      onChange={(event) => setDraft(question.id, { text: event.target.value })}
                      placeholder={
                        draft.assumed
                          ? "The blueprint will record this as an assumption."
                          : "Be specific. Name the user, the constraint, or the number."
                      }
                    />
                    {question.options.length ? (
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {question.options.map((option) => (
                          <button
                            key={option}
                            type="button"
                            disabled={draft.assumed}
                            onClick={() => {
                              const next = draft.text.trim()
                                ? `${draft.text.trim().replace(/[.;]+$/, "")}; ${option}`
                                : option;
                              setDraft(question.id, { text: next });
                            }}
                            className="rounded-full border border-border bg-surface-raised px-2.5 py-1 text-[10px] text-muted transition-colors hover:border-accent/30 hover:text-foreground disabled:opacity-40"
                          >
                            + {option}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </Card>
                );
              })}

              <div className="flex flex-col gap-2 rounded-2xl border border-border bg-surface/60 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-[11px] text-muted">
                  {state.questions.length} questions in this round. Unanswered items need an explicit assumption.
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => submitAnswers(true)}
                    disabled={submitting}
                  >
                    Assume all
                  </Button>
                  <Button onClick={() => submitAnswers(false)} disabled={submitting}>
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                    {submitting ? "Saving…" : "Save answers & continue"}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <Card className="p-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-accent/25 bg-accent/[0.08] text-accent">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <h2 className="mt-4 text-lg font-semibold tracking-tight">Discovery complete</h2>
              <p className="mx-auto mt-1.5 max-w-md text-xs leading-relaxed text-muted">
                You have answered the available question set. Generate the blueprint to synthesize
                requirements, technical detail, flow, wireframes, and the task plan.
              </p>
              <Button className="mt-5" onClick={() => setShowGenerate(true)}>
                <Sparkles className="h-4 w-4" />
                Generate blueprint
              </Button>
            </Card>
          )}

          {showLog ? (
            <Card className="overflow-hidden">
              <div className="flex items-center justify-between border-b border-border px-5 py-3">
                <div>
                  <div className="text-xs font-medium">Discovery log</div>
                  <div className="text-[10px] text-muted">{history.length} messages before this round</div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowLog(false)}
                  className="text-muted hover:text-foreground"
                  aria-label="Close discovery log"
                >
                  <ChevronUp className="h-4 w-4" />
                </button>
              </div>
              <div className="max-h-[460px] space-y-4 overflow-y-auto p-5">
                {history.length === 0 ? (
                  <p className="text-xs text-muted">No previous rounds yet.</p>
                ) : (
                  history.map((message) => (
                    <LogMessage key={message.id} message={message} />
                  ))
                )}
              </div>
            </Card>
          ) : null}
        </div>

        <div className="space-y-4">
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-medium text-foreground">Discovery coverage</div>
                <div className="mt-0.5 text-[10px] text-muted">Material dimensions for a build-ready PRD</div>
              </div>
              <div className="text-lg font-semibold tracking-tight text-accent">
                {state.coveragePercent}%
              </div>
            </div>
            <Progress value={state.coveragePercent} className="mt-3" />
            <div className="mt-4 space-y-2">
              {COVERAGE_DIMENSIONS.map((dimension) => {
                const covered = state.coverage[dimension.key as CoverageDimension];
                return (
                  <div key={dimension.key} className="flex items-start gap-2">
                    {covered ? (
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                    ) : (
                      <Circle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted/50" />
                    )}
                    <div className="min-w-0">
                      <div className={cn("text-[11px]", covered ? "text-muted-strong" : "text-muted")}>
                        {dimension.label}
                      </div>
                      <div className="truncate text-[10px] text-muted/70">{dimension.description}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className={cn("p-5", state.canGenerate ? "border-accent/20 bg-accent/[0.03]" : "")}>
            <div className="flex items-center gap-2 text-xs font-medium text-foreground">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              Generate the blueprint
            </div>
            <p className="mt-1.5 text-[11px] leading-relaxed text-muted">
              {state.canGenerate
                ? "Generate now, or continue the interview for sharper requirements."
                : "Answer at least one round to unlock generation. Gaps become explicit assumptions."}
            </p>
            <Button
              className="mt-4 w-full"
              variant={state.canGenerate ? "primary" : "secondary"}
              disabled={!state.canGenerate}
              onClick={() => setShowGenerate(true)}
            >
              <Sparkles className="h-4 w-4" />
              Generate blueprint
            </Button>
            <div className="mt-2 text-center text-[10px] text-muted">
              {answeredDimensions} of 12 dimensions covered
            </div>
          </Card>

          {state.mode === "local" ? (
            <div className="rounded-2xl border border-border bg-surface/40 p-4 text-[11px] leading-relaxed text-muted">
              <span className="font-medium text-muted-strong">Local engine active.</span> Questions
              come from the built-in domain bank. Add a provider in Settings for a tailored
              interview and synthesis.
            </div>
          ) : null}
        </div>
      </div>

      <Dialog
        open={showGenerate}
        onOpenChange={setShowGenerate}
        title="Generate the blueprint?"
        description="This creates a new PRD version, product flow, wireframes, and task plan."
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowGenerate(false)}>
              Keep interviewing
            </Button>
            <Button onClick={generate}>
              <Sparkles className="h-4 w-4" />
              Generate
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="rounded-xl border border-border bg-background/50 p-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted">Coverage</span>
              <span className="font-medium">{state.coveragePercent}%</span>
            </div>
            <Progress value={state.coveragePercent} className="mt-2" />
          </div>
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="rounded-xl border border-border bg-background/40 p-3">
              <div className="text-lg font-semibold">{answeredDimensions}/12</div>
              <div className="text-[10px] text-muted">dimensions answered</div>
            </div>
            <div className="rounded-xl border border-border bg-background/40 p-3">
              <div className="text-lg font-semibold">{12 - answeredDimensions}</div>
              <div className="text-[10px] text-muted">will become assumptions</div>
            </div>
          </div>
          <p className="text-[11px] leading-relaxed text-muted">
            Missing details are recorded in the scope assumptions and open questions. You can edit
            every section after generation.
          </p>
        </div>
      </Dialog>

      <Dialog
        open={Boolean(result)}
        onOpenChange={() => setResult(null)}
        title="Blueprint ready"
        description="The PRD, flow, wireframes, and task plan were generated and saved as a new version."
        footer={
          <Button
            onClick={() => {
              setResult(null);
              router.push(`/projects/${project.id}/prd`);
            }}
          >
            Open PRD
            <ArrowRight className="h-4 w-4" />
          </Button>
        }
      >
        {result ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl border border-border bg-background/40 p-3">
                <div className="text-lg font-semibold">{result.taskCount}</div>
                <div className="text-[10px] text-muted">tasks</div>
              </div>
              <div className="rounded-xl border border-border bg-background/40 p-3">
                <div className="text-lg font-semibold">{result.nodeCount}</div>
                <div className="text-[10px] text-muted">flow nodes</div>
              </div>
              <div className="rounded-xl border border-border bg-background/40 p-3">
                <div className="text-lg font-semibold">{result.readiness}</div>
                <div className="text-[10px] text-muted">readiness</div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Badge variant={result.mode === "ai" ? "accent" : "muted"}>
                {result.mode === "ai" ? "AI synthesis" : "Local engine"}
              </Badge>
              <span className="text-muted">PRD v{result.prdVersion}</span>
            </div>
            {result.warnings.length ? (
              <div className="rounded-xl border border-warning/25 bg-warning/[0.06] p-3">
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-warning">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Generation notes
                </div>
                <ul className="mt-1.5 space-y-1 text-[11px] leading-relaxed text-muted">
                  {result.warnings.slice(0, 4).map((warning) => (
                    <li key={warning}>• {warning}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}
      </Dialog>

      {generating ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 p-5 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-[0_40px_120px_rgba(0,0,0,0.65)]">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
              <div>
                <div className="text-sm font-semibold">Building your blueprint</div>
                <div className="text-[11px] text-muted">This can take a moment with a remote model.</div>
              </div>
            </div>
            <div className="mt-6 space-y-2.5">
              {STAGES.map((stage, index) => (
                <div
                  key={stage}
                  className={cn(
                    "flex items-center gap-2.5 text-xs transition-colors",
                    index < stageIndex
                      ? "text-muted-strong"
                      : index === stageIndex
                        ? "text-foreground"
                        : "text-muted/50",
                  )}
                >
                  {index < stageIndex ? (
                    <Check className="h-3.5 w-3.5 text-accent" />
                  ) : index === stageIndex ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-accent" />
                  ) : (
                    <Circle className="h-3.5 w-3.5" />
                  )}
                  {stage}
                </div>
              ))}
            </div>
            <Progress value={((stageIndex + 1) / STAGES.length) * 100} className="mt-6" />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function LogMessage({ message }: { message: InterviewState["messages"][number] }) {
  if (message.role === "assistant") {
    const payload = message.metadata && !Array.isArray(message.metadata) ? message.metadata : null;
    return (
      <div className="rounded-xl border border-border bg-surface-raised/50 p-3">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-muted">
          <Bot className="h-3 w-3 text-accent" />
          Interviewer · Round {payload?.round ?? "—"}
        </div>
        <p className="mt-1.5 text-xs text-muted-strong">{message.content}</p>
        {payload?.questions.length ? (
          <ul className="mt-2 space-y-1.5">
            {payload.questions.map((question) => (
              <li key={question.id} className="text-[11px] leading-relaxed text-muted">
                <span className="text-muted-strong">[{question.dimension}]</span> {question.question}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    );
  }
  const answers = Array.isArray(message.metadata) ? message.metadata : [];
  return (
    <div className="rounded-xl border border-accent/10 bg-accent/[0.02] p-3">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-muted">
        <MessagesSquare className="h-3 w-3 text-accent" />
        You
      </div>
      <div className="mt-1.5 space-y-2">
        {answers.map((answer, index) => (
          <div key={`${answer.questionId}-${index}`} className="text-[11px] leading-relaxed text-muted">
            <span className="text-muted-strong">[{answer.dimension}]</span> {answer.question}
            <div className="mt-0.5 text-muted-strong">
              {answer.assumed ? "Accepted an AI assumption." : answer.answer}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
