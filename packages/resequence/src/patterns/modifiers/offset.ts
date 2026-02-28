import type { Duration } from "../../utils/duration";
import { resolveDuration } from "../../utils/duration";
import type { PatternNode } from "../pattern";
import { MidiPattern, type Pattern } from "../pattern";
import { mapNotes } from "../utils/tree";

export class OffsetPattern extends MidiPattern {
	constructor(
		readonly source: Pattern,
		readonly amount: number,
		node: PatternNode,
	) {
		super(node);
	}

	clone(overrides: Partial<PatternNode>): OffsetPattern {
		return new OffsetPattern(this.source, this.amount, this.overrideNode(overrides));
	}
}

export function offset(pattern: Pattern, amount: Duration | number): OffsetPattern {
	const resolvedAmount = resolveDuration(amount);

	const transformed = mapNotes(pattern, (note) => ({
		...note,
		startBeat: note.startBeat + resolvedAmount,
		endBeat: note.endBeat + resolvedAmount,
	}));

	return new OffsetPattern(pattern, resolvedAmount, transformed);
}
