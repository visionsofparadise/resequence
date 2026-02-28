import type { ScoreNote } from "../note";
import type { PatternNode } from "../pattern";
import { MidiPattern, type Pattern } from "../pattern";
import { toPattern } from "../sequence";
import { mapNotes } from "../utils/tree";

export class OffsetPattern extends MidiPattern {
	constructor(
		readonly source: Pattern | ScoreNote,
		readonly amount: number,
		node: PatternNode,
	) {
		super(node);
	}

	clone(overrides: Partial<PatternNode>): OffsetPattern {
		return new OffsetPattern(this.source, this.amount, this.overrideNode(overrides));
	}
}

export function offset(pattern: Pattern | ScoreNote, amount: number): OffsetPattern {
	const resolved = toPattern(pattern);
	const transformed = mapNotes(resolved, (note) => ({
		...note,
		startBeat: note.startBeat + amount,
		endBeat: note.endBeat + amount,
	}));

	return new OffsetPattern(pattern, amount, transformed);
}
