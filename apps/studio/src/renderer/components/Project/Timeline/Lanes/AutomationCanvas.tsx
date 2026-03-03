import { memo, useEffect, useRef } from "react";
import { evaluateAt, type Keyframe, type Lfo } from "resequence";
import { AUTOMATION_COLOR } from "../constants";

interface AutomationCanvasProps {
	readonly source: ReadonlyArray<Keyframe> | Lfo;
	readonly width: number;
	readonly height: number;
	readonly startBeat: number;
	readonly endBeat: number;
	readonly pxPerBeat: number;
}

function isKeyframes(source: ReadonlyArray<Keyframe> | Lfo): source is ReadonlyArray<Keyframe> {
	return Array.isArray(source);
}

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

export const AutomationCanvas = memo<AutomationCanvasProps>(({ source, width, height, startBeat, endBeat, pxPerBeat }) => {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const dpr = typeof window !== "undefined" ? window.devicePixelRatio : 1;

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const canvasCtx = canvas.getContext("2d");
		if (!canvasCtx) return;

		canvas.width = Math.ceil(width * dpr);
		canvas.height = Math.ceil(height * dpr);
		canvasCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
		canvasCtx.clearRect(0, 0, width, height);

		const totalBeats = endBeat - startBeat;
		if (totalBeats <= 0 || width <= 0) return;

		if (isKeyframes(source)) {
			drawEnvelope(canvasCtx, source, width, height, startBeat, pxPerBeat);
		} else {
			drawLfo(canvasCtx, source, width, height, startBeat, totalBeats);
		}
	}, [source, width, height, startBeat, endBeat, pxPerBeat, dpr]);

	return (
		<canvas
			ref={canvasRef}
			style={{ width, height }}
		/>
	);
});

function drawEnvelope(
	canvasCtx: CanvasRenderingContext2D,
	keyframes: ReadonlyArray<Keyframe>,
	width: number,
	height: number,
	startBeat: number,
	pxPerBeat: number,
): void {
	const padding = 2;
	const drawHeight = height - padding * 2;

	// Fill area
	canvasCtx.beginPath();
	canvasCtx.moveTo(0, height);
	for (let px = 0; px <= width; px++) {
		const beat = startBeat + (px / pxPerBeat);
		const value = evaluateAt(keyframes, beat);
		const vy = padding + drawHeight * (1 - value);
		canvasCtx.lineTo(px, vy);
	}
	canvasCtx.lineTo(width, height);
	canvasCtx.closePath();
	canvasCtx.fillStyle = AUTOMATION_COLOR.replace("55%)", "55% / 0.15)").replace("hsl(", "hsl(");
	canvasCtx.globalAlpha = 1;
	canvasCtx.fill();

	// Curve line
	canvasCtx.beginPath();
	for (let px = 0; px <= width; px++) {
		const beat = startBeat + (px / pxPerBeat);
		const value = evaluateAt(keyframes, beat);
		const vy = padding + drawHeight * (1 - value);
		if (px === 0) canvasCtx.moveTo(px, vy);
		else canvasCtx.lineTo(px, vy);
	}
	canvasCtx.strokeStyle = AUTOMATION_COLOR;
	canvasCtx.lineWidth = 1.5;
	canvasCtx.stroke();

	// Dots at keyframe positions
	canvasCtx.fillStyle = AUTOMATION_COLOR;
	for (const kf of keyframes) {
		const kx = (kf.beat - startBeat) * pxPerBeat;
		if (kx < 0 || kx > width) continue;
		const ky = padding + drawHeight * (1 - kf.value);
		canvasCtx.beginPath();
		canvasCtx.arc(kx, ky, 3, 0, 2 * Math.PI);
		canvasCtx.fill();
	}
}

function drawLfo(
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
		const beat = startBeat + (px / pxPerBeat);
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
