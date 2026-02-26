import type { ScheduleContext } from "../../rendering/schedule-context";
import { isInScope, scheduleNotes } from "../../rendering/schedule-notes";
import type { ValidateContext } from "../../validate";
import type { Pattern, PositionedAutomation, PositionedMetadata, ScoreNote } from "../pattern";
import { MidiPattern } from "../pattern";

export class LegatoPattern extends MidiPattern {
	readonly type = "legato" as const;
	readonly durationBeats: number;
	readonly notes: ReadonlyArray<ScoreNote>;
	readonly metadatas: ReadonlyArray<PositionedMetadata>;
	readonly automations: ReadonlyArray<PositionedAutomation>;

	constructor(
		readonly child: Pattern,
		readonly extendLast = true,
	) {
		super();

		this.durationBeats = child.durationBeats;

		const sorted = child.notes.slice().sort((noteA, noteB) => noteA.beat - noteB.beat);
		const result: Array<ScoreNote> = [];

		for (let noteIndex = 0; noteIndex < sorted.length; noteIndex++) {
			const positionedNote = sorted[noteIndex];
			if (positionedNote === undefined) continue;
			const nextNote = sorted[noteIndex + 1];

			if (nextNote) {
				result.push({ ...positionedNote, durationBeats: nextNote.beat - positionedNote.beat });
			} else if (extendLast) {
				result.push({ ...positionedNote, durationBeats: child.durationBeats - positionedNote.beat });
			} else {
				result.push(positionedNote);
			}
		}

		this.notes = result;
		this.metadatas = child.metadatas;
		this.automations = child.automations;
	}

	validate(context: ValidateContext): void {
		const childContext = this.outputs.length > 0 ? { ...context, insideRoute: true } : context;
		this.child.validate(childContext);
	}


	schedule(offsetBeats: number, context: ScheduleContext): void {
		if (!isInScope(offsetBeats, this.durationBeats, context)) return;

		scheduleNotes(this.notes, offsetBeats, this.outputs, context);
		this.child.schedule(offsetBeats, context);
	}
}

export function legato(pattern: Pattern, extendLast?: boolean): LegatoPattern {
	return new LegatoPattern(pattern, extendLast ?? true);
}
