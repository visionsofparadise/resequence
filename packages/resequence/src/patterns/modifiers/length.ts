import type { Duration } from "../../utils/duration";
import { resolveDuration } from "../../utils/duration";
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

export function length(pattern: Pattern, duration: Duration | number): LengthPattern {
	const noteDuration = resolveDuration(duration);

	const transformed = mapNotes(pattern, (note) => {
		const truncatedSlides = note.slides?.filter((sl) => sl.beat <= noteDuration);
		return {
			...note,
			endBeat: note.startBeat + noteDuration,
			slides: truncatedSlides && truncatedSlides.length > 0 ? truncatedSlides : undefined,
		};
	});

	return new LengthPattern(pattern, noteDuration, transformed);
}
