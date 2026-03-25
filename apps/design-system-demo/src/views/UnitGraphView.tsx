import { useMemo, useState, useCallback, useRef } from 'react';
import dagre from '@dagrejs/dagre';
import UnitNode from '../UnitNode';
import { Meter, Fader } from '@resequence/design-system';
import ViewHeader from '../ViewHeader';
import type { Param } from '../UnitNode';
import { CHROME_HEIGHT } from '../constants';

const NODE_WIDTH = 200;
const NODE_PADDING = 12;
const GRAPH_PAD = 40;

interface NodeDef {
  id: string;
  name: string;
  controls: Array<Param>;
}

interface DagreNodePos {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface LayoutNode extends NodeDef {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface NodePosition {
  x: number;
  y: number;
}

const TIMELINE_NODE_ID = 'timeline';
const TIMELINE_W = 360;
const TIMELINE_H = 120;
const OUT_NODE_ID = 'out';
const OUT_W = 120;
const OUT_H = 240;

const nodeData: Array<NodeDef> = [
  {
    id: TIMELINE_NODE_ID,
    name: 'TIMELINE',
    controls: [],
  },
  {
    id: 'osc',
    name: 'OSC',
    controls: [
      { type: 'selection', label: 'WAVEFORM', options: ['SINE', 'SQUARE', 'SAW', 'TRI'], active: 'SAW' },
      { type: 'knob', label: 'FREQ', value: 0.5 },
      { type: 'knob', label: 'DETUNE', value: 0.3 },
    ],
  },
  {
    id: 'filter',
    name: 'FILTER',
    controls: [
      { type: 'selection', label: 'TYPE', options: ['LP', 'HP', 'BP'], active: 'LP' },
      { type: 'knob', label: 'CUTOFF', value: 0.65, overridden: true },
      { type: 'knob', label: 'RES', value: 0.4 },
    ],
  },
  {
    id: 'env',
    name: 'ENV',
    controls: [
      { type: 'knob', label: 'ATK', value: 0.1 },
      { type: 'knob', label: 'DEC', value: 0.3 },
      { type: 'knob', label: 'SUS', value: 0.7 },
      { type: 'knob', label: 'REL', value: 0.4 },
    ],
  },
  {
    id: 'gain',
    name: 'GAIN',
    controls: [
      { type: 'knob', label: 'LEVEL', value: 0.8, overridden: true },
    ],
  },
  {
    id: OUT_NODE_ID,
    name: 'OUT',
    controls: [],
  },
];

const graphEdges: Array<[string, string]> = [
  [TIMELINE_NODE_ID, 'osc'],
  ['osc', 'filter'],
  ['filter', 'env'],
  ['env', 'gain'],
  ['gain', 'out'],
];

const estimateNodeHeight = (controls: Array<Param>): number => {
  const headerHeight = 28;
  const selections = controls.filter((ctrl) => ctrl.type === 'selection');
  const knobs = controls.filter((ctrl) => ctrl.type === 'knob');
  const selectionHeight = selections.length * 44;
  const knobRows = Math.ceil(knobs.length / 3);
  const knobHeight = knobRows > 0 ? knobRows * 56 : 0;

  return headerHeight + selectionHeight + knobHeight + NODE_PADDING * 2;
};

const UnitGraphView = () => {
  const initialNodes = useMemo(() => {
    const graph = new dagre.graphlib.Graph();

    graph.setGraph({ rankdir: 'LR', nodesep: 60, ranksep: 80 });
    graph.setDefaultEdgeLabel(() => ({}));

    for (const node of nodeData) {
      if (node.id === TIMELINE_NODE_ID) {
        graph.setNode(node.id, { width: TIMELINE_W, height: TIMELINE_H });
      } else if (node.id === OUT_NODE_ID) {
        graph.setNode(node.id, { width: OUT_W, height: OUT_H });
      } else {
        const height = estimateNodeHeight(node.controls);

        graph.setNode(node.id, { width: NODE_WIDTH, height });
      }
    }

    for (const [src, tgt] of graphEdges) {
      graph.setEdge(src, tgt);
    }

    dagre.layout(graph);

    return nodeData.map((nd): LayoutNode => {
      const pos = graph.node(nd.id) as DagreNodePos;
      const nodeW = nd.id === TIMELINE_NODE_ID ? TIMELINE_W : nd.id === OUT_NODE_ID ? OUT_W : NODE_WIDTH;

      return {
        ...nd,
        x: pos.x - nodeW / 2,
        y: pos.y - pos.height / 2,
        w: nodeW,
        h: pos.height,
      };
    });
  }, []);

  const [nodePositions, setNodePositions] = useState<Record<string, NodePosition>>(() => {
    const positions: Record<string, NodePosition> = {};

    for (const node of initialNodes) {
      positions[node.id] = { x: node.x, y: node.y };
    }

    return positions;
  });

  const [bypassed, setBypassed] = useState(false);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });
  const panOrigin = useRef({ x: 0, y: 0 });

