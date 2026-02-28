import { ResequenceError } from "../../error";
import type { PatternNode } from "../pattern";
import { MidiPattern, type Pattern } from "../pattern";
import { flatMapNotes } from "../utils/tree";

export class RepeatPattern extends MidiPattern {
	constructor(
		readonly count: number,
		node: PatternNode,
	) {
		super(node);
	}

	clone(overrides: Partial<PatternNode>): RepeatPattern {
		return new RepeatPattern(this.count, this.overrideNode(overrides));
	}
}

export function repeat(pattern: Pattern, count: number): RepeatPattern {
	if (count < 1 || !Number.isInteger(count)) {
		throw new ResequenceError("INVALID_REPEAT_COUNT", `repeat(): count must be a positive integer, got ${count}`);
	}

	const durationBeats = pattern.endBeat - pattern.startBeat;

	const transformed = flatMapNotes(pattern, (note) => {
		const copies = [];

		for (let index = 0; index < count; index++) {
			copies.push({ ...note, startBeat: note.startBeat + durationBeats * index, endBeat: note.endBeat + durationBeats * index });
		}

		return copies;
	});

	return new RepeatPattern(count, transformed);
}
