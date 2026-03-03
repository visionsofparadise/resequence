import type { Keyframe, Lfo, Pitch, ResolvedTuning, TempoMap } from "resequence";

export interface AggregatedNote {
	readonly pitch: Pitch;
	readonly startBeat: number;
	readonly endBeat: number;
	readonly velocity: number;
	readonly lyric?: string;
	readonly slides?: ReadonlyArray<Keyframe>;
	readonly patternPath: string;
}

export interface PatternSpan {
	readonly patternPath: string;
	readonly patternType: string;
	readonly startBeat: number;
	readonly endBeat: number;
}

export interface NoteLane {
	readonly kind: "notes";
	readonly outputKey: string;
	readonly outputIds: ReadonlyArray<string>;
	readonly notes: ReadonlyArray<AggregatedNote>;
	readonly spans: ReadonlyArray<PatternSpan>;
	readonly minPitch: number;
	readonly maxPitch: number;
	readonly tuning: ResolvedTuning | null;
	readonly timeSignature: readonly [number, number];
}

export interface AudioLane {
	readonly kind: "audio";
	readonly name: string;
	readonly patternPath: string;
	readonly startBeat: number;
	readonly endBeat: number;
	readonly filePath: string;
	readonly durationBeats: number;
	readonly playFromBeats: number;
	readonly reversed: boolean;
}

export interface AutomationLane {
	readonly kind: "automation";
	readonly name: string;
	readonly patternPath: string;
	readonly paths: ReadonlyArray<string>;
	readonly source: ReadonlyArray<Keyframe> | Lfo;
	readonly startBeat: number;
	readonly endBeat: number;
}

export type Lane = NoteLane | AudioLane | AutomationLane;

export interface TimelineSegment {
	readonly startBeat: number;
	readonly endBeat: number;
	readonly lanes: ReadonlyArray<Lane>;
	readonly children: ReadonlyArray<TimelineSegment>;
}

export interface TimelineData {
	readonly segments: ReadonlyArray<TimelineSegment>;
	readonly totalStartBeat: number;
	readonly totalEndBeat: number;
	readonly tempoMap: TempoMap;
}
