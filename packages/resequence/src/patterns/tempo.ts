import { ResequenceError } from "../error";
import type { ScheduleContext } from "../rendering/schedule-context";
import type { ValidateContext } from "../validate";
import type { Pattern, PositionedNote } from "./pattern";

export class TempoPattern implements Pattern {
	readonly type = "tempo" as const;
	readonly durationBeats: number;
	readonly notes: ReadonlyArray<PositionedNote>;

	constructor(
		readonly child: Pattern,
		readonly bpm: number,
	) {
		if (bpm <= 0) {
			throw new ResequenceError("INVALID_TEMPO", `tempo(): bpm must be greater than 0, got ${bpm}`);
		}

		this.durationBeats = child.durationBeats;
		this.notes = child.notes;
	}

	validate(context: ValidateContext): void {
		this.child.validate(context);
	}

	setup(context: ScheduleContext): void {
		this.child.setup(context);
	}

	prepare(offsetBeats: number, context: ScheduleContext): void {
		this.child.prepare(offsetBeats, context);
	}

	schedule(offsetBeats: number, context: ScheduleContext): void {
		this.child.schedule(offsetBeats, context);
	}

	teardown(context: ScheduleContext): void {
		this.child.teardown(context);
	}
}

export function tempo(pattern: Pattern, bpm: number): TempoPattern {
	return new TempoPattern(pattern, bpm);
}
