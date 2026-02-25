import type { ScheduleContext } from "../../rendering/schedule-context";
import { isInScope, prepareNotes, scheduleNotes } from "../../rendering/schedule-notes";
import type { ValidateContext } from "../../validate";
import type { Pattern, PositionedNote } from "../pattern";
import { MidiPattern } from "../pattern";

export class ReversePattern extends MidiPattern {
	readonly type = "reverse" as const;
	readonly durationBeats: number;
	readonly notes: ReadonlyArray<PositionedNote>;

	constructor(readonly child: Pattern) {
		super();

		this.durationBeats = child.durationBeats;

		const total = child.durationBeats;

		this.notes = child.notes
			.slice()
			.sort((noteA, noteB) => noteA.beat - noteB.beat)
			.map((positionedNote) => ({
				...positionedNote,
				beat: total - positionedNote.beat - (positionedNote.durationBeats ?? 0),
			}))
			.sort((noteA, noteB) => noteA.beat - noteB.beat);
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

export function reverse(pattern: Pattern): ReversePattern {
	return new ReversePattern(pattern);
}
