import { ResequenceError } from "../error";
import type { Pitch } from "../utils/pitch";

export interface ScoreNote {
	readonly pitch: Pitch;
	readonly startBeat: number;
	readonly endBeat: number;
	readonly velocity: number;
	readonly lyric?: string;
	readonly cc?: Partial<Record<number, number>>;
	readonly slides?: ReadonlyArray<ScoreNoteSlide>;
}

export interface ScoreNoteSlideInput {
	readonly pitch: Pitch;
	readonly beat: number;
	readonly curve?: number;
}

export function note(
	pitch: Pitch,
	durationBeats: number,
	options?: { velocity?: number; lyric?: string; cc?: Partial<Record<number, number>>; slides?: ReadonlyArray<ScoreNoteSlideInput> },
): ScoreNote {
	const velocity = options?.velocity ?? 100;

	if (velocity < 0 || velocity > 127) {
		throw new ResequenceError("INVALID_VELOCITY", `note(): velocity must be 0-127, got ${velocity}`);
	}

	const slides = options?.slides ? resolveScoreNoteSlides(options.slides, durationBeats) : undefined;

	return { pitch, startBeat: 0, endBeat: durationBeats, velocity, lyric: options?.lyric, cc: options?.cc, slides };
}

export interface ScoreNoteSlide {
	readonly pitch: Pitch;
	readonly beat: number;
	readonly curve: number;
}

export function resolveScoreNoteSlides(inputs: ReadonlyArray<ScoreNoteSlideInput>, durationBeats: number): ReadonlyArray<ScoreNoteSlide> {
	const resolved = inputs.map((input) => {
		const curve = Math.max(-1, Math.min(1, input.curve ?? 0));

		if (input.beat < 0) {
			throw new ResequenceError("INVALID_SLIDE", `note(): slide time must not be negative, got ${input.beat}`);
		}
		if (input.beat > durationBeats) {
			throw new ResequenceError("INVALID_SLIDE", `note(): slide time ${input.beat} exceeds note duration ${durationBeats}`);
		}

		return { beat: input.beat, pitch: input.pitch, curve };
	});

	return resolved.sort((s1, s2) => s1.beat - s2.beat);
}
