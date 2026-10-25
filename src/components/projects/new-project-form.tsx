"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { PRODUCT_TYPES } from "@/lib/constants";
import { AUTO_TECH_PRESET_ID, CUSTOM_TECH_PRESET_ID, TECH_MODE_OPTIONS, TECH_PRESET_MAP, TECH_PRESETS, type TechStackMode } from "@/lib/tech-presets";
import type { ProjectSummary } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { usePreferences } from "@/components/preferences-provider";

const EXAMPLES = [
  {
    label: "CRM",
    name: "Acme CRM",
    type: "CRM",
    summary:
      "A lightweight CRM for a 20-person B2B sales team. Reps need to capture leads, manage a deal pipeline, log activities, and see weekly pipeline health without spreadsheet work.",
  },
  {
    label: "SaaS",
    name: "Opsboard",
    type: "SaaS Platform",
    summary:
      "A workspace where operations teams can track recurring processes, assign owners, and see bottlenecks. The first release needs workspaces, role-based access, a process board, and notifications.",
  },
  {
    label: "Marketplace",
    name: "LocalSupply",
    type: "Marketplace",
    summary:
      "A curated marketplace connecting independent suppliers with local buyers. Buyers need search and checkout; sellers need onboarding, listings, and payouts; operators need moderation tools.",
  },
  {
    label: "Internal tool",
    name: "RequestFlow",
    type: "Internal Tool",
    summary:
      "An internal request and approval tool for a finance team. Employees submit requests, approvers review them with context, and operations needs SLA tracking and an audit trail.",
  },
];

