"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  addEdge,
  useEdgesState,
  useNodesState,
  type Connection,
  type EdgeChange,
  type NodeChange,
} from "@xyflow/react";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  ChevronDown,
  CirclePlus,
  GitBranch,
  Loader2,
  Monitor,
  RefreshCw,
  Save,
  Wand2,
  Workflow,
} from "lucide-react";
import { toast } from "sonner";
import type {
  FlowEdge,
  FlowNode,
  FlowNodeKind,
  ProductFlow,
  ProjectDetail,
  ReadinessReport,
  Requirement,
  Task,
} from "@/lib/types";
import { createWireframe } from "@/lib/wireframe";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { usePreferences } from "@/components/preferences-provider";
import { Progress } from "@/components/ui/progress";
import { cn, uid } from "@/lib/utils";
import { EdgeInspector } from "./edge-inspector";
import { FlowInspector } from "./flow-inspector";
import { ProductFlowCanvas } from "./product-flow-canvas";
import { WireframePreview } from "./wireframe-preview";
import {
  autoLayoutFlow,
  buildCanvasEdges,
  buildCanvasNodes,
  edgeStyle,
  extractFlow,
  type FlowCanvasEdge,
  type FlowCanvasNode,
} from "./flow-types";
import { TaskFlowCanvas } from "@/components/tasks/task-flow-canvas";

type Tab = "flow" | "screens" | "tasks";

const NODE_KINDS: { kind: FlowNodeKind; label: string }[] = [
  { kind: "screen", label: "Screen" },
  { kind: "action", label: "Action" },
  { kind: "decision", label: "Decision" },
  { kind: "system", label: "System" },
  { kind: "data", label: "Data" },
  { kind: "integration", label: "Integration" },
  { kind: "actor", label: "Actor" },
];

