import { useCallback, useEffect, useRef, useState } from "react";
import type { ProjectContext } from "../../../models/Context";
import type { PianoRollTarget, ProjectState } from "../../../models/State/Project";
import { Playhead } from "./Playhead";
import { Ruler } from "./Ruler";
import { SegmentComponent } from "./Segment";
import { RULER_HEIGHT } from "./constants";
import { useTimelinePan } from "./hooks/useTimelinePan";
import { useTimelineData } from "./hooks/useTimelineData";
import { useTimelineWheel } from "./hooks/useTimelineWheel";

interface TimelineViewProps {
	readonly context: ProjectContext;
}

export const TimelineView: React.FC<TimelineViewProps> = ({ context }) => {
	const { project, build } = context;

	const containerRef = useRef<HTMLDivElement>(null);
	const contentRef = useRef<HTMLDivElement>(null);
	const [viewportWidth, setViewportWidth] = useState(0);
	const [hoveredPattern, setHoveredPattern] = useState<string | null>(null);

	const timelineData = useTimelineData(context);
	const tree = build.tree;
	const totalBeats = tree ? tree.endBeat - tree.startBeat : 0;

	const bindWheel = useTimelineWheel({ context, containerRef, totalBeats });
	const { bindPan, isPanning } = useTimelinePan({ context });

	const onOpenPianoRoll = useCallback((target: PianoRollTarget) => {
		context.projectStore.mutate<ProjectState>(project, (proxy) => {
			proxy.activePianoRoll = target;
		});
	}, [context.projectStore, project]);

	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		const observer = new ResizeObserver((entries) => {
			for (const entry of entries) {
				setViewportWidth(entry.contentRect.width);
			}
		});
		observer.observe(container);
		return () => observer.disconnect();
	}, []);

	const contentWidth = Math.max(totalBeats * project.timelineZoom.value, viewportWidth);

	const updateContentTransform = useCallback(() => {
		if (!contentRef.current) return;
		const scrollX = project.timelineScrollX.value;
		const scrollY = project.timelineScrollY.value;
		contentRef.current.style.transform = `translate(${-scrollX}px, ${-scrollY}px)`;
	}, [project.timelineScrollX, project.timelineScrollY]);

	useEffect(() => {
		const unsubs = [
			project.timelineScrollX.watch(updateContentTransform),
			project.timelineScrollY.watch(updateContentTransform),
		];
		return () => unsubs.forEach((unsub) => unsub());
	}, [project.timelineScrollX, project.timelineScrollY, updateContentTransform]);

	return (
		<div
			ref={containerRef}
			className="relative flex-1 min-h-0 overflow-hidden"
			style={{
				touchAction: "none",
				cursor: isPanning ? "grabbing" : "grab",
			}}
			{...bindWheel()}
			{...bindPan()}
		>
			<Ruler context={context} />
			<div
				ref={contentRef}
				className="relative"
				style={{
					width: contentWidth,
					minHeight: `calc(100% - ${RULER_HEIGHT}px)`,
				}}
			>
				{!timelineData || timelineData.segments.length === 0 ? (
					<div className="flex h-full items-center justify-center text-sm text-muted-foreground">
						No patterns
					</div>
				) : (
					timelineData.segments.map((segment, segIndex) => (
						<SegmentComponent
							key={`seg-${segment.startBeat}-${segIndex}`}
							segment={segment}
							segmentPath={[segIndex]}
							pxPerBeat={project.timelineZoom.value}
							pitchZoom={project.pitchZoom.value}
							hoveredPattern={hoveredPattern}
							onHoverPattern={setHoveredPattern}
							onOpenPianoRoll={onOpenPianoRoll}
							context={context}
							tempoMap={timelineData.tempoMap}
						/>
					))
				)}
				<Playhead context={context} />
			</div>
		</div>
	);
};
