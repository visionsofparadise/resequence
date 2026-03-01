import type { OptionalProperties } from "../../utils/RequiredProperties";
import type { ScoreNote } from "../note";
import type { Pattern, PatternProperties, RelativeChild, RelativeNote } from "../pattern";
import { toPattern } from "../sequence";
import { collectNotes, flatMapNotes, walkNodes } from "../utils/tree";
import { ModifierPattern, type ModifierProperties } from "./modifier";

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

export interface SpliceProperties extends ModifierProperties {
	readonly spliceOptions: SpliceOptions;
}

export class SplicePattern extends ModifierPattern {
	readonly properties: SpliceProperties;

	constructor(properties: OptionalProperties<SpliceProperties, "outputs">) {
		super(properties);

		this.properties = {
			...properties,
			outputs: properties.outputs ?? [],
		};
	}

	clone(overrides: Partial<PatternProperties>): SplicePattern {
		return new SplicePattern({
			...this.properties,
			...overrides,
			previousProperties: this.properties,
		});
	}
}

export interface InsertProperties extends ModifierProperties {
	readonly insertOptions: InsertOptions;
}

export class InsertPattern extends ModifierPattern {
	readonly properties: InsertProperties;

	constructor(properties: OptionalProperties<InsertProperties, "outputs">) {
		super(properties);

		this.properties = {
			...properties,
			outputs: properties.outputs ?? [],
		};
	}

	clone(overrides: Partial<PatternProperties>): InsertPattern {
		return new InsertPattern({
			...this.properties,
			...overrides,
			previousProperties: this.properties,
		});
	}
}

export function splice(pattern: Pattern | ScoreNote, options: SpliceOptions): SplicePattern {
	const resolved = toPattern(pattern);
	const removeCount = options.remove ?? 0;

	const entries: Array<{ note: ScoreNote; absoluteStart: number; absoluteEnd: number }> = [];
	walkNodes(resolved, (node, absoluteOffset) => {
		for (const { offsetBeats, note } of node.notes) {
			const totalOffset = absoluteOffset + offsetBeats;
			entries.push({ note, absoluteStart: totalOffset + note.startBeat, absoluteEnd: totalOffset + note.endBeat });
		}
	});

	entries.sort((ea, eb) => ea.absoluteStart - eb.absoluteStart);
	const removing = entries.slice(options.at, options.at + removeCount);
	const afterEntries = entries.slice(options.at + removeCount);
	const totalDuration = pattern.endBeat - pattern.startBeat;

	const firstRemoving = removing[0];
	const lastRemoving = removing[removing.length - 1];
	const firstAfter = afterEntries[0];

	const insertionTick = firstRemoving !== undefined ? firstRemoving.absoluteStart : firstAfter !== undefined ? firstAfter.absoluteStart : totalDuration;
	const removedSpan = firstRemoving !== undefined && lastRemoving !== undefined ? lastRemoving.absoluteEnd - firstRemoving.absoluteStart : 0;

	const insertDuration = options.insert ? options.insert.endBeat - options.insert.startBeat : 0;
	const shift = insertDuration - removedSpan;

	const removeSet = new Set(removing.map((entry) => entry.note));
	const afterSet = new Set(afterEntries.map((entry) => entry.note));

	const transformed = flatMapNotes(resolved, (note) => {
		if (removeSet.has(note)) return [];
		if (afterSet.has(note)) {
			return [{ ...note, startBeat: note.startBeat + shift, endBeat: note.endBeat + shift }];
		}
		return [note];
	});

	const insertedNotes: Array<RelativeNote> = options.insert
		? collectNotes(options.insert).map((scoreNote) => ({
				offsetBeats: 0,
				note: { ...scoreNote, startBeat: scoreNote.startBeat + insertionTick, endBeat: scoreNote.endBeat + insertionTick },
			}))
		: [];

	const notes = [...transformed.notes, ...insertedNotes];
	notes.sort((ra, rb) => ra.offsetBeats + ra.note.startBeat - (rb.offsetBeats + rb.note.startBeat));

	const newDuration = totalDuration + shift;
	return new SplicePattern({ notes, children: transformed.children, startBeat: 0, endBeat: newDuration, spliceOptions: options, input: resolved });
}

export function insert(pattern: Pattern | ScoreNote, options: InsertOptions): InsertPattern {
	const resolved = toPattern(pattern);
	const atTick = options.at;
	const removeDuration = options.remove ?? 0;
	const removeEndTick = atTick + removeDuration;
	const insertDuration = options.insert ? options.insert.endBeat - options.insert.startBeat : 0;
	const shift = insertDuration - removeDuration;
	const totalDuration = pattern.endBeat - pattern.startBeat;

	const transformed = flatMapNotes(resolved, (note, { absoluteOffset }) => {
		const noteEnd = absoluteOffset + note.endBeat;
		if (noteEnd <= atTick) return [note];

		const noteStart = absoluteOffset + note.startBeat;
		if (noteStart >= removeEndTick) {
			return [{ ...note, startBeat: note.startBeat + shift, endBeat: note.endBeat + shift }];
		}

		return [];
	});

	const children: Array<RelativeChild> = [...transformed.children];
	if (options.insert) {
		children.push({ offsetBeats: atTick, pattern: options.insert });
	}

	const newDuration = totalDuration + shift;
	return new InsertPattern({ notes: transformed.notes, children, startBeat: 0, endBeat: newDuration, insertOptions: options, input: resolved });
}
