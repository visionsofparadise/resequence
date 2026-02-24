import type { ScheduleContext } from "../../rendering/schedule-context";
import { isInScope, prepareNotes, scheduleNotes } from "../../rendering/schedule-notes";
import type { ValidateContext } from "../../validate";
import type { Pattern, PositionedNote } from "../pattern";
import { MidiPattern } from "../pattern";

export class StretchPattern extends MidiPattern {
	readonly type = "stretch" as const;
	readonly durationTicks: number;
	readonly notes: ReadonlyArray<PositionedNote>;

	constructor(
		readonly child: Pattern,
		readonly factor: number,
	) {
		super();

		this.durationTicks = Math.round(child.durationTicks * factor);

		this.notes = child.notes.map((positionedNote) => ({
			...positionedNote,
			tick: Math.round(positionedNote.tick * factor),
			durationTicks: positionedNote.durationTicks !== undefined ? Math.round(positionedNote.durationTicks * factor) : undefined,
		}));
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

export function stretch(pattern: Pattern, factor: number): StretchPattern {
	return new StretchPattern(pattern, factor);
}
