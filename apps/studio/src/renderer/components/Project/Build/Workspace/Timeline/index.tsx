import { useEffect, useMemo, useRef, useState } from "react";
import { Barcode } from "@resequence/design-system";
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
	const { project, arrangement } = context;

	const containerRef = useRef<HTMLDivElement>(null);
	const contentRef = useRef<HTMLDivElement>(null);
	const [viewportWidth, setViewportWidth] = useState(0);

	const totalBeats = arrangement.endBeat - arrangement.startBeat;
	const totalBars = Math.ceil(totalBeats / 4);

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
			className="bg-surface relative flex-1 min-h-0 overflow-hidden"
			style={{
				touchAction: "none",
				cursor: isPanning ? "grabbing" : "grab",
			}}
			{...bindWheel()}
			{...bindPan()}
		>
			<div className="absolute inset-0 z-0 pointer-events-none select-none">
				<div className="absolute top-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1">
					<span className="type-label text-border leading-none">
						{totalBars} BARS
					</span>
				</div>
				<div
					className="absolute top-4 left-4 flex flex-col gap-1"
					style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
				>
					<Barcode height={40} color="var(--color-border)" />
				</div>
				<div
					className="absolute top-4 right-6"
					style={{ writingMode: "vertical-rl" }}
				>
					<span className="type-display text-[56px] leading-none text-border block">
						RESEQUENCE
					</span>
				</div>
			</div>
			<Ruler context={context} />
			<div
				ref={contentRef}
				className="relative z-[1]"
				style={{
					minHeight: `calc(100% - ${RULER_HEIGHT}px)`,
				}}
			>
				{arrangement.sequences.length === 0 ? (
					<div className="flex h-full items-center justify-center text-sm text-text-secondary">No patterns</div>
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
