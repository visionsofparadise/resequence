import { useEffect, useMemo, useRef, useState } from "react";
import type { ProjectContext } from "../../../models/Context";
import { Icon } from "../../ui/Icon";
import { Button } from "../../ui/button";
import { outputSetColor } from "../Timeline/aggregation/outputColor";
import type { NoteLane as NoteLaneData, TimelineSegment } from "../Timeline/aggregation/types";
import { NUM_OCTAVES } from "../Timeline/constants";
import { useTimelineData } from "../Timeline/hooks/useTimelineData";
import { NoteElement } from "./NoteElement";
import { PianoRollGrid } from "./PianoRollGrid";
import { PitchSlide } from "./PitchSlide";

interface PianoRollViewTarget {
	readonly segmentPath: ReadonlyArray<number>;
	readonly laneIndex: number;
}

interface PianoRollViewProps {
	readonly context: ProjectContext;
	readonly target: PianoRollViewTarget;
	readonly onBack: () => void;
}

function resolveNoteLane(segments: ReadonlyArray<TimelineSegment>, target: PianoRollViewTarget): NoteLaneData | null {
	let current: ReadonlyArray<TimelineSegment> = segments;
	for (let si = 0; si < target.segmentPath.length; si++) {
		const index = target.segmentPath[si];
		if (index === undefined) return null;
		const segment = current[index];
		if (!segment) return null;
		if (si < target.segmentPath.length - 1) {
			current = segment.children;
		} else {
			const lane = segment.lanes[target.laneIndex];
			if (lane?.kind !== "notes") return null;
			return lane;
		}
	}
	return null;
}

export const PianoRollView: React.FC<PianoRollViewProps> = ({ context, target, onBack }) => {
	const { project } = context;
	const timelineData = useTimelineData(context);
	const scrollRef = useRef<HTMLDivElement>(null);
	const [hoveredPattern, setHoveredPattern] = useState<string | null>(null);

	const lane = useMemo(() => {
		if (!timelineData) return null;
		return resolveNoteLane(timelineData.segments, target);
	}, [timelineData, target]);

	const pitchZoom = project.pitchZoom.value;
	const pxPerBeat = project.timelineZoom.value;

	const stepsPerOctave = lane?.tuning ? lane.tuning.classes.length : 12;
	const octaveRatio = lane?.tuning ? lane.tuning.octaveRatio : 2;
	const timeSignature = lane?.timeSignature ?? ([4, 4] as const);
	const maxPitchKey = stepsPerOctave * NUM_OCTAVES - 1;
	const minPitchKey = 0;

	// Find beat range from the segment
	const segmentBeatRange = useMemo(() => {
		if (!timelineData) return { startBeat: 0, endBeat: 0 };
		let current: ReadonlyArray<TimelineSegment> = timelineData.segments;
		for (let si = 0; si < target.segmentPath.length; si++) {
			const index = target.segmentPath[si];
			if (index === undefined) return { startBeat: 0, endBeat: 0 };
			const segment = current[index];
			if (!segment) return { startBeat: 0, endBeat: 0 };
			if (si === target.segmentPath.length - 1) {
				return { startBeat: segment.startBeat, endBeat: segment.endBeat };
			}
			current = segment.children;
		}
		return { startBeat: 0, endBeat: 0 };
	}, [timelineData, target]);

	// Center scroll on notes
	useEffect(() => {
		if (!lane || !scrollRef.current) return;
		const container = scrollRef.current;
		const centerKey = (lane.minPitch + lane.maxPitch) / 2;
		const scrollTop = (maxPitchKey - centerKey) * pitchZoom - container.clientHeight / 2;
		container.scrollTop = Math.max(0, scrollTop);
	}, [lane, maxPitchKey, pitchZoom]);

	if (!lane) {
		return (
			<div className="flex h-full flex-col">
				<div className="shrink-0 px-3 py-2">
					<Button variant="ghost" size="sm" onClick={onBack}>
						<Icon.ArrowLeft className="mr-1 h-3.5 w-3.5" />
						Back
					</Button>
				</div>
				<div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
					Piano roll lane not found
				</div>
			</div>
		);
	}

	const color = outputSetColor(lane.outputIds);
	const contentWidth = (segmentBeatRange.endBeat - segmentBeatRange.startBeat) * pxPerBeat;
	const contentHeight = (maxPitchKey - minPitchKey + 1) * pitchZoom;

	return (
		<div className="flex h-full flex-col">
			<div className="flex shrink-0 items-center gap-2 border-b px-3 py-1.5">
				<Button variant="ghost" size="sm" onClick={onBack}>
					<Icon.ArrowLeft className="mr-1 h-3.5 w-3.5" />
					Back
				</Button>
				<span className="text-sm text-muted-foreground">
					{lane.outputKey === "unrouted" ? "unrouted" : lane.outputIds.join(", ")}
				</span>
			</div>

			<div ref={scrollRef} className="flex-1 overflow-auto" style={{ minHeight: 0 }}>
				<div className="relative" style={{ width: contentWidth, height: contentHeight }}>
					<PianoRollGrid
						minPitchKey={minPitchKey}
						maxPitchKey={maxPitchKey}
						stepsPerOctave={stepsPerOctave}
						timeSignature={timeSignature}
						startBeat={segmentBeatRange.startBeat}
						endBeat={segmentBeatRange.endBeat}
						pxPerBeat={pxPerBeat}
						pitchZoom={pitchZoom}
					/>

					{lane.notes.map((noteData, ni) => (
						<NoteElement
							key={`n-${ni}`}
							note={noteData}
							startBeat={segmentBeatRange.startBeat}
							maxPitchKey={maxPitchKey}
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
								startBeat={segmentBeatRange.startBeat}
								maxPitchKey={maxPitchKey}
								pxPerBeat={pxPerBeat}
								pitchZoom={pitchZoom}
								stepsPerOctave={stepsPerOctave}
								octaveRatio={octaveRatio}
								color={color}
							/>
						) : null,
					)}

					{lane.spans.map((span) => (
						<div
							key={`span-${span.patternPath}-${span.startBeat}`}
							className="absolute top-0"
							style={{
								left: (span.startBeat - segmentBeatRange.startBeat) * pxPerBeat,
								width: (span.endBeat - span.startBeat) * pxPerBeat,
								height: contentHeight,
								border: `1px solid ${color}`,
								opacity: hoveredPattern === null ? 0.3 : hoveredPattern === span.patternPath ? 0.8 : 0.15,
								pointerEvents: "auto",
							}}
							onMouseEnter={() => setHoveredPattern(span.patternPath)}
							onMouseLeave={() => setHoveredPattern(null)}
						/>
					))}
				</div>
			</div>
		</div>
	);
};
