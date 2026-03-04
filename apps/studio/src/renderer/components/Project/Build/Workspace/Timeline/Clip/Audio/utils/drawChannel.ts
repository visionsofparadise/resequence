import type { PointData } from "./collectPoints";

export function drawChannel(canvasCtx: CanvasRenderingContext2D, points: ReadonlyArray<PointData>, height: number, bits: 8 | 16, opacity: number): void {
	const maxValue = bits === 8 ? 128 : 32768;
	const centerY = height / 2;
	const scale = centerY * 0.9;

	canvasCtx.beginPath();

	for (let column = 0; column < points.length; column++) {
		const point = points[column];

		if (!point) continue;

		const topY = centerY - (point.max / maxValue) * scale;

		if (column === 0) canvasCtx.moveTo(point.x, topY);
		else canvasCtx.lineTo(point.x, topY);
	}

	for (let column = points.length - 1; column >= 0; column--) {
		const point = points[column];

		if (!point) continue;

		const bottomY = centerY - (point.min / maxValue) * scale;

		canvasCtx.lineTo(point.x, bottomY);
	}

	canvasCtx.closePath();

	const style = getComputedStyle(canvasCtx.canvas);
	const primaryHsl = style.getPropertyValue("--primary").trim();
	canvasCtx.fillStyle = `hsl(${primaryHsl} / ${opacity})`;
	canvasCtx.fill();

	canvasCtx.strokeStyle = `hsl(${primaryHsl} / ${Math.min(opacity + 0.2, 1)})`;
	canvasCtx.lineWidth = 0.5;
	canvasCtx.stroke();
}
