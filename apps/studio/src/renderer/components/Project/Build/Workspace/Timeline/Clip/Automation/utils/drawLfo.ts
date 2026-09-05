import { strokeValueCurve } from "./strokeValueCurve";
import type { Lfo } from "resequence";

function sampleLfoWaveform(shape: Lfo["shape"], phase: number): number {
	const normalized = ((phase % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);

	switch (shape) {
		case "sine":
			return (Math.sin(normalized) + 1) / 2;
		case "square":
			return normalized < Math.PI ? 1 : 0;
		case "sawtooth":
			return normalized / (2 * Math.PI);
		case "triangle":
			return normalized < Math.PI ? normalized / Math.PI : 2 - normalized / Math.PI;
		default:
			return 0.5;
	}
}

export function drawLfo(
	canvasCtx: CanvasRenderingContext2D,
	lfo: Lfo,
	width: number,
	height: number,
	totalBeats: number,
): void {
	const pxPerBeat = width / totalBeats;

	strokeValueCurve(canvasCtx, width, height, (px) => {
		const elapsed = px / pxPerBeat;

		let amplitude: number;

		if (elapsed < lfo.delay) {
			amplitude = 0;
		} else if (elapsed < lfo.delay + lfo.attack) {
			amplitude = (elapsed - lfo.delay) / lfo.attack;
		} else {
			amplitude = 1;
		}

		const phase = 2 * Math.PI * lfo.frequency * Math.max(0, elapsed - lfo.delay);
		const sample = sampleLfoWaveform(lfo.shape, phase);

		return 0.5 + (sample - 0.5) * lfo.value * amplitude;
	});
}
