"use client";

import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Connection,
  type NodeTypes,
  type OnEdgesChange,
  type OnNodesChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { usePreferences } from "@/components/preferences-provider";
import { FlowNodeCard } from "./flow-node-card";
import type { FlowCanvasEdge, FlowCanvasNode } from "./flow-types";

const nodeTypes = { flowNode: FlowNodeCard } as NodeTypes;

export function ProductFlowCanvas(props: {
  nodes: FlowCanvasNode[];
  edges: FlowCanvasEdge[];
  onNodesChange: OnNodesChange<FlowCanvasNode>;
  onEdgesChange: OnEdgesChange<FlowCanvasEdge>;
  onConnect: (connection: Connection) => void;
  onNodeClick: (nodeId: string) => void;
  onEdgeClick: (edgeId: string) => void;
  onPaneClick: () => void;
  onDirty: () => void;
}) {
  return (
    <ReactFlowProvider>
      <CanvasInner {...props} />
    </ReactFlowProvider>
  );
}

function CanvasInner({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeClick,
  onEdgeClick,
  onPaneClick,
  onDirty,
}: {
  nodes: FlowCanvasNode[];
  edges: FlowCanvasEdge[];
  onNodesChange: OnNodesChange<FlowCanvasNode>;
  onEdgesChange: OnEdgesChange<FlowCanvasEdge>;
  onConnect: (connection: Connection) => void;
  onNodeClick: (nodeId: string) => void;
  onEdgeClick: (edgeId: string) => void;
  onPaneClick: () => void;
  onDirty: () => void;
}) {
  const { fitView } = useReactFlow();
  const { t } = usePreferences();
  return (
    <div className="relative h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={(_event, node) => onNodeClick(node.id)}
        onEdgeClick={(_event, edge) => onEdgeClick(edge.id)}
        onPaneClick={onPaneClick}
        onNodeDragStart={onDirty}
        onNodesDelete={onDirty}
        onEdgesDelete={onDirty}
        fitView
        fitViewOptions={{ padding: 0.12 }}
        minZoom={0.25}
        maxZoom={1.8}
        snapToGrid
        snapGrid={[10, 10]}
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
            const kind = (node.data as FlowCanvasNode["data"])?.node?.kind;
            return kind === "screen"
              ? "var(--accent)"
              : kind === "decision"
                ? "var(--warning)"
                : kind === "data"
                  ? "var(--success)"
                  : "var(--flow-edge)";
          }}
        />
      </ReactFlow>
      <button
        type="button"
        onClick={() => fitView({ padding: 0.25, duration: 400 })}
        className="absolute left-3 top-3 z-10 rounded-lg border border-border bg-surface/90 px-2.5 py-1.5 text-[10px] text-muted-strong backdrop-blur transition-colors hover:text-foreground"
      >
        {t("Fit view")}
      </button>
    </div>
  );
}
