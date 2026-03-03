import { useWheel } from "@use-gesture/react";
import type { ReactDOMAttributes } from "@use-gesture/react/dist/declarations/src/types";
import type { ProjectContext } from "../../../../models/Context";
import type { ProjectState } from "../../../../models/State/Project";
import { MAX_PX_PER_BEAT, MIN_PX_PER_BEAT, ZOOM_SENSITIVITY } from "../constants";

interface UseTimelineWheelProps {
	readonly context: ProjectContext;
	readonly containerRef: React.RefObject<HTMLDivElement | null>;
	readonly totalBeats: number;
}

export function useTimelineWheel({ context, containerRef, totalBeats }: UseTimelineWheelProps): () => ReactDOMAttributes {
	const { project, projectStore } = context;

	return useWheel(
		({ event, delta: [, deltaY], ctrlKey, shiftKey, last }) => {
			if (event.cancelable) event.preventDefault();

			const container = containerRef.current;
			if (!container) return;

			if (ctrlKey) {
				const oldPpb = project.timelineZoom.value;
				const deltaRatio = 1 - deltaY * ZOOM_SENSITIVITY;
				const newPpb = Math.max(MIN_PX_PER_BEAT, Math.min(MAX_PX_PER_BEAT, oldPpb * deltaRatio));

				const rect = container.getBoundingClientRect();
				const cursorXInViewport = event.clientX - rect.left;
				const cursorXInContent = project.timelineScrollX.value + cursorXInViewport;
				const cursorBeat = cursorXInContent / oldPpb;

				const newCursorXInContent = cursorBeat * newPpb;
				const newScrollX = Math.max(0, newCursorXInContent - cursorXInViewport);

				projectStore.mutate<ProjectState>(project, (proxy) => {
					if (last) {
						proxy.timelineZoom.committed.value = newPpb;
						proxy.timelineScrollX.committed.value = newScrollX;
					} else {
						proxy.timelineZoom.transient.value = newPpb;
						proxy.timelineScrollX.transient.value = newScrollX;
					}
				});
			} else if (shiftKey) {
				const contentWidth = totalBeats * project.timelineZoom.value;
				const viewportWidth = container.clientWidth;
				const maxScrollX = Math.max(0, contentWidth - viewportWidth);
				const newScrollX = Math.max(0, Math.min(maxScrollX, project.timelineScrollX.value + deltaY));

				projectStore.mutate<ProjectState>(project, (proxy) => {
					if (last) {
						proxy.timelineScrollX.committed.value = newScrollX;
					} else {
						proxy.timelineScrollX.transient.value = newScrollX;
					}
				});
			} else {
				const contentHeight = container.scrollHeight;
				const viewportHeight = container.clientHeight;
				const maxScrollY = Math.max(0, contentHeight - viewportHeight);
				const newScrollY = Math.max(0, Math.min(maxScrollY, project.timelineScrollY.value + deltaY));

				projectStore.mutate<ProjectState>(project, (proxy) => {
					if (last) {
						proxy.timelineScrollY.committed.value = newScrollY;
					} else {
						proxy.timelineScrollY.transient.value = newScrollY;
					}
				});
			}
		},
		{ eventOptions: { passive: false } },
	);
}
