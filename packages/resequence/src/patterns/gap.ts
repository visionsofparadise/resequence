import type { Duration } from "../duration";
import { resolveDuration } from "../duration";
import type { Pattern, PositionedNote } from "./pattern";

export class GapPattern implements Pattern {
	readonly type = "gap" as const;
	readonly durationTicks: number;

	constructor(readonly duration: Duration) {
		this.durationTicks = resolveDuration(duration);
	}

	transpose(): GapPattern {
		return new GapPattern(this.duration);
	}

	reverse(): GapPattern {
		return new GapPattern(this.duration);
	}

	getNotes(): Array<PositionedNote> {
		return [];
	}
}

export function gap(duration: Duration): GapPattern {
	return new GapPattern(duration);
}
