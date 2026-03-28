import type { Note, MidiPatternProperties, PatternProperties, RelativeNote } from "@resequence/patterns-core";
import { MidiPattern } from "@resequence/patterns-core";
export type GenerativeCallback = (accumulator: Array<Note>, index: number, total: number) => Array<Note>;

export interface GenerativeProperties extends MidiPatternProperties {
	readonly callback: GenerativeCallback;
	readonly count: number;
	readonly durationBeats: number;
}

export class GenerativePattern extends MidiPattern<GenerativeProperties> {
	readonly type = ["pattern", "midi", "generator", "generative"] as const;

	static override is(value: unknown): value is GenerativePattern {
		return MidiPattern.is(value) && value.type[2] === "generator" && value.type[3] === "generative";
	}

	clone(overrides: Partial<PatternProperties>): GenerativePattern {
		return new GenerativePattern({
			...this.properties,
			...overrides,
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
