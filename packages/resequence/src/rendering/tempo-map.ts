import type { Pattern } from "../patterns/pattern";

export interface TempoPoint {
	readonly beat: number;
	readonly bpm: number;
}

export type TempoMap = ReadonlyArray<TempoPoint>;

export function buildTempoMap(pattern: Pattern, offsetBeats = 0): TempoMap {
	return pattern.metadatas
		.filter((positioned): positioned is typeof positioned & { meta: { tempo: number } } => positioned.meta.tempo !== undefined)
		.map((positioned) => ({ beat: positioned.beat + offsetBeats, bpm: positioned.meta.tempo }))
		.sort((left, right) => left.beat - right.beat);
}

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

export interface TimeSignaturePoint {
	readonly beat: number;
	readonly timeSignature: readonly [number, number];
}

export function buildTimeSignatureMap(pattern: Pattern, offsetBeats = 0): ReadonlyArray<TimeSignaturePoint> {
	return pattern.metadatas
		.filter((positioned): positioned is typeof positioned & { meta: { timeSignature: readonly [number, number] } } => positioned.meta.timeSignature !== undefined)
		.map((positioned) => ({ beat: positioned.beat + offsetBeats, timeSignature: positioned.meta.timeSignature }))
		.sort((left, right) => left.beat - right.beat);
}
