import { ticksToSeconds } from "../rendering/ticks-to-seconds";
import type { Duration } from "./duration";
import { resolveDuration } from "./duration";

export type LfoShape = "sine" | "sawtooth" | "triangle" | "square";

export interface Lfo {
	readonly shape: LfoShape;
	readonly value: number;
	readonly frequency?: number;
	readonly speedTicks?: number;
	readonly delay: number;
	readonly attack: number;
}

export function resolveLfo(lfo: { shape: LfoShape; value: number; frequency: number | Duration; delay?: number; attack?: number }): Lfo {
	const frequency = typeof lfo.frequency === "number" ? lfo.frequency : undefined;
	const speedTicks = typeof lfo.frequency !== "number" ? resolveDuration(lfo.frequency) : undefined;

	return {
		shape: lfo.shape,
		value: lfo.value,
		frequency,
		speedTicks,
		delay: lfo.delay ?? 0,
		attack: lfo.attack ?? 0,
	};
}

export function scheduleLfo(lfo: Lfo, target: AudioParam, audioContext: BaseAudioContext, startTime: number, stopTime: number, depthScale: number, tempo: number): void {
	const osc = audioContext.createOscillator();

	osc.type = lfo.shape;
	osc.frequency.value = lfo.frequency ?? (lfo.speedTicks !== undefined ? 1 / ticksToSeconds(lfo.speedTicks, tempo) : 0);

	const depthGain = audioContext.createGain();
	const fullDepth = lfo.value * depthScale;

	if (lfo.attack > 0) {
		depthGain.gain.setValueAtTime(0, startTime + lfo.delay);
		depthGain.gain.linearRampToValueAtTime(fullDepth, startTime + lfo.delay + lfo.attack);
	} else {
		depthGain.gain.value = fullDepth;
	}

	osc.connect(depthGain);
	depthGain.connect(target);
	osc.start(startTime + lfo.delay);
	osc.stop(stopTime);
}
