import { useMemo, useRef } from "react";
import { useTransients } from "../../../../../hooks/useTransients";
import type { BuildContext } from "../../../../../models/Context";
import type { MidiClip, MidiClipNote } from "../../utils/buildArrangement";

interface PianoRollNoteProps {
	readonly note: MidiClipNote;
	readonly clip: MidiClip;
	readonly context: BuildContext;
}

export const PianoRollNote: React.FC<PianoRollNoteProps> = ({ note, clip, context }) => {
	const { project, build } = context;
	const ref = useRef<HTMLDivElement>(null);
	const lyricRef = useRef<HTMLSpanElement>(null);

	const pitchKey = note.pitch.octave * note.pitch.stepsPerOctave + note.pitch.class;
	const baseOpacity = 0.4 + (note.velocity / 127) * 0.6;
	const unitColor = context.portColorMap.get(clip.port) ?? "var(--color-text-secondary)";

	const transients = useMemo(() => [project.timelineZoom, project.pitchZoom], [project.timelineZoom, project.pitchZoom]);

	useTransients(transients, () => {
		if (!ref.current) return;

		const pxPerBeat = project.timelineZoom.value;
		const pitchZoom = project.pitchZoom.value;

		ref.current.style.left = `${note.startBeat * pxPerBeat}px`;
		ref.current.style.top = `${(clip.maxPitch - pitchKey) * pitchZoom}px`;
		ref.current.style.width = `${(note.endBeat - note.startBeat) * pxPerBeat}px`;
		ref.current.style.height = `${pitchZoom}px`;

		if (lyricRef.current) {
			lyricRef.current.style.lineHeight = `${pitchZoom}px`;
			lyricRef.current.style.display = pitchZoom >= 8 ? "" : "none";
		}
	});

	const pxPerBeat = project.timelineZoom.value;
	const pitchZoom = project.pitchZoom.value;
	const hoveredPattern = build.hoveredPattern;
	const isMatch = hoveredPattern === null || hoveredPattern === note.patternId;
	const opacity = isMatch ? baseOpacity : baseOpacity * 0.3;

	return (
		<div
			ref={ref}
			className="absolute box-border"
			style={{
				left: note.startBeat * pxPerBeat,
				top: (clip.maxPitch - pitchKey) * pitchZoom,
				width: (note.endBeat - note.startBeat) * pxPerBeat,
				height: pitchZoom,
				backgroundColor: unitColor,
				opacity,
				borderRadius: 1,
				borderLeft: `1px solid color-mix(in srgb, ${unitColor} 70%, black 30%)`,
			}}
		>
			{note.lyric && (
				<span
					ref={lyricRef}
					className="pointer-events-none absolute inset-0 overflow-hidden truncate px-0.5 text-[8px] leading-none text-text-primary"
					style={{ lineHeight: `${pitchZoom}px`, display: pitchZoom >= 8 ? "" : "none" }}
				>
					{note.lyric}
				</span>
			)}
		</div>
	);
};
