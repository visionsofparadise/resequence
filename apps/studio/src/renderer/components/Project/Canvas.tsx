import { Background, ReactFlow, type OnMove, type OnMoveEnd } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback } from "react";
import type { ProjectContext } from "../../models/Context";
import type { ProjectState } from "../../models/State/Project";

interface CanvasProps {
	readonly context: ProjectContext;
}

const emptyNodes: Array<never> = [];
const emptyEdges: Array<never> = [];

export const Canvas: React.FC<CanvasProps> = ({ context }) => {
	const { project, projectStore } = context;

	const onMove = useCallback<OnMove>(
		(_event, viewport) => {
			projectStore.mutate<ProjectState>(project, (proxy) => {
				proxy.canvasX.transient.value = viewport.x;
				proxy.canvasY.transient.value = viewport.y;
				proxy.zoom.transient.value = viewport.zoom;
			});
		},
		[project, projectStore],
	);

	const onMoveEnd = useCallback<OnMoveEnd>(
		(_event, viewport) => {
			projectStore.mutate<ProjectState>(project, (proxy) => {
				proxy.canvasX.committed.value = viewport.x;
				proxy.canvasY.committed.value = viewport.y;
				proxy.zoom.committed.value = viewport.zoom;
			});
		},
		[project, projectStore],
	);

	return (
		<ReactFlow
			nodes={emptyNodes}
			edges={emptyEdges}
			defaultViewport={{
				x: project.canvasX._committed,
				y: project.canvasY._committed,
				zoom: project.zoom._committed,
			}}
			onMove={onMove}
			onMoveEnd={onMoveEnd}
			proOptions={{ hideAttribution: true }}
		>
			<Background />
		</ReactFlow>
	);
};
