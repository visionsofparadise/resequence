import type { AnyKeyframe, CurveKeyframe, Keyframe } from "../patterns/automate";
import type { Pattern } from "../patterns/pattern";
import type { Duration } from "../utils/duration";
import { resolveDuration } from "../utils/duration";

export interface TriggerOptions {
	readonly peak: number;
	readonly attack: Duration;
	readonly release: Duration;
	readonly tension?: number;
}

const CURVE_SAMPLES = 128;
const EPSILON = 1e-6;

export function trigger(pattern: Pattern, options: TriggerOptions): Array<AnyKeyframe> {
	if (pattern.notes.length === 0) return [];

	const sorted = [...pattern.notes].sort((left, right) => left.tick - right.tick);
	const attackTicks = resolveDuration(options.attack);
	const releaseTicks = resolveDuration(options.release);
	const tension = options.tension ?? 1;
	const keyframes: Array<AnyKeyframe> = [];

	for (let index = 0; index < sorted.length; index++) {
		const current = sorted[index];

		if (!current) continue;

		const tick = current.tick;
		const next = sorted[index + 1];
		const nextTick = next ? next.tick : Infinity;
		const releaseEnd = tick + attackTicks + releaseTicks;

		const baseline: Keyframe = { time: tick as Duration, value: 0, curve: "step" };
		const peak: Keyframe = { time: (tick + attackTicks) as Duration, value: options.peak, curve: "linear" };
		keyframes.push(baseline, peak);

		const curve = buildReleaseCurve(tick + attackTicks, releaseTicks, options.peak, tension, Math.min(releaseEnd, nextTick));
		if (curve) keyframes.push(curve);
	}

	return keyframes;
}

function buildReleaseCurve(startTick: number, releaseTicks: number, peak: number, tension: number, cutoffTick: number): CurveKeyframe | null {
	const effectiveDuration = cutoffTick - startTick;

	if (effectiveDuration <= 0) return null;

	const values = Float32Array.from({ length: CURVE_SAMPLES }, (_, sampleIndex) => {
		const progress = (sampleIndex / (CURVE_SAMPLES - 1)) * (effectiveDuration / releaseTicks);
		return Math.max(peak * Math.pow(1 - progress, tension), EPSILON);
	});

	return {
		time: startTick as Duration,
		duration: effectiveDuration as Duration,
		values,
	};
}
