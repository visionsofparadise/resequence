import { memo, useRef } from "react";
import { NoteElement } from "../../PianoRoll/NoteElement";
import { PianoRollGrid } from "../../PianoRoll/PianoRollGrid";
import { PitchSlide } from "../../PianoRoll/PitchSlide";
import { outputSetColor } from "../aggregation/outputColor";
import type { NoteLane as NoteLaneData, PatternSpan } from "../aggregation/types";
import { MIN_LANE_HEIGHT, MIN_PITCH_RANGE } from "../constants";

interface NoteLaneProps {
	readonly lane: NoteLaneData;
	readonly pxPerBeat: number;
	readonly pitchZoom: number;
	readonly segmentStartBeat: number;
	readonly segmentEndBeat: number;
	readonly hoveredPattern: string | null;
	readonly onHoverPattern: (path: string | null) => void;
	readonly onClickLane?: () => void;
}

const CLICK_THRESHOLD = 4;

export const NoteLane = memo<NoteLaneProps>(({ lane, pxPerBeat, pitchZoom, segmentStartBeat, segmentEndBeat, hoveredPattern, onHoverPattern, onClickLane }) => {
	const mouseDownPos = useRef<{ x: number; y: number } | null>(null);
	const pitchRange = lane.maxPitch - lane.minPitch;
	const padded = Math.max(pitchRange, MIN_PITCH_RANGE);
	const padAmount = Math.floor((padded - pitchRange) / 2);
	const displayMin = lane.minPitch - padAmount;
	const displayMax = displayMin + padded;

	const height = Math.max((displayMax - displayMin + 1) * pitchZoom, MIN_LANE_HEIGHT);
	const color = outputSetColor(lane.outputIds);
	const stepsPerOctave = lane.tuning ? lane.tuning.classes.length : 12;
	const octaveRatio = lane.tuning ? lane.tuning.octaveRatio : 2;

	return (
		<div
			className="relative overflow-hidden border-b border-border"
			style={{ height, backgroundColor: `color-mix(in srgb, ${color} 10%, transparent)` }}
			onMouseDown={(ev) => { mouseDownPos.current = { x: ev.clientX, y: ev.clientY }; }}
			onMouseUp={(ev) => {
				const pos = mouseDownPos.current;
				mouseDownPos.current = null;
				if (!pos || !onClickLane) return;
				const dx = ev.clientX - pos.x;
				const dy = ev.clientY - pos.y;
				if (Math.sqrt(dx * dx + dy * dy) < CLICK_THRESHOLD) onClickLane();
			}}
		>
			<PianoRollGrid
				minPitchKey={displayMin}
				maxPitchKey={displayMax}
				stepsPerOctave={stepsPerOctave}
				timeSignature={lane.timeSignature}
				startBeat={segmentStartBeat}
				endBeat={segmentEndBeat}
				pxPerBeat={pxPerBeat}
				pitchZoom={pitchZoom}
			/>

			{lane.notes.map((noteData, ni) => (
				<NoteElement
					key={`n-${ni}`}
					note={noteData}
					startBeat={segmentStartBeat}
					maxPitchKey={displayMax}
					pxPerBeat={pxPerBeat}
					pitchZoom={pitchZoom}
					color={color}
					hoveredPattern={hoveredPattern}
				/>
			))}

			{lane.notes.map((noteData, ni) =>
				noteData.slides && noteData.slides.length > 0 ? (
					<PitchSlide
						key={`s-${ni}`}
						note={noteData}
						slides={noteData.slides}
						startBeat={segmentStartBeat}
						maxPitchKey={displayMax}
						pxPerBeat={pxPerBeat}
						pitchZoom={pitchZoom}
						stepsPerOctave={stepsPerOctave}
						octaveRatio={octaveRatio}
						color={color}
					/>
				) : null,
			)}

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

			<span className="absolute left-1 top-0.5 z-10 text-[10px] text-muted-foreground">
				{lane.outputKey === "unrouted" ? "unrouted" : lane.outputIds.join(", ")}
			</span>
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
