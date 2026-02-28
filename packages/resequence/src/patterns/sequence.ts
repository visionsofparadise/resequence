import type { ScoreNote } from "./note";
import type { PatternNode, RelativeChild, RelativeNote } from "./pattern";
import { MidiPattern, Pattern } from "./pattern";

export class SequencePattern extends MidiPattern {
	clone(overrides: Partial<PatternNode>): SequencePattern {
		return new SequencePattern(this.overrideNode(overrides));
	}
}

export function sequence(...inputs: ReadonlyArray<Pattern | ScoreNote>): SequencePattern {
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
