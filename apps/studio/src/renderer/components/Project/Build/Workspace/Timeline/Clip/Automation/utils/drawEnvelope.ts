import { evaluateAt, type Keyframe } from "@resequence/patterns";
import { textPrimary, accentPrimary } from "@resequence/design-system";

export const AUTOMATION_COLOR = textPrimary;

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
	canvasCtx.fillStyle = AUTOMATION_COLOR;
	canvasCtx.globalAlpha = 0.1;
	canvasCtx.fill();
	canvasCtx.globalAlpha = 1;

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

	canvasCtx.fillStyle = accentPrimary;

	for (const kf of keyframes) {
		const kx = (kf.beat - startBeat) * pxPerBeat;

		if (kx < 0 || kx > width) continue;

		const ky = padding + drawHeight * (1 - kf.value);

		canvasCtx.beginPath();
		canvasCtx.arc(kx, ky, 3, 0, 2 * Math.PI);
		canvasCtx.fill();
	}
}
