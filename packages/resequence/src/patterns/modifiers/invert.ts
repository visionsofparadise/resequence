import type { ScheduleContext } from "../../rendering/schedule-context";
import { isInScope, prepareNotes, scheduleNotes } from "../../rendering/schedule-notes";
import type { ValidateContext } from "../../validate";
import type { Pattern, PositionedNote } from "../pattern";
import { MidiPattern } from "../pattern";

export class InvertPattern extends MidiPattern {
	readonly type = "invert" as const;
	readonly durationTicks: number;
	readonly notes: ReadonlyArray<PositionedNote>;

	constructor(
		readonly child: Pattern,
		readonly n: number,
	) {
		super();
		this.durationTicks = child.durationTicks;

		const byTick = new Map<number, Array<PositionedNote>>();

		for (const positionedNote of child.notes) {
			let group = byTick.get(positionedNote.tick);
			if (!group) {
				group = [];
				byTick.set(positionedNote.tick, group);
			}
			group.push(positionedNote);
		}

		const result: Array<PositionedNote> = [];

		for (const group of byTick.values()) {
			const sorted = group.slice().sort((noteA, noteB) => noteA.pitch - noteB.pitch);

			if (n > 0) {
				for (const [noteIndex, positionedNote] of sorted.entries()) {
					result.push(noteIndex < n ? { ...positionedNote, pitch: positionedNote.pitch + 12 } : positionedNote);
				}
			} else if (n < 0) {
				const count = -n;
				for (const [noteIndex, positionedNote] of sorted.entries()) {
					result.push(noteIndex >= sorted.length - count ? { ...positionedNote, pitch: positionedNote.pitch - 12 } : positionedNote);
				}
			} else {
				result.push(...sorted);
			}
		}

		this.notes = result;
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

export function invertChord(pattern: Pattern, inversions: number): InvertPattern {
	return new InvertPattern(pattern, inversions);
}
