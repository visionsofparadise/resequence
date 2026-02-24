import type { Duration } from "../utils/duration";
import { resolveDuration } from "../utils/duration";
import type { ScheduleContext } from "../rendering/schedule-context";
import type { ValidateContext } from "../validate";
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

	getMidi(): Array<PositionedNote> {
		return [];
	}

	validate(_context: ValidateContext): void {
		return;
	}

	setup(_context: ScheduleContext): void {
		return;
	}

	schedule(_offsetTicks: number, _context: ScheduleContext): void {
		return;
	}

	teardown(_context: ScheduleContext): void {
		return;
	}
}

export function gap(duration: Duration): GapPattern {
	return new GapPattern(duration);
}
