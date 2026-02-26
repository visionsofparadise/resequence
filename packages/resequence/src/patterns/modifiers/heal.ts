import type { ScheduleContext } from "../../rendering/schedule-context";
import { isInScope, scheduleNotes } from "../../rendering/schedule-notes";
import type { Duration } from "../../utils/duration";
import { resolveDuration } from "../../utils/duration";
import { pitchKey } from "../../utils/pitch";
import type { ValidateContext } from "../../validate";
import type { Pattern, PositionedAutomation, PositionedMetadata, ScoreNote } from "../pattern";
import { MidiPattern } from "../pattern";

export class HealPattern extends MidiPattern {
	readonly type = "heal" as const;
	readonly durationBeats: number;
	readonly notes: ReadonlyArray<ScoreNote>;
	readonly metadatas: ReadonlyArray<PositionedMetadata>;
	readonly automations: ReadonlyArray<PositionedAutomation>;

	constructor(
		readonly child: Pattern,
		readonly threshold: number,
	) {
		super();

		this.durationBeats = child.durationBeats;

		const sorted = child.notes.slice().sort((noteA, noteB) => noteA.beat - noteB.beat || pitchKey(noteA.pitch) - pitchKey(noteB.pitch));

		const result: Array<ScoreNote> = [];

		for (const positionedNote of sorted) {
			const last = result[result.length - 1];
			const prevEnd = (last?.beat ?? 0) + (last?.durationBeats ?? 0);
			const gap = positionedNote.beat - prevEnd;

			if (last !== undefined && pitchKey(last.pitch) === pitchKey(positionedNote.pitch) && gap <= threshold) {
				result[result.length - 1] = {
					...last,
					durationBeats: positionedNote.beat + (positionedNote.durationBeats ?? 0) - last.beat,
				};
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

export function heal(pattern: Pattern, threshold?: Duration | number): HealPattern {
	return new HealPattern(pattern, threshold !== undefined ? resolveDuration(threshold) : 0);
}
