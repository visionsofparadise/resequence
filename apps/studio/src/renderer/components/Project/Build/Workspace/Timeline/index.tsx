import { useEffect, useMemo, useRef, useState } from "react";
import type { BuildContext } from "../../../../../models/Context";
import { useTransients } from "../../../../../hooks/useTransients";
import { Playhead } from "./Playhead";
import { Ruler, RULER_HEIGHT } from "./Ruler";
import { SequenceCard } from "./Sequence";
import { useTimelinePan } from "./hooks/useTimelinePan";
import { useTimelineWheel } from "./hooks/useTimelineWheel";

interface TimelineProps {
	readonly context: BuildContext;
}

export const Timeline: React.FC<TimelineProps> = ({ context }) => {
	const { project, arrangement, rootPattern } = context;

	const containerRef = useRef<HTMLDivElement>(null);
	const contentRef = useRef<HTMLDivElement>(null);
	const [viewportWidth, setViewportWidth] = useState(0);

	const totalBeats = rootPattern.endBeat - rootPattern.startBeat;

	const bindWheel = useTimelineWheel({ context, containerRef, totalBeats });
	const { bindPan, isPanning } = useTimelinePan({ context });

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

	const contentTransients = useMemo(() => [project.timelineScrollX, project.timelineScrollY, project.timelineZoom], [project.timelineScrollX, project.timelineScrollY, project.timelineZoom]);

	useTransients(contentTransients, () => {
		if (!contentRef.current) return;

		const scrollX = project.timelineScrollX.value;
		const scrollY = project.timelineScrollY.value;
		const pxPerBeat = project.timelineZoom.value;
		const contentWidth = Math.max(totalBeats * pxPerBeat, viewportWidth);

		contentRef.current.style.transform = `translate(${-scrollX}px, ${-scrollY}px)`;
		contentRef.current.style.width = `${contentWidth}px`;
	});

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
					minHeight: `calc(100% - ${RULER_HEIGHT}px)`,
				}}
			>
				{arrangement.sequences.length === 0 ? (
					<div className="flex h-full items-center justify-center text-sm text-muted-foreground">No patterns</div>
				) : (
					arrangement.sequences.map((sequence, index) => (
						<SequenceCard
							key={`seq-${sequence.startBeat}-${index}`}
							sequence={sequence}
							sequencePath={[index]}
							context={context}
						/>
					))
				)}
				<Playhead context={context} />
			</div>
		</div>
	);
};
