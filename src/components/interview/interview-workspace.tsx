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
import { usePreferences } from "@/components/preferences-provider";
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
  const { t } = usePreferences();
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
        unanswered.length === 1
          ? t("{count} question is unanswered. Answer or use an assumption.", { count: unanswered.length })
          : t("{count} questions are unanswered. Answer or use an assumption.", { count: unanswered.length }),
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
      if (!response.ok) throw new Error(payload.error || t("Could not save your answers."));
      setState(payload);
      setDrafts(
        Object.fromEntries(
          payload.questions.map((question) => [question.id, { text: "", assumed: false }]),
        ),
      );
      toast.success(
        payload.questions.length
          ? t("Round saved. {count} new questions.", { count: payload.questions.length })
          : t("Discovery complete. Your blueprint is ready to generate."),
      );
      questionsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("Could not save your answers."));
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
      if (!response.ok) throw new Error(payload.error || t("Blueprint generation failed."));
      setResult(payload);
      setGenerating(false);
      router.refresh();
    } catch (error) {
      setGenerating(false);
      toast.error(error instanceof Error ? error.message : t("Blueprint generation failed."));
    }
  }

  const history = state.messages.slice(0, -1);
  const modeLabel = state.mode === "ai" ? t("AI interview") : t("Local question bank");

  return (
    <div className="mx-auto w-full max-w-7xl px-5 py-7 md:px-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant={state.mode === "ai" ? "accent" : "muted"}>
              {state.mode === "ai" ? <Bot className="h-3 w-3" /> : <Database className="h-3 w-3" />}
              {modeLabel}
            </Badge>
            <Badge variant="outline">{t("Round")} {state.round}</Badge>
            <Badge variant="outline">{answeredDimensions}/12 {t("dimensions")}</Badge>
          </div>
          <h1 className="mt-3 text-2xl font-semibold tracking-[-0.035em] text-foreground md:text-3xl">
            {t("Discovery interview")}
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted">
            {t("Answer the highest-leverage questions first. Anything you skip becomes an explicit assumption in the blueprint, never a hidden guess.")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => setShowLog((value) => !value)}>
            <MessagesSquare className="h-4 w-4" />
            {showLog ? t("Hide discovery log") : t("View discovery log")}
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
                        <Badge variant="accent">{t(dimension?.label ?? question.dimension)}</Badge>
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
                        {draft.assumed ? t("Using assumption") : t("Use AI assumption")}
                      </button>
                    </div>
                    <h2 className="mt-3 text-sm font-medium leading-relaxed text-foreground">
                      {t(question.question)}
                    </h2>
                    <p className="mt-1 text-[11px] leading-relaxed text-muted">{t(question.hint)}</p>
                    <Textarea
                      className="mt-3"
                      rows={3}
                      value={draft.text}
                      disabled={draft.assumed}
                      onChange={(event) => setDraft(question.id, { text: event.target.value })}
                      placeholder={
                        draft.assumed
                          ? t("The blueprint will record this as an assumption.")
                          : t("Be specific. Name the user, the constraint, or the number.")
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
                              const translated = t(option);
                              const next = draft.text.trim()
                                ? `${draft.text.trim().replace(/[.;]+$/, "")}; ${translated}`
                                : translated;
                              setDraft(question.id, { text: next });
                            }}
                            className="rounded-full border border-border bg-surface-raised px-2.5 py-1 text-[10px] text-muted transition-colors hover:border-accent/30 hover:text-foreground disabled:opacity-40"
                          >
                            + {t(option)}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </Card>
                );
              })}

              <div className="flex flex-col gap-2 rounded-2xl border border-border bg-surface/60 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-[11px] text-muted">
                  {t("{count} questions in this round. Unanswered items need an explicit assumption.", { count: state.questions.length })}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => submitAnswers(true)}
                    disabled={submitting}
                  >
                    {t("Assume all")}
                  </Button>
                  <Button onClick={() => submitAnswers(false)} disabled={submitting}>
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                    {submitting ? t("Saving…") : t("Save answers & continue")}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <Card className="p-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-accent/25 bg-accent/[0.08] text-accent">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <h2 className="mt-4 text-lg font-semibold tracking-tight">{t("Discovery complete")}</h2>
              <p className="mx-auto mt-1.5 max-w-md text-xs leading-relaxed text-muted">
                {t("You have answered the available question set. Generate the blueprint to synthesize requirements, technical detail, flow, wireframes, and the task plan.")}
              </p>
              <Button className="mt-5" onClick={() => setShowGenerate(true)}>
                <Sparkles className="h-4 w-4" />
                {t("Generate blueprint")}
              </Button>
            </Card>
          )}

          {showLog ? (
            <Card className="overflow-hidden">
              <div className="flex items-center justify-between border-b border-border px-5 py-3">
                <div>
                  <div className="text-xs font-medium">{t("Discovery log")}</div>
                  <div className="text-[10px] text-muted">{t("{count} messages before this round", { count: history.length })}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowLog(false)}
                  className="text-muted hover:text-foreground"
                  aria-label={t("Close")}
                >
                  <ChevronUp className="h-4 w-4" />
                </button>
              </div>
              <div className="max-h-[460px] space-y-4 overflow-y-auto p-5">
                {history.length === 0 ? (
                  <p className="text-xs text-muted">{t("No previous rounds yet.")}</p>
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
                <div className="text-xs font-medium text-foreground">{t("Discovery coverage")}</div>
                <div className="mt-0.5 text-[10px] text-muted">{t("Material dimensions for a build-ready PRD")}</div>
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
                        {t(dimension.label)}
                      </div>
                      <div className="text-[10px] leading-relaxed text-muted">{t(dimension.description)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className={cn("p-5", state.canGenerate ? "border-accent/20 bg-accent/[0.03]" : "")}>
            <div className="flex items-center gap-2 text-xs font-medium text-foreground">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              {t("Generate the blueprint")}
            </div>
            <p className="mt-1.5 text-[11px] leading-relaxed text-muted">
              {state.canGenerate
                ? t("Generate now, or continue the interview for sharper requirements.")
                : t("Answer at least one round to unlock generation. Gaps become explicit assumptions.")}
            </p>
            <Button
              className="mt-4 w-full"
              variant={state.canGenerate ? "primary" : "secondary"}
              disabled={!state.canGenerate}
              onClick={() => setShowGenerate(true)}
            >
              <Sparkles className="h-4 w-4" />
              {t("Generate blueprint")}
            </Button>
            <div className="mt-2 text-center text-[10px] text-muted">
              {t("{count} of 12 dimensions covered", { count: answeredDimensions })}
            </div>
          </Card>

          {state.mode === "local" ? (
            <div className="rounded-2xl border border-border bg-surface/40 p-4 text-[11px] leading-relaxed text-muted">
              <span className="font-medium text-muted-strong">{t("Local engine active.")}</span>{" "}
              {t("Questions come from the built-in domain bank. Add a provider in Settings for a tailored interview and synthesis.")}
            </div>
          ) : null}
        </div>
      </div>

      <Dialog
        open={showGenerate}
        onOpenChange={setShowGenerate}
        title={t("Generate the blueprint?")}
        description={t("This creates a new PRD version, product flow, wireframes, and task plan.")}
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowGenerate(false)}>
              {t("Keep interviewing")}
            </Button>
            <Button onClick={generate}>
              <Sparkles className="h-4 w-4" />
              {t("Generate")}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="rounded-xl border border-border bg-background/50 p-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted">{t("Coverage")}</span>
              <span className="font-medium">{state.coveragePercent}%</span>
            </div>
            <Progress value={state.coveragePercent} className="mt-2" />
          </div>
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="rounded-xl border border-border bg-background/40 p-3">
              <div className="text-lg font-semibold">{answeredDimensions}/12</div>
              <div className="text-[10px] text-muted">{t("dimensions answered")}</div>
            </div>
            <div className="rounded-xl border border-border bg-background/40 p-3">
              <div className="text-lg font-semibold">{12 - answeredDimensions}</div>
              <div className="text-[10px] text-muted">{t("will become assumptions")}</div>
            </div>
          </div>
          <p className="text-[11px] leading-relaxed text-muted">
            {t("Missing details are recorded in the scope assumptions and open questions. You can edit every section after generation.")}
          </p>
        </div>
      </Dialog>

      <Dialog
        open={Boolean(result)}
        onOpenChange={() => setResult(null)}
        title={t("Blueprint ready")}
        description={t("The PRD, flow, wireframes, and task plan were generated and saved as a new version.")}
        footer={
          <Button
            onClick={() => {
              setResult(null);
              router.push(`/projects/${project.id}/prd`);
            }}
          >
            {t("Open PRD")}
            <ArrowRight className="h-4 w-4" />
          </Button>
        }
      >
        {result ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl border border-border bg-background/40 p-3">
                <div className="text-lg font-semibold">{result.taskCount}</div>
                <div className="text-[10px] text-muted">{t("tasks")}</div>
              </div>
              <div className="rounded-xl border border-border bg-background/40 p-3">
                <div className="text-lg font-semibold">{result.nodeCount}</div>
                <div className="text-[10px] text-muted">{t("flow nodes")}</div>
              </div>
              <div className="rounded-xl border border-border bg-background/40 p-3">
                <div className="text-lg font-semibold">{result.readiness}</div>
                <div className="text-[10px] text-muted">{t("readiness")}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Badge variant={result.mode === "ai" ? "accent" : "muted"}>
                {result.mode === "ai" ? t("AI synthesis") : t("Local engine")}
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
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-[var(--card-shadow)]">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
              <div>
                <div className="text-sm font-semibold">{t("Building your blueprint")}</div>
                <div className="text-[11px] text-muted">{t("This can take a moment with a remote model.")}</div>
              </div>
            </div>
            <div className="mt-6 space-y-2.5">
              {STAGES.map((stage, index) => (
                <div
                  key={t(stage)}
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
  const { t } = usePreferences();
  if (message.role === "assistant") {
    const payload = message.metadata && !Array.isArray(message.metadata) ? message.metadata : null;
    return (
      <div className="rounded-xl border border-border bg-surface-raised/50 p-3">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-muted">
          <Bot className="h-3 w-3 text-accent" />
          {t("Interviewer")} · {t("Round")} {payload?.round ?? "—"}
        </div>
        <p className="mt-1.5 text-xs text-muted-strong">{message.content}</p>
        {payload?.questions.length ? (
          <ul className="mt-2 space-y-1.5">
            {payload.questions.map((question) => (
              <li key={question.id} className="text-[11px] leading-relaxed text-muted">
                <span className="text-muted-strong">[{question.dimension}]</span> {t(question.question)}
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
            <span className="text-muted-strong">[{answer.dimension}]</span> {t(answer.question)}
            <div className="mt-0.5 text-muted-strong">
              {answer.assumed ? t("Accepted an AI assumption.") : answer.answer}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
