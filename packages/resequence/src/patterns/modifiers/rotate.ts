import type { ScheduleContext } from "../../rendering/schedule-context";
import { isInScope, prepareNotes, scheduleNotes } from "../../rendering/schedule-notes";
import type { ValidateContext } from "../../validate";
import type { Pattern, PositionedNote } from "../pattern";
import { MidiPattern } from "../pattern";

export class RotatePattern extends MidiPattern {
	readonly type = "rotate" as const;
	readonly durationBeats: number;
	readonly notes: ReadonlyArray<PositionedNote>;

	constructor(
		readonly child: Pattern,
		readonly steps: number,
	) {
		super();
		this.durationBeats = child.durationBeats;

		const sorted = child.notes.slice().sort((noteA, noteB) => noteA.beat - noteB.beat);

		if (sorted.length === 0) {
			this.notes = [];
			return;
		}

		const total = child.durationBeats;
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
				gaps.push(next.beat - curr.beat);
			} else {
				gaps.push(total - curr.beat + firstNote.beat);
			}
		}

		// Normalize shift (handle negatives)
		const shift = ((steps % noteCount) + noteCount) % noteCount;

		const rotatedNotes = [...sorted.slice(shift), ...sorted.slice(0, shift)];
		const rotatedGaps = [...gaps.slice(shift), ...gaps.slice(0, shift)];

		const result: Array<PositionedNote> = [];
		let beat = 0;

		for (let noteIndex = 0; noteIndex < noteCount; noteIndex++) {
			const rotatedNote = rotatedNotes[noteIndex];
			const rotatedGap = rotatedGaps[noteIndex];
			if (rotatedNote === undefined || rotatedGap === undefined) continue;
			result.push({ ...rotatedNote, beat });
			beat += rotatedGap;
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

export function rotate(pattern: Pattern, steps: number): RotatePattern {
	return new RotatePattern(pattern, steps);
}
