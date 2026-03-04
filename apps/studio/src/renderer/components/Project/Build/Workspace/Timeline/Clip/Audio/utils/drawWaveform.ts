import type { WaveformBinary } from "../../../../../../../../../shared/utilities/waveform/WaveformCodec";
import { collectPoints } from "./collectPoints";
import { drawChannel } from "./drawChannel";

export function drawWaveform(canvas: CanvasRenderingContext2D, waveform: WaveformBinary, width: number, height: number, playFromMs: number, displayDurationMs: number, reversed: boolean): void {
	canvas.clearRect(0, 0, width, height);

	const channelOpacity = waveform.channels > 1 ? 0.5 : 0.4;

	for (let channel = 0; channel < waveform.channels; channel++) {
		let points = collectPoints(waveform, channel, width, playFromMs, displayDurationMs);

		if (reversed) {
			points = [...points].reverse().map((point, column) => ({ x: column, min: point.min, max: point.max }));
		}

		drawChannel(canvas, points, height, waveform.bits, channelOpacity);
	}
}
