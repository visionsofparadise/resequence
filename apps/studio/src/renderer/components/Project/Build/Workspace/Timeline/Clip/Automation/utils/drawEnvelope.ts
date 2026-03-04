import { evaluateAt, type Keyframe } from "resequence";
export const AUTOMATION_COLOR = "hsl(45, 80%, 55%)";

export function drawEnvelope(canvasCtx: CanvasRenderingContext2D, keyframes: ReadonlyArray<Keyframe>, width: number, height: number, startBeat: number, pxPerBeat: number): void {
	const padding = 2;
	const drawHeight = height - padding * 2;

	canvasCtx.beginPath();
	canvasCtx.moveTo(0, height);

	for (let px = 0; px <= width; px++) {
		const beat = startBeat + px / pxPerBeat;
		const value = evaluateAt(keyframes, beat);
		const vy = padding + drawHeight * (1 - value);
		canvasCtx.lineTo(px, vy);
	}

	canvasCtx.lineTo(width, height);
	canvasCtx.closePath();
	canvasCtx.fillStyle = AUTOMATION_COLOR.replace("55%)", "55% / 0.15)").replace("hsl(", "hsl(");
	canvasCtx.globalAlpha = 1;
	canvasCtx.fill();

	canvasCtx.beginPath();

	for (let px = 0; px <= width; px++) {
		const beat = startBeat + px / pxPerBeat;
		const value = evaluateAt(keyframes, beat);
		const vy = padding + drawHeight * (1 - value);

		if (px === 0) canvasCtx.moveTo(px, vy);
		else canvasCtx.lineTo(px, vy);
	}
	canvasCtx.strokeStyle = AUTOMATION_COLOR;
	canvasCtx.lineWidth = 1.5;
	canvasCtx.stroke();

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
