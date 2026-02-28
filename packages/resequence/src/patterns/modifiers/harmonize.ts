import { addSteps } from "../../utils/pitch";
import type { PatternNode } from "../pattern";
import { MidiPattern, type Pattern } from "../pattern";
import { flatMapNotes } from "../utils/tree";

export class HarmonizePattern extends MidiPattern {
	constructor(
		readonly source: Pattern,
		readonly interval: number,
		node: PatternNode,
	) {
		super(node);
	}

	clone(overrides: Partial<PatternNode>): HarmonizePattern {
		return new HarmonizePattern(this.source, this.interval, this.overrideNode(overrides));
	}
}

export function harmonize(pattern: Pattern, interval: number): HarmonizePattern {
	const transformed = flatMapNotes(pattern, (note) => [
		note,
		{
			...note,
			pitch: addSteps(note.pitch, interval),
			slides: note.slides?.map((sl) => ({ ...sl, pitch: addSteps(sl.pitch, interval) })),
		},
	]);

	return new HarmonizePattern(pattern, interval, transformed);
}
