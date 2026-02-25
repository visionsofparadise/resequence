import type { ScheduleContext } from "../../rendering/schedule-context";
import { isInScope, prepareNotes, scheduleNotes } from "../../rendering/schedule-notes";
import type { Duration } from "../../utils/duration";
import { resolveDuration } from "../../utils/duration";
import type { ValidateContext } from "../../validate";
import type { Pattern, PositionedNote } from "../pattern";
import { MidiPattern } from "../pattern";

export class FlamPattern extends MidiPattern {
	readonly type = "flam" as const;
	readonly durationBeats: number;
	readonly notes: ReadonlyArray<PositionedNote>;

	constructor(
		readonly child: Pattern,
		readonly flamOffset: number,
		readonly graceVelocity: number,
	) {
		super();

		this.durationBeats = child.durationBeats;

		const result: Array<PositionedNote> = [];

		for (const positionedNote of child.notes) {
			result.push({
				...positionedNote,
				beat: Math.max(0, positionedNote.beat - flamOffset),
				velocity: graceVelocity,
				durationBeats: flamOffset,
			});

			result.push(positionedNote);
		}

		this.notes = result;
	}

	validate(context: ValidateContext): void {
		const childContext = this.outputs.length > 0 ? { ...context, insideRoute: true } : context;

		this.child.validate(childContext);
	}

	prepare(offsetBeats: number, context: ScheduleContext): void {
		if (!isInScope(offsetBeats, this.durationBeats, context)) return;

		prepareNotes(this.notes, offsetBeats, this.outputs, context);
		this.child.prepare(offsetBeats, context);
	}

	schedule(offsetBeats: number, context: ScheduleContext): void {
		if (!isInScope(offsetBeats, this.durationBeats, context)) return;

		scheduleNotes(this.notes, offsetBeats, this.outputs, context);
		this.child.schedule(offsetBeats, context);
	}
}

export function flam(pattern: Pattern, flamOffset: Duration | number, graceVelocity = 40): FlamPattern {
	return new FlamPattern(pattern, resolveDuration(flamOffset), graceVelocity);
}
