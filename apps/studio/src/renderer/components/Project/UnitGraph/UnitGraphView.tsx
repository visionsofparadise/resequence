import { Background, ReactFlow, type OnMove, type OnMoveEnd } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback, useMemo } from "react";
import type { ProjectContext } from "../../../models/Context";
import type { ProjectState } from "../../../models/State/Project";
import { buildGraph } from "./buildGraph";
import { layoutGraph } from "./layoutGraph";
import { UnitNode } from "./UnitNode";

const nodeTypes = { unit: UnitNode };

interface UnitGraphViewProps {
	readonly context: ProjectContext;
	readonly outputId: string;
	readonly onBack: () => void;
}

export const UnitGraphView: React.FC<UnitGraphViewProps> = ({ context, outputId, onBack }) => {
	const { project, projectStore, build } = context;

	const outputUnit = useMemo(() => {
		if (!build.unitRoot) return null;

		return build.unitRoot.children.find((unit) => (unit.id ?? "") === outputId) ?? null;
	}, [build.unitRoot, outputId]);

	const { nodes, edges } = useMemo(() => {
		if (!outputUnit) return { nodes: [], edges: [] };

		const graph = buildGraph(outputUnit, build.derivedDrivers);

		return { nodes: layoutGraph(graph.nodes, graph.edges), edges: graph.edges };
	}, [outputUnit, build.derivedDrivers]);

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

	if (!outputUnit) {
		return <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Output not found</div>;
	}

	return (
		<div className="relative h-full">
			<div className="absolute left-3 top-2 z-10">
				<button
					type="button"
					className="text-xs text-muted-foreground hover:text-foreground"
					onClick={onBack}
				>
					&larr; Back
				</button>
			</div>
			<ReactFlow
				nodes={nodes}
				edges={edges}
				nodeTypes={nodeTypes}
				defaultViewport={defaultViewport}
				onMove={onMove}
				onMoveEnd={onMoveEnd}
				proOptions={{ hideAttribution: true }}
				nodesDraggable={false}
				nodesConnectable={false}
			>
				<Background />
			</ReactFlow>
		</div>
	);
};
