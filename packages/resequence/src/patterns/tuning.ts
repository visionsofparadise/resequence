import type { ScheduleContext } from "../rendering/schedule-context";
import type { TuningConfig } from "../utils/pitch";
import type { ValidateContext } from "../validate";
import type { Pattern, PositionedNote } from "./pattern";

export class TuningPattern implements Pattern {
	readonly type = "tuning" as const;
	readonly durationBeats: number;
	readonly notes: ReadonlyArray<PositionedNote>;

	constructor(
		readonly child: Pattern,
		readonly def: TuningConfig,
	) {
		this.durationBeats = child.durationBeats;
		this.notes = child.notes;
	}

	validate(context: ValidateContext): void {
		this.child.validate(context);
	}

	setup(context: ScheduleContext): void {
		this.child.setup({ ...context, tuning: this.def });
	}

	prepare(offsetBeats: number, context: ScheduleContext): void {
		this.child.prepare(offsetBeats, { ...context, tuning: this.def });
	}

	schedule(offsetBeats: number, context: ScheduleContext): void {
		this.child.schedule(offsetBeats, { ...context, tuning: this.def });
	}

	teardown(context: ScheduleContext): void {
		this.child.teardown({ ...context, tuning: this.def });
	}
}

export function tuning(pattern: Pattern, def: TuningConfig): TuningPattern {
	return new TuningPattern(pattern, def);
}
