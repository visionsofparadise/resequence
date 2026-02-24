import type { ScheduleContext } from "../../rendering/schedule-context";
import { isInScope, prepareNotes, scheduleNotes } from "../../rendering/schedule-notes";
import type { ValidateContext } from "../../validate";
import type { Pattern, PositionedNote } from "../pattern";
import { MidiPattern } from "../pattern";

export class PolyphonyPattern extends MidiPattern {
	readonly type = "polyphony" as const;
	readonly durationTicks: number;
	readonly notes: ReadonlyArray<PositionedNote>;

	constructor(
		readonly child: Pattern,
		readonly max: number,
		readonly isGreedy = false,
	) {
		super();

		this.durationTicks = child.durationTicks;

		const sorted = child.notes.slice().sort((noteA, noteB) => noteA.tick - noteB.tick);
		const kept = new Set<PositionedNote>();

		for (const positionedNote of sorted) {
			const active = [...kept].filter((keptNote) => keptNote.tick <= positionedNote.tick && positionedNote.tick < keptNote.tick + (keptNote.durationTicks ?? Infinity));

			if (active.length < max) {
				kept.add(positionedNote);
			} else if (isGreedy) {
				let oldest = active[0];

				if (oldest === undefined) continue;

				for (const activeNote of active) {
					if (activeNote.tick < oldest.tick) oldest = activeNote;
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

export function polyphony(pattern: Pattern, max: number, isGreedy = false): PolyphonyPattern {
	return new PolyphonyPattern(pattern, max, isGreedy);
}
