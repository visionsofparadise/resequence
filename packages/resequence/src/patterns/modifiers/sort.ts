import type { ScheduleContext } from "../../rendering/schedule-context";
import { isInScope, prepareNotes, scheduleNotes } from "../../rendering/schedule-notes";
import type { ValidateContext } from "../../validate";
import type { Pattern, PositionedNote } from "../pattern";
import { MidiPattern } from "../pattern";

export type SortKey = "asc" | "desc" | ((noteA: PositionedNote, noteB: PositionedNote) => number);

export class SortPattern extends MidiPattern {
	readonly type = "sort" as const;
	readonly durationTicks: number;
	readonly notes: ReadonlyArray<PositionedNote>;

	constructor(
		readonly child: Pattern,
		readonly key: SortKey = "asc",
	) {
		super();

		this.durationTicks = child.durationTicks;

		// Notes ordered by tick — these define the timing slots
		const byTick = child.notes.slice().sort((noteA, noteB) => noteA.tick - noteB.tick);

		// Pitches in sorted order, to assign into the timing slots
		let pitches: Array<number>;

		if (typeof key === "function") {
			pitches = child.notes
				.slice()
				.sort(key)
				.map((positionedNote) => positionedNote.pitch);
		} else if (key === "desc") {
			pitches = byTick.map((positionedNote) => positionedNote.pitch).sort((pitchA, pitchB) => pitchB - pitchA);
		} else {
			pitches = byTick.map((positionedNote) => positionedNote.pitch).sort((pitchA, pitchB) => pitchA - pitchB);
		}

		this.notes = byTick.map((positionedNote, noteIndex) => ({
			...positionedNote,
			pitch: pitches[noteIndex] ?? positionedNote.pitch,
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

export function sort(pattern: Pattern, key?: SortKey): SortPattern {
	return new SortPattern(pattern, key);
}
