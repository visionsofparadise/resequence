import type { ScheduleContext } from "../../rendering/schedule-context";
import { isInScope, prepareNotes, scheduleNotes } from "../../rendering/schedule-notes";
import type { ValidateContext } from "../../validate";
import type { Pattern, PositionedNote } from "../pattern";
import { MidiPattern } from "../pattern";

export class RotatePattern extends MidiPattern {
	readonly type = "rotate" as const;
	readonly durationTicks: number;
	readonly notes: ReadonlyArray<PositionedNote>;

	constructor(
		readonly child: Pattern,
		readonly steps: number,
	) {
		super();
		this.durationTicks = child.durationTicks;

		const sorted = child.notes.slice().sort((noteA, noteB) => noteA.tick - noteB.tick);

		if (sorted.length === 0) {
			this.notes = [];
			return;
		}

		const total = child.durationTicks;
		const noteCount = sorted.length;

		// Compute cyclic inter-note gaps
		const gaps: Array<number> = [];

		const firstNote = sorted[0];

		if (firstNote === undefined) {
			this.notes = [];
			return;
		}

		for (let gapIndex = 0; gapIndex < noteCount; gapIndex++) {
			const curr = sorted[gapIndex];
			if (curr === undefined) continue;

			if (gapIndex < noteCount - 1) {
				const next = sorted[gapIndex + 1];
				if (next === undefined) continue;
				gaps.push(next.tick - curr.tick);
			} else {
				gaps.push(total - curr.tick + firstNote.tick);
			}
		}

		// Normalize shift (handle negatives)
		const shift = ((steps % noteCount) + noteCount) % noteCount;

		const rotatedNotes = [...sorted.slice(shift), ...sorted.slice(0, shift)];
		const rotatedGaps = [...gaps.slice(shift), ...gaps.slice(0, shift)];

		const result: Array<PositionedNote> = [];
		let tick = 0;

		for (let noteIndex = 0; noteIndex < noteCount; noteIndex++) {
			const rotatedNote = rotatedNotes[noteIndex];
			const rotatedGap = rotatedGaps[noteIndex];
			if (rotatedNote === undefined || rotatedGap === undefined) continue;
			result.push({ ...rotatedNote, tick });
			tick += rotatedGap;
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

export function rotate(pattern: Pattern, steps: number): RotatePattern {
	return new RotatePattern(pattern, steps);
}
