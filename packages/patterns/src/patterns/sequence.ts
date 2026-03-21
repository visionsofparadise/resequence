import type { Note } from "../note";
import { MidiPattern } from "./midi";
import type { PatternProperties, RelativeChild, RelativeNote } from "./pattern";
import { Pattern } from "./pattern";

export class SequencePattern extends MidiPattern {
	readonly type = ["pattern", "midi", "sequence"] as const;

	static override is(value: unknown): value is SequencePattern {
		return MidiPattern.is(value) && value.type[2] === "sequence";
	}

	clone(overrides: Partial<PatternProperties>): SequencePattern {
		return new SequencePattern({
			...this.properties,
			...overrides,
			previousProperties: this.properties,
		});
	}
}

export function sequence(...inputs: ReadonlyArray<Pattern | Note>): SequencePattern {
	const notes: Array<RelativeNote> = [];
	const children: Array<RelativeChild> = [];

	let cursor = 0;
	let startBeat = 0;
	let endBeat = 0;

	for (const input of inputs) {
		if (!(input instanceof Pattern)) {
			notes.push({ offsetBeats: cursor, note: input });
		} else {
			children.push({ offsetBeats: cursor, pattern: input });
		}

		startBeat = Math.min(startBeat, cursor + input.startBeat);
		endBeat = Math.max(endBeat, cursor + input.endBeat);
		cursor += input.endBeat - input.startBeat;
	}

	return new SequencePattern({ notes, children, startBeat, endBeat });
}

export function toPattern(input: Pattern | Note): Pattern {
	if (input instanceof Pattern) return input;

	return sequence(input);
}
