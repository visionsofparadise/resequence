import type { Keyframe } from "../patterns/automate";
import type { Duration } from "../utils/duration";
import { resolveDuration } from "../utils/duration";

export interface FormulaOptions {
	readonly duration: Duration;
	readonly resolution: number;
}

export function formula(evaluate: (t: number) => number, options: FormulaOptions): Array<Keyframe> {
	const durationBeats = resolveDuration(options.duration);
	const keyframes: Array<Keyframe> = [];

	for (let index = 0; index <= options.resolution; index++) {
		const progress = index / options.resolution;
		const beatTime = progress * durationBeats;
		const value = Math.max(0, Math.min(1, evaluate(progress)));

		keyframes.push({ time: beatTime, value, curve: "linear" });
	}

	return keyframes;
}
