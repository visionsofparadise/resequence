import type { ScoreNote } from "../note";
import type { PatternNode } from "../pattern";
import { MidiPattern, type Pattern } from "../pattern";
import { toPattern } from "../sequence";
import { mapNotes } from "../utils/tree";

export class StretchPattern extends MidiPattern {
	constructor(
		readonly source: Pattern | ScoreNote,
		readonly factor: number,
		node: PatternNode,
	) {
		super(node);
	}

	clone(overrides: Partial<PatternNode>): StretchPattern {
		return new StretchPattern(this.source, this.factor, this.overrideNode(overrides));
	}
}

export function stretch(pattern: Pattern | ScoreNote, factor: number): StretchPattern {
	const resolved = toPattern(pattern);
	const transformed = mapNotes(resolved, (note) => ({
		...note,
		startBeat: note.startBeat * factor,
		endBeat: note.endBeat * factor,
		slides: note.slides?.map((sl) => ({ ...sl, beat: sl.beat * factor })),
	}));

	return new StretchPattern(pattern, factor, transformed);
}
