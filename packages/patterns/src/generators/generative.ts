import type { Note } from "../note";
import type { PatternProperties, RelativeNote } from "../patterns/pattern";
import type { MidiPatternProperties } from "../patterns/midi-pattern";
import { MidiPattern } from "../patterns/midi-pattern";

export type GenerativeCallback = (accumulator: Array<Note>, index: number, total: number) => Array<Note>;

export interface GenerativeProperties extends MidiPatternProperties {
	readonly callback: GenerativeCallback;
	readonly count: number;
	readonly durationBeats: number;
}

export class GenerativePattern extends MidiPattern<GenerativeProperties> {
	static is(value: unknown): value is GenerativePattern {
		return value instanceof GenerativePattern;
	}

	clone(overrides: Partial<PatternProperties>): GenerativePattern {
		return new GenerativePattern({
			...this.properties,
			...overrides,
			previousProperties: this.properties,
		});
	}
}

export function generative(callback: GenerativeCallback, count: number, durationBeats: number): GenerativePattern {
	let accumulator: Array<Note> = [];

	for (let stepIndex = 0; stepIndex < count; stepIndex++) {
		accumulator = callback(accumulator, stepIndex, count);
	}

	const notes: Array<RelativeNote> = [];

	for (const scoreNote of accumulator) {
		if (scoreNote.startBeat >= durationBeats) continue;

		const clipped = scoreNote.endBeat > durationBeats ? { ...scoreNote, endBeat: durationBeats } : scoreNote;

		notes.push({ offsetBeats: 0, note: clipped });
	}

	return new GenerativePattern({ notes, children: [], startBeat: 0, endBeat: durationBeats, callback, count, durationBeats });
}
