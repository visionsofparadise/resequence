import {
  BaseEdge,
  getBezierPath,
  useReactFlow,
  type EdgeProps,
  type Edge,
} from "@xyflow/react";

type SignalEdgeType = Edge<Record<string, unknown>, "signal">;

export function SignalEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  source,
  target,
}: EdgeProps<SignalEdgeType>) {
  const { getNode } = useReactFlow();
  const sourceNode = getNode(source);
  const targetNode = getNode(target);
  const isHighlighted = sourceNode?.selected === true || targetNode?.selected === true;

  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      style={{
        stroke: isHighlighted ? "var(--gold-500)" : "var(--border-default)",
        strokeWidth: 1.5,
      }}
    />
  );
}
