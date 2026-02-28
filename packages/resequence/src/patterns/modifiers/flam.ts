import type { ScoreNote } from "../note";
import type { PatternNode } from "../pattern";
import { MidiPattern, type Pattern } from "../pattern";
import { toPattern } from "../sequence";
import { flatMapNotes } from "../utils/tree";

export class FlamPattern extends MidiPattern {
	constructor(
		readonly source: Pattern | ScoreNote,
		readonly flamOffset: number,
		readonly graceVelocity: number,
		node: PatternNode,
	) {
		super(node);
	}

	clone(overrides: Partial<PatternNode>): FlamPattern {
		return new FlamPattern(this.source, this.flamOffset, this.graceVelocity, this.overrideNode(overrides));
	}
}

export function flam(pattern: Pattern | ScoreNote, flamOffset: number, graceVelocity = 40): FlamPattern {
	const resolved = toPattern(pattern);
	const transformed = flatMapNotes(resolved, (note) => [
		{
			...note,
			startBeat: note.startBeat - flamOffset,
			endBeat: note.startBeat,
			velocity: graceVelocity,
			slides: undefined,
		},
		note,
	]);

	return new FlamPattern(pattern, flamOffset, graceVelocity, transformed);
}
