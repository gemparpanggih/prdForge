"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import {
  ArrowRightLeft,
  Database,
  GitBranch,
  Monitor,
  MousePointerClick,
  Server,
  UserRound,
  Workflow,
} from "lucide-react";
import type { FlowNodeKind } from "@/lib/types";
import { cn } from "@/lib/utils";
import type { FlowCanvasNode } from "./flow-types";

const KIND = {
  actor: {
    icon: UserRound,
    className: "border-[#7dd3fc]/25 bg-[#7dd3fc]/[0.06]",
    iconClass: "text-[#7dd3fc]",
    label: "Actor",
  },
  screen: {
    icon: Monitor,
    className: "border-accent/25 bg-accent/[0.05]",
    iconClass: "text-accent",
    label: "Screen",
  },
  action: {
    icon: MousePointerClick,
    className: "border-[#a78bfa]/25 bg-[#a78bfa]/[0.06]",
    iconClass: "text-[#a78bfa]",
    label: "Action",
  },
  decision: {
    icon: GitBranch,
    className: "border-warning/25 bg-warning/[0.05]",
    iconClass: "text-warning",
    label: "Decision",
  },
  system: {
    icon: Server,
    className: "border-border-strong bg-white/[0.02]",
    iconClass: "text-muted-strong",
    label: "System",
  },
  data: {
    icon: Database,
    className: "border-success/25 bg-success/[0.05]",
    iconClass: "text-success",
    label: "Data",
  },
  integration: {
    icon: ArrowRightLeft,
    className: "border-[#f0abfc]/25 bg-[#f0abfc]/[0.05]",
    iconClass: "text-[#f0abfc]",
    label: "Integration",
  },
} satisfies Record<
  FlowNodeKind,
  { icon: React.ComponentType<{ className?: string }>; className: string; iconClass: string; label: string }
>;

export function FlowNodeCard({ data, selected }: NodeProps<FlowCanvasNode>) {
  const node = data.node;
  const kind = KIND[node.kind];
  const Icon = kind.icon;
  return (
    <div
      className={cn(
        "w-[214px] rounded-xl border bg-surface px-3 py-2.5 shadow-[0_12px_32px_rgba(0,0,0,0.3)] transition-shadow",
        kind.className,
        selected && "ring-2 ring-accent/50 ring-offset-2 ring-offset-background",
      )}
    >
      <Handle type="target" position={Position.Left} />
      <div className="flex items-center gap-2">
        <span className={cn("flex h-6 w-6 items-center justify-center rounded-lg border border-white/5 bg-black/20", kind.iconClass)}>
          <Icon className="h-3 w-3" />
        </span>
        <div className="min-w-0">
          <div className="truncate text-[11px] font-medium text-foreground">{node.label || "Untitled"}</div>
          <div className="text-[8px] uppercase tracking-[0.14em] text-muted">{kind.label}</div>
        </div>
      </div>
      {node.description ? (
        <p className="mt-1.5 line-clamp-2 text-[9px] leading-relaxed text-muted">{node.description}</p>
      ) : null}
      <div className="mt-2 flex items-center justify-between gap-2 border-t border-white/[0.05] pt-1.5">
        <span className="flex items-center gap-1 text-[8px] text-muted">
          <Workflow className="h-2.5 w-2.5" />
          {node.requirementIds.length} {node.requirementIds.length === 1 ? "requirement" : "requirements"}
        </span>
        {node.wireframe ? <span className="rounded bg-accent/10 px-1.5 py-0.5 text-[7px] text-accent">wireframe</span> : null}
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
