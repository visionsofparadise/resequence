import type { Duration } from "../utils/duration";
import { resolveDuration } from "../utils/duration";
import type { PatternNode } from "./pattern";
import { Pattern } from "./pattern";

export class GapPattern extends Pattern {
	constructor(
		readonly duration: Duration,
		node: PatternNode,
	) {
		super(node);
	}

	clone(overrides: Partial<PatternNode>): GapPattern {
		return new GapPattern(this.duration, this.overrideNode(overrides));
	}
}

export function gap(duration: Duration): GapPattern {
	const durationBeats = resolveDuration(duration);
	return new GapPattern(duration, { notes: [], children: [], startBeat: 0, endBeat: durationBeats });
}
