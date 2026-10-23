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
        className="bg-[#0b0c0f]"
      >
        <Background variant={BackgroundVariant.Dots} gap={18} size={1} color="#22252b" />
        <Controls position="bottom-left" showInteractive={false} />
        <MiniMap
          position="bottom-right"
          pannable
          zoomable
          maskColor="rgba(5,6,8,0.75)"
          style={{ backgroundColor: "#0b0c0f", bottom: 24 }}
          nodeColor={(node) => {
            const kind = (node.data as FlowCanvasNode["data"])?.node?.kind;
            return kind === "screen"
              ? "#c6f26a"
              : kind === "decision"
                ? "#fbbf24"
                : kind === "data"
                  ? "#5eead4"
                  : "#4b515c";
          }}
        />
      </ReactFlow>
      <button
        type="button"
        onClick={() => fitView({ padding: 0.25, duration: 400 })}
        className="absolute left-3 top-3 z-10 rounded-lg border border-border bg-surface/90 px-2.5 py-1.5 text-[10px] text-muted-strong backdrop-blur transition-colors hover:text-foreground"
      >
        Fit view
      </button>
    </div>
  );
}
