import { MidiPattern } from "./midi";
import { Pattern } from "./pattern";
import type { Note } from "../note";
import type { MidiPatternProperties } from "./midi";
import type { PatternProperties, RelativeChild, RelativeNote } from "./pattern";

export interface SequenceProperties extends MidiPatternProperties {
	readonly inputs?: ReadonlyArray<Pattern | Note>;
}

export class SequencePattern extends MidiPattern<SequenceProperties> {
	readonly packageName = "@resequence/patterns-core";
	readonly unitName = "sequence";

	constructor(properties: SequenceProperties) {
		super(SequencePattern.resolveProperties(properties));
	}

	private static resolveProperties(properties: SequenceProperties): SequenceProperties {
		if (!properties.inputs) return properties;

		const notes: Array<RelativeNote> = [];
		const children: Array<RelativeChild> = [];

		let cursor = 0;
		let startBeat = 0;
		let endBeat = 0;

		for (const input of properties.inputs) {
			if (!(input instanceof Pattern)) {
				notes.push({ offsetBeats: cursor, note: input });
			} else {
				children.push({ offsetBeats: cursor, pattern: input });
			}

			startBeat = Math.min(startBeat, cursor + input.startBeat);
			endBeat = Math.max(endBeat, cursor + input.endBeat);
			cursor += input.endBeat - input.startBeat;
		}

		return { ...properties, notes, children, startBeat, endBeat };
	}

	clone(overrides: Partial<PatternProperties>): SequencePattern {
		return new SequencePattern({
			...this.properties,
			...overrides,
		});
	}
}

export function sequence(...inputs: ReadonlyArray<Pattern | Note>): SequencePattern {
	return new SequencePattern({ notes: [], children: [], startBeat: 0, endBeat: 0, inputs });
}

export function toPattern(input: Pattern | Note): Pattern {
	if (input instanceof Pattern) return input;

	return sequence(input);
}