export function NewProjectForm({ initialType }: { initialType?: string }) {
  const router = useRouter();
  const { t } = usePreferences();
  const [name, setName] = useState("");
  const [productType, setProductType] = useState(initialType || "CRM");
  const [summary, setSummary] = useState("");
  const [techMode, setTechMode] = useState<TechStackMode>("auto");
  const [techPresetId, setTechPresetId] = useState("nextjs-postgres");
  const [customStack, setCustomStack] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const selectedTechPreset = TECH_PRESET_MAP[techPresetId] ?? TECH_PRESETS[0];

  function applyExample(example: (typeof EXAMPLES)[number]) {
    setName(example.name);
    setProductType(example.type);
    setSummary(example.summary);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (name.trim().length < 2) {
      toast.error(t("Give the project a name with at least 2 characters."));
      return;
    }
    if (summary.trim().length < 10) {
      toast.error(t("Add a short brief so the interview has context."));
      return;
    }
    if (techMode === "custom" && customStack.trim().length < 3) {
      toast.error(t("Describe the custom stack when the custom option is selected."));
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          productType,
          summary,
          techPreset:
            techMode === "auto"
              ? AUTO_TECH_PRESET_ID
              : techMode === "custom"
                ? CUSTOM_TECH_PRESET_ID
                : techPresetId,
          customStack: techMode === "custom" ? customStack : "",
        }),
      });
      const payload = (await response.json()) as ProjectSummary & { error?: string };
      if (!response.ok) throw new Error(payload.error || t("Could not create the project."));
      toast.success(t("Project created. Starting discovery."));
      router.push(`/projects/${payload.id}/interview`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("Could not create the project."));
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-8 md:px-8 md:py-10">
      <button
        type="button"
        onClick={() => router.push("/")}
        className="mb-7 inline-flex items-center gap-1.5 text-xs text-muted transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {t("Back to projects")}
      </button>

      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/[0.06] px-3 py-1 text-[11px] font-medium text-accent">
            <Sparkles className="h-3 w-3" />
            {t("New blueprint")}
          </div>
          <h1 className="text-3xl font-semibold tracking-[-0.04em] text-foreground">
            {t("What are you building?")}
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
            {t("Start with the smallest useful brief. The discovery interview will fill in users, scope, data, constraints, and non-functional requirements.")}
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <Label htmlFor="project-name">{t("Project name")}</Label>
                <Input
                  id="project-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Acme CRM"
                  maxLength={120}
                  autoFocus
                />
              </div>
              <div>
                <Label htmlFor="product-type">{t("Product type")}</Label>
                <select
                  id="product-type"
                  value={productType}
                  onChange={(event) => setProductType(event.target.value)}
                  className="h-10 w-full appearance-none rounded-xl border border-border bg-background/60 px-3 pr-9 text-sm text-foreground focus-visible:border-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/20"
                >
                  {PRODUCT_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {t(type.label)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor="project-summary">{t("Short brief")}</Label>
              <Textarea
                id="project-summary"
                value={summary}
                onChange={(event) => setSummary(event.target.value)}
                placeholder={t("Who is it for, what problem does it solve, and what must the first release do?")}
                rows={7}
                maxLength={4000}
              />
              <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted">
                <span>{t("A paragraph is enough. Be specific about the user and the pain.")}</span>
                <span>{summary.length}/4000</span>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-surface/50 p-4">
              <div>
                <Label className="mb-0">{t("Tech stack & environment")}</Label>
                <p className="mt-1 text-[11px] leading-relaxed text-muted">
                  {t("Choose how the technical blueprint should be built.")}
                </p>
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {TECH_MODE_OPTIONS.map((option) => {
                  const active = techMode === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setTechMode(option.id)}
                      className={`rounded-xl border p-3 text-left transition-colors ${active ? "border-accent/40 bg-accent/[0.05]" : "border-border bg-background/40 hover:border-border-strong"}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-xs font-medium ${active ? "text-foreground" : "text-muted-strong"}`}>{t(option.label)}</span>
                        {active ? <Check className="h-3.5 w-3.5 text-accent" /> : null}
                      </div>
                      <p className="mt-1 text-[10px] leading-relaxed text-muted">{t(option.description)}</p>
                    </button>
                  );
                })}
              </div>

              {techMode === "preset" ? (
                <div className="mt-3 space-y-3">
                  <div>
                    <Label htmlFor="tech-preset">{t("Preset stack")}</Label>
                    <select
                      id="tech-preset"
                      value={techPresetId}
                      onChange={(event) => setTechPresetId(event.target.value)}
                      className="h-10 w-full appearance-none rounded-xl border border-border bg-background/60 px-3 pr-9 text-sm text-foreground focus-visible:border-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/20"
                    >
                      {TECH_PRESETS.map((preset) => (
                        <option key={preset.id} value={preset.id}>
                          {preset.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="rounded-xl border border-border bg-background/40 p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-medium text-foreground">{selectedTechPreset.name}</span>
                      <Badge variant="outline">{t(selectedTechPreset.category)}</Badge>
                    </div>
                    <p className="mt-1.5 text-[11px] leading-relaxed text-muted">{t(selectedTechPreset.summary)}</p>
                    <div className="mt-2.5 flex flex-wrap gap-1">
                      {selectedTechPreset.stack.slice(0, 5).map((item) => (
                        <Badge key={item.layer} variant="muted">
                          {item.choice}
                        </Badge>
                      ))}
                      {selectedTechPreset.stack.length > 5 ? (
                        <Badge variant="muted">+{selectedTechPreset.stack.length - 5}</Badge>
                      ) : null}
                    </div>
                    <p className="mt-2 text-[10px] leading-relaxed text-muted">
                      <span className="text-muted-strong">{t("Environment")}:</span>{" "}
                      {selectedTechPreset.environment}
                    </p>
                  </div>
                </div>
              ) : null}

              {techMode === "custom" ? (
                <div className="mt-3">
                  <Label htmlFor="custom-stack">{t("Custom stack description")}</Label>
                  <Textarea
                    id="custom-stack"
                    rows={4}
                    value={customStack}
                    onChange={(event) => setCustomStack(event.target.value)}
                    placeholder={t("e.g. Laravel 12 + MySQL + Redis, deployed with Docker on a VPS. Must use Inertia + React.")}
                    maxLength={4000}
                  />
                  <p className="mt-1.5 text-[10px] leading-relaxed text-muted">
                    {t("The local engine records this as a project constraint. AI mode receives it as a hard requirement.")}
                  </p>
                </div>
              ) : null}

              {techMode === "auto" ? (
                <p className="mt-3 rounded-xl border border-border bg-background/40 p-3 text-[10px] leading-relaxed text-muted">
                  {t("The AI decides the stack. The local engine uses a project-type heuristic: web products default to Next.js + PostgreSQL, mobile products to React Native + Supabase.")}
                </p>
              ) : null}
            </div>

            <div>
              <Label>{t("Or start from an example")}</Label>
              <div className="flex flex-wrap gap-2">
                {EXAMPLES.map((example) => (
                  <button
                    key={example.label}
                    type="button"
                    onClick={() => applyExample(example)}
                    className="rounded-lg border border-border bg-surface-raised px-2.5 py-1.5 text-[11px] text-muted-strong transition-colors hover:border-accent/30 hover:text-foreground"
                  >
                    {t(example.label)}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 border-t border-border pt-5">
              <Button type="submit" size="lg" disabled={submitting}>
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )}
                {submitting ? t("Creating project…") : t("Start discovery interview")}
              </Button>
              <Button type="button" variant="ghost" onClick={() => router.push("/")} disabled={submitting}>
                {t("Cancel")}
              </Button>
            </div>
          </form>
        </div>

        <div className="space-y-3">
          <Card className="p-5">
            <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-accent">
              {t("What happens next")}
            </div>
            <ol className="mt-4 space-y-4">
              {[
                [t("Focused interview"), t("3–6 rounds of specific questions. Skip anything you do not know; assumptions are recorded.")],
                [t("Structured blueprint"), t("PRD, requirements with acceptance criteria, technical baseline, flow, and wireframes.")],
                [t("Execution plan"), t("Dependency-ordered tasks with test plans, Definition of Done, and agent prompts.")],
                [t("Export"), t("A Markdown bundle and machine-readable JSON, validated before download.")],
              ].map(([title, description], index) => (
                <li key={title} className="flex gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-accent/25 bg-accent/[0.08] text-[10px] font-semibold text-accent">
                    {index + 1}
                  </span>
                  <div>
                    <div className="text-xs font-medium text-foreground">{title}</div>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-muted">{description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Card>

          <Card className="border-accent/15 bg-accent/[0.03] p-5">
            <div className="flex items-center gap-2 text-xs font-medium text-foreground">
              <Check className="h-3.5 w-3.5 text-accent" />
              {t("No AI key required to start")}
            </div>
            <p className="mt-1.5 text-[11px] leading-relaxed text-muted">
              {t("The local engine produces a complete blueprint. Add a provider later for tailored synthesis and richer domain language.")}
            </p>
          </Card>

          <div className="rounded-2xl border border-border bg-surface/40 p-5 text-[11px] leading-relaxed text-muted">
            <span className="font-medium text-muted-strong">{t("Tip:")}</span>{" "}
            {t(
              "name the primary user and the decision they need to make. “Sales reps need to know which deals are stalled” produces a sharper plan than “build a CRM”.",
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
