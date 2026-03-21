import { useMemo, useRef } from "react";
import { useTransients } from "../../../../../../../hooks/useTransients";
import type { BuildContext } from "../../../../../../../models/Context";
import type { ProjectState } from "../../../../../../../models/State/Project";
import type { MidiClip, Sequence } from "../../../../utils/buildArrangement";
import { outputColor } from "../../../../utils/outputColor";
import { PianoRollGrid } from "../../../PianoRoll/Grid";
import { PianoRollNote } from "../../../PianoRoll/Note";
import { PianoRollPitchSlide } from "../../../PianoRoll/PitchSlide";
import { computeClipHeight } from "../../layout";
import { PatternBoundary } from "./PatternBoundary";

const MIN_PITCH_RANGE = 12;
const CLICK_THRESHOLD = 4;

interface MidiClipCardProps {
	readonly clip: MidiClip;
	readonly sequence: Sequence;
	readonly sequencePath: Array<number>;
	readonly index: number;
	readonly context: BuildContext;
}

export const MidiClipCard: React.FC<MidiClipCardProps> = ({ clip, sequence, sequencePath, index, context }) => {
	const { project, projectStore } = context;

	const mouseDownPos = useRef<{ x: number; y: number } | null>(null);
	const containerRef = useRef<HTMLDivElement>(null);

	const pitchRange = clip.maxPitch - clip.minPitch;
	const padded = Math.max(pitchRange, MIN_PITCH_RANGE);
	const padAmount = Math.floor((padded - pitchRange) / 2);
	const displayMin = clip.minPitch - padAmount;
	const displayMax = displayMin + padded;
	const displayRange = displayMax - displayMin;

	const color = outputColor(clip.port);
	const stepsPerOctave = clip.tuning ? clip.tuning.classes.length : 12;

	const transients = useMemo(() => [project.pitchZoom], [project.pitchZoom]);

	useTransients(transients, () => {
		if (!containerRef.current) return;

		const height = computeClipHeight(displayRange, project.pitchZoom.value);

		containerRef.current.style.height = `${height}px`;
	});

	const pitchZoom = project.pitchZoom.value;
	const height = computeClipHeight(displayRange, pitchZoom);

	return (
		<div
			ref={containerRef}
			className="relative overflow-hidden border-b border-border"
			style={{ height, backgroundColor: `color-mix(in srgb, ${color} 10%, transparent)` }}
			onMouseDown={(ev) => {
				mouseDownPos.current = { x: ev.clientX, y: ev.clientY };
			}}
			onMouseUp={(ev) => {
				const pos = mouseDownPos.current;

				mouseDownPos.current = null;

				if (!pos) return;

				const dx = ev.clientX - pos.x;
				const dy = ev.clientY - pos.y;

				if (Math.sqrt(dx * dx + dy * dy) < CLICK_THRESHOLD) {
					projectStore.mutate<ProjectState>(project, (proxy) => {
						proxy.activePianoRoll = { sequencePath, index };
					});
				}
			}}
		>
			<PianoRollGrid
				minPitchKey={displayMin}
				maxPitchKey={displayMax}
				stepsPerOctave={stepsPerOctave}
				timeSignature={clip.timeSignature}
				startBeat={sequence.startBeat}
				endBeat={sequence.endBeat}
				context={context}
			/>

			{clip.notes.map((note, index) => (
				<PianoRollNote
					key={`n-${index}`}
					note={note}
					clip={clip}
					context={context}
				/>
			))}

			{clip.notes.map((note, ni) =>
				note.slides && note.slides.length > 0 ? (
					<PianoRollPitchSlide
						key={`s-${ni}`}
						note={note}
						clip={clip}
						sequence={sequence}
						context={context}
					/>
				) : null,
			)}

			{clip.spans.map((span) => (
				<PatternBoundary
					key={`${span.patternId}-${span.startBeat}`}
					span={span}
					clip={clip}
					sequence={sequence}
					context={context}
				/>
			))}

			<span className="absolute left-1 top-0.5 z-10 text-[10px] text-muted-foreground">{clip.port}</span>
		</div>
	);
};
