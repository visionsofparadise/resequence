import type { ScheduleContext } from "../../rendering/schedule-context";
import { isInScope, prepareNotes, scheduleNotes } from "../../rendering/schedule-notes";
import type { Duration } from "../../utils/duration";
import { resolveDuration } from "../../utils/duration";
import type { ValidateContext } from "../../validate";
import type { Pattern, PositionedNote } from "../pattern";
import { MidiPattern } from "../pattern";

export class ChopPattern extends MidiPattern {
	readonly type = "chop" as const;
	readonly durationTicks: number;
	readonly notes: ReadonlyArray<PositionedNote>;

	constructor(
		readonly child: Pattern,
		readonly subdivision: number,
	) {
		super();
		this.durationTicks = child.durationTicks;

		const result: Array<PositionedNote> = [];

		for (const positionedNote of child.notes) {
			const duration = positionedNote.durationTicks ?? 0;
			const chopCount = Math.floor(duration / subdivision);

			for (let chopIndex = 0; chopIndex < chopCount; chopIndex++) {
				result.push({
					...positionedNote,
					tick: positionedNote.tick + chopIndex * subdivision,
					durationTicks: subdivision,
				});
			}
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

export function chop(pattern: Pattern, subdivision: Duration | number): ChopPattern {
	return new ChopPattern(pattern, resolveDuration(subdivision));
}
