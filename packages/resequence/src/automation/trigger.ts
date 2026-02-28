import type { AnyKeyframe, CurveKeyframe, Keyframe } from "../patterns/automate";
import type { Pattern } from "../patterns/pattern";
import { collectNotes } from "../patterns/utils/tree";
;
;

export interface TriggerOptions {
	readonly peak: number;
	readonly attack: number;
	readonly release: number;
	readonly tension?: number;
}

const CURVE_SAMPLES = 128;
const EPSILON = 1e-6;

export function trigger(pattern: Pattern, options: TriggerOptions): Array<AnyKeyframe> {
	const allNotes = collectNotes(pattern);

	if (allNotes.length === 0) return [];

	const sorted = allNotes.sort((left, right) => left.startBeat - right.startBeat);
	const attackBeats = options.attack;
	const releaseBeats = options.release;
	const tension = options.tension ?? 1;
	const keyframes: Array<AnyKeyframe> = [];

	for (let index = 0; index < sorted.length; index++) {
		const current = sorted[index];

		if (!current) continue;

		const tick = current.startBeat;
		const next = sorted[index + 1];
		const nextBeat = next ? next.startBeat : Infinity;
		const releaseEnd = tick + attackBeats + releaseBeats;

		const baseline: Keyframe = { time: tick, value: 0, curve: "step" };
		const peak: Keyframe = { time: (tick + attackBeats), value: options.peak, curve: "linear" };
		keyframes.push(baseline, peak);

		const curve = buildReleaseCurve(tick + attackBeats, releaseBeats, options.peak, tension, Math.min(releaseEnd, nextBeat));
		if (curve) keyframes.push(curve);
	}

	return keyframes;
}

function buildReleaseCurve(startBeat: number, releaseBeats: number, peak: number, tension: number, cutoffBeat: number): CurveKeyframe | null {
	const effectiveDuration = cutoffBeat - startBeat;

	if (effectiveDuration <= 0) return null;

	const values = Float32Array.from({ length: CURVE_SAMPLES }, (_, sampleIndex) => {
		const progress = (sampleIndex / (CURVE_SAMPLES - 1)) * (effectiveDuration / releaseBeats);
		return Math.max(peak * Math.pow(1 - progress, tension), EPSILON);
	});

	return {
		time: startBeat,
		duration: effectiveDuration,
		values,
	};
}
