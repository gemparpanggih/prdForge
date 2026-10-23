"use client";

import type { Edge, Node } from "@xyflow/react";
import type { FlowEdge, FlowNode, ProductFlow } from "@/lib/types";

export type FlowNodeData = {
  node: FlowNode;
  [key: string]: unknown;
};

export type FlowCanvasNode = Node<FlowNodeData, "flowNode">;
export type FlowCanvasEdge = Edge<{ kind: FlowEdge["kind"]; [key: string]: unknown }>;

export function buildCanvasNodes(flow: ProductFlow): FlowCanvasNode[] {
  return flow.nodes.map((node) => ({
    id: node.id,
    type: "flowNode",
    position: { x: node.x, y: node.y },
    data: { node },
  }));
}

export function edgeStyle(kind: FlowEdge["kind"]) {
  return {
    stroke:
      kind === "failure" ? "#fb7185" : kind === "success" ? "#c6f26a" : "#4b515c",
    strokeDasharray: kind === "failure" ? "5 4" : undefined,
    strokeWidth: kind === "default" ? 1.5 : 2,
  };
}

export function buildCanvasEdges(flow: ProductFlow): FlowCanvasEdge[] {
  return flow.edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    label: edge.label,
    type: "smoothstep",
    animated: edge.kind === "failure",
    data: { kind: edge.kind },
    style: edgeStyle(edge.kind),
    labelStyle: { fill: "#9ca3af", fontSize: 10 },
    labelBgStyle: { fill: "#16181d", fillOpacity: 0.9 },
    labelBgPadding: [4, 2] as [number, number],
    labelBgBorderRadius: 4,
  }));
}

export function extractFlow(nodes: FlowCanvasNode[], edges: FlowCanvasEdge[]): ProductFlow {
  return {
    nodes: nodes.map((node) => ({
      ...node.data.node,
      x: node.position.x,
      y: node.position.y,
    })),
    edges: edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: typeof edge.label === "string" ? edge.label : "",
      kind: edge.data?.kind ?? "default",
    })),
  };
}

export function autoLayoutFlow(nodes: FlowCanvasNode[], edges: FlowCanvasEdge[]): FlowCanvasNode[] {
  const outgoing = new Map<string, string[]>();
  const indegree = new Map<string, number>();
  for (const node of nodes) {
    outgoing.set(node.id, []);
    indegree.set(node.id, 0);
  }
  for (const edge of edges) {
    outgoing.get(edge.source)?.push(edge.target);
    indegree.set(edge.target, (indegree.get(edge.target) ?? 0) + 1);
  }
  const queue = nodes.filter((node) => (indegree.get(node.id) ?? 0) === 0).map((node) => node.id);
  const level = new Map<string, number>(queue.map((id) => [id, 0]));
  const order: string[] = [];
  while (queue.length) {
    const id = queue.shift()!;
    order.push(id);
    for (const target of outgoing.get(id) ?? []) {
      level.set(target, Math.max(level.get(target) ?? 0, (level.get(id) ?? 0) + 1));
      indegree.set(target, (indegree.get(target) ?? 1) - 1);
      if ((indegree.get(target) ?? 0) === 0) queue.push(target);
    }
  }
  const columns = new Map<number, string[]>();
  for (const node of nodes) {
    const column = level.get(node.id) ?? 0;
    columns.set(column, [...(columns.get(column) ?? []), node.id]);
  }
  return nodes.map((node) => {
    const column = level.get(node.id) ?? 0;
    const row = columns.get(column)?.indexOf(node.id) ?? 0;
    return {
      ...node,
      position: { x: column * 300, y: row * 190 },
    };
  });
}
