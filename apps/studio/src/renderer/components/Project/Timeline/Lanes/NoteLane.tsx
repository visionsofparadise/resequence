import { memo } from "react";
import { outputSetColor } from "../aggregation/outputColor";
import type { NoteLane as NoteLaneData, PatternSpan } from "../aggregation/types";
import { MIN_LANE_HEIGHT, MIN_PITCH_RANGE, PX_PER_SEMITONE } from "../constants";

interface NoteLaneProps {
	readonly lane: NoteLaneData;
	readonly pxPerBeat: number;
	readonly segmentStartBeat: number;
	readonly hoveredPattern: string | null;
	readonly onHoverPattern: (path: string | null) => void;
}

export const NoteLanePlaceholder = memo<NoteLaneProps>(({ lane, pxPerBeat, segmentStartBeat, hoveredPattern, onHoverPattern }) => {
	const pitchRange = lane.maxPitch - lane.minPitch;
	const displayRange = Math.max(pitchRange, MIN_PITCH_RANGE);
	const height = Math.max(displayRange * PX_PER_SEMITONE, MIN_LANE_HEIGHT);

	const color = outputSetColor(lane.outputIds);

	return (
		<div
			className="relative overflow-hidden border-b border-border"
			style={{ height, backgroundColor: `color-mix(in srgb, ${color} 10%, transparent)` }}
		>
			<span className="absolute left-1 top-0.5 text-[10px] text-muted-foreground">
				{lane.outputKey === "unrouted" ? "unrouted" : lane.outputIds.join(", ")}
			</span>

			{lane.spans.map((span) => (
				<SpanOverlay
					key={`${span.patternPath}-${span.startBeat}`}
					span={span}
					pxPerBeat={pxPerBeat}
					segmentStartBeat={segmentStartBeat}
					height={height}
					color={color}
					hoveredPattern={hoveredPattern}
					onHoverPattern={onHoverPattern}
				/>
			))}
		</div>
	);
});

interface SpanOverlayProps {
	readonly span: PatternSpan;
	readonly pxPerBeat: number;
	readonly segmentStartBeat: number;
	readonly height: number;
	readonly color: string;
	readonly hoveredPattern: string | null;
	readonly onHoverPattern: (path: string | null) => void;
}

const SpanOverlay = memo<SpanOverlayProps>(({ span, pxPerBeat, segmentStartBeat, height, color, hoveredPattern, onHoverPattern }) => {
	const left = (span.startBeat - segmentStartBeat) * pxPerBeat;
	const width = (span.endBeat - span.startBeat) * pxPerBeat;
	const isHovered = hoveredPattern === span.patternPath;
	const isDimmed = hoveredPattern !== null && !isHovered;

	return (
		<div
			className="absolute top-0"
			style={{
				left,
				width,
				height,
				border: `1px solid ${color}`,
				opacity: isDimmed ? 0.3 : isHovered ? 1 : 0.6,
			}}
			onMouseEnter={() => onHoverPattern(span.patternPath)}
			onMouseLeave={() => onHoverPattern(null)}
		>
			<span className="absolute left-0.5 top-0.5 text-[10px] text-muted-foreground">
				{span.patternType}
			</span>
		</div>
	);
});
