import type { ScoreNote } from "../note";
import type { PatternNode } from "../pattern";
import { MidiPattern, type Pattern } from "../pattern";
import { toPattern } from "../sequence";
import { mapNotes } from "../utils/tree";

export class LengthPattern extends MidiPattern {
	constructor(
		readonly source: Pattern | ScoreNote,
		readonly noteDuration: number,
		node: PatternNode,
	) {
		super(node);
	}

	clone(overrides: Partial<PatternNode>): LengthPattern {
		return new LengthPattern(this.source, this.noteDuration, this.overrideNode(overrides));
	}
}

export function length(pattern: Pattern | ScoreNote, duration: number): LengthPattern {
	const resolved = toPattern(pattern);
	const transformed = mapNotes(resolved, (note) => {
		const truncatedSlides = note.slides?.filter((sl) => sl.beat <= duration);
		return {
			...note,
			endBeat: note.startBeat + duration,
			slides: truncatedSlides && truncatedSlides.length > 0 ? truncatedSlides : undefined,
		};
	});

	return new LengthPattern(pattern, duration, transformed);
}
