import type { Keyframe } from "../patterns/automate";
import type { Duration } from "../utils/duration";
import { resolveDuration } from "../utils/duration";
import type { LfoShape } from "../utils/lfo";

export type { LfoShape } from "../utils/lfo";
// FIX: Once again pointlessly reexporting

export interface LfoOptions {
	readonly shape: LfoShape;
	readonly rate: Duration;
	readonly duration: Duration;
	readonly phase?: number;
}

// FIX: Is this file even used anymore??

export function lfo(options: LfoOptions): Array<Keyframe> {
	const rate = resolveDuration(options.rate);
	const duration = resolveDuration(options.duration);
	const offset = options.phase ?? 0;
	const keyframes: Array<Keyframe> = [];

	switch (options.shape) {
		case "sine":
			for (let tick = -offset * rate; tick <= duration; tick += rate / 4) {
				if (tick < 0) continue;

				const phase = tick / rate + offset;
				keyframes.push({ time: tick, value: 0.5 + 0.5 * Math.sin(2 * Math.PI * phase), curve: "exponential" });
			}

			break;

		case "triangle":
			for (let tick = -offset * rate; tick <= duration; tick += rate / 2) {
				if (tick < 0) continue;

				const phase = (((tick / rate + offset) % 1) + 1) % 1;
				keyframes.push({ time: tick, value: phase < 0.5 ? phase * 2 : 2 - phase * 2, curve: "linear" });
			}

			break;

		case "sawtooth":
			for (let tick = -offset * rate; tick <= duration; tick += rate) {
				if (tick < 0) continue;

				if (tick > 0) {
					keyframes.push({ time: tick, value: 1, curve: "linear" });
				}

				if (tick <= duration) {
					keyframes.push({ time: tick, value: 0, curve: "step" });
				}
			}

			break;

		case "square":
			for (let tick = -offset * rate; tick <= duration; tick += rate / 2) {
				if (tick < 0) continue;

				const phase = (((tick / rate + offset) % 1) + 1) % 1;
				keyframes.push({ time: tick, value: phase < 0.5 ? 1 : 0, curve: "step" });
			}

			break;
	}

	return keyframes;
}
