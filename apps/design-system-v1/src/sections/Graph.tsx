import {
  ReactFlow,
  Background,
  MiniMap,
  BackgroundVariant,
  type Node,
  type Edge,
} from "@xyflow/react";
import dagre from "@dagrejs/dagre";
import DemoSection from "@/components/DemoSection";
import { SignalEdge } from "@/components/graph/SignalEdge";
import { UnitNode } from "@/components/graph/UnitNode";
import "@xyflow/react/dist/style.css";

const NODE_WIDTH = 160;
const NODE_HEIGHT = 96;

const nodeTypes = { unit: UnitNode };
const edgeTypes = { signal: SignalEdge };

interface LayoutInput {
  nodes: Array<Node>;
  edges: Array<Edge>;
}

function getLayoutedElements({ nodes, edges }: LayoutInput): LayoutInput {
  const graph = new dagre.graphlib.Graph();

  graph.setDefaultEdgeLabel(() => ({}));
  graph.setGraph({ rankdir: "LR", nodesep: 50, ranksep: 80 });

  for (const node of nodes) {
    graph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  }

  for (const edge of edges) {
    graph.setEdge(edge.source, edge.target);
  }

  dagre.layout(graph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = graph.node(node.id) as { x: number; y: number };

    return {
      ...node,
      position: {
        x: nodeWithPosition.x - NODE_WIDTH / 2,
        y: nodeWithPosition.y - NODE_HEIGHT / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}

const RAW_NODES: Array<Node> = [
  {
    id: "osc",
    type: "unit",
    position: { x: 0, y: 0 },
    data: {
      label: "Oscillator",
      knobs: [
        { label: "Freq", value: 0.5 },
        { label: "Fine", value: 0.5, bipolar: true },
      ],
      sourceConnected: true,
    },
  },
  {
    id: "filter",
    type: "unit",
    position: { x: 0, y: 0 },
    data: {
      label: "Filter",
      knobs: [
        { label: "Cutoff", value: 0.7 },
        { label: "Reso", value: 0.3 },
      ],
      sourceConnected: true,
      targetConnected: true,
    },
  },
  {
    id: "amp",
    type: "unit",
    position: { x: 0, y: 0 },
    data: {
      label: "Amp Envelope",
      knobs: [
        { label: "Attack", value: 0.1 },
        { label: "Release", value: 0.4 },
      ],
      sourceConnected: true,
      targetConnected: true,
    },
  },
  {
    id: "chorus",
    type: "unit",
    position: { x: 0, y: 0 },
    data: {
      label: "Chorus",
      knobs: [{ label: "Mix", value: 0.3 }],
      sourceConnected: true,
      targetConnected: true,
    },
  },
  {
    id: "reverb",
    type: "unit",
    position: { x: 0, y: 0 },
    data: {
      label: "Reverb",
      knobs: [
        { label: "Mix", value: 0.4 },
        { label: "Size", value: 0.6 },
      ],
      sourceConnected: true,
      targetConnected: true,
    },
  },
  {
    id: "output",
    type: "unit",
    position: { x: 0, y: 0 },
    data: {
      label: "Output",
      knobs: [{ label: "Gain", value: 0.8 }],
      targetConnected: true,
    },
  },
  {
    id: "lfo",
    type: "unit",
    position: { x: 0, y: 0 },
    data: {
      label: "LFO",
      knobs: [
        { label: "Rate", value: 0.4 },
        { label: "Depth", value: 0.6 },
      ],
      sourceConnected: true,
    },
  },
];

const RAW_EDGES: Array<Edge> = [
  { id: "osc-filter", source: "osc", target: "filter", type: "signal" },
  { id: "filter-amp", source: "filter", target: "amp", type: "signal" },
  { id: "amp-chorus", source: "amp", target: "chorus", type: "signal" },
  { id: "chorus-reverb", source: "chorus", target: "reverb", type: "signal" },
  { id: "reverb-output", source: "reverb", target: "output", type: "signal" },
  { id: "lfo-filter", source: "lfo", target: "filter", type: "signal" },
];

const { nodes: LAYOUTED_NODES, edges: LAYOUTED_EDGES } = getLayoutedElements({
  nodes: RAW_NODES,
  edges: RAW_EDGES,
});

function NodeGraph() {
  return (
    <div
      className="h-[400px] w-full overflow-hidden rounded-[4px] border border-border-default"
      style={{ background: "var(--surface-2)" }}
    >
      <ReactFlow
        nodes={LAYOUTED_NODES}
        edges={LAYOUTED_EDGES}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{ type: "signal" }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="var(--border-subtle)"
        />
        <MiniMap
          nodeColor="var(--surface-3)"
          nodeStrokeColor="var(--border-default)"
          maskColor="rgba(0, 0, 0, 0.3)"
          className="!rounded-[4px] !border !border-border-default !bg-surface-2"
          style={{ boxShadow: "var(--shadow-lg)" }}
        />
      </ReactFlow>
    </div>
  );
}

export default function Graph() {
  return (
    <div>
      <DemoSection
        id="nodes"
        title="Node Graph"
        description="Signal flow graph with auto-layout, custom nodes and edges styled with design system tokens."
      >
        <NodeGraph />
      </DemoSection>
    </div>
  );
}
