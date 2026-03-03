import { memo, useMemo } from "react";
import { applyCurve, denormalizePitch, pitchKey, type Keyframe } from "resequence";
import type { AggregatedNote } from "../Timeline/aggregation/types";

interface PitchSlideProps {
	readonly note: AggregatedNote;
	readonly slides: ReadonlyArray<Keyframe>;
	readonly startBeat: number;
	readonly maxPitchKey: number;
	readonly pxPerBeat: number;
	readonly pitchZoom: number;
	readonly stepsPerOctave: number;
	readonly octaveRatio: number;
	readonly color: string;
}

const SAMPLES_PER_SEGMENT = 20;

export const PitchSlide = memo<PitchSlideProps>(
	({ note, slides, startBeat, maxPitchKey, pxPerBeat, pitchZoom, stepsPerOctave, octaveRatio, color }) => {
		const pathD = useMemo(() => {
			const noteKey = note.pitch.octave * note.pitch.stepsPerOctave + note.pitch.class;
			const beatToX = (beat: number) => (beat - startBeat) * pxPerBeat;
			const keyToY = (key: number) => (maxPitchKey - key) * pitchZoom + pitchZoom / 2;

			const points: Array<{ x: number; y: number }> = [];

			// Start at note's own pitch at note's startBeat
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
					// Step: horizontal line at previous value, then vertical jump
					points.push({ x: beatToX(kfBeat), y: keyToY(pitchKey(denormalizePitch(prevValue, stepsPerOctave, octaveRatio))) });
					points.push({ x: beatToX(kfBeat), y: keyToY(kfKey) });
				} else {
					const curve = kf.curve ?? 0;
					const prevPitch = denormalizePitch(prevValue, stepsPerOctave, octaveRatio);
					const prevKey = pitchKey(prevPitch);

					for (let si = 1; si <= SAMPLES_PER_SEGMENT; si++) {
						const progress = si / SAMPLES_PER_SEGMENT;
						const curvedProgress = applyCurve(progress, curve);
						const interpBeat = prevBeat + (kfBeat - prevBeat) * progress;
						const interpKey = prevKey + (kfKey - prevKey) * curvedProgress;
						points.push({ x: beatToX(interpBeat), y: keyToY(interpKey) });
					}
				}
			}

			if (points.length < 2) return "";
			return `M ${points.map((pt) => `${pt.x} ${pt.y}`).join(" L ")}`;
		}, [note, slides, startBeat, maxPitchKey, pxPerBeat, pitchZoom, stepsPerOctave, octaveRatio]);

		if (!pathD) return null;

		return (
			<svg className="pointer-events-none absolute inset-0" style={{ overflow: "visible" }}>
				<path d={pathD} stroke={color} strokeWidth={2} fill="none" opacity={0.8} />
			</svg>
		);
	},
);
