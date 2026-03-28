import type { Event, Keyframe, MetadataEvent } from "@resequence/patterns-core";
import { denormalizeBpm, normalizeBpm } from "@resequence/patterns-core";
import { evaluateAt } from "../utils/keyframe";

export interface TempoPoint {
	readonly beat: number;
	readonly bpm: number;
}

export type TempoMap = ReadonlyArray<TempoPoint>;

export interface MarkerPoint {
	readonly beat: number;
	readonly name: string;
}

export interface TimeSignaturePoint {
	readonly beat: number;
	readonly timeSignature: readonly [number, number];
}

export interface RegionPoint {
	readonly name: string;
	readonly startBeat: number;
	readonly endBeat: number;
}

export interface CollectedMetadata {
	readonly tempoMap: TempoMap;
	readonly markers: ReadonlyArray<MarkerPoint>;
	readonly timeSignatures: ReadonlyArray<TimeSignaturePoint>;
	readonly regions: ReadonlyArray<RegionPoint>;
}

const SAMPLE_RESOLUTION = 0.1;

export function collectTempoPoints(
	baseBpm: number,
	keyframes: ReadonlyArray<Keyframe>,
	offsetBeats: number,
	entries: Array<TempoPoint>,
): void {
	if (keyframes.length === 0) {
		entries.push({ beat: offsetBeats, bpm: baseBpm });

		return;
	}

	const sorted = [...keyframes].sort((left, right) => left.beat - right.beat);
	const first = sorted[0];

	if (first?.beat === 0) {
		entries.push({ beat: offsetBeats, bpm: denormalizeBpm(first.value) });
	} else {
		entries.push({ beat: offsetBeats, bpm: baseBpm });
		sorted.unshift({ beat: 0, value: normalizeBpm(baseBpm) });
	}

	let prevBeat = 0;

	for (const kf of sorted) {
		if (kf.beat === 0) {
			prevBeat = 0;
			continue;
		}

		const curve = kf.curve ?? 0;

		if (kf.step || curve === 0) {
			entries.push({ beat: offsetBeats + kf.beat, bpm: denormalizeBpm(kf.value) });
		} else {
			let sampleBeat = prevBeat + SAMPLE_RESOLUTION;

			while (sampleBeat <= kf.beat) {
				const bpm = denormalizeBpm(evaluateAt(sorted, sampleBeat));

				entries.push({ beat: offsetBeats + Math.round(sampleBeat * 100) / 100, bpm });
				sampleBeat = Math.round((sampleBeat + SAMPLE_RESOLUTION) * 100) / 100;
			}
		}

		prevBeat = kf.beat;
	}
}

export function buildTempoMap(events: ReadonlyArray<Event>): TempoMap {
	const entries: Array<TempoPoint> = [];

	for (const event of events) {
		if (event.type !== "metadata") continue;
		const meta = event as MetadataEvent;

		if (meta.bpm === undefined) continue;

		collectTempoPoints(meta.bpm, meta.tempoKeyframes ?? [], meta.absoluteBeat, entries);
	}

	return entries.sort((left, right) => left.beat - right.beat);
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

export function secondsToBeats(fromBeat: number, elapsedSeconds: number, tempoMap: TempoMap): number {
	let remaining = elapsedSeconds;
	let currentBeat = fromBeat;
	let bpm = 120;

	for (const point of tempoMap) {
		if (point.beat <= fromBeat) {
			bpm = point.bpm;
			continue;
		}

		if (point.beat > currentBeat) {
			const beatsAtTempo = point.beat - currentBeat;
			const secondsAtTempo = beatsAtTempo * (60 / bpm);

			if (remaining <= secondsAtTempo) {
				return currentBeat + remaining / (60 / bpm);
			}

			remaining -= secondsAtTempo;
			currentBeat = point.beat;
			bpm = point.bpm;
		}
	}

	return currentBeat + remaining / (60 / bpm);
}

export function collectMetadata(events: ReadonlyArray<Event>): CollectedMetadata {
	const tempoEntries: Array<TempoPoint> = [];
	const markers: Array<MarkerPoint> = [];
	const timeSignatures: Array<TimeSignaturePoint> = [];
	const regions: Array<RegionPoint> = [];

	for (const event of events) {
		if (event.type !== "metadata") continue;
		const meta = event as MetadataEvent;

		if (meta.bpm !== undefined) {
			collectTempoPoints(meta.bpm, meta.tempoKeyframes ?? [], meta.absoluteBeat, tempoEntries);
		}

		if (meta.marker !== undefined) {
			markers.push({ beat: meta.absoluteBeat, name: meta.marker });
		}

		if (meta.timeSignature !== undefined) {
			timeSignatures.push({ beat: meta.absoluteBeat, timeSignature: meta.timeSignature });
		}

		if (meta.region !== undefined && meta.regionEndBeat !== undefined) {
			regions.push({ name: meta.region, startBeat: meta.absoluteBeat, endBeat: meta.regionEndBeat });
		}
	}

	return {
		tempoMap: tempoEntries.sort((left, right) => left.beat - right.beat),
		markers: markers.sort((left, right) => left.beat - right.beat),
		timeSignatures: timeSignatures.sort((left, right) => left.beat - right.beat),
		regions: regions.sort((left, right) => left.startBeat - right.startBeat),
	};
}
