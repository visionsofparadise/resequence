import type { ScheduleContext } from "../../rendering/schedule-context";
import { isInScope, prepareNotes, scheduleNotes } from "../../rendering/schedule-notes";
import type { Duration } from "../../utils/duration";
import { resolveDuration } from "../../utils/duration";
import type { ValidateContext } from "../../validate";
import type { Pattern, PositionedNote } from "../pattern";
import { MidiPattern } from "../pattern";

export interface SpliceOptions {
	readonly at: number;
	readonly remove?: number;
	readonly insert?: Pattern;
}

export interface InsertOptions {
	readonly at: Duration | number;
	readonly remove?: Duration | number;
	readonly insert?: Pattern;
}

export class SplicePattern extends MidiPattern {
	readonly type = "splice" as const;
	readonly durationTicks: number;
	readonly notes: ReadonlyArray<PositionedNote>;

	constructor(
		readonly child: Pattern,
		readonly options: SpliceOptions,
	) {
		super();

		const sorted = child.notes.slice().sort((noteA, noteB) => noteA.tick - noteB.tick);
		const removeCount = options.remove ?? 0;
		const before = sorted.slice(0, options.at);
		const removing = sorted.slice(options.at, options.at + removeCount);
		const after = sorted.slice(options.at + removeCount);

		const firstRemoving = removing[0];
		const lastRemoving = removing[removing.length - 1];
		const firstAfter = after[0];

		const insertionTick = firstRemoving !== undefined ? firstRemoving.tick : firstAfter !== undefined ? firstAfter.tick : child.durationTicks;

		const removedSpan = firstRemoving !== undefined && lastRemoving !== undefined ? lastRemoving.tick + (lastRemoving.durationTicks ?? 0) - firstRemoving.tick : 0;

		const insertDuration = options.insert?.durationTicks ?? 0;
		const shift = insertDuration - removedSpan;

		const insertedNotes = (options.insert?.notes ?? []).map((positionedNote) => ({
			...positionedNote,
			tick: positionedNote.tick + insertionTick,
		}));

		const afterNotes = after.map((positionedNote) => ({
			...positionedNote,
			tick: positionedNote.tick + shift,
		}));

		this.notes = [...before, ...insertedNotes, ...afterNotes];
		this.durationTicks = child.durationTicks + shift;
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

export class InsertPattern extends MidiPattern {
	readonly type = "insert" as const;
	readonly durationTicks: number;
	readonly notes: ReadonlyArray<PositionedNote>;

	constructor(
		readonly child: Pattern,
		readonly options: InsertOptions,
	) {
		super();

		const atTick = resolveDuration(options.at);
		const removeDuration = options.remove !== undefined ? resolveDuration(options.remove) : 0;
		const removeEndTick = atTick + removeDuration;
		const insertDuration = options.insert?.durationTicks ?? 0;
		const shift = insertDuration - removeDuration;

		const before = child.notes.filter((positionedNote) => positionedNote.tick + (positionedNote.durationTicks ?? 0) <= atTick);
		const afterNotes = child.notes.filter((positionedNote) => positionedNote.tick >= removeEndTick).map((positionedNote) => ({ ...positionedNote, tick: positionedNote.tick + shift }));

		const insertedNotes = (options.insert?.notes ?? []).map((positionedNote) => ({
			...positionedNote,
			tick: positionedNote.tick + atTick,
		}));

		this.notes = [...before, ...insertedNotes, ...afterNotes];
		this.durationTicks = child.durationTicks + shift;
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

export function splice(pattern: Pattern, options: SpliceOptions): SplicePattern {
	return new SplicePattern(pattern, options);
}

export function insert(pattern: Pattern, options: InsertOptions): InsertPattern {
	return new InsertPattern(pattern, options);
}
