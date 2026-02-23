import type { Duration } from "../utils/duration";
import { resolveDuration } from "../utils/duration";
import type { AutomationPoint } from "../patterns/automate";
import type { Pattern } from "../patterns/pattern";

export interface TriggerOptions {
	readonly peak: number;
	readonly attack: Duration;
	readonly release: Duration;
	readonly tension?: number;
}

const RELEASE_SAMPLES = 8;
const EPSILON = 1e-6;

export function trigger(pattern: Pattern, options: TriggerOptions): Array<AutomationPoint> {
	const notes = pattern.getMidi();

	if (notes.length === 0) return [];

	const sorted = [...notes].sort((left, right) => left.tick - right.tick);
	const attackTicks = resolveDuration(options.attack);
	const releaseTicks = resolveDuration(options.release);
	const tension = options.tension ?? 1;
	const points: Array<AutomationPoint> = [];

	for (let index = 0; index < sorted.length; index++) {
		const current = sorted[index];
		if (!current) continue;

		const tick = current.tick;
		const next = sorted[index + 1];
		const nextTick = next ? next.tick : Infinity;
		const releaseEnd = tick + attackTicks + releaseTicks;

		points.push({ time: tick, value: 0, curve: "step" });
		points.push({ time: tick + attackTicks, value: options.peak, curve: "linear" });

		const releasePoints = generateReleaseCurve(tick + attackTicks, releaseTicks, options.peak, tension, Math.min(releaseEnd, nextTick));

		points.push(...releasePoints);
	}

	return points;
}

function generateReleaseCurve(startTick: number, releaseTicks: number, peak: number, tension: number, cutoffTick: number): Array<AutomationPoint> {
	const points: Array<AutomationPoint> = [];

	for (let sample = 1; sample <= RELEASE_SAMPLES; sample++) {
		const progress = sample / RELEASE_SAMPLES;
		const tick = startTick + releaseTicks * progress;

		if (tick > cutoffTick) break;

		const value = peak * Math.pow(1 - progress, tension);
		const clamped = Math.max(value, EPSILON);

		points.push({ time: tick, value: clamped, curve: "linear" });
	}

	return points;
}
