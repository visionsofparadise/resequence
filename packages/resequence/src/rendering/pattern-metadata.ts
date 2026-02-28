import { AudioPattern } from "../patterns/audio";
import { MetadataPattern } from "../patterns/metadata";
import type { Pattern } from "../patterns/pattern";
import { MidiPattern } from "../patterns/pattern";
import type { TempoKeyframe } from "../patterns/tempo";
import { TempoPattern } from "../patterns/tempo";
import type { TempoMap, TempoPoint } from "./tempo-map";

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

export interface PatternMetadata {
	readonly tempoMap: TempoMap;
	readonly markers: ReadonlyArray<MarkerPoint>;
	readonly timeSignatures: ReadonlyArray<TimeSignaturePoint>;
	readonly regions: ReadonlyArray<RegionPoint>;
	readonly tracks: ReadonlySet<string>;
}

export function collectMetadata(pattern: Pattern): PatternMetadata {
	const tempoEntries: Array<TempoPoint> = [];
	const markers: Array<MarkerPoint> = [];
	const timeSignatures: Array<TimeSignaturePoint> = [];
	const regions: Array<RegionPoint> = [];
	const tracks = new Set<string>();

	walkMetadata(pattern, 0, tempoEntries, markers, timeSignatures, regions, tracks, false);

	return {
		tempoMap: tempoEntries.sort((left, right) => left.beat - right.beat),
		markers: markers.sort((left, right) => left.beat - right.beat),
		timeSignatures: timeSignatures.sort((left, right) => left.beat - right.beat),
		regions: regions.sort((left, right) => left.startBeat - right.startBeat),
		tracks,
	};
}

const SAMPLE_RESOLUTION = 0.1;

function walkMetadata(
	pattern: Pattern,
	offsetBeats: number,
	tempoEntries: Array<TempoPoint>,
	markers: Array<MarkerPoint>,
	timeSignatures: Array<TimeSignaturePoint>,
	regions: Array<RegionPoint>,
	tracks: Set<string>,
	ancestorHasTempo: boolean,
): void {
	let tempoForChildren = ancestorHasTempo;

	if (pattern instanceof TempoPattern) {
		const shouldTakeEffect = !ancestorHasTempo || pattern.isOverride;

		if (shouldTakeEffect) {
			collectTempoPoints(pattern.bpm, pattern.keyframes, offsetBeats, tempoEntries);
			tempoForChildren = true;
		}
	}

	if (pattern instanceof MetadataPattern) {
		if (pattern.meta.marker !== undefined) {
			markers.push({ beat: offsetBeats, name: pattern.meta.marker });
		}

		if (pattern.meta.timeSignature !== undefined) {
			timeSignatures.push({ beat: offsetBeats, timeSignature: pattern.meta.timeSignature });
		}

		if (pattern.meta.region !== undefined) {
			regions.push({
				name: pattern.meta.region,
				startBeat: offsetBeats + pattern.startBeat,
				endBeat: offsetBeats + pattern.endBeat,
			});
		}
	}

	if (pattern instanceof AudioPattern) {
		tracks.add(pattern.name);
	}

	if (pattern instanceof MidiPattern && pattern.outputs.length > 0) {
		for (const output of pattern.outputs) {
			if (output.id !== undefined) {
				tracks.add(output.id);
			}
		}
	}

	for (const { offsetBeats: childOffset, pattern: child } of pattern.children) {
		walkMetadata(child, offsetBeats + childOffset, tempoEntries, markers, timeSignatures, regions, tracks, tempoForChildren);
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