  const [dragging, setDragging] = useState<{
    id: string;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);

  const handlePointerDown = useCallback((nodeId: string, ev: React.PointerEvent) => {
    ev.preventDefault();
    (ev.currentTarget as HTMLElement).setPointerCapture(ev.pointerId);
    const pos = nodePositions[nodeId];

    if (!pos) return;

    setDragging({
      id: nodeId,
      startX: ev.clientX,
      startY: ev.clientY,
      originX: pos.x,
      originY: pos.y,
    });
  }, [nodePositions]);

  const handlePointerMove = useCallback((ev: React.PointerEvent) => {
    if (!dragging) return;

    const dx = ev.clientX - dragging.startX;
    const dy = ev.clientY - dragging.startY;

    setNodePositions((prev) => ({
      ...prev,
      [dragging.id]: { x: dragging.originX + dx, y: dragging.originY + dy },
    }));
  }, [dragging]);

  const handlePointerUp = useCallback(() => {
    setDragging(null);
  }, []);

  // Build positioned nodes from current state
  const positionedNodes = initialNodes.map((node) => {
    const pos = nodePositions[node.id] ?? { x: node.x, y: node.y };

    return { ...node, x: pos.x, y: pos.y };
  });

  // Compute bounds
  const allX: Array<number> = positionedNodes.flatMap((nd) => [nd.x, nd.x + nd.w]);
  const allY: Array<number> = positionedNodes.flatMap((nd) => [nd.y, nd.y + nd.h]);
  const minX = Math.min(...allX);
  const minY = Math.min(...allY);
  const maxX = Math.max(...allX);
  const maxY = Math.max(...allY);
  const graphW = maxX - minX;
  const graphH = maxY - minY;

  const containerW = graphW + GRAPH_PAD * 2;
  const containerH = graphH + GRAPH_PAD * 2;
  const offsetX = -minX + GRAPH_PAD;
  const offsetY = -minY + GRAPH_PAD;

  const firstNodeId = nodeData[0]?.id;
  const lastNodeId = nodeData[nodeData.length - 1]?.id;

  // Derive edge paths from current node positions
  const edgePaths = graphEdges.map(([src, tgt]) => {
    const srcNode = positionedNodes.find((nd) => nd.id === src);
    const tgtNode = positionedNodes.find((nd) => nd.id === tgt);

    if (!srcNode || !tgtNode) return { x1: 0, y1: 0, x2: 0, y2: 0 };

    return {
      x1: srcNode.x + srcNode.w,
      y1: srcNode.y + srcNode.h / 2,
      x2: tgtNode.x,
      y2: tgtNode.y + tgtNode.h / 2,
    };
  });

