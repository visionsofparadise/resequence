export interface TempoPoint {
	readonly beat: number;
	readonly bpm: number;
}

export type TempoMap = ReadonlyArray<TempoPoint>;

export function beatsToSeconds(beats: number, tempoMap: TempoMap): number {
	if (beats <= 0) return 0;

	let seconds = 0;
	let lastBeat = 0;
	let lastBpm = 120;

	for (const point of tempoMap) {
		if (point.beat >= beats) break;

		seconds += (point.beat - lastBeat) * (60 / lastBpm);

		lastBeat = point.beat;
		lastBpm = point.bpm;
	}

	seconds += (beats - lastBeat) * (60 / lastBpm);

	return seconds;
}
