import { useMemo, useRef } from "react";
import { applyCurve, denormalizePitch, pitchKey } from "resequence";
import { useTransients } from "../../../../../hooks/useTransients";
import type { BuildContext } from "../../../../../models/Context";
import type { MidiClip, MidiClipNote, Sequence } from "../../utils/buildArrangement";

interface PianoRollPitchSlideProps {
	readonly note: MidiClipNote;
	readonly clip: MidiClip;
	readonly sequence: Sequence;
	readonly context: BuildContext;
}

function buildSlidePathD(note: MidiClipNote, clip: MidiClip, sequence: Sequence, pxPerBeat: number, pitchZoom: number): string {
	const slides = note.slides;

	if (!slides || slides.length === 0) return "";

	const stepsPerOctave = note.pitch.stepsPerOctave;
	const octaveRatio = note.pitch.octaveRatio;
	const noteKey = note.pitch.octave * stepsPerOctave + note.pitch.class;
	const beatToX = (beat: number) => (beat - sequence.startBeat) * pxPerBeat;
	const keyToY = (key: number) => (clip.maxPitch - key) * pitchZoom + pitchZoom / 2;

	const points: Array<{ x: number; y: number }> = [];

	points.push({ x: beatToX(note.startBeat), y: keyToY(noteKey) });

	for (let ki = 0; ki < slides.length; ki++) {
		const kf = slides[ki];

		if (!kf) continue;
		const prevKf = ki > 0 ? (slides[ki - 1] ?? null) : null;
		const prevBeat = prevKf ? note.startBeat + prevKf.beat : note.startBeat;
		const prevValue = prevKf ? prevKf.value : pitchKey(note.pitch) / (stepsPerOctave * 11);
		const kfBeat = note.startBeat + kf.beat;
		const kfPitch = denormalizePitch(kf.value, stepsPerOctave, octaveRatio);
		const kfKey = pitchKey(kfPitch);

		if (kf.step) {
			points.push({ x: beatToX(kfBeat), y: keyToY(pitchKey(denormalizePitch(prevValue, stepsPerOctave, octaveRatio))) });
			points.push({ x: beatToX(kfBeat), y: keyToY(kfKey) });
		} else {
			const curve = kf.curve ?? 0;
			const prevPitch = denormalizePitch(prevValue, stepsPerOctave, octaveRatio);
			const prevKey = pitchKey(prevPitch);

			const segmentPx = Math.abs(beatToX(kfBeat) - beatToX(prevBeat));
			const samples = Math.max(2, Math.min(Math.ceil(segmentPx), 100));

			for (let si = 1; si <= samples; si++) {
				const progress = si / samples;
				const curvedProgress = applyCurve(progress, curve);
				const interpBeat = prevBeat + (kfBeat - prevBeat) * progress;
				const interpKey = prevKey + (kfKey - prevKey) * curvedProgress;

				points.push({ x: beatToX(interpBeat), y: keyToY(interpKey) });
			}
		}
	}

	if (points.length < 2) return "";

	return `M ${points.map((pt) => `${pt.x} ${pt.y}`).join(" L ")}`;
}

export const PianoRollPitchSlide: React.FC<PianoRollPitchSlideProps> = ({ note, clip, sequence, context }) => {
	const { project } = context;
	const pathRef = useRef<SVGPathElement>(null);

	const transients = useMemo(() => [project.timelineZoom, project.pitchZoom], [project.timelineZoom, project.pitchZoom]);

	useTransients(transients, () => {
		if (!pathRef.current || !note.slides || note.slides.length === 0) return;
		pathRef.current.setAttribute("d", buildSlidePathD(note, clip, sequence, project.timelineZoom.value, project.pitchZoom.value));
	});

	if (!note.slides || note.slides.length === 0) return null;

	const pathD = buildSlidePathD(note, clip, sequence, project.timelineZoom.value, project.pitchZoom.value);

	if (!pathD) return null;

	return (
		<svg className="pointer-events-none absolute inset-0" style={{ overflow: "visible" }}>
			<path
				ref={pathRef}
				d={pathD}
				stroke={context.portColorMap.get(clip.port) ?? "var(--color-text-secondary)"}
				strokeWidth={2}
				fill="none"
				opacity={0.6}
			/>
		</svg>
	);
};
