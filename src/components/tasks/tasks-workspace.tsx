"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Circle,
  Clock3,
  Copy,
  Flag,
  GitBranch,
  LayoutList,
  ListChecks,
  Search,
  Table2,
} from "lucide-react";
import { toast } from "sonner";
import type { ProjectDetail, ReadinessReport, Requirement, Task, TaskStatus } from "@/lib/types";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Input, Label, Select } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { Progress } from "@/components/ui/progress";
import { usePreferences } from "@/components/preferences-provider";
import { cn } from "@/lib/utils";
import { TaskFlowCanvas } from "./task-flow-canvas";

type View = "table" | "board" | "graph";

const STATUS_COLUMNS: { status: TaskStatus; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { status: "todo", label: "To do", icon: Circle },
  { status: "in_progress", label: "In progress", icon: Clock3 },
  { status: "blocked", label: "Blocked", icon: Flag },
  { status: "done", label: "Done", icon: CheckCircle2 },
];

export function TasksWorkspace({
  project,
  initialTasks,
  requirements,
  knownRequirementIds,
  readiness,
}: {
  project: ProjectDetail;
  initialTasks: Task[];
  requirements: Requirement[];
  knownRequirementIds: string[];
  readiness: ReadinessReport;
}) {
  const { t } = usePreferences();
  const [tasks, setTasks] = useState(initialTasks);
  const [view, setView] = useState<View>("table");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [milestoneFilter, setMilestoneFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [savingTaskId, setSavingTaskId] = useState<string | null>(null);

  const milestones = useMemo(
    () => [...new Set(tasks.map((task) => task.milestoneId))].sort(),
    [tasks],
  );

  const filtered = useMemo(
    () =>
      tasks.filter((task) => {
        const haystack = `${task.id} ${task.title} ${task.epicTitle} ${task.description}`.toLowerCase();
        if (query && !haystack.includes(query.toLowerCase())) return false;
        if (statusFilter !== "all" && task.status !== statusFilter) return false;
        if (milestoneFilter !== "all" && task.milestoneId !== milestoneFilter) return false;
        if (priorityFilter !== "all" && task.priority !== priorityFilter) return false;
        return true;
      }),
    [tasks, query, statusFilter, milestoneFilter, priorityFilter],
  );

  const selected = tasks.find((task) => task.id === selectedId) ?? null;
  const knownIds = useMemo(() => new Set(knownRequirementIds), [knownRequirementIds]);
  const done = tasks.filter((task) => task.status === "done").length;
  const blocked = tasks.filter((task) => task.status === "blocked").length;
  const must = tasks.filter((task) => task.priority === "must").length;

  async function updateTask(taskId: string, patch: Partial<Task>) {
    const previous = tasks;
    setTasks((current) =>
      current.map((task) => (task.id === taskId ? { ...task, ...patch } : task)),
    );
    setSavingTaskId(taskId);
    try {
      const task = tasks.find((item) => item.id === taskId);
      if (!task) return;
      const next = { ...task, ...patch };
      const response = await fetch(`/api/projects/${project.id}/tasks`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task: next }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error || t("Could not update the task."));
    } catch (error) {
      setTasks(previous);
      toast.error(error instanceof Error ? error.message : t("Could not update the task."));
    } finally {
      setSavingTaskId(null);
    }
  }

  async function copy(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t("{label} copied.", { label }));
    } catch {
      toast.error(t("Clipboard permission was denied."));
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1500px] px-4 py-5 md:px-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/[0.06] px-3 py-1 text-[10px] font-medium text-accent">
            <ListChecks className="h-3 w-3" />
            {tasks.length} {t("executable tasks")}
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-[-0.035em]">{t("Execution plan")}</h1>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">
            {t("Dependency-ordered work with acceptance criteria, test plans, Definition of Done, and self-contained prompts for a coding agent.")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => copy(tasks.map((task) => `### ${task.id}\n${task.agentPrompt}`).join("\n\n"), t("All agent prompts"))}>
            <Copy className="h-3.5 w-3.5" />
            {t("Copy all prompts")}
          </Button>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label={t("Done")} value={`${done}/${tasks.length}`} detail={`${tasks.length ? Math.round((done / tasks.length) * 100) : 0}% ${t("complete")}`} />
        <Metric label={t("Blocked")} value={blocked} detail={t("Needs a decision")} />
        <Metric label={t("Must-have")} value={must} detail={t("Release critical")} />
        <Metric label={t("Readiness")} value={`${readiness.score}%`} detail={readiness.canExport ? t("Export gate open") : t("Review required")} />
      </div>
      <Progress value={tasks.length ? (done / tasks.length) * 100 : 0} className="mt-3" />

      <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1 rounded-xl border border-border bg-surface p-1">
          {[
            { id: "table" as const, label: t("Table"), icon: Table2 },
            { id: "board" as const, label: t("Board"), icon: LayoutList },
            { id: "graph" as const, label: t("Graph"), icon: GitBranch },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setView(item.id)}
              className={cn(
                "flex h-8 items-center gap-1.5 rounded-lg px-3 text-[11px] font-medium transition-colors",
                view === item.id ? "bg-foreground/[0.06] text-foreground" : "text-muted hover:text-foreground",
              )}
            >
              <item.icon className={cn("h-3.5 w-3.5", view === item.id ? "text-accent" : "text-muted")} />
              {item.label}
            </button>
          ))}
        </div>

        {view !== "graph" ? (
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
              <Input
                className="h-8 w-52 pl-8 text-[11px]"
                placeholder={t("Search tasks…")}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <Select className="h-8 w-[138px] text-[11px]" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">{t("All statuses")}</option>
              {STATUS_COLUMNS.map((column) => <option key={column.status} value={column.status}>{t(column.label)}</option>)}
            </Select>
            <Select className="h-8 w-[150px] text-[11px]" value={milestoneFilter} onChange={(event) => setMilestoneFilter(event.target.value)}>
              <option value="all">{t("All milestones")}</option>
              {milestones.map((milestone) => <option key={milestone} value={milestone}>{milestone}</option>)}
            </Select>
            <Select className="h-8 w-[140px] text-[11px]" value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)}>
              <option value="all">{t("All priorities")}</option>
              <option value="must">{t("Must")}</option>
              <option value="should">{t("Should")}</option>
              <option value="could">{t("Could")}</option>
            </Select>
          </div>
        ) : null}
      </div>

      {tasks.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title={t("No tasks yet")}
          description={t("Generate the blueprint from the discovery interview to create an execution plan.")}
          className="mt-4"
        />
      ) : null}

      {view === "table" && tasks.length ? (
        <Card className="mt-3 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead>
                <tr className="border-b border-border bg-background/40 text-[10px] uppercase tracking-[0.12em] text-muted">
                  <th className="px-4 py-2.5 font-medium">{t("Task")}</th>
                  <th className="px-3 py-2.5 font-medium">{t("Type")}</th>
                  <th className="px-3 py-2.5 font-medium">{t("Priority")}</th>
                  <th className="px-3 py-2.5 font-medium">{t("Milestone")}</th>
                  <th className="px-3 py-2.5 font-medium">{t("Depends on")}</th>
                  <th className="px-3 py-2.5 font-medium">{t("Status")}</th>
                  <th className="px-3 py-2.5 font-medium">{t("Est.")}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((task) => (
                  <tr
                    key={task.id}
                    onClick={() => setSelectedId(task.id)}
                    className="cursor-pointer border-b border-border/60 transition-colors last:border-0 hover:bg-foreground/[0.02]"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-start gap-2">
                        <span className="mt-0.5 font-mono text-[9px] text-accent">{task.id}</span>
                        <div className="min-w-0">
                          <div className="max-w-[360px] truncate text-xs font-medium text-foreground">{task.title}</div>
                          <div className="mt-0.5 truncate text-[10px] text-muted">{task.epicTitle}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-[10px] capitalize text-muted-strong">{t(task.type)}</td>
                    <td className="px-3 py-3"><StatusBadge status={task.priority} /></td>
                    <td className="px-3 py-3 font-mono text-[10px] text-muted">{task.milestoneId}</td>
                    <td className="px-3 py-3 text-[10px] text-muted">{task.dependencies.length ? task.dependencies.join(", ") : "—"}</td>
                    <td className="px-3 py-3"><StatusBadge status={task.status} /></td>
                    <td className="px-3 py-3 text-[10px] text-muted">{task.estimate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 ? <div className="p-8 text-center text-xs text-muted">{t("No tasks match the filters.")}</div> : null}
        </Card>
      ) : null}

      {view === "board" && tasks.length ? (
        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {STATUS_COLUMNS.map((column) => {
            const columnTasks = filtered.filter((task) => task.status === column.status);
            return (
              <div
                key={column.status}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  const taskId = event.dataTransfer.getData("text/task-id");
                  if (taskId) void updateTask(taskId, { status: column.status });
                }}
                className="rounded-2xl border border-border bg-surface/50 p-2.5"
              >
                <div className="mb-2 flex items-center justify-between px-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-strong">
                    <column.icon className="h-3.5 w-3.5" />
                    {t(column.label)}
                  </div>
                  <span className="text-[10px] text-muted">{columnTasks.length}</span>
                </div>
                <div className="space-y-2">
                  {columnTasks.map((task) => (
                    <button
                      key={task.id}
                      type="button"
                      draggable
                      onDragStart={(event) => event.dataTransfer.setData("text/task-id", task.id)}
                      onClick={() => setSelectedId(task.id)}
                      className="w-full rounded-xl border border-border bg-surface p-3 text-left transition-colors hover:border-border-strong"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[9px] text-accent">{task.id}</span>
                        <StatusBadge status={task.priority} />
                      </div>
                      <div className="mt-1.5 line-clamp-2 text-[11px] font-medium leading-relaxed">{task.title}</div>
                      <div className="mt-2 flex items-center justify-between text-[9px] text-muted">
                        <span>{task.milestoneId}</span>
                        <span>{t(task.type)}</span>
                      </div>
                    </button>
                  ))}
                  {columnTasks.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border px-2 py-6 text-center text-[10px] text-muted">
                      {t("Drop a task here")}
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      {view === "graph" && tasks.length ? (
        <Card className="mt-3 h-[calc(100vh-280px)] min-h-[520px] overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <div className="flex items-center gap-2 text-[10px] text-muted">
              <GitBranch className="h-3.5 w-3.5 text-accent" />
              {t("Dependencies run left to right. The critical path is highlighted.")}
            </div>
            <span className="text-[10px] text-muted">{tasks.length} nodes</span>
          </div>
          <div className="h-[calc(100%-40px)]">
            <TaskFlowCanvas tasks={tasks} />
          </div>
        </Card>
      ) : null}

      <Dialog
        open={Boolean(selected)}
        onOpenChange={() => setSelectedId(null)}
        title={selected ? `${selected.id} — ${selected.title}` : t("Task")}
        description={selected ? `${selected.epicId} · ${selected.epicTitle}` : undefined}
        size="xl"
        footer={
          selected ? (
            <>
              <Button variant="ghost" onClick={() => setSelectedId(null)}>{t("Close")}</Button>
              <Button variant="secondary" onClick={() => copy(selected.agentPrompt, t("Agent prompt"))}>
                <Copy className="h-4 w-4" /> {t("Copy prompt")}
              </Button>
            </>
          ) : null
        }
      >
        {selected ? (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={selected.priority} />
              <StatusBadge status={selected.status} />
              <Badge variant="outline">{t(selected.type)}</Badge>
              <Badge variant="outline">{selected.milestoneId}</Badge>
              <Badge variant="outline">Estimate {selected.estimate}</Badge>
              {savingTaskId === selected.id ? <span className="text-[10px] text-muted">{t("Saving…")}</span> : null}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>{t("Status")}</Label>
                <Select
                  value={selected.status}
                  onChange={(event) => updateTask(selected.id, { status: event.target.value as TaskStatus })}
                >
                  {STATUS_COLUMNS.map((column) => <option key={column.status} value={column.status}>{t(column.label)}</option>)}
                </Select>
              </div>
              <div>
                <Label>{t("Priority")}</Label>
                <Select
                  value={selected.priority}
                  onChange={(event) => updateTask(selected.id, { priority: event.target.value as Task["priority"] })}
                >
                  <option value="must">{t("Must")}</option>
                  <option value="should">{t("Should")}</option>
                  <option value="could">{t("Could")}</option>
                  <option value="wont">{t("Won't")}</option>
                </Select>
              </div>
            </div>

            <Block title={t("Context")}>
              <p className="text-xs leading-relaxed text-muted-strong">{selected.context}</p>
              <p className="mt-2 text-xs leading-relaxed text-muted-strong">{selected.description}</p>
            </Block>

            <div className="grid gap-4 md:grid-cols-2">
              <Block title={t("Implementation steps")}>
                <ol className="space-y-1.5 text-[11px] leading-relaxed text-muted-strong">
                  {selected.steps.map((step, index) => (
                    <li key={step} className="flex gap-2">
                      <span className="font-mono text-[9px] text-accent">{index + 1}.</span>
                      {step}
                    </li>
                  ))}
                </ol>
              </Block>
              <Block title={t("Definition of Done")}>
                <ul className="space-y-1.5">
                  {selected.definitionOfDone.map((item) => (
                    <li key={item} className="flex gap-2 text-[11px] leading-relaxed text-muted-strong">
                      <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-accent/70" />
                      {item}
                    </li>
                  ))}
                </ul>
              </Block>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Block title={t("Acceptance criteria")}>
                <ul className="space-y-1.5">
                  {selected.acceptanceCriteria.map((item) => (
                    <li key={item} className="flex gap-2 text-[11px] leading-relaxed text-muted-strong">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent" />
                      {item}
                    </li>
                  ))}
                </ul>
              </Block>
              <Block title={t("Test plan")}>
                <ul className="space-y-1.5">
                  {selected.testPlan.map((item) => (
                    <li key={item} className="flex gap-2 text-[11px] leading-relaxed text-muted-strong">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-info" />
                      {item}
                    </li>
                  ))}
                </ul>
              </Block>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Block title={t("Requirements")}>
                <div className="flex flex-wrap gap-1.5">
                  {selected.requirementIds.length ? selected.requirementIds.map((id) => {
                    const requirement = requirements.find((item) => item.id === id);
                    if (!knownIds.has(id)) {
                      return (
                        <button
                          key={id}
                          type="button"
                          title={t("Remove missing requirement link")}
                          onClick={() =>
                            updateTask(selected.id, {
                              requirementIds: selected.requirementIds.filter((item) => item !== id),
                            })
                          }
                          className="rounded-full border border-danger/30 bg-danger/[0.06] px-2.5 py-0.5 text-[11px] text-danger hover:bg-danger/15"
                        >
                          {id} ×
                        </button>
                      );
                    }
                    return (
                      <Badge key={id} variant="accent" title={requirement?.title ?? t("Non-functional requirement")}>
                        {id}
                      </Badge>
                    );
                  }) : <span className="text-[11px] text-muted">{t("Foundation work")}</span>}
                </div>
              </Block>
              <Block title={t("Dependencies")}>
                <div className="flex flex-wrap gap-1.5">
                  {selected.dependencies.length ? selected.dependencies.map((id) => <Badge key={id} variant="muted">{id}</Badge>) : <span className="text-[11px] text-muted">{t("No dependencies")}</span>}
                </div>
              </Block>
            </div>

            <Block title={t("Agent prompt")}>
              <div className="relative">
                <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-xl border border-border bg-background/60 p-3 font-mono text-[10px] leading-relaxed text-muted-strong">
                  {selected.agentPrompt}
                </pre>
                <Button
                  variant="secondary"
                  size="sm"
                  className="absolute right-2 top-2"
                  onClick={() => copy(selected.agentPrompt, t("Agent prompt"))}
                >
                  <Copy className="h-3 w-3" /> {t("Copy")}
                </Button>
              </div>
            </Block>
          </div>
        ) : null}
      </Dialog>
    </div>
  );
}

function Metric({ label, value, detail }: { label: string; value: string | number; detail: string }) {
  return (
    <Card className="p-3.5">
      <div className="text-[10px] uppercase tracking-[0.14em] text-muted">{label}</div>
      <div className="mt-1 text-xl font-semibold tracking-tight">{value}</div>
      <div className="mt-0.5 text-[10px] text-muted">{detail}</div>
    </Card>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-muted">{title}</div>
      {children}
    </div>
  );
}

