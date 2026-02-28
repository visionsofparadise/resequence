import { addSteps } from "../../utils/pitch";
import type { ScoreNote } from "../note";
import type { PatternNode } from "../pattern";
import { MidiPattern, type Pattern } from "../pattern";
import { toPattern } from "../sequence";
import { mapNotes } from "../utils/tree";

export class TransposePattern extends MidiPattern {
	constructor(
		readonly source: Pattern | ScoreNote,
		readonly interval: number,
		node: PatternNode,
	) {
		super(node);
	}

	clone(overrides: Partial<PatternNode>): TransposePattern {
		return new TransposePattern(this.source, this.interval, this.overrideNode(overrides));
	}
}

export function transpose(pattern: Pattern | ScoreNote, interval: number): TransposePattern {
	const resolved = toPattern(pattern);
	const transformed = mapNotes(resolved, (note) => ({
		...note,
		pitch: addSteps(note.pitch, interval),
		slides: note.slides?.map((sl) => ({ ...sl, pitch: addSteps(sl.pitch, interval) })),
	}));

	return new TransposePattern(pattern, interval, transformed);
}
