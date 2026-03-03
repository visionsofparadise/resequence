import { useDrag } from "@use-gesture/react";
import type { ReactDOMAttributes } from "@use-gesture/react/dist/declarations/src/types";
import { useState } from "react";
import type { ProjectContext } from "../../../../models/Context";
import type { ProjectState } from "../../../../models/State/Project";

interface UseTimelinePanProps {
	readonly context: ProjectContext;
}

interface UseTimelinePanResult {
	readonly bindPan: () => ReactDOMAttributes;
	readonly isPanning: boolean;
}

export function useTimelinePan({ context }: UseTimelinePanProps): UseTimelinePanResult {
	const { project, projectStore } = context;
	const [isPanning, setIsPanning] = useState(false);

	const bindPan = useDrag(
		({ delta: [dx, dy], first, last }) => {
			if (first) setIsPanning(true);

			const newScrollX = Math.max(0, project.timelineScrollX.value - dx);
			const newScrollY = Math.max(0, project.timelineScrollY.value - dy);

			projectStore.mutate<ProjectState>(project, (proxy) => {
				if (last) {
					proxy.timelineScrollX.committed.value = newScrollX;
					proxy.timelineScrollY.committed.value = newScrollY;
				} else {
					proxy.timelineScrollX.transient.value = newScrollX;
					proxy.timelineScrollY.transient.value = newScrollY;
				}
			});

			if (last) setIsPanning(false);
		},
		{ pointer: { keys: false } },
	);

	return { bindPan, isPanning };
}
