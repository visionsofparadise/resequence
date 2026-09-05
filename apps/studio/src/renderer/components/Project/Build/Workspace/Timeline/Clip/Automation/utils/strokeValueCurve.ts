import { textPrimary } from "@resequence/design-system";

export const AUTOMATION_COLOR = textPrimary;

const CURVE_PADDING = 2;

export function strokeValueCurve(
	canvasCtx: CanvasRenderingContext2D,
	width: number,
	height: number,
	valueAt: (px: number) => number,
): void {
	const drawHeight = height - CURVE_PADDING * 2;

	canvasCtx.beginPath();

	for (let px = 0; px <= width; px++) {
		const vy = CURVE_PADDING + drawHeight * (1 - valueAt(px));

		if (px === 0) canvasCtx.moveTo(px, vy);
		else canvasCtx.lineTo(px, vy);
	}

	canvasCtx.strokeStyle = AUTOMATION_COLOR;
	canvasCtx.lineWidth = 1.5;
	canvasCtx.stroke();
}
