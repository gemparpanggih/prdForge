"use client";

import { useState } from "react";
import {
  CirclePlus,
  Monitor,
  Trash2,
  X,
} from "lucide-react";
import type {
  FlowNode,
  FlowNodeKind,
  Requirement,
  WireframeBlockType,
  WireframeLayout,
} from "@/lib/types";
import { createWireframe, createWireframeBlock } from "@/lib/wireframe";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { usePreferences } from "@/components/preferences-provider";
import { WireframePreview } from "./wireframe-preview";

const NODE_KINDS: FlowNodeKind[] = ["actor", "screen", "action", "decision", "system", "data", "integration"];
const BLOCK_TYPES: WireframeBlockType[] = [
  "header",
  "sidebar",
  "stats",
  "chart",
  "table",
  "form",
  "actions",
  "list",
  "kanban",
  "detail",
  "footer",
];
const LAYOUTS: WireframeLayout[] = ["dashboard", "table", "form", "detail", "auth", "kanban", "settings", "empty"];

export function FlowInspector({
  node,
  requirements,
  onChange,
  onDelete,
  onClose,
}: {
  node: FlowNode | null;
  requirements: Requirement[];
  onChange: (patch: Partial<FlowNode>) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const { t } = usePreferences();
  const [blockType, setBlockType] = useState<WireframeBlockType>("header");
  const knownRequirementIds = new Set(requirements.map((requirement) => requirement.id));
  const missingRequirementIds = node?.requirementIds.filter(
    (id) => !knownRequirementIds.has(id),
  ) ?? [];

  if (!node) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-5 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface-raised text-muted">
          <Monitor className="h-4 w-4" />
        </div>
        <div className="mt-3 text-xs font-medium">{t("Select a node")}</div>
        <p className="mt-1 max-w-[220px] text-[10px] leading-relaxed text-muted">
          {t("Edit labels, link requirements, and design the wireframe for any screen node.")}
        </p>
      </div>
    );
  }

  function updateWireframe(patch: Partial<NonNullable<FlowNode["wireframe"]>>) {
    onChange({ wireframe: { ...node!.wireframe!, ...patch } });
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <div className="text-xs font-semibold">{t("Node inspector")}</div>
          <div className="text-[9px] uppercase tracking-[0.14em] text-muted">{node.kind}</div>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label={t("Close")}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <div className="space-y-3">
          <div>
            <Label>{t("Type")}</Label>
            <Select value={node.kind} onChange={(event) => onChange({ kind: event.target.value as FlowNodeKind })}>
              {NODE_KINDS.map((kind) => (
                <option key={kind} value={kind}>{kind}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label>{t("Label")}</Label>
            <Input value={node.label} onChange={(event) => onChange({ label: event.target.value })} />
          </div>
          <div>
            <Label>{t("Description")}</Label>
            <Textarea rows={3} value={node.description} onChange={(event) => onChange({ description: event.target.value })} />
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <Label className="mb-0">{t("Linked requirements")}</Label>
            <Badge variant="outline">{node.requirementIds.length}</Badge>
          </div>
          <div className="max-h-[180px] space-y-1 overflow-y-auto rounded-xl border border-border bg-background/40 p-2">
            {requirements.map((requirement) => {
              const checked = node.requirementIds.includes(requirement.id);
              return (
                <label key={requirement.id} className="flex cursor-pointer items-start gap-2 rounded-lg px-1.5 py-1 hover:bg-foreground/[0.03]">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() =>
                      onChange({
                        requirementIds: checked
                          ? node.requirementIds.filter((id) => id !== requirement.id)
                          : [...node.requirementIds, requirement.id],
                      })
                    }
                    className="mt-0.5 h-3 w-3 accent-[#c6f26a]"
                  />
                  <span className="min-w-0">
                    <span className="block font-mono text-[9px] text-accent">{requirement.id}</span>
                    <span className="block truncate text-[10px] text-muted">{requirement.title}</span>
                  </span>
                </label>
              );
            })}
          </div>
          {missingRequirementIds.length ? (
            <div className="mt-2 flex flex-wrap gap-1">
              {missingRequirementIds.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() =>
                    onChange({
                      requirementIds: node.requirementIds.filter((item) => item !== id),
                    })
                  }
                  className="rounded-full border border-danger/30 bg-danger/[0.06] px-2 py-0.5 text-[9px] text-danger hover:bg-danger/15"
                  title={t("Remove missing requirement link")}
                >
                  {id} ×
                </button>
              ))}
            </div>
          ) : null}
          {node.kind !== "actor" && node.requirementIds.length === 0 ? (
            <p className="mt-1.5 text-[9px] text-warning">{t("Unlinked nodes are flagged in the readiness review.")}</p>
          ) : null}
        </div>

        {node.kind === "screen" ? (
          <div className="border-t border-border pt-4">
            <div className="mb-2 flex items-center justify-between">
              <Label className="mb-0">{t("Wireframe")}</Label>
              {node.wireframe ? <Badge variant="accent">{node.wireframe.layout}</Badge> : null}
            </div>
            {node.wireframe ? (
              <div className="space-y-3">
                <WireframePreview wireframe={node.wireframe} compact />
                <div className="grid gap-2">
                  <Select
                    value={node.wireframe.layout}
                    onChange={(event) => updateWireframe({ layout: event.target.value as WireframeLayout })}
                  >
                    {LAYOUTS.map((layout) => <option key={layout} value={layout}>{layout}</option>)}
                  </Select>
                  <Input
                    value={node.wireframe.title}
                    placeholder={t("Screen title")}
                    onChange={(event) => updateWireframe({ title: event.target.value })}
                  />
                  <Input
                    value={node.wireframe.description}
                    placeholder={t("What is this screen for?")}
                    onChange={(event) => updateWireframe({ description: event.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  {node.wireframe.blocks.map((block, index) => (
                    <details key={block.id} className="rounded-lg border border-border bg-background/40 px-2.5 py-2">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-[10px] text-muted-strong">
                        <span className="truncate">
                          <span className="mr-1 text-muted">#{index + 1}</span>
                          {block.type} · {block.title || "Untitled"}
                        </span>
                        <Trash2
                          className="h-3 w-3 shrink-0 text-muted hover:text-danger"
                          onClick={(event) => {
                            event.preventDefault();
                            updateWireframe({
                              blocks: node.wireframe!.blocks.filter((item) => item.id !== block.id),
                            });
                          }}
                        />
                      </summary>
                      <div className="mt-2 space-y-2">
                        <Select
                          value={block.type}
                          onChange={(event) =>
                            updateWireframe({
                              blocks: node.wireframe!.blocks.map((item) =>
                                item.id === block.id
                                  ? { ...item, type: event.target.value as WireframeBlockType }
                                  : item,
                              ),
                            })
                          }
                        >
                          {BLOCK_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                        </Select>
                        <Input
                          value={block.title}
                          placeholder={t("Block title")}
                          onChange={(event) =>
                            updateWireframe({
                              blocks: node.wireframe!.blocks.map((item) =>
                                item.id === block.id ? { ...item, title: event.target.value } : item,
                              ),
                            })
                          }
                        />
                        <Textarea
                          rows={3}
                          value={block.items.join("\n")}
                          placeholder={t("One item per line")}
                          onChange={(event) =>
                            updateWireframe({
                              blocks: node.wireframe!.blocks.map((item) =>
                                item.id === block.id
                                  ? { ...item, items: event.target.value.split("\n") }
                                  : item,
                              ),
                            })
                          }
                        />
                      </div>
                    </details>
                  ))}
                </div>

                <div className="flex gap-1.5">
                  <Select className="h-8 text-[10px]" value={blockType} onChange={(event) => setBlockType(event.target.value as WireframeBlockType)}>
                    {BLOCK_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                  </Select>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      updateWireframe({ blocks: [...node.wireframe!.blocks, createWireframeBlock(blockType)] })
                    }
                  >
                    <CirclePlus className="h-3 w-3" /> {t("Add")}
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                className="w-full"
                onClick={() => onChange({ wireframe: createWireframe("dashboard", node.label) })}
              >
                <Monitor className="h-3.5 w-3.5" />
                {t("Add wireframe")}
              </Button>
            )}
          </div>
        ) : null}
      </div>

      <div className="border-t border-border p-3">
        <Button variant="danger" size="sm" className="w-full" onClick={onDelete}>
          <Trash2 className="h-3.5 w-3.5" />
          {t("Delete node")}
        </Button>
      </div>
    </div>
  );
}
