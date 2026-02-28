import type { Pattern } from "../patterns/pattern";
import type { TempoKeyframe } from "../patterns/tempo";
import { TempoPattern } from "../patterns/tempo";

export interface TempoPoint {
	readonly beat: number;
	readonly bpm: number;
}

export type TempoMap = ReadonlyArray<TempoPoint>;

const SAMPLE_RESOLUTION = 0.1;

export function buildTempoMap(pattern: Pattern): TempoMap {
	const entries: Array<TempoPoint> = [];
	walkTempoTree(pattern, 0, entries, false);
	return entries.sort((left, right) => left.beat - right.beat);
}

function walkTempoTree(pattern: Pattern, offsetBeats: number, entries: Array<TempoPoint>, ancestorHasTempo: boolean): void {
	let tempoForChildren = ancestorHasTempo;

	if (pattern instanceof TempoPattern) {
		const shouldTakeEffect = !ancestorHasTempo || pattern.isOverride;

		if (shouldTakeEffect) {
			collectTempoPoints(pattern.bpm, pattern.keyframes, offsetBeats, entries);
			tempoForChildren = true;
		}
	}

	for (const { offsetBeats: childOffset, pattern: child } of pattern.children) {
		walkTempoTree(child, offsetBeats + childOffset, entries, tempoForChildren);
	}
}

function collectTempoPoints(baseBpm: number, keyframes: ReadonlyArray<TempoKeyframe>, offsetBeats: number, entries: Array<TempoPoint>): void {
	if (keyframes.length === 0) {
		entries.push({ beat: offsetBeats, bpm: baseBpm });
		return;
	}

	const sorted = [...keyframes].sort((left, right) => left.beat - right.beat);
	const first = sorted[0];

	let prevBpm = baseBpm;
	let prevBeat = 0;

	if (first?.beat === 0) {
		entries.push({ beat: offsetBeats, bpm: first.bpm });
		prevBpm = first.bpm;
	} else {
		entries.push({ beat: offsetBeats, bpm: baseBpm });
	}

	for (const kf of sorted) {
		if (kf.beat === 0) {
			prevBeat = 0;
			continue;
		}

		if (!kf.curve || kf.curve === "step") {
			entries.push({ beat: offsetBeats + kf.beat, bpm: kf.bpm });
		} else {
			let sampleBeat = prevBeat + SAMPLE_RESOLUTION;
			while (sampleBeat <= kf.beat) {
				const fraction = (sampleBeat - prevBeat) / (kf.beat - prevBeat);
				let bpm: number;
				if (kf.curve === "linear") {
					bpm = prevBpm + (kf.bpm - prevBpm) * fraction;
				} else {
					bpm = prevBpm * Math.pow(Math.max(kf.bpm / prevBpm, 1e-6), fraction);
				}
				entries.push({ beat: offsetBeats + Math.round(sampleBeat * 100) / 100, bpm });
				sampleBeat = Math.round((sampleBeat + SAMPLE_RESOLUTION) * 100) / 100;
			}
		}

		prevBpm = kf.bpm;
		prevBeat = kf.beat;
	}
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
