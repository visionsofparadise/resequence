import type { ScheduleContext } from "../../rendering/schedule-context";
import { isInScope, prepareNotes, scheduleNotes } from "../../rendering/schedule-notes";
import type { Duration } from "../../utils/duration";
import { resolveDuration } from "../../utils/duration";
import type { ValidateContext } from "../../validate";
import type { Pattern, PositionedNote } from "../pattern";
import { MidiPattern } from "../pattern";

export class HealPattern extends MidiPattern {
	readonly type = "heal" as const;
	readonly durationTicks: number;
	readonly notes: ReadonlyArray<PositionedNote>;

	constructor(
		readonly child: Pattern,
		readonly threshold: number,
	) {
		super();

		this.durationTicks = child.durationTicks;

		const sorted = child.notes.slice().sort((noteA, noteB) => noteA.tick - noteB.tick || noteA.pitch - noteB.pitch);

		const result: Array<PositionedNote> = [];

		for (const positionedNote of sorted) {
			const last = result[result.length - 1];
			const prevEnd = (last?.tick ?? 0) + (last?.durationTicks ?? 0);
			const gap = positionedNote.tick - prevEnd;

			if (last?.pitch === positionedNote.pitch && gap <= threshold) {
				result[result.length - 1] = {
					...last,
					durationTicks: positionedNote.tick + (positionedNote.durationTicks ?? 0) - last.tick,
				};
			} else {
				result.push(positionedNote);
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

export function heal(pattern: Pattern, threshold?: Duration | number): HealPattern {
	return new HealPattern(pattern, threshold !== undefined ? resolveDuration(threshold) : 0);
}
