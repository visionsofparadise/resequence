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
}

export interface NoteEvent extends BaseEvent {
	readonly type: "note";
	readonly port: string;
	readonly channel: number;
	readonly pitch: Pitch;
	readonly startBeat: number;
	readonly durationBeats: number;
	readonly velocity: number;
	readonly lyric?: string;
	readonly cc?: Partial<Record<number, number>>;
	readonly slides?: ReadonlyArray<Keyframe>;
	readonly tuning?: ResolvedTuning;
}

export type Event = NoteEvent | BaseEvent;
