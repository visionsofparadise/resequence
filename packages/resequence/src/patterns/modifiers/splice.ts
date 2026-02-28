;
;
import type { ScoreNote } from "../note";
import type { PatternNode, RelativeNote } from "../pattern";
import { MidiPattern, type Pattern } from "../pattern";
import { toPattern } from "../sequence";
import { collectNotes } from "../utils/tree";

export interface SpliceOptions {
	readonly at: number;
	readonly remove?: number;
	readonly insert?: Pattern;
}

export interface InsertOptions {
	readonly at: number;
	readonly remove?: number;
	readonly insert?: Pattern;
}

export class SplicePattern extends MidiPattern {
	constructor(
		readonly source: Pattern | ScoreNote,
		readonly spliceOptions: SpliceOptions,
		node: PatternNode,
	) {
		super(node);
	}

	clone(overrides: Partial<PatternNode>): SplicePattern {
		return new SplicePattern(this.source, this.spliceOptions, this.overrideNode(overrides));
	}
}

export class InsertPattern extends MidiPattern {
	constructor(
		readonly source: Pattern | ScoreNote,
		readonly insertOptions: InsertOptions,
		node: PatternNode,
	) {
		super(node);
	}

	clone(overrides: Partial<PatternNode>): InsertPattern {
		return new InsertPattern(this.source, this.insertOptions, this.overrideNode(overrides));
	}
}

export function splice(pattern: Pattern | ScoreNote, options: SpliceOptions): SplicePattern {
	const resolved = toPattern(pattern);
	const allNotes = collectNotes(resolved);
	const sorted = allNotes.slice().sort((noteA, noteB) => noteA.startBeat - noteB.startBeat);
	const removeCount = options.remove ?? 0;
	const before = sorted.slice(0, options.at);
	const removing = sorted.slice(options.at, options.at + removeCount);
	const after = sorted.slice(options.at + removeCount);

	const firstRemoving = removing[0];
	const lastRemoving = removing[removing.length - 1];
	const firstAfter = after[0];
	const totalDuration = pattern.endBeat - pattern.startBeat;

	const insertionTick = firstRemoving !== undefined ? firstRemoving.startBeat : firstAfter !== undefined ? firstAfter.startBeat : totalDuration;

	const removedSpan = firstRemoving !== undefined && lastRemoving !== undefined ? lastRemoving.endBeat - firstRemoving.startBeat : 0;

	const insertNotes = options.insert ? collectNotes(options.insert) : [];
	const insertDuration = options.insert ? (options.insert.endBeat - options.insert.startBeat) : 0;
	const shift = insertDuration - removedSpan;

	const insertedNotes = insertNotes.map((scoreNote) => ({
		...scoreNote,
		startBeat: scoreNote.startBeat + insertionTick,
		endBeat: scoreNote.endBeat + insertionTick,
	}));

	const afterNotes = after.map((scoreNote) => ({
		...scoreNote,
		startBeat: scoreNote.startBeat + shift,
		endBeat: scoreNote.endBeat + shift,
	}));

	const result = [...before, ...insertedNotes, ...afterNotes];
	const notes: Array<RelativeNote> = result.map((scoreNote) => ({ offsetBeats: 0, note: scoreNote }));
	const newDuration = totalDuration + shift;

	return new SplicePattern(pattern, options, { notes, children: [], startBeat: 0, endBeat: newDuration });
}

export function insert(pattern: Pattern | ScoreNote, options: InsertOptions): InsertPattern {
	const resolved = toPattern(pattern);
	const allNotes = collectNotes(resolved);
	const atTick = options.at;
	const removeDuration = options.remove ?? 0;
	const removeEndTick = atTick + removeDuration;
	const insertNotes = options.insert ? collectNotes(options.insert) : [];
	const insertDuration = options.insert ? (options.insert.endBeat - options.insert.startBeat) : 0;
	const shift = insertDuration - removeDuration;
	const totalDuration = pattern.endBeat - pattern.startBeat;

	const before = allNotes.filter((scoreNote) => scoreNote.endBeat <= atTick);
	const afterNotes = allNotes.filter((scoreNote) => scoreNote.startBeat >= removeEndTick).map((scoreNote) => ({
		...scoreNote,
		startBeat: scoreNote.startBeat + shift,
		endBeat: scoreNote.endBeat + shift,
	}));
	const insertedNotes = insertNotes.map((scoreNote) => ({
		...scoreNote,
		startBeat: scoreNote.startBeat + atTick,
		endBeat: scoreNote.endBeat + atTick,
	}));

	const result = [...before, ...insertedNotes, ...afterNotes];
	const notes: Array<RelativeNote> = result.map((scoreNote) => ({ offsetBeats: 0, note: scoreNote }));
	const newDuration = totalDuration + shift;

	return new InsertPattern(pattern, options, { notes, children: [], startBeat: 0, endBeat: newDuration });
}
