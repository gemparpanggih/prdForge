import Link from "next/link";
import {
  ArrowRight,
  CircleCheck,
  FileText,
  MessagesSquare,
  Plus,
  Sparkles,
  Workflow,
} from "lucide-react";
import { listProjects } from "@/server/projects";
import { Card } from "@/components/ui/card";
import { buttonClass } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ProjectCard } from "@/components/dashboard/project-card";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Projects — PRD Forge",
};

export default async function DashboardPage() {
  const projects = await listProjects();
  const ready = projects.filter((project) => project.readiness >= 80).length;
  const inProgress = projects.filter((project) =>
    ["interview", "generating", "draft", "review"].includes(project.status),
  ).length;
  const average = projects.length
    ? Math.round(projects.reduce((sum, project) => sum + project.readiness, 0) / projects.length)
    : 0;

  return (
    <div className="mx-auto w-full max-w-7xl px-5 py-8 md:px-8 md:py-10">
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/[0.06] px-3 py-1 text-[11px] font-medium text-accent">
            <Sparkles className="h-3 w-3" />
            Local-first · AI-ready · English output
          </div>
          <h1 className="max-w-2xl text-balance text-3xl font-semibold tracking-[-0.045em] text-foreground md:text-[2.65rem] md:leading-[1.05]">
            Design the product before you build it.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
            Turn a rough idea into a professional PRD, an editable product flow, low-fidelity
            wireframes, and a dependency-ordered task plan that an AI coding agent can execute.
          </p>
        </div>
        <Link href="/projects/new" className={buttonClass("primary", "md", "shrink-0")}>
          <Plus className="h-4 w-4" />
          New project
        </Link>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Projects" value={projects.length} icon={FileText} detail="Total blueprints" />
        <StatCard label="Ready" value={ready} icon={CircleCheck} detail="Readiness ≥ 80" tone="success" />
        <StatCard label="In progress" value={inProgress} icon={Workflow} detail="Discovery or draft" tone="warning" />
        <StatCard label="Average readiness" value={`${average}%`} icon={Sparkles} detail="Across all projects" tone="accent" />
      </div>

      <div className="mt-9 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-foreground">Your projects</h2>
          <p className="mt-0.5 text-xs text-muted">
            {projects.length === 0
              ? "Start with a short brief. The interview handles the rest."
              : "Pick up where you left off."}
          </p>
        </div>
        {projects.length > 0 ? (
          <span className="text-[11px] text-muted">{projects.length} total</span>
        ) : null}
      </div>

      {projects.length === 0 ? (
        <EmptyState
          className="mt-4"
          icon={FileText}
          title="No blueprints yet"
          description="Create your first project. You will answer a few focused discovery questions, then PRD Forge builds the document, flow, wireframes, and task plan."
          action={
            <Link href="/projects/new" className={buttonClass("primary", "md")}>
              <Plus className="h-4 w-4" />
              Create your first project
            </Link>
          }
        />
      ) : (
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project, index) => (
            <ProjectCard key={project.id} project={project} index={index} />
          ))}
        </div>
      )}

      <div className="mt-12">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="text-sm font-semibold tracking-tight">How it works</h2>
            <p className="mt-0.5 text-xs text-muted">
              Four stages, one source of truth, zero hand-waving.
            </p>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <StepCard
            number="01"
            icon={MessagesSquare}
            title="Discovery interview"
            description="The AI asks only the questions that matter, tracks coverage, and records assumptions explicitly."
          />
          <StepCard
            number="02"
            icon={Workflow}
            title="Blueprint workspace"
            description="Edit the PRD, drag the product flow, and tune low-fidelity wireframes linked to requirements."
          />
          <StepCard
            number="03"
            icon={FileText}
            title="Execution bundle"
            description="Export PRD.md, TASKS.md, AGENTS.md, diagrams, and JSON that a coding agent can follow."
          />
        </div>
      </div>

      <div className="mt-12 flex flex-col items-start justify-between gap-4 rounded-2xl border border-border bg-surface/60 p-5 md:flex-row md:items-center">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-accent/20 bg-accent/[0.08] text-accent">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <div className="text-sm font-medium text-foreground">Bring your own model</div>
            <p className="mt-0.5 max-w-xl text-xs leading-relaxed text-muted">
              The deterministic local engine can generate a complete, valid blueprint without a
              key. Add a provider in Settings when you want tailored synthesis.
            </p>
          </div>
        </div>
        <Link href="/settings" className={buttonClass("outline", "sm")}>
          Configure provider
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: number | string;
  detail: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "default" | "success" | "warning" | "accent";
}) {
  const toneClass = {
    default: "text-muted-strong",
    success: "text-success",
    warning: "text-warning",
    accent: "text-accent",
  }[tone];
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">{label}</span>
        <Icon className={`h-4 w-4 ${toneClass}`} />
      </div>
      <div className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-foreground">{value}</div>
      <div className="mt-1 text-[11px] text-muted">{detail}</div>
    </Card>
  );
}

function StepCard({
  number,
  icon: Icon,
  title,
  description,
}: {
  number: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <Card className="group p-5 transition-colors hover:border-border-strong">
      <div className="flex items-center justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface-raised text-accent">
          <Icon className="h-4 w-4" />
        </div>
        <span className="font-mono text-[10px] tracking-[0.2em] text-muted">{number}</span>
      </div>
      <h3 className="mt-4 text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-1.5 text-xs leading-relaxed text-muted">{description}</p>
    </Card>
  );
}
