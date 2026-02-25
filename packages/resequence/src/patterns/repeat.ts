import { ResequenceError } from "../error";
import type { ScheduleContext } from "../rendering/schedule-context";
import { isInScope, prepareNotes, scheduleNotes } from "../rendering/schedule-notes";
import type { ValidateContext } from "../validate";
import type { Pattern, PositionedNote } from "./pattern";
import { MidiPattern } from "./pattern";

export class RepeatPattern extends MidiPattern {
	readonly type = "repeat" as const;
	readonly durationBeats: number;
	readonly notes: ReadonlyArray<PositionedNote>;

	constructor(
		readonly child: Pattern,
		readonly count: number,
	) {
		super();

		if (count < 1 || !Number.isInteger(count)) {
			throw new ResequenceError("INVALID_REPEAT_COUNT", `repeat(): count must be a positive integer, got ${count}`);
		}

		this.durationBeats = child.durationBeats * count;

		const notes: Array<PositionedNote> = [];

		for (let iteration = 0; iteration < count; iteration++) {
			const offset = child.durationBeats * iteration;

			for (const childNote of child.notes) {
				notes.push({ ...childNote, beat: childNote.beat + offset });
			}
		}

		this.notes = notes;
	}

	validate(context: ValidateContext): void {
		const childContext = this.outputs.length > 0 ? { ...context, insideRoute: true } : context;

		this.child.validate(childContext);
	}

	setup(context: ScheduleContext): void {
		this.child.setup(context);
	}

	prepare(offsetBeats: number, context: ScheduleContext): void {
		if (!isInScope(offsetBeats, this.durationBeats, context)) return;

		prepareNotes(this.notes, offsetBeats, this.outputs, context);

		for (let iteration = 0; iteration < this.count; iteration++) {
			this.child.prepare(offsetBeats + this.child.durationBeats * iteration, context);
		}
	}

	schedule(offsetBeats: number, context: ScheduleContext): void {
		if (!isInScope(offsetBeats, this.durationBeats, context)) return;

		scheduleNotes(this.notes, offsetBeats, this.outputs, context);

		for (let iteration = 0; iteration < this.count; iteration++) {
			this.child.schedule(offsetBeats + this.child.durationBeats * iteration, context);
		}
	}

	teardown(context: ScheduleContext): void {
		this.child.teardown(context);
	}
}

export function repeat(node: Pattern, count: number): RepeatPattern {
	return new RepeatPattern(node, count);
}
