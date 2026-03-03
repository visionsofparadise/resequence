import { memo } from "react";
import type { AggregatedNote } from "../Timeline/aggregation/types";

interface NoteElementProps {
	readonly note: AggregatedNote;
	readonly startBeat: number;
	readonly maxPitchKey: number;
	readonly pxPerBeat: number;
	readonly pitchZoom: number;
	readonly color: string;
	readonly hoveredPattern: string | null;
}

export const NoteElement = memo<NoteElementProps>(({ note, startBeat, maxPitchKey, pxPerBeat, pitchZoom, color, hoveredPattern }) => {
	const pitchKey = note.pitch.octave * note.pitch.stepsPerOctave + note.pitch.class;
	const left = (note.startBeat - startBeat) * pxPerBeat;
	const top = (maxPitchKey - pitchKey) * pitchZoom;
	const width = (note.endBeat - note.startBeat) * pxPerBeat;
	const baseOpacity = 0.4 + (note.velocity / 127) * 0.6;

	const isMatch = hoveredPattern === null || hoveredPattern === note.patternPath;
	const opacity = isMatch ? baseOpacity : baseOpacity * 0.3;

	return (
		<div
			className="absolute"
			style={{
				left,
				top,
				width,
				height: pitchZoom,
				backgroundColor: color,
				opacity,
				borderRadius: 1,
			}}
		>
			{note.lyric && pitchZoom >= 8 && (
				<span
					className="pointer-events-none absolute inset-0 overflow-hidden truncate px-0.5 text-[8px] leading-none text-white"
					style={{ lineHeight: `${pitchZoom}px` }}
				>
					{note.lyric}
				</span>
			)}
		</div>
	);
});
