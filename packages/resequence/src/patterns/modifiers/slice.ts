import type { ScheduleContext } from "../../rendering/schedule-context";
import { isInScope, prepareNotes, scheduleNotes } from "../../rendering/schedule-notes";
import type { Duration } from "../../utils/duration";
import { resolveDuration } from "../../utils/duration";
import type { ValidateContext } from "../../validate";
import type { Pattern, PositionedNote } from "../pattern";
import { MidiPattern } from "../pattern";

export class SlicePattern extends MidiPattern {
	readonly type = "slice" as const;
	readonly durationTicks: number;
	readonly notes: ReadonlyArray<PositionedNote>;

	constructor(
		readonly child: Pattern,
		readonly from: number,
		readonly to: number,
	) {
		super();

		const sorted = child.notes.slice().sort((noteA, noteB) => noteA.tick - noteB.tick);
		const kept = sorted.slice(from, to);

		if (kept.length === 0) {
			this.durationTicks = 0;
			this.notes = [];

			return;
		}

		const firstEntry = kept[0];
		const lastNote = kept[kept.length - 1];

		if (firstEntry === undefined || lastNote === undefined) {
			this.durationTicks = 0;
			this.notes = [];
			return;
		}

		const firstTick = firstEntry.tick;

		this.durationTicks = lastNote.tick + (lastNote.durationTicks ?? 0) - firstTick;
		this.notes = kept.map((positionedNote) => ({ ...positionedNote, tick: positionedNote.tick - firstTick }));
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

export class TrimPattern extends MidiPattern {
	readonly type = "trim" as const;
	readonly durationTicks: number;
	readonly notes: ReadonlyArray<PositionedNote>;

	constructor(
		readonly child: Pattern,
		readonly fromTicks: number,
		readonly toTicks: number,
	) {
		super();

		this.durationTicks = Math.max(0, toTicks - fromTicks);

		const result: Array<PositionedNote> = [];

		for (const positionedNote of child.notes) {
			const noteStart = positionedNote.tick;
			const noteEnd = positionedNote.tick + (positionedNote.durationTicks ?? 0);
			const overlapStart = Math.max(noteStart, fromTicks);
			const overlapEnd = Math.min(noteEnd, toTicks);

			if (overlapEnd > overlapStart) {
				result.push({
					...positionedNote,
					tick: overlapStart - fromTicks,
					durationTicks: overlapEnd - overlapStart,
				});
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

export function slice(pattern: Pattern, from: number, to: number): SlicePattern {
	return new SlicePattern(pattern, from, to);
}

export function trim(pattern: Pattern, from: Duration | number, to: Duration | number): TrimPattern {
	return new TrimPattern(pattern, resolveDuration(from), resolveDuration(to));
}
