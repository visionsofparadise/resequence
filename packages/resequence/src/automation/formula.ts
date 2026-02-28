import type { Keyframe } from "../patterns/automate";

export interface FormulaOptions {
	readonly duration: number;
	readonly resolution: number;
}

export function formula(evaluate: (t: number) => number, options: FormulaOptions): Array<Keyframe> {
	const keyframes: Array<Keyframe> = [];

	for (let index = 0; index <= options.resolution; index++) {
		const progress = index / options.resolution;
		const beatTime = progress * options.duration;
		const value = Math.max(0, Math.min(1, evaluate(progress)));

		keyframes.push({ time: beatTime, value, curve: "linear" });
	}

	return keyframes;
}
