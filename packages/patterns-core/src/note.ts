import type { Keyframe } from "./events";
import type { Pitch } from "./pitch";

export interface Note {
	readonly pitch: Pitch;
	readonly startBeat: number;
	readonly endBeat: number;
	readonly velocity: number;
	readonly lyric?: string;
	readonly cc?: Partial<Record<number, number>>;
	readonly slides?: ReadonlyArray<Keyframe>;
}

export function note(
	pitch: Pitch,
	durationBeats: number,
	options?: {
		velocity?: number;
		lyric?: string;
		cc?: Partial<Record<number, number>>;
		slides?: ReadonlyArray<Keyframe>;
	},
): Note {
	const velocity = options?.velocity ?? 100;

	return {
		pitch,
		startBeat: 0,
		endBeat: durationBeats,
		velocity,
		lyric: options?.lyric,
		cc: options?.cc,
		slides: options?.slides,
	};
}
