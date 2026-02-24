import type { ScheduleContext } from "../../rendering/schedule-context";
import { isInScope, prepareNotes, scheduleNotes } from "../../rendering/schedule-notes";
import type { ValidateContext } from "../../validate";
import type { Pattern, PositionedNote } from "../pattern";
import { MidiPattern } from "../pattern";

export class LegatoPattern extends MidiPattern {
	readonly type = "legato" as const;
	readonly durationTicks: number;
	readonly notes: ReadonlyArray<PositionedNote>;

	constructor(
		readonly child: Pattern,
		readonly extendLast = true,
	) {
		super();

		this.durationTicks = child.durationTicks;

		const sorted = child.notes.slice().sort((noteA, noteB) => noteA.tick - noteB.tick);
		const result: Array<PositionedNote> = [];

		for (let noteIndex = 0; noteIndex < sorted.length; noteIndex++) {
			const positionedNote = sorted[noteIndex];
			if (positionedNote === undefined) continue;
			const nextNote = sorted[noteIndex + 1];

			if (nextNote) {
				result.push({ ...positionedNote, durationTicks: nextNote.tick - positionedNote.tick });
			} else if (extendLast) {
				result.push({ ...positionedNote, durationTicks: child.durationTicks - positionedNote.tick });
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

export function legato(pattern: Pattern, extendLast?: boolean): LegatoPattern {
	return new LegatoPattern(pattern, extendLast ?? true);
}
