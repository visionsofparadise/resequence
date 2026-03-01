import type { ScoreNote } from "../note";
import type { PatternNode } from "../pattern";
import { MidiPattern, type Pattern } from "../pattern";
import { toPattern } from "../sequence";
import { mapNotes } from "../utils/tree";

export class ReversePattern extends MidiPattern {
	constructor(
		readonly source: Pattern | ScoreNote,
		node: PatternNode,
	) {
		super(node);
	}

	clone(overrides: Partial<PatternNode>): ReversePattern {
		return new ReversePattern(this.source, this.overrideNode(overrides));
	}
}

export function reverse(pattern: Pattern | ScoreNote): ReversePattern {
	const resolved = toPattern(pattern);
	const totalDuration = pattern.endBeat - pattern.startBeat;

	const transformed = mapNotes(resolved, (note, { absoluteOffset }) => {
		const noteDuration = note.endBeat - note.startBeat;
		const absEnd = absoluteOffset + note.endBeat;
		const newAbsStart = totalDuration - absEnd;
		const newStartBeat = newAbsStart - absoluteOffset;

		return {
			...note,
			startBeat: newStartBeat,
			endBeat: newStartBeat + noteDuration,
		};
	});

	return new ReversePattern(pattern, transformed);
}
