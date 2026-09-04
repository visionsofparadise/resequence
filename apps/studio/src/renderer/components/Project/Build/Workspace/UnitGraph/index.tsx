import { surface, border } from "@resequence/design-system";
import { ReactFlow, ReactFlowProvider, type OnMove, type OnMoveEnd } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback, useMemo } from "react";
import { ViewHeader } from "../../../../ViewHeader";
import { UnitNode } from "./UnitNode";
import { buildGraph } from "./utils/buildGraph";
import { layoutGraph } from "./utils/layoutGraph";
import type { BuildContext } from "../../../../../models/Context";
import type { ProjectState } from "../../../../../models/State/Project";
import type { Unit } from "@resequence/web-au/core";

const nodeTypes = { unit: UnitNode };

const defaultEdgeOptions = {
	type: "default" as const,
	style: { stroke: border, strokeWidth: 1.5 },
};

interface UnitGraphProps {
	readonly context: BuildContext;
	readonly portKey: string;
	readonly outputUnit: Unit;
	readonly onBack: () => void;
}

export const UnitGraph: React.FC<UnitGraphProps> = ({ context, portKey, outputUnit, onBack }) => {
	const { project, projectStore, unitDriverMap, portColorMap } = context;

	const outputId = portKey;

	const { nodes, edges } = useMemo(() => {
		const graph = buildGraph(outputUnit, unitDriverMap);

		return { nodes: layoutGraph(graph.nodes, graph.edges), edges: graph.edges };
	}, [outputUnit, unitDriverMap]);

	const storedViewport = project.outputGraphViewports[outputId];
	const defaultViewport = storedViewport ?? { x: 0, y: 0, zoom: 1 };

	const onMove = useCallback<OnMove>(
		(_event, viewport) => {
			projectStore.mutate<ProjectState>(project, (proxy) => {
				proxy.outputGraphViewports[outputId] = {
					x: viewport.x,
					y: viewport.y,
					zoom: viewport.zoom,
				};
			});
		},
		[project, projectStore, outputId],
	);

	const onMoveEnd = useCallback<OnMoveEnd>(
		(_event, viewport) => {
			projectStore.mutate<ProjectState>(project, (proxy) => {
				proxy.outputGraphViewports[outputId] = {
					x: viewport.x,
					y: viewport.y,
					zoom: viewport.zoom,
				};
			});
		},
		[project, projectStore, outputId],
	);

	const unitColor = portColorMap.get(portKey);

	return (
		<ReactFlowProvider>
			<div className="relative h-full" style={{ backgroundColor: surface }}>
				<ViewHeader
					title={portKey}
					unitColor={unitColor}
					metadata={[{ label: `${nodes.length} NODES`, className: "text-dimmed" }]}
					onClose={onBack}
					floating
				/>
				<ReactFlow
					nodes={nodes}
					edges={edges}
					nodeTypes={nodeTypes}
					defaultViewport={defaultViewport}
					defaultEdgeOptions={defaultEdgeOptions}
					onMove={onMove}
					onMoveEnd={onMoveEnd}
					proOptions={{ hideAttribution: true }}
					nodesDraggable={false}
					nodesConnectable={false}
					style={{ backgroundColor: surface }}
				/>
			</div>
		</ReactFlowProvider>
	);
};
