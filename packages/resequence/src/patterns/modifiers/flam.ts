import type { ScheduleContext } from "../../rendering/schedule-context";
import { isInScope, prepareNotes, scheduleNotes } from "../../rendering/schedule-notes";
import type { Duration } from "../../utils/duration";
import { resolveDuration } from "../../utils/duration";
import type { ValidateContext } from "../../validate";
import type { Pattern, PositionedNote } from "../pattern";
import { MidiPattern } from "../pattern";

export class FlamPattern extends MidiPattern {
	readonly type = "flam" as const;
	readonly durationTicks: number;
	readonly notes: ReadonlyArray<PositionedNote>;

	constructor(
		readonly child: Pattern,
		readonly flamOffset: number,
		readonly graceVelocity: number,
	) {
		super();

		this.durationTicks = child.durationTicks;

		const result: Array<PositionedNote> = [];

		for (const positionedNote of child.notes) {
			result.push({
				...positionedNote,
				tick: Math.max(0, positionedNote.tick - flamOffset),
				velocity: graceVelocity,
				durationTicks: flamOffset,
			});

			result.push(positionedNote);
		}

		this.notes = result;
	}

	validate(context: ValidateContext): void {
		const childContext = this.outputs.length > 0 ? { ...context, insideRoute: true } : context;

		this.child.validate(childContext);
	}

	prepare(offsetTicks: number, context: ScheduleContext): void {
		if (!isInScope(offsetTicks, this.durationTicks, context)) return;

		prepareNotes(this.notes, offsetTicks, this.outputs, context);
		this.child.prepare(offsetTicks, context);
	}

	schedule(offsetTicks: number, context: ScheduleContext): void {
		if (!isInScope(offsetTicks, this.durationTicks, context)) return;

		scheduleNotes(this.notes, offsetTicks, this.outputs, context);
		this.child.schedule(offsetTicks, context);
	}
}

export function flam(pattern: Pattern, flamOffset: Duration | number, graceVelocity = 40): FlamPattern {
	return new FlamPattern(pattern, resolveDuration(flamOffset), graceVelocity);
}
