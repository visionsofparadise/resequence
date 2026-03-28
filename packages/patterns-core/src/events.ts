import type { Pitch } from "./pitch";
import type { ResolvedTuning } from "./tuning";

export interface Keyframe {
	readonly beat: number;
	readonly value: number;
	readonly curve?: number;
	readonly step?: true;
}

export interface BaseEvent {
	readonly type: string;
	readonly [key: string]: unknown;
}

export interface NoteEvent extends BaseEvent {
	readonly type: "note";
	readonly port: string;
	readonly channel: number;
	readonly pitch: Pitch;
	readonly startBeat: number;
	readonly durationBeats: number;
	readonly velocity: number;
	readonly frequency: number;
	readonly midiNote: number;
	readonly bend: number;
	readonly lyric?: string;
	readonly cc?: Partial<Record<number, number>>;
	readonly slides?: ReadonlyArray<Keyframe>;
	readonly tuning?: ResolvedTuning;
}

export interface MetadataEvent extends BaseEvent {
	readonly type: "metadata";
	readonly absoluteBeat: number;
	readonly tuning?: ResolvedTuning;
	readonly bpm?: number;
	readonly tempoKeyframes?: ReadonlyArray<Keyframe>;
	readonly tempoIsOverride?: boolean;
	readonly timeSignature?: readonly [number, number];
	readonly marker?: string;
	readonly region?: string;
	readonly regionEndBeat?: number;
	readonly name?: string;
	readonly description?: string;
}

export type Event = NoteEvent | MetadataEvent | BaseEvent;
