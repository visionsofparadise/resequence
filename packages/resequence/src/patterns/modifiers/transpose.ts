import { addSteps } from "../../utils/pitch";
import type { PatternNode } from "../pattern";
import { MidiPattern, type Pattern } from "../pattern";
import { mapNotes } from "../utils/tree";

export class TransposePattern extends MidiPattern {
	constructor(
		readonly source: Pattern,
		readonly interval: number,
		node: PatternNode,
	) {
		super(node);
	}

	clone(overrides: Partial<PatternNode>): TransposePattern {
		return new TransposePattern(this.source, this.interval, this.overrideNode(overrides));
	}
}

export function transpose(pattern: Pattern, interval: number): TransposePattern {
	const transformed = mapNotes(pattern, (note) => ({
		...note,
		pitch: addSteps(note.pitch, interval),
		slides: note.slides?.map((sl) => ({ ...sl, pitch: addSteps(sl.pitch, interval) })),
	}));

	return new TransposePattern(pattern, interval, transformed);
}
