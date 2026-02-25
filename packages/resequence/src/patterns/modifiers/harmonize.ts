import type { ScheduleContext } from "../../rendering/schedule-context";
import { isInScope, prepareNotes, scheduleNotes } from "../../rendering/schedule-notes";
import { addSteps } from "../../utils/pitch";
import type { ValidateContext } from "../../validate";
import type { Pattern, PositionedNote } from "../pattern";
import { MidiPattern } from "../pattern";

export class HarmonizePattern extends MidiPattern {
	readonly type = "harmonize" as const;
	readonly durationBeats: number;
	readonly notes: ReadonlyArray<PositionedNote>;

	constructor(
		readonly child: Pattern,
		readonly interval: number,
	) {
		super();

		this.durationBeats = child.durationBeats;

		const result: Array<PositionedNote> = [];

		for (const positionedNote of child.notes) {
			result.push(positionedNote);
			result.push({ ...positionedNote, pitch: addSteps(positionedNote.pitch, interval) });
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

export function harmonize(pattern: Pattern, interval: number): HarmonizePattern {
	return new HarmonizePattern(pattern, interval);
}
