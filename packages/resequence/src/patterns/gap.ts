import type { ScheduleContext } from "../rendering/schedule-context";
import type { Duration } from "../utils/duration";
import { resolveDuration } from "../utils/duration";
import type { ValidateContext } from "../validate";
import type { Pattern, PositionedAutomation, PositionedMetadata, ScoreNote } from "./pattern";

export class GapPattern implements Pattern {
	readonly type = "gap" as const;
	readonly durationBeats: number;
	readonly notes: ReadonlyArray<ScoreNote> = [];
	readonly metadatas: ReadonlyArray<PositionedMetadata> = [];
	readonly automations: ReadonlyArray<PositionedAutomation> = [];
	readonly sampleKeys: ReadonlySet<string> = new Set();
	readonly moduleUrls: ReadonlySet<string> = new Set();

	constructor(readonly duration: Duration) {
		this.durationBeats = resolveDuration(duration);
	}

	validate(_context: ValidateContext): void {
		return;
	}

	setup(_context: ScheduleContext): void {
		return;
	}


	schedule(_offsetBeats: number, _context: ScheduleContext): void {
		return;
	}

	teardown(_context: ScheduleContext): void {
		return;
	}
}

export function gap(duration: Duration): GapPattern {
	return new GapPattern(duration);
}
