import type { ScheduleContext } from "../rendering/schedule-context";
import type { ValidateContext } from "../validate";
import type { Pattern, PositionedNote } from "./pattern";

export class TuningPattern implements Pattern {
	readonly type = "tuning" as const;
	readonly durationTicks: number;
	readonly notes: ReadonlyArray<PositionedNote>;

	constructor(
		readonly child: Pattern,
		readonly def: unknown,
	) {
		this.durationTicks = child.durationTicks;
		this.notes = child.notes;
	}

	validate(context: ValidateContext): void {
		this.child.validate(context);
	}

	setup(context: ScheduleContext): void {
		this.child.setup(context);
	}

	prepare(offsetTicks: number, context: ScheduleContext): void {
		this.child.prepare(offsetTicks, context);
	}

	schedule(offsetTicks: number, context: ScheduleContext): void {
		this.child.schedule(offsetTicks, context);
	}

	teardown(context: ScheduleContext): void {
		this.child.teardown(context);
	}
}

export function tuning(pattern: Pattern, def: unknown): TuningPattern {
	return new TuningPattern(pattern, def);
}
