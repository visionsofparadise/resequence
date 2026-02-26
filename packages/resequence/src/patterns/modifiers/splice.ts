import type { ScheduleContext } from "../../rendering/schedule-context";
import { isInScope, scheduleNotes } from "../../rendering/schedule-notes";
import type { Duration } from "../../utils/duration";
import { resolveDuration } from "../../utils/duration";
import type { ValidateContext } from "../../validate";
import type { Pattern, PositionedAutomation, PositionedMetadata, ScoreNote } from "../pattern";
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
	readonly durationBeats: number;
	readonly notes: ReadonlyArray<ScoreNote>;
	readonly metadatas: ReadonlyArray<PositionedMetadata>;
	readonly automations: ReadonlyArray<PositionedAutomation>;

	constructor(
		readonly child: Pattern,
		readonly options: SpliceOptions,
	) {
		super();

		const sorted = child.notes.slice().sort((noteA, noteB) => noteA.beat - noteB.beat);
		const removeCount = options.remove ?? 0;
		const before = sorted.slice(0, options.at);
		const removing = sorted.slice(options.at, options.at + removeCount);
		const after = sorted.slice(options.at + removeCount);

		const firstRemoving = removing[0];
		const lastRemoving = removing[removing.length - 1];
		const firstAfter = after[0];

		const insertionTick = firstRemoving !== undefined ? firstRemoving.beat : firstAfter !== undefined ? firstAfter.beat : child.durationBeats;

		const removedSpan = firstRemoving !== undefined && lastRemoving !== undefined ? lastRemoving.beat + (lastRemoving.durationBeats ?? 0) - firstRemoving.beat : 0;

		const insertDuration = options.insert?.durationBeats ?? 0;
		const shift = insertDuration - removedSpan;

		const insertedNotes = (options.insert?.notes ?? []).map((positionedNote) => ({
			...positionedNote,
			beat: positionedNote.beat + insertionTick,
		}));

		const afterNotes = after.map((positionedNote) => ({
			...positionedNote,
			beat: positionedNote.beat + shift,
		}));

		this.notes = [...before, ...insertedNotes, ...afterNotes];
		this.metadatas = child.metadatas;
		this.automations = child.automations;
		this.durationBeats = child.durationBeats + shift;
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

export class InsertPattern extends MidiPattern {
	readonly type = "insert" as const;
	readonly durationBeats: number;
	readonly notes: ReadonlyArray<ScoreNote>;
	readonly metadatas: ReadonlyArray<PositionedMetadata>;
	readonly automations: ReadonlyArray<PositionedAutomation>;

	constructor(
		readonly child: Pattern,
		readonly options: InsertOptions,
	) {
		super();

		const atTick = resolveDuration(options.at);
		const removeDuration = options.remove !== undefined ? resolveDuration(options.remove) : 0;
		const removeEndTick = atTick + removeDuration;
		const insertDuration = options.insert?.durationBeats ?? 0;
		const shift = insertDuration - removeDuration;

		const before = child.notes.filter((positionedNote) => positionedNote.beat + (positionedNote.durationBeats ?? 0) <= atTick);
		const afterNotes = child.notes.filter((positionedNote) => positionedNote.beat >= removeEndTick).map((positionedNote) => ({ ...positionedNote, beat: positionedNote.beat + shift }));

		const insertedNotes = (options.insert?.notes ?? []).map((positionedNote) => ({
			...positionedNote,
			beat: positionedNote.beat + atTick,
		}));

		this.notes = [...before, ...insertedNotes, ...afterNotes];
		this.metadatas = child.metadatas;
		this.automations = child.automations;
		this.durationBeats = child.durationBeats + shift;
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

export function splice(pattern: Pattern, options: SpliceOptions): SplicePattern {
	return new SplicePattern(pattern, options);
}

export function insert(pattern: Pattern, options: InsertOptions): InsertPattern {
	return new InsertPattern(pattern, options);
}
