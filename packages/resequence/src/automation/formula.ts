import type { Duration } from "../utils/duration";
import { resolveDuration } from "../utils/duration";
import type { AutomationPoint } from "../patterns/automate";

export interface FormulaOptions {
	readonly duration: Duration;
	readonly resolution: number;
}

export function formula(evaluate: (t: number) => number, options: FormulaOptions): Array<AutomationPoint> {
	const durationTicks = resolveDuration(options.duration);
	const points: Array<AutomationPoint> = [];

	for (let index = 0; index <= options.resolution; index++) {
		const progress = index / options.resolution;
		const tick = progress * durationTicks;
		const value = Math.max(0, Math.min(1, evaluate(progress)));

		points.push({ time: tick, value, curve: "linear" });
	}

	return points;
}
