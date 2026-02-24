import type { ScheduleContext } from "../../rendering/schedule-context";
import { isInScope, prepareNotes, scheduleNotes } from "../../rendering/schedule-notes";
import type { ValidateContext } from "../../validate";
import type { Pattern, PositionedNote } from "../pattern";
import { MidiPattern } from "../pattern";

export class ReversePattern extends MidiPattern {
	readonly type = "reverse" as const;
	readonly durationTicks: number;
	readonly notes: ReadonlyArray<PositionedNote>;

	constructor(readonly child: Pattern) {
		super();

		this.durationTicks = child.durationTicks;

		const total = child.durationTicks;

		this.notes = child.notes
			.slice()
			.sort((noteA, noteB) => noteA.tick - noteB.tick)
			.map((positionedNote) => ({
				...positionedNote,
				tick: total - positionedNote.tick - (positionedNote.durationTicks ?? 0),
			}))
			.sort((noteA, noteB) => noteA.tick - noteB.tick);
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

export function reverse(pattern: Pattern): ReversePattern {
	return new ReversePattern(pattern);
}
