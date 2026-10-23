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
import { usePreferences } from "@/components/preferences-provider";
import { cn } from "@/lib/utils";
import type { FlowCanvasNode } from "./flow-types";

const KIND = {
  actor: {
    icon: UserRound,
    color: "var(--kind-actor)",
    label: "Actor",
  },
  screen: {
    icon: Monitor,
    color: "var(--accent)",
    label: "Screen",
  },
  action: {
    icon: MousePointerClick,
    color: "var(--kind-action)",
    label: "Action",
  },
  decision: {
    icon: GitBranch,
    color: "var(--warning)",
    label: "Decision",
  },
  system: {
    icon: Server,
    color: "var(--muted-strong)",
    label: "System",
  },
  data: {
    icon: Database,
    color: "var(--success)",
    label: "Data",
  },
  integration: {
    icon: ArrowRightLeft,
    color: "var(--kind-integration)",
    label: "Integration",
  },
} satisfies Record<
  FlowNodeKind,
  { icon: React.ComponentType<{ className?: string }>; color: string; label: string }
>;

export function FlowNodeCard({ data, selected }: NodeProps<FlowCanvasNode>) {
  const { t } = usePreferences();
  const node = data.node;
  const kind = KIND[node.kind];
  const Icon = kind.icon;
  return (
    <div
      className={cn(
        "w-[214px] rounded-xl border bg-surface px-3 py-2.5 shadow-[var(--card-shadow)] transition-shadow",
        selected && "ring-2 ring-accent/50 ring-offset-2 ring-offset-background",
      )}
      style={{
        borderColor: `color-mix(in srgb, ${kind.color} 30%, transparent)`,
        backgroundColor: `color-mix(in srgb, ${kind.color} 7%, var(--surface))`,
      }}
    >
      <Handle type="target" position={Position.Left} />
      <div className="flex items-center gap-2">
        <span
          className="flex h-6 w-6 items-center justify-center rounded-lg border border-border/60 bg-background/50"
          style={{ color: kind.color }}
        >
          <Icon className="h-3 w-3" />
        </span>
        <div className="min-w-0">
          <div className="truncate text-[11px] font-medium text-foreground">{node.label || t("Untitled")}</div>
          <div className="text-[8px] uppercase tracking-[0.14em] text-muted">{t(kind.label)}</div>
        </div>
      </div>
      {node.description ? (
        <p className="mt-1.5 line-clamp-2 text-[9px] leading-relaxed text-muted">{node.description}</p>
      ) : null}
      <div className="mt-2 flex items-center justify-between gap-2 border-t border-border/60 pt-1.5">
        <span className="flex items-center gap-1 text-[8px] text-muted">
          <Workflow className="h-2.5 w-2.5" />
          {node.requirementIds.length} {t("requirement")}
        </span>
        {node.wireframe ? <span className="rounded bg-accent/10 px-1.5 py-0.5 text-[7px] text-accent">{t("wireframe")}</span> : null}
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
