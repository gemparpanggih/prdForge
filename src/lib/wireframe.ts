import type { Wireframe, WireframeBlock, WireframeBlockType, WireframeLayout } from "./types";
import { uid } from "./utils";

function block(type: WireframeBlockType, title: string, items: string[]): WireframeBlock {
  return { id: uid("block"), type, title, items };
}

export function createWireframe(layout: WireframeLayout, title: string): Wireframe {
  const base: Wireframe = {
    layout,
    title,
    description: "",
    blocks: [
      block("header", title, ["Search", "Notifications", "New"]),
      block("stats", "Key metrics", ["Active", "Pending", "Complete"]),
      block("table", "Recent records", ["Name", "Owner", "Status", "Updated"]),
      block("actions", "Actions", ["Cancel", "Save"]),
    ],
  };
  if (layout === "table" || layout === "dashboard" || layout === "kanban" || layout === "settings") {
    base.blocks.unshift(block("sidebar", "Navigation", ["Overview", "Records", "Reports", "Settings"]));
  }
  if (layout === "form") {
    base.blocks = [
      block("header", title, ["Back"]),
      block("form", "Fields", ["Name", "Owner", "Status", "Description"]),
      block("actions", "Actions", ["Cancel", "Save"]),
    ];
  }
  if (layout === "detail") {
    base.blocks = [
      block("sidebar", "Record navigation", ["Overview", "Activity", "Tasks"]),
      block("header", title, ["Status", "Owner"]),
      block("detail", "Summary", ["Description", "Priority", "Due date"]),
      block("list", "Activity", ["Created", "Status changed", "Comment added"]),
    ];
  }
  if (layout === "auth") {
    base.blocks = [
      block("header", title, []),
      block("form", "Sign in", ["Email", "Password"]),
      block("actions", "Actions", ["Sign in"]),
    ];
  }
  if (layout === "empty") {
    base.blocks = [block("header", title, []), block("list", "Empty state", ["No records yet"])];
  }
  return base;
}

export function createWireframeBlock(type: WireframeBlockType): WireframeBlock {
  return { id: uid("block"), type, title: type, items: [] };
}
