import type { ScheduleContext } from "../../rendering/schedule-context";
import { isInScope, prepareNotes, scheduleNotes } from "../../rendering/schedule-notes";
import type { Duration } from "../../utils/duration";
import { resolveDuration } from "../../utils/duration";
import type { ValidateContext } from "../../validate";
import type { Pattern, PositionedNote } from "../pattern";
import { MidiPattern } from "../pattern";

export class OffsetPattern extends MidiPattern {
	readonly type = "offset" as const;
	readonly durationBeats: number;
	readonly notes: ReadonlyArray<PositionedNote>;

	constructor(
		readonly child: Pattern,
		readonly amount: number,
	) {
		super();

		this.durationBeats = child.durationBeats;

		this.notes = child.notes.map((positionedNote) => ({
			...positionedNote,
			beat: Math.max(0, positionedNote.beat + amount),
		}));
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

export function offset(pattern: Pattern, amount: Duration | number): OffsetPattern {
	return new OffsetPattern(pattern, resolveDuration(amount));
}
