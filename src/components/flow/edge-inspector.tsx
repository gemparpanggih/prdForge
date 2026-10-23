"use client";

import { ArrowRight, Trash2, X } from "lucide-react";
import type { FlowEdge } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { usePreferences } from "@/components/preferences-provider";
import type { FlowCanvasEdge, FlowCanvasNode } from "./flow-types";

export function EdgeInspector({
  edge,
  nodes,
  onChange,
  onDelete,
  onClose,
}: {
  edge: FlowCanvasEdge;
  nodes: FlowCanvasNode[];
  onChange: (patch: { label?: string; kind?: FlowEdge["kind"] }) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const { t } = usePreferences();
  const source = nodes.find((node) => node.id === edge.source)?.data.node;
  const target = nodes.find((node) => node.id === edge.target)?.data.node;
  const kind = edge.data?.kind ?? "default";

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <div className="text-xs font-semibold">{t("Edge inspector")}</div>
          <div className="text-[9px] uppercase tracking-[0.14em] text-muted">{t("Connection")}</div>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label={t("Close")}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <div className="rounded-xl border border-border bg-background/40 p-3">
          <div className="flex items-center gap-2 text-[10px] text-muted-strong">
            <span className="truncate">{source?.label ?? edge.source}</span>
            <ArrowRight className="h-3 w-3 shrink-0 text-accent" />
            <span className="truncate">{target?.label ?? edge.target}</span>
          </div>
        </div>
        <div>
          <Label>{t("Label")}</Label>
          <Input
            value={typeof edge.label === "string" ? edge.label : ""}
            placeholder={t("Trigger or condition")}
            onChange={(event) => onChange({ label: event.target.value })}
          />
        </div>
        <div>
          <Label>{t("Path type")}</Label>
          <Select
            value={kind}
            onChange={(event) => onChange({ kind: event.target.value as FlowEdge["kind"] })}
          >
            <option value="default">{t("Default")}</option>
            <option value="success">{t("Success")}</option>
            <option value="failure">{t("Failure / alternative")}</option>
          </Select>
          <p className="mt-1 text-[10px] leading-relaxed text-muted">
            {t("Failure paths are rendered as dashed red edges. Success paths use the accent color.")}
          </p>
        </div>
      </div>
      <div className="border-t border-border p-3">
        <Button variant="danger" size="sm" className="w-full" onClick={onDelete}>
          <Trash2 className="h-3.5 w-3.5" />
          {t("Delete edge")}
        </Button>
      </div>
    </div>
  );
}
