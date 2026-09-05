import { accentPrimary } from "@resequence/design-system";
import { evaluateAt, type Keyframe } from "resequence";
import { AUTOMATION_COLOR, strokeValueCurve } from "./strokeValueCurve";

export function drawEnvelope(
	canvasCtx: CanvasRenderingContext2D,
	keyframes: ReadonlyArray<Keyframe>,
	width: number,
	height: number,
	startBeat: number,
	pxPerBeat: number,
): void {
	const padding = 2;
	const drawHeight = height - padding * 2;
	const valueAt = (px: number): number => evaluateAt(keyframes, startBeat + px / pxPerBeat);

	canvasCtx.beginPath();
	canvasCtx.moveTo(0, height);

	for (let px = 0; px <= width; px++) {
		canvasCtx.lineTo(px, padding + drawHeight * (1 - valueAt(px)));
	}

	canvasCtx.lineTo(width, height);
	canvasCtx.closePath();
	canvasCtx.fillStyle = AUTOMATION_COLOR;
	canvasCtx.globalAlpha = 0.1;
	canvasCtx.fill();
	canvasCtx.globalAlpha = 1;

	strokeValueCurve(canvasCtx, width, height, valueAt);

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
