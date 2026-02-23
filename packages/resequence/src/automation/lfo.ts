import type { Duration } from "../utils/duration";
import { resolveDuration } from "../utils/duration";
import type { AutomationPoint } from "../patterns/automate";

export type LfoShape = "sine" | "saw" | "triangle" | "square";

export interface LfoOptions {
	readonly shape: LfoShape;
	readonly rate: Duration;
	readonly duration: Duration;
	readonly phase?: number;
}

export function lfo(options: LfoOptions): Array<AutomationPoint> {
	const rate = resolveDuration(options.rate);
	const duration = resolveDuration(options.duration);
	const offset = options.phase ?? 0;
	const points: Array<AutomationPoint> = [];

	switch (options.shape) {
		case "sine":
			for (let tick = -offset * rate; tick <= duration; tick += rate / 4) {
				if (tick < 0) continue;

				const phase = tick / rate + offset;
				points.push({ time: tick, value: 0.5 + 0.5 * Math.sin(2 * Math.PI * phase), curve: "exponential" });
			}

			break;

		case "triangle":
			for (let tick = -offset * rate; tick <= duration; tick += rate / 2) {
				if (tick < 0) continue;

				const phase = (((tick / rate + offset) % 1) + 1) % 1;
				points.push({ time: tick, value: phase < 0.5 ? phase * 2 : 2 - phase * 2, curve: "linear" });
			}

			break;

		case "saw":
			for (let tick = -offset * rate; tick <= duration; tick += rate) {
				if (tick < 0) continue;

				if (tick > 0) {
					points.push({ time: tick, value: 1, curve: "linear" });
				}

				if (tick <= duration) {
					points.push({ time: tick, value: 0, curve: "step" });
				}
			}

			break;

		case "square":
			for (let tick = -offset * rate; tick <= duration; tick += rate / 2) {
				if (tick < 0) continue;

				const phase = (((tick / rate + offset) % 1) + 1) % 1;
				points.push({ time: tick, value: phase < 0.5 ? 1 : 0, curve: "step" });
			}

			break;
	}

	return points;
}
