import type { PatternNode } from "./pattern";
import { Pattern } from "./pattern";

export class GapPattern extends Pattern {
	constructor(
		readonly duration: number,
		node: PatternNode,
	) {
		super(node);
	}

	clone(overrides: Partial<PatternNode>): GapPattern {
		return new GapPattern(this.duration, this.overrideNode(overrides));
	}
}

export function gap(duration: number): GapPattern {
	return new GapPattern(duration, { notes: [], children: [], startBeat: 0, endBeat: duration });
}
