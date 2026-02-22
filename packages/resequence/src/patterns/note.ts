import type { Duration } from "../duration";
import { resolveDuration } from "../duration";
import type { Pitch } from "../pitch";
import { resolvePitch } from "../pitch";
import { MidiPattern } from "./pattern";

export class NotePattern extends MidiPattern {
	readonly type = "note" as const;
	readonly durationTicks: number;

	constructor(
		readonly pitch: Pitch,
		readonly duration: Duration,
		readonly velocity: number,
		readonly lyric?: string,
	) {
		super();

		this.durationTicks = resolveDuration(duration);
	}

	transpose(interval: number): NotePattern {
		const midi = resolvePitch(this.pitch) + interval;

		return new NotePattern(midi, this.duration, this.velocity, this.lyric);
	}

	reverse(): NotePattern {
		return new NotePattern(this.pitch, this.duration, this.velocity, this.lyric);
	}
}

export function note(pitch: Pitch, duration: Duration, options?: { velocity?: number; lyric?: string }): NotePattern {
	return new NotePattern(pitch, duration, options?.velocity ?? 100, options?.lyric);
}
