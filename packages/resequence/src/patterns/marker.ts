import type { ScheduleContext } from "../rendering/schedule-context";
import type { ValidateContext } from "../validate";
import type { Pattern, PositionedNote } from "./pattern";

export class MarkerPattern implements Pattern {
	readonly type = "marker" as const;
	readonly durationBeats: number;
	readonly notes: ReadonlyArray<PositionedNote>;

	constructor(
		readonly child: Pattern,
		readonly name: string,
	) {
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

export function marker(pattern: Pattern, name: string): MarkerPattern {
	return new MarkerPattern(pattern, name);
}

export const cue = marker;
