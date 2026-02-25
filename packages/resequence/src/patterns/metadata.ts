import type { ScheduleContext } from "../rendering/schedule-context";
import type { ValidateContext } from "../validate";
import type { Pattern, PositionedNote } from "./pattern";

export class MetadataPattern implements Pattern {
	readonly type = "metadata" as const;
	readonly durationTicks: number;
	readonly notes: ReadonlyArray<PositionedNote>;

	constructor(
		readonly child: Pattern,
		readonly name?: string,
		readonly description?: string,
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

export function metadata(pattern: Pattern, config: { name?: string; description?: string }): MetadataPattern {
	return new MetadataPattern(pattern, config.name, config.description);
}