  return (
    <div
      style={{
        height: `calc(100vh - ${CHROME_HEIGHT}px)`,
        backgroundColor: 'var(--color-surface)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div
        className="flex-1 relative overflow-hidden cursor-grab active:cursor-grabbing"
        onMouseDown={(ev) => {
          if (ev.target !== ev.currentTarget) return;
          isPanning.current = true;
          panStart.current = { x: ev.clientX, y: ev.clientY };
          panOrigin.current = { ...pan };
        }}
        onMouseMove={(ev) => {
          if (!isPanning.current) return;
          setPan({
            x: panOrigin.current.x + ev.clientX - panStart.current.x,
            y: panOrigin.current.y + ev.clientY - panStart.current.y,
          });
        }}
        onMouseUp={() => { isPanning.current = false; }}
        onMouseLeave={() => { isPanning.current = false; }}
      >
        <ViewHeader
          title="SYNTH"
          metadata={[{ label: '5 NODES', className: 'text-dimmed' }]}
          borderVisible={false}
          floating
        >
          <button
            onClick={() => setBypassed(prev => !prev)}
            className={`px-0 cursor-pointer border-none type-label transition-colors leading-none text-left ${bypassed ? 'text-accent-primary' : 'text-border hover:text-text-primary'}`}
          >
            BYPASS
          </button>
        </ViewHeader>

        <div
          style={{
            position: 'absolute',
            left: `calc(50% - ${containerW / 2}px + ${pan.x}px)`,
            top: `calc(50% - ${containerH / 2}px + ${pan.y}px)`,
            width: containerW,
            height: containerH,
          }}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          <svg
            style={{ position: 'absolute', top: 0, left: 0, width: containerW, height: containerH, pointerEvents: 'none' }}
          >
            {edgePaths.map((edge, ix) => {
              const ex1 = edge.x1 + offsetX;
              const ey1 = edge.y1 + offsetY;
              const ex2 = edge.x2 + offsetX;
              const ey2 = edge.y2 + offsetY;
              const midX = (ex1 + ex2) / 2;

              return (
                <path
                  key={ix}
                  d={`M ${ex1} ${ey1} C ${midX} ${ey1}, ${midX} ${ey2}, ${ex2} ${ey2}`}
                  fill="none"
                  stroke="var(--color-unit-1)"
                  strokeWidth={1}
                />
              );
            })}
          </svg>

          {positionedNodes.map((node) => (
            <div
              key={node.id}
              style={{
                position: 'absolute',
                left: node.x + offsetX,
                top: node.y + offsetY,
                cursor: dragging?.id === node.id ? 'grabbing' : 'grab',
                userSelect: 'none',
              }}
              onPointerDown={(ev) => handlePointerDown(node.id, ev)}
            >
              {node.id === TIMELINE_NODE_ID ? (
                <div
                  className="relative"
                  style={{ width: TIMELINE_W, height: TIMELINE_H }}
                >
                  <div className="inline-flex flex-col">
                    <span className="type-display text-[56px] text-text-primary leading-none">TIMELINE</span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="type-label text-dimmed">00:02:24.000</span>
                      <div className="flex-1 h-px bg-border" />
                      <svg width="12" height="12" viewBox="0 0 12 12" className="shrink-0">
                        <circle cx="6" cy="6" r="5.5" stroke="var(--color-border)" strokeWidth="1" fill="none" />
                        <circle cx="6" cy="6" r="2" fill="var(--color-dimmed)" />
                      </svg>
                    </div>
                  </div>
                  <div
                    className="absolute top-1/2 -translate-y-1/2 rounded-full bg-dimmed"
                    style={{ right: -3, width: 6, height: 6 }}
                  />
                </div>
              ) : node.id === OUT_NODE_ID ? (
                <div
                  className="relative"
                  style={{ width: OUT_W, height: OUT_H }}
                >
                  <div className="pl-10">
                  <span className="type-display text-[56px] text-text-primary leading-none block">OUT</span>
                  <div className="flex gap-3 mt-3 items-start">
                    <Fader value={0.75} label="" height={120} />
                    <div className="flex flex-col gap-1">
                      <button className="type-label text-dimmed hover:text-text-primary transition-colors bg-transparent border-none p-0 cursor-pointer text-left">MUTE</button>
                      <button className="type-label text-dimmed hover:text-text-primary transition-colors bg-transparent border-none p-0 cursor-pointer text-left">RST</button>
                    </div>
                  </div>
                  </div>
                  <div
                    className="absolute top-1/2 -translate-y-1/2 rounded-full bg-dimmed"
                    style={{ left: -3, width: 6, height: 6 }}
                  />
                </div>
              ) : (
                <UnitNode
                  name={node.name}
                  controls={node.controls}
                  hasInput={node.id !== firstNodeId}
                  hasOutput={node.id !== lastNodeId}
                />
              )}
            </div>
          ))}
        </div>

        <div className="absolute bottom-4 right-4 flex flex-col items-end gap-1 z-10">
          <span className="type-label text-dimmed tabular-nums">-3.2 dB</span>
          <div className="flex gap-1.5">
            <Meter level={0.6} height={320} animated />
            <Meter level={0.5} height={320} animated />
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnitGraphView;
