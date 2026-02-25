import type { ScheduleContext } from "../../rendering/schedule-context";
import { isInScope, prepareNotes, scheduleNotes } from "../../rendering/schedule-notes";
import type { ValidateContext } from "../../validate";
import type { Pattern, PositionedNote } from "../pattern";
import { MidiPattern } from "../pattern";

export class PolyphonyPattern extends MidiPattern {
	readonly type = "polyphony" as const;
	readonly durationBeats: number;
	readonly notes: ReadonlyArray<PositionedNote>;

	constructor(
		readonly child: Pattern,
		readonly max: number,
		readonly isGreedy = false,
	) {
		super();

		this.durationBeats = child.durationBeats;

		const sorted = child.notes.slice().sort((noteA, noteB) => noteA.beat - noteB.beat);
		const kept = new Set<PositionedNote>();

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

export function polyphony(pattern: Pattern, max: number, isGreedy = false): PolyphonyPattern {
	return new PolyphonyPattern(pattern, max, isGreedy);
}
