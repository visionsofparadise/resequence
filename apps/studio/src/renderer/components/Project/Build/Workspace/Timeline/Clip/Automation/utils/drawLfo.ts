import { AUTOMATION_COLOR } from "./drawEnvelope";
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
	startBeat: number,
	totalBeats: number,
): void {
	const padding = 2;
	const drawHeight = height - padding * 2;
	const pxPerBeat = width / totalBeats;

	canvasCtx.beginPath();

	for (let px = 0; px <= width; px++) {
		const beat = startBeat + px / pxPerBeat;
		const elapsed = beat - startBeat;

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
		const value = 0.5 + (sample - 0.5) * lfo.value * amplitude;

		const vy = padding + drawHeight * (1 - value);

		if (px === 0) canvasCtx.moveTo(px, vy);
		else canvasCtx.lineTo(px, vy);
	}

	canvasCtx.strokeStyle = AUTOMATION_COLOR;
	canvasCtx.lineWidth = 1.5;
	canvasCtx.stroke();
}
