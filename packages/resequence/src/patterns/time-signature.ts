import { ResequenceError } from "../error";
import type { ScheduleContext } from "../rendering/schedule-context";
import type { ValidateContext } from "../validate";
import type { Pattern, PositionedNote } from "./pattern";

export class TimeSignaturePattern implements Pattern {
	readonly type = "timeSignature" as const;
	readonly durationBeats: number;
	readonly notes: ReadonlyArray<PositionedNote>;

	constructor(
		readonly child: Pattern,
		readonly timeSignature: readonly [number, number],
	) {
		if (timeSignature[0] < 1 || timeSignature[1] < 1) {
			throw new ResequenceError("INVALID_TIME_SIGNATURE", `timeSignature(): values must be >= 1, got [${timeSignature[0]}, ${timeSignature[1]}]`);
		}

		this.durationBeats = child.durationBeats;
		this.notes = child.notes;
	}

	setup(context: ScheduleContext): void {
		this.child.setup(context);
	}

	prepare(offsetBeats: number, context: ScheduleContext): void {
		this.child.prepare(offsetBeats, { ...context, timeSignature: this.timeSignature });
	}

	schedule(offsetBeats: number, context: ScheduleContext): void {
		this.child.schedule(offsetBeats, { ...context, timeSignature: this.timeSignature });
	}

	teardown(context: ScheduleContext): void {
		this.child.teardown(context);
	}

	validate(context: ValidateContext): void {
		this.child.validate(context);
	}
}

export function timeSignature(pattern: Pattern, sig: readonly [number, number]): TimeSignaturePattern {
	return new TimeSignaturePattern(pattern, sig);
}
