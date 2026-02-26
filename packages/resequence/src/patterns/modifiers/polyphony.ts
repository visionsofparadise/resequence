import type { ScheduleContext } from "../../rendering/schedule-context";
import { isInScope, scheduleNotes } from "../../rendering/schedule-notes";
import type { ValidateContext } from "../../validate";
import type { Pattern, PositionedAutomation, PositionedMetadata, ScoreNote } from "../pattern";
import { MidiPattern } from "../pattern";

export class PolyphonyPattern extends MidiPattern {
	readonly type = "polyphony" as const;
	readonly durationBeats: number;
	readonly notes: ReadonlyArray<ScoreNote>;
	readonly metadatas: ReadonlyArray<PositionedMetadata>;
	readonly automations: ReadonlyArray<PositionedAutomation>;

	constructor(
		readonly child: Pattern,
		readonly max: number,
		readonly isGreedy = false,
	) {
		super();

		this.durationBeats = child.durationBeats;

		const sorted = child.notes.slice().sort((noteA, noteB) => noteA.beat - noteB.beat);
		const kept = new Set<ScoreNote>();

		for (const positionedNote of sorted) {
			const active = [...kept].filter((keptNote) => keptNote.beat <= positionedNote.beat && positionedNote.beat < keptNote.beat + (keptNote.durationBeats ?? Infinity));

			if (active.length < max) {
				kept.add(positionedNote);
			} else if (isGreedy) {
				let oldest = active[0];

				if (oldest === undefined) continue;

				for (const activeNote of active) {
					if (activeNote.beat < oldest.beat) oldest = activeNote;
				}

				kept.delete(oldest);
				kept.add(positionedNote);
			}
		}

		this.notes = sorted.filter((positionedNote) => kept.has(positionedNote));
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

export function polyphony(pattern: Pattern, max: number, isGreedy = false): PolyphonyPattern {
	return new PolyphonyPattern(pattern, max, isGreedy);
}
