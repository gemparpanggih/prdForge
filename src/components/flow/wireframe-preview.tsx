import type { Wireframe, WireframeBlock } from "@/lib/types";
import { cn } from "@/lib/utils";

export function WireframePreview({
  wireframe,
  compact = false,
  className,
}: {
  wireframe: Wireframe;
  compact?: boolean;
  className?: string;
}) {
  const sidebar = wireframe.blocks.find((block) => block.type === "sidebar");
  const bodyBlocks = wireframe.blocks.filter((block) => block.type !== "sidebar");
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-[#0b0c0f] shadow-[0_16px_40px_rgba(0,0,0,0.25)]",
        className,
      )}
    >
      <div className="flex items-center gap-1.5 border-b border-border bg-surface-raised/60 px-3 py-2">
        <span className="h-1.5 w-1.5 rounded-full bg-[#fb7185]/70" />
        <span className="h-1.5 w-1.5 rounded-full bg-[#fbbf24]/70" />
        <span className="h-1.5 w-1.5 rounded-full bg-[#5eead4]/70" />
        <div className="ml-2 flex-1 truncate rounded-md border border-border bg-background/70 px-2 py-0.5 text-[8px] text-muted">
          app.local / {wireframe.title || "screen"}
        </div>
      </div>
      <div className={cn("flex gap-3", compact ? "p-2" : "p-3")}>
        {sidebar ? (
          <aside
            className={cn(
              "shrink-0 space-y-1.5 border-r border-border pr-2",
              compact ? "w-[74px]" : "w-[112px]",
            )}
          >
            <div className={cn("font-medium text-muted-strong", compact ? "text-[7px]" : "text-[10px]")}>
              {sidebar.title || "Navigation"}
            </div>
            {sidebar.items.slice(0, 5).map((item) => (
              <div
                key={item}
                className={cn(
                  "truncate rounded-md bg-white/[0.03] px-1.5 py-1 text-muted",
                  compact ? "text-[6.5px]" : "text-[9px]",
                )}
              >
                {item}
              </div>
            ))}
          </aside>
        ) : null}
        <div className="min-w-0 flex-1 space-y-2">
          {bodyBlocks.map((block) => (
            <Block key={block.id} block={block} compact={compact} />
          ))}
          {!bodyBlocks.length ? (
            <div className="flex h-24 items-center justify-center rounded-lg border border-dashed border-border text-[9px] text-muted">
              Empty screen
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Block({ block, compact }: { block: WireframeBlock; compact: boolean }) {
  const text = compact ? "text-[6.5px]" : "text-[9px]";
  const title = compact ? "text-[7px]" : "text-[10px]";
  switch (block.type) {
    case "header":
      return (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-white/[0.02] px-2 py-1.5">
          <div className={cn("font-medium text-muted-strong", title)}>{block.title || "Header"}</div>
          <div className="flex gap-1">
            {block.items.slice(0, 3).map((item) => (
              <span key={item} className={cn("rounded bg-accent/10 px-1.5 py-0.5 text-accent", text)}>
                {item}
              </span>
            ))}
          </div>
        </div>
      );
    case "stats":
      return (
        <div className={cn("grid gap-1.5", compact ? "grid-cols-2" : "grid-cols-4")}>
          {block.items.slice(0, 4).map((item, index) => (
            <div key={item} className="rounded-lg border border-border bg-white/[0.02] p-1.5">
              <div className={cn("text-muted", text)}>{item}</div>
              <div className={cn("mt-1 font-semibold text-foreground", compact ? "text-[10px]" : "text-sm")}>
                {[24, 8, 82, 3][index] ?? 12}
              </div>
            </div>
          ))}
        </div>
      );
    case "chart":
      return (
        <div className="rounded-lg border border-border bg-white/[0.02] p-2">
          <div className={cn("mb-2 text-muted", text)}>{block.title || "Chart"}</div>
          <div className="flex h-12 items-end gap-1">
            {[30, 52, 44, 68, 38, 76, 58, 84, 48, 66].map((height, index) => (
              <div
                key={index}
                className="flex-1 rounded-sm bg-accent/30"
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
        </div>
      );
    case "table":
      return (
        <div className="overflow-hidden rounded-lg border border-border">
          <div className="flex items-center justify-between bg-white/[0.03] px-2 py-1.5">
            <span className={cn("font-medium text-muted-strong", title)}>{block.title || "Table"}</span>
            <span className={cn("rounded bg-accent/10 px-1.5 py-0.5 text-accent", text)}>View all</span>
          </div>
          <div className="grid grid-cols-4 gap-2 border-b border-border px-2 py-1 text-muted">
            {block.items.slice(0, 4).map((item) => (
              <span key={item} className={text}>{item}</span>
            ))}
          </div>
          {[0, 1, 2, 3].map((row) => (
            <div key={row} className="grid grid-cols-4 gap-2 border-b border-border/60 px-2 py-1.5 last:border-0">
              {block.items.slice(0, 4).map((item, column) => (
                <span key={`${item}-${column}`} className={cn("truncate text-muted-strong", text)}>
                  {column === 0 ? `${item} ${row + 1}` : column === 2 ? ["Active", "Draft", "Done", "Blocked"][row] : "—"}
                </span>
              ))}
            </div>
          ))}
        </div>
      );
    case "form":
      return (
        <div className="rounded-lg border border-border bg-white/[0.02] p-2">
          <div className={cn("mb-2 font-medium text-muted-strong", title)}>{block.title || "Form"}</div>
          <div className={cn("grid gap-1.5", compact ? "grid-cols-1" : "grid-cols-2")}>
            {block.items.slice(0, 6).map((item) => (
              <div key={item}>
                <div className={cn("mb-0.5 text-muted", text)}>{item}</div>
                <div className={cn("h-5 rounded-md border border-border bg-background/60", compact ? "h-3.5" : "h-5")} />
              </div>
            ))}
          </div>
        </div>
      );
    case "actions":
      return (
        <div className="flex justify-end gap-1.5">
          {block.items.map((item, index) => (
            <span
              key={item}
              className={cn(
                "rounded-md px-2 py-1",
                index === block.items.length - 1
                  ? "bg-accent text-accent-foreground"
                  : "border border-border text-muted-strong",
                text,
              )}
            >
              {item}
            </span>
          ))}
        </div>
      );
    case "list":
      return (
        <div className="rounded-lg border border-border bg-white/[0.02] p-2">
          <div className={cn("mb-1.5 font-medium text-muted-strong", title)}>{block.title || "Activity"}</div>
          {block.items.slice(0, 4).map((item) => (
            <div key={item} className="flex items-center gap-1.5 border-b border-border/50 py-1 last:border-0">
              <span className="h-1 w-1 rounded-full bg-accent/60" />
              <span className={cn("text-muted", text)}>{item}</span>
            </div>
          ))}
        </div>
      );
    case "kanban":
      return (
        <div className="grid grid-cols-3 gap-1.5">
          {["To do", "In progress", "Done"].map((column) => (
            <div key={column} className="rounded-lg border border-border bg-white/[0.02] p-1.5">
              <div className={cn("mb-1 text-muted", text)}>{column}</div>
              {block.items.slice(0, 2).map((item) => (
                <div key={`${column}-${item}`} className={cn("mb-1 rounded border border-border bg-surface px-1 py-1 text-muted-strong", text)}>
                  {item}
                </div>
              ))}
            </div>
          ))}
        </div>
      );
    case "detail":
      return (
        <div className="rounded-lg border border-border bg-white/[0.02] p-2">
          <div className={cn("mb-1.5 font-medium text-muted-strong", title)}>{block.title || "Details"}</div>
          <div className="space-y-1">
            {block.items.map((item) => (
              <div key={item} className="flex items-center justify-between gap-2">
                <span className={cn("text-muted", text)}>{item}</span>
                <span className={cn("h-2 w-12 rounded bg-white/[0.06]", compact ? "w-8" : "w-14")} />
              </div>
            ))}
          </div>
        </div>
      );
    case "footer":
      return <div className={cn("border-t border-border pt-2 text-center text-muted", text)}>{block.title || block.items.join(" · ")}</div>;
    default:
      return null;
  }
}
