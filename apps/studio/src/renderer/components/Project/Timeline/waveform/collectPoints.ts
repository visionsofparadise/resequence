import type { WaveformBinary } from "../../../../../shared/utilities/waveform/WaveformCodec";

export interface PointData {
	readonly x: number;
	readonly min: number;
	readonly max: number;
}

export function collectPoints(
	waveform: WaveformBinary,
	channel: number,
	width: number,
	playFromMs: number,
	displayDurationMs: number,
): ReadonlyArray<PointData> {
	const msPerDataPoint = (waveform.samplesPerPixel / waveform.sampleRate) * 1000;
	const { data, channels, length } = waveform;
	const points: Array<PointData> = [];
	const drawPoints = Math.max(1, Math.floor(width));

	for (let column = 0; column < drawPoints; column++) {
		const ms = playFromMs + (column / drawPoints) * displayDurationMs;
		const msEnd = playFromMs + ((column + 1) / drawPoints) * displayDurationMs;

		const startIndex = Math.floor(ms / msPerDataPoint);
		const endIndex = Math.min(Math.ceil(msEnd / msPerDataPoint), length - 1);

		let min = Infinity;
		let max = -Infinity;

		for (let dataIndex = startIndex; dataIndex <= endIndex; dataIndex++) {
			const minSample = data[(dataIndex * channels + channel) * 2];
			const maxSample = data[(dataIndex * channels + channel) * 2 + 1];
			if (minSample !== undefined && minSample < min) min = minSample;
			if (maxSample !== undefined && maxSample > max) max = maxSample;
		}

		if (min === Infinity) min = 0;
		if (max === -Infinity) max = 0;

		points.push({ x: column, min, max });
	}

	return points;
}
