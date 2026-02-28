import type { PatternNode } from "../pattern";
import { MidiPattern, type Pattern } from "../pattern";
import { flatMapNotes } from "../utils/tree";

export class FlamPattern extends MidiPattern {
	constructor(
		readonly source: Pattern,
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

export function flam(pattern: Pattern, flamOffset: number, graceVelocity = 40): FlamPattern {
	const transformed = flatMapNotes(pattern, (note) => [
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
