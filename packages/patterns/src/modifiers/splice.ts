import type { Event, Note, ModifierProperties, Pattern, PatternProperties, RelativeChild, RelativeNote } from "@resequence/patterns-core";
import { ModifierPattern, toPattern, flatModifyNotes, collectNotes, walkPatterns } from "@resequence/patterns-core";
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

export class SplicePattern extends ModifierPattern<SpliceProperties> {
	readonly packageName = "@resequence/patterns";
	readonly unitName = "splice";

	override _setup(): Array<Event> {
		const options = this.properties.spliceOptions;
		const removeCount = options.remove ?? 0;

		const entries: Array<{ note: Note; absoluteStart: number; absoluteEnd: number }> = [];

		walkPatterns(this, (node, absoluteOffset) => {
			for (const { offsetBeats, note } of node.notes) {
				const totalOffset = absoluteOffset + offsetBeats;

				entries.push({ note, absoluteStart: totalOffset + note.startBeat, absoluteEnd: totalOffset + note.endBeat });
			}
		});

		entries.sort((ea, eb) => ea.absoluteStart - eb.absoluteStart);
		const removing = entries.slice(options.at, options.at + removeCount);
		const afterEntries = entries.slice(options.at + removeCount);
		const totalDuration = this.endBeat - this.startBeat;

		const firstRemoving = removing[0];
		const lastRemoving = removing[removing.length - 1];
		const firstAfter = afterEntries[0];

		const insertionTick = firstRemoving !== undefined ? firstRemoving.absoluteStart : firstAfter !== undefined ? firstAfter.absoluteStart : totalDuration;
		const removedSpan = firstRemoving !== undefined && lastRemoving !== undefined ? lastRemoving.absoluteEnd - firstRemoving.absoluteStart : 0;

		const insertDuration = options.insert ? options.insert.endBeat - options.insert.startBeat : 0;
		const shift = insertDuration - removedSpan;

		const removeSet = new Set(removing.map((entry) => entry.note));
		const afterSet = new Set(afterEntries.map((entry) => entry.note));

		flatModifyNotes(this, (note) => {
			if (removeSet.has(note)) return [];
			if (afterSet.has(note)) {
				return [{ ...note, startBeat: note.startBeat + shift, endBeat: note.endBeat + shift }];
			}

			return [note];
		});

		const insertedNotes: Array<RelativeNote> = options.insert
			? collectNotes(options.insert).map(({ note: scoreNote, absoluteBeat }) => ({
					offsetBeats: 0,
					note: { ...scoreNote, startBeat: scoreNote.startBeat + absoluteBeat + insertionTick, endBeat: scoreNote.endBeat + absoluteBeat + insertionTick },
				}))
			: [];

		const notes = [...this.properties.notes, ...insertedNotes];

		notes.sort((ra, rb) => ra.offsetBeats + ra.note.startBeat - (rb.offsetBeats + rb.note.startBeat));

		const newDuration = totalDuration + shift;

		this.properties.notes = notes;
		this.properties.startBeat = 0;
		this.properties.endBeat = newDuration;

		return [];
	}

	clone(_overrides: Partial<PatternProperties>): SplicePattern {
		return new SplicePattern({ spliceOptions: this.properties.spliceOptions, input: this.properties.input });
	}
}

export interface InsertProperties extends ModifierProperties {
	readonly insertOptions: InsertOptions;
}

export class InsertPattern extends ModifierPattern<InsertProperties> {
	readonly packageName = "@resequence/patterns";
	readonly unitName = "insert";

	override _setup(): Array<Event> {
		const options = this.properties.insertOptions;
		const atTick = options.at;
		const removeDuration = options.remove ?? 0;
		const removeEndTick = atTick + removeDuration;
		const insertDuration = options.insert ? options.insert.endBeat - options.insert.startBeat : 0;
		const shift = insertDuration - removeDuration;
		const totalDuration = this.endBeat - this.startBeat;

		flatModifyNotes(this, (note, { absoluteOffset }) => {
			const noteEnd = absoluteOffset + note.endBeat;

			if (noteEnd <= atTick) return [note];

			const noteStart = absoluteOffset + note.startBeat;

			if (noteStart >= removeEndTick) {
				return [{ ...note, startBeat: note.startBeat + shift, endBeat: note.endBeat + shift }];
			}

			return [];
		});

		const children: Array<RelativeChild> = [...this.properties.children];

		if (options.insert) {
			children.push({ offsetBeats: atTick, pattern: options.insert });
		}

		const newDuration = totalDuration + shift;

		this.properties.children = children;
		this.properties.startBeat = 0;
		this.properties.endBeat = newDuration;

		return [];
	}

	clone(_overrides: Partial<PatternProperties>): InsertPattern {
		return new InsertPattern({ insertOptions: this.properties.insertOptions, input: this.properties.input });
	}
}

export function splice(pattern: Pattern | Note, options: SpliceOptions): SplicePattern {
	const resolved = toPattern(pattern);

	return new SplicePattern({ spliceOptions: options, input: resolved });
}

export function insert(pattern: Pattern | Note, options: InsertOptions): InsertPattern {
	const resolved = toPattern(pattern);

	return new InsertPattern({ insertOptions: options, input: resolved });
}
