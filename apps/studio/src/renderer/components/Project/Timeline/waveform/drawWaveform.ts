import type { WaveformBinary } from "../../../../../shared/utilities/waveform/WaveformCodec";
import { collectPoints, type PointData } from "./collectPoints";

function drawChannel(
	canvasCtx: CanvasRenderingContext2D,
	points: ReadonlyArray<PointData>,
	height: number,
	bits: 8 | 16,
	opacity: number,
): void {
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

export function drawWaveform(
	canvasCtx: CanvasRenderingContext2D,
	waveform: WaveformBinary,
	width: number,
	height: number,
	playFromMs: number,
	displayDurationMs: number,
	reversed: boolean,
): void {
	canvasCtx.clearRect(0, 0, width, height);

	const channelOpacity = waveform.channels > 1 ? 0.5 : 0.4;

	for (let channel = 0; channel < waveform.channels; channel++) {
		let points = collectPoints(waveform, channel, width, playFromMs, displayDurationMs);

		if (reversed) {
			points = [...points].reverse().map((point, column) => ({ x: column, min: point.min, max: point.max }));
		}

		drawChannel(canvasCtx, points, height, waveform.bits, channelOpacity);
	}
}
