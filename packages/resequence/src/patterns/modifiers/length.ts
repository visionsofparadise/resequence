import type { PatternNode } from "../pattern";
import { MidiPattern, type Pattern } from "../pattern";
import { mapNotes } from "../utils/tree";

export class LengthPattern extends MidiPattern {
	constructor(
		readonly source: Pattern,
		readonly noteDuration: number,
		node: PatternNode,
	) {
		super(node);
	}

	clone(overrides: Partial<PatternNode>): LengthPattern {
		return new LengthPattern(this.source, this.noteDuration, this.overrideNode(overrides));
	}
}

export function length(pattern: Pattern, duration: number): LengthPattern {
	const transformed = mapNotes(pattern, (note) => {
		const truncatedSlides = note.slides?.filter((sl) => sl.beat <= duration);
		return {
			...note,
			endBeat: note.startBeat + duration,
			slides: truncatedSlides && truncatedSlides.length > 0 ? truncatedSlides : undefined,
		};
	});

	return new LengthPattern(pattern, duration, transformed);
}
