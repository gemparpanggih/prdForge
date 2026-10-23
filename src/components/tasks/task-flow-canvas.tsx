"use client";

import { useMemo } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { CheckCircle2, Circle, Clock3, Flag } from "lucide-react";
import type { Task, TaskStatus } from "@/lib/types";
import { criticalPath, taskLayers } from "@/lib/task-graph";
import { usePreferences } from "@/components/preferences-provider";
import { cn } from "@/lib/utils";

type TaskNodeData = { task: Task; critical: boolean; [key: string]: unknown };
type TaskCanvasNode = Node<TaskNodeData, "taskNode">;

const statusStyles: Record<TaskStatus, { label: string; className: string; icon: React.ComponentType<{ className?: string }> }> = {
  todo: { label: "To do", className: "border-border bg-surface", icon: Circle },
  in_progress: { label: "In progress", className: "border-info/25 bg-info/[0.04]", icon: Clock3 },
  blocked: { label: "Blocked", className: "border-danger/30 bg-danger/[0.04]", icon: Flag },
  done: { label: "Done", className: "border-success/25 bg-success/[0.04]", icon: CheckCircle2 },
};

function TaskNode({ data }: NodeProps<TaskCanvasNode>) {
  const { t } = usePreferences();
  const task = data.task;
  const status = statusStyles[task.status];
  const StatusIcon = status.icon;
  return (
    <div
      className={cn(
        "w-[222px] rounded-xl border px-3 py-2.5 shadow-[var(--card-shadow)]",
        status.className,
        data.critical && "ring-1 ring-accent/40",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[9px] text-accent">{task.id}</span>
        <span className="inline-flex items-center gap-1 text-[8px] text-muted">
          <StatusIcon className="h-2.5 w-2.5" />
          {t(status.label)}
        </span>
      </div>
      <div className="mt-1 line-clamp-2 text-[10px] font-medium leading-relaxed text-foreground">
        {task.title}
      </div>
      <div className="mt-2 flex items-center justify-between border-t border-border/60 pt-1.5 text-[8px] text-muted">
        <span className="capitalize">{task.type}</span>
        <span>{task.milestoneId}</span>
      </div>
    </div>
  );
}

const nodeTypes = { taskNode: TaskNode };

export function TaskFlowCanvas({ tasks }: { tasks: Task[] }) {
  const { nodes, edges } = useMemo(() => {
    const layers = taskLayers(tasks);
    const critical = new Set(criticalPath(tasks));
    const groups = new Map<number, Task[]>();
    for (const task of tasks) {
      const layer = layers.get(task.id) ?? 0;
      groups.set(layer, [...(groups.get(layer) ?? []), task]);
    }
    const nodes: TaskCanvasNode[] = tasks.map((task) => {
      const layer = layers.get(task.id) ?? 0;
      const index = groups.get(layer)?.findIndex((item) => item.id === task.id) ?? 0;
      return {
        id: task.id,
        type: "taskNode",
        position: { x: layer * 280, y: index * 145 },
        data: { task, critical: critical.has(task.id) },
      };
    });
    const edges: Edge[] = tasks.flatMap((task) =>
      task.dependencies.map((dependency) => ({
        id: `${dependency}-${task.id}`,
        source: dependency,
        target: task.id,
        type: "smoothstep",
        style: {
          stroke: critical.has(task.id) && critical.has(dependency) ? "var(--accent)" : "var(--flow-edge)",
          strokeWidth: critical.has(task.id) && critical.has(dependency) ? 2 : 1.4,
        },
      })),
    );
    return { nodes, edges };
  }, [tasks]);

  return (
    <ReactFlowProvider>
      <div className="h-full w-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.2}
          maxZoom={1.6}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable
          className="bg-[var(--flow-bg)]"
        >
          <Background variant={BackgroundVariant.Dots} gap={18} size={1} color="var(--flow-grid)" />
          <Controls position="bottom-left" showInteractive={false} />
          <MiniMap
            position="bottom-right"
            pannable
            zoomable
            maskColor="var(--flow-mask)"
            style={{ backgroundColor: "var(--flow-bg)", bottom: 24 }}
            nodeColor={(node) => {
              const task = (node.data as TaskNodeData)?.task;
              return task?.status === "done"
                ? "var(--success)"
                : task?.status === "blocked"
                  ? "#fb7185"
                  : task?.status === "in_progress"
                    ? "var(--info)"
                    : "var(--flow-edge)";
            }}
          />
        </ReactFlow>
      </div>
    </ReactFlowProvider>
  );
}