export function FlowWorkspace({
  project,
  initialFlow,
  requirements,
  tasks,
  initialReadiness,
}: {
  project: ProjectDetail;
  initialFlow: ProductFlow;
  requirements: Requirement[];
  tasks: Task[];
  initialReadiness: ReadinessReport;
}) {
  const router = useRouter();
  const { t } = usePreferences();
  const [tab, setTab] = useState<Tab>("flow");
  const [nodes, setNodes, baseOnNodesChange] = useNodesState<FlowCanvasNode>(buildCanvasNodes(initialFlow));
  const [edges, setEdges, baseOnEdgesChange] = useEdgesState<FlowCanvasEdge>(buildCanvasEdges(initialFlow));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [applying, setApplying] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [readiness, setReadiness] = useState(initialReadiness);

  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedId)?.data.node ?? null,
    [nodes, selectedId],
  );
  const selectedEdge = useMemo(
    () => edges.find((edge) => edge.id === selectedEdgeId) ?? null,
    [edges, selectedEdgeId],
  );
  const screenNodes = nodes.filter((node) => node.data.node.kind === "screen" && node.data.node.wireframe);

  function handleNodesChange(changes: NodeChange<FlowCanvasNode>[]) {
    baseOnNodesChange(changes);
    if (
      changes.some(
        (change) =>
          change.type === "add" ||
          change.type === "remove" ||
          change.type === "replace" ||
          change.type === "position",
      )
    ) {
      setDirty(true);
    }
  }

  function handleEdgesChange(changes: EdgeChange<FlowCanvasEdge>[]) {
    baseOnEdgesChange(changes);
    if (
      changes.some(
        (change) =>
          change.type === "add" ||
          change.type === "remove" ||
          change.type === "replace",
      )
    ) {
      setDirty(true);
    }
  }

  function handleConnect(connection: Connection) {
    setEdges((current) =>
      addEdge(
        {
          ...connection,
          id: uid("edge"),
          type: "smoothstep",
          label: "",
          data: { kind: "default" },
          style: { stroke: "#4b515c", strokeWidth: 1.5 },
        },
        current,
      ),
    );
    setDirty(true);
  }

  function updateSelectedNode(patch: Partial<FlowNode>) {
    if (!selectedId) return;
    setNodes((current) =>
      current.map((node) => {
        if (node.id !== selectedId) return node;
        const next = { ...node.data.node, ...patch };
        if (patch.kind && patch.kind !== "screen") {
          next.wireframe = undefined;
        }
        if (patch.kind === "screen" && !next.wireframe) {
          next.wireframe = createWireframe("dashboard", next.label);
        }
        return { ...node, data: { ...node.data, node: next } };
      }),
    );
    setDirty(true);
  }

  function deleteSelectedNode() {
    if (!selectedId) return;
    setNodes((current) => current.filter((node) => node.id !== selectedId));
    setEdges((current) =>
      current.filter((edge) => edge.source !== selectedId && edge.target !== selectedId),
    );
    setSelectedId(null);
    setDirty(true);
  }

  function updateSelectedEdge(patch: { label?: string; kind?: FlowEdge["kind"] }) {
    if (!selectedEdgeId) return;
    setEdges((current) =>
      current.map((edge) => {
        if (edge.id !== selectedEdgeId) return edge;
        const kind = patch.kind ?? edge.data?.kind ?? "default";
        return {
          ...edge,
          ...(patch.label !== undefined ? { label: patch.label } : {}),
          data: { kind },
          animated: kind === "failure",
          style: edgeStyle(kind),
        };
      }),
    );
    setDirty(true);
  }

  function deleteSelectedEdge() {
    if (!selectedEdgeId) return;
    setEdges((current) => current.filter((edge) => edge.id !== selectedEdgeId));
    setSelectedEdgeId(null);
    setDirty(true);
  }

  function addNode(kind: FlowNodeKind) {
    const count = nodes.length;
    const label =
      kind === "screen"
        ? "New screen"
        : kind === "action"
          ? "New action"
          : kind === "decision"
            ? "New decision"
            : kind === "actor"
              ? "New actor"
              : kind === "system"
                ? "New system"
                : kind === "data"
                  ? "New data store"
                  : "New integration";
    const node: FlowNode = {
      id: uid(`node-${kind}`),
      kind,
      label,
      description: "",
      x: 120 + (count % 4) * 250,
      y: 120 + Math.floor(count / 4) * 180,
      requirementIds: [],
      wireframe: kind === "screen" ? createWireframe("dashboard", label) : undefined,
    };
    setNodes((current) => [
      ...current,
      { id: node.id, type: "flowNode", position: { x: node.x, y: node.y }, data: { node } },
    ]);
    setSelectedId(node.id);
    setSelectedEdgeId(null);
    setTab("flow");
    setAddOpen(false);
    setDirty(true);
  }

  function handleAutoLayout() {
    setNodes((current) => autoLayoutFlow(current, edges));
    setDirty(true);
    toast.success(t("Canvas re-laid out."));
  }

  async function saveFlow(): Promise<boolean> {
    setSaving(true);
    try {
      const flow = extractFlow(nodes, edges);
      const response = await fetch(`/api/projects/${project.id}/flow`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(flow),
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        readiness?: ReadinessReport;
        error?: string;
      };
      if (!response.ok) throw new Error(payload.error || "Could not save the flow.");
      if (payload.readiness) setReadiness(payload.readiness);
      setDirty(false);
      toast.success(t("Flow saved."));
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("Could not save the flow."));
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function applyToPrd() {
    setApplying(true);
    try {
      const flow = extractFlow(nodes, edges);
      const saveResponse = await fetch(`/api/projects/${project.id}/flow`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(flow),
      });
      if (!saveResponse.ok) {
        const payload = (await saveResponse.json()) as { error?: string };
        throw new Error(payload.error || "Could not save the flow.");
      }
      const response = await fetch(`/api/projects/${project.id}/flow/apply`, { method: "POST" });
      const payload = (await response.json()) as {
        version?: number;
        readiness?: ReadinessReport;
        error?: string;
      };
      if (!response.ok) throw new Error(payload.error || "Could not apply the flow.");
      if (payload.readiness) setReadiness(payload.readiness);
      setDirty(false);
      toast.success(t("Flow applied to PRD v{version}.", { version: payload.version ?? "" }));
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("Could not apply the flow."));
    } finally {
      setApplying(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-4 md:px-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 rounded-xl border border-border bg-surface p-1">
          {[
            { id: "flow" as const, label: t("Product flow"), icon: Workflow },
            { id: "screens" as const, label: `${t("Wireframes")} (${screenNodes.length})`, icon: Monitor },
            { id: "tasks" as const, label: t("Task flow"), icon: GitBranch },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={cn(
                "flex h-8 items-center gap-1.5 rounded-lg px-3 text-[11px] font-medium transition-colors",
                tab === item.id
                  ? "bg-foreground/[0.06] text-foreground"
                  : "text-muted hover:text-foreground",
              )}
            >
              <item.icon className={cn("h-3.5 w-3.5", tab === item.id ? "text-accent" : "text-muted")} />
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="hidden items-center gap-1.5 text-[10px] text-muted sm:flex">
            {dirty ? (
              <>
                <span className="h-1.5 w-1.5 rounded-full bg-warning" />
                {t("Unsaved changes")}
              </>
            ) : (
              <>
                <Check className="h-3 w-3 text-success" />
                {t("Flow saved")}
              </>
            )}
          </div>
          {tab === "flow" ? (
            <div className="relative">
              <Button variant="secondary" size="sm" onClick={() => setAddOpen((value) => !value)}>
                <CirclePlus className="h-3.5 w-3.5" />
                {t("Add node")}
                <ChevronDown className="h-3 w-3" />
              </Button>
              {addOpen ? (
                <>
                  <button
                    type="button"
                    className="fixed inset-0 z-30 cursor-default"
                    aria-label={t("Close")}
                    onClick={() => setAddOpen(false)}
                  />
                  <div className="absolute right-0 top-full z-40 mt-1 w-44 rounded-xl border border-border bg-surface p-1 shadow-[var(--card-shadow)]">
                    {NODE_KINDS.map((item) => (
                      <button
                        key={item.kind}
                        type="button"
                        onClick={() => addNode(item.kind)}
                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[11px] text-muted-strong hover:bg-foreground/[0.04] hover:text-foreground"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-accent/60" />
                        {t(item.label)}
                      </button>
                    ))}
                  </div>
                </>
              ) : null}
            </div>
          ) : null}
          {tab === "flow" ? (
            <Button variant="secondary" size="sm" onClick={handleAutoLayout}>
              <Wand2 className="h-3.5 w-3.5" />
              {t("Auto layout")}
            </Button>
          ) : null}
          {tab === "flow" ? (
            <Button variant="secondary" size="sm" onClick={saveFlow} disabled={saving}>
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              {t("Save")}
            </Button>
          ) : null}
          <Button size="sm" onClick={applyToPrd} disabled={applying || saving}>
            {applying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            {t("Apply to PRD")}
          </Button>
        </div>
      </div>

      {tab === "flow" ? (
        <div className="grid overflow-hidden rounded-2xl border border-border bg-surface xl:h-[calc(100vh-210px)] xl:min-h-[580px] xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="h-[520px] min-h-0 xl:h-full">
            <ProductFlowCanvas
              nodes={nodes}
              edges={edges}
              onNodesChange={handleNodesChange}
              onEdgesChange={handleEdgesChange}
              onConnect={handleConnect}
              onNodeClick={(id) => {
                setSelectedId(id);
                setSelectedEdgeId(null);
              }}
              onEdgeClick={(id) => {
                setSelectedEdgeId(id);
                setSelectedId(null);
              }}
              onPaneClick={() => {
                setSelectedId(null);
                setSelectedEdgeId(null);
              }}
              onDirty={() => setDirty(true)}
            />
          </div>
          <aside className="min-h-[320px] border-t border-border bg-surface/60 xl:h-full xl:max-h-none xl:border-l xl:border-t-0">
            {selectedEdge ? (
              <EdgeInspector
                edge={selectedEdge}
                nodes={nodes}
                onChange={updateSelectedEdge}
                onDelete={deleteSelectedEdge}
                onClose={() => setSelectedEdgeId(null)}
              />
            ) : (
              <FlowInspector
                node={selectedNode}
                requirements={requirements}
                onChange={updateSelectedNode}
                onDelete={deleteSelectedNode}
                onClose={() => setSelectedId(null)}
              />
            )}
          </aside>
        </div>
      ) : null}

      {tab === "screens" ? (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div>
            {screenNodes.length === 0 ? (
              <EmptyState
                icon={Monitor}
                title={t("No wireframes yet")}
                description={t("Add a screen node to the product flow, then design its layout in the inspector.")}
                action={
                  <Button size="sm" onClick={() => addNode("screen")}>
                    <CirclePlus className="h-3.5 w-3.5" /> {t("Add screen")}
                  </Button>
                }
              />
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {screenNodes.map((node) => (
                  <button
                    key={node.id}
                    type="button"
                    onClick={() => setSelectedId(node.id)}
                    className={cn(
                      "group rounded-2xl border bg-surface p-3 text-left transition-colors",
                      selectedId === node.id ? "border-accent/40" : "border-border hover:border-border-strong",
                    )}
                  >
                    <WireframePreview wireframe={node.data.node.wireframe!} compact />
                    <div className="mt-2.5 flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-xs font-medium">{node.data.node.label}</div>
                        <div className="mt-0.5 truncate text-[10px] text-muted">
                          {node.data.node.wireframe?.description || t("No screen description")}
                        </div>
                      </div>
                      <Badge variant="outline">{node.data.node.requirementIds.length} FR</Badge>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <aside className="min-h-[320px] overflow-hidden rounded-2xl border border-border bg-surface/60">
            <FlowInspector
              node={selectedNode}
              requirements={requirements}
              onChange={updateSelectedNode}
              onDelete={deleteSelectedNode}
              onClose={() => setSelectedId(null)}
            />
          </aside>
        </div>
      ) : null}

      {tab === "tasks" ? (
        <div className="overflow-hidden rounded-2xl border border-border">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-surface/70 px-4 py-2.5">
            <div className="flex items-center gap-2 text-[11px] text-muted">
              <GitBranch className="h-3.5 w-3.5 text-accent" />
              {t("Execution graph · dependency order · critical path highlighted")}
            </div>
            <div className="flex items-center gap-3 text-[10px] text-muted">
              <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-accent" /> {t("Critical path")}</span>
              <Link href={`/projects/${project.id}/tasks`} className="inline-flex items-center gap-1 text-accent hover:underline">
                {t("Open task list")} <ArrowRight className="h-2.5 w-2.5" />
              </Link>
            </div>
          </div>
          <div className="h-[calc(100vh-260px)] min-h-[540px]">
            <TaskFlowCanvas tasks={tasks} />
          </div>
        </div>
      ) : null}

      {readiness.issues.length ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border bg-surface/50 px-4 py-3">
          <div className="flex items-center gap-2 text-[11px] text-muted">
            <AlertTriangle className="h-3.5 w-3.5 text-warning" />
            {readiness.issues.filter((issue) => issue.severity === "blocker").length} {t("blockers")} ·{" "}
            {readiness.issues.filter((issue) => issue.severity === "major").length} major issues
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted">{t("Readiness")} {readiness.score}%</span>
            <Progress value={readiness.score} className="w-24" indicatorClassName={readiness.canExport ? "bg-accent" : "bg-warning"} />
            <Link href={`/projects/${project.id}/review`} className="text-[10px] text-accent hover:underline">
              Review
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
